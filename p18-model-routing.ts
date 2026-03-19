import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

type ModelTier = 'haiku' | 'sonnet' | 'opus'
type Complexity = 'simple' | 'medium' | 'complex'

interface ModelConfig {
  id: string
  tier: ModelTier
  inputPricePerMTok: number
  outputPricePerMTok: number
  maxTokens: number
}

interface UsageRecord {
  model: string
  tier: ModelTier
  inputTokens: number
  outputTokens: number
  costUsd: number
  timestamp: number
}

const MODELS: Record<ModelTier, ModelConfig> = {
  haiku: {
    id: 'claude-haiku-4-5-20251001',
    tier: 'haiku',
    inputPricePerMTok: 0.8,
    outputPricePerMTok: 4.0,
    maxTokens: 1024,
  },
  sonnet: {
    id: 'claude-sonnet-4-20250514',
    tier: 'sonnet',
    inputPricePerMTok: 3.0,
    outputPricePerMTok: 15.0,
    maxTokens: 2048,
  },
  opus: {
    id: 'claude-opus-4-6',
    tier: 'opus',
    inputPricePerMTok: 15.0,
    outputPricePerMTok: 75.0,
    maxTokens: 4096,
  },
}

const COMPLEX_KEYWORDS = [
  '分析',
  '比较',
  '设计',
  '架构',
  '重构',
  '优化',
  'analyze',
  'compare',
  'design',
  'architect',
  'refactor',
  '为什么',
  '权衡',
  '原理',
  '深入',
  'trade-off',
]

const SIMPLE_KEYWORDS = [
  '查询',
  '转换',
  '翻译',
  '格式化',
  '列出',
  'list',
  'convert',
  'translate',
  'format',
  'what is',
  '是什么',
  '几点',
  '多少',
  '定义',
]

function classifyComplexity(message: string, toolCount: number, turnIndex: number): Complexity {
  const length = message.length
  let score = 0

  if (length < 50) score -= 1
  else if (length > 300) score += 1
  if (length > 800) score += 1

  if (toolCount === 0) score -= 1
  else if (toolCount >= 3) score += 1

  const lowerMsg = message.toLowerCase()
  for (const keyword of COMPLEX_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      score += 1
      break
    }
  }
  for (const keyword of SIMPLE_KEYWORDS) {
    if (lowerMsg.includes(keyword)) {
      score -= 1
      break
    }
  }

  if (turnIndex >= 5) score += 1

  if (score <= -1) return 'simple'
  if (score >= 2) return 'complex'
  return 'medium'
}

class BudgetTracker {
  private readonly records: UsageRecord[] = []
  private readonly budgetUsd: number

  constructor(budgetUsd: number) {
    this.budgetUsd = budgetUsd
  }

  calculateCost(config: ModelConfig, inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * config.inputPricePerMTok
    const outputCost = (outputTokens / 1_000_000) * config.outputPricePerMTok
    return inputCost + outputCost
  }

  record(config: ModelConfig, inputTokens: number, outputTokens: number): UsageRecord {
    const entry: UsageRecord = {
      model: config.id,
      tier: config.tier,
      inputTokens,
      outputTokens,
      costUsd: this.calculateCost(config, inputTokens, outputTokens),
      timestamp: Date.now(),
    }
    this.records.push(entry)
    return entry
  }

  totalCost(): number {
    return this.records.reduce((sum, record) => sum + record.costUsd, 0)
  }

  remainingBudget(): number {
    return Math.max(0, this.budgetUsd - this.totalCost())
  }

  isOverBudget(): boolean {
    return this.totalCost() >= this.budgetUsd
  }

  printSummary(): void {
    console.log('\n--- Token 用量摘要 ---')
    console.log(`调用次数: ${this.records.length}`)

    const byTier: Record<string, { calls: number; cost: number }> = {}
    for (const record of this.records) {
      const stats = byTier[record.tier] ?? { calls: 0, cost: 0 }
      stats.calls += 1
      stats.cost += record.costUsd
      byTier[record.tier] = stats
    }

    for (const [tier, stats] of Object.entries(byTier)) {
      console.log(`  ${tier}: ${stats.calls} 次, $${stats.cost.toFixed(6)}`)
    }

    console.log(`累计成本: $${this.totalCost().toFixed(6)}`)
    console.log(`剩余预算: $${this.remainingBudget().toFixed(6)}`)
    console.log('---\n')
  }

  getRecords(): ReadonlyArray<UsageRecord> {
    return this.records
  }
}

const COMPLEXITY_TO_TIER: Record<Complexity, ModelTier> = {
  simple: 'haiku',
  medium: 'sonnet',
  complex: 'opus',
}

const FALLBACK_CHAINS: Record<ModelTier, ModelTier[]> = {
  opus: ['opus', 'sonnet', 'haiku'],
  sonnet: ['sonnet', 'haiku'],
  haiku: ['haiku'],
}

class ModelRouter {
  private readonly budget: BudgetTracker

  constructor(budget: BudgetTracker) {
    this.budget = budget
  }

  selectModel(
    message: string,
    toolCount: number,
    turnIndex: number,
  ): { config: ModelConfig; complexity: Complexity; fallbackChain: ModelTier[] } {
    const remaining = this.budget.remainingBudget()
    const total = remaining + this.budget.totalCost()
    const ratio = total > 0 ? remaining / total : 1

    if (ratio < 0.2) {
      console.log('[Router] 预算不足 20%，强制使用 Haiku')
      return {
        config: MODELS.haiku,
        complexity: 'simple',
        fallbackChain: ['haiku'],
      }
    }

    const complexity = classifyComplexity(message, toolCount, turnIndex)
    const tier = COMPLEXITY_TO_TIER[complexity]
    const fallbackChain = FALLBACK_CHAINS[tier]

    console.log(
      `[Router] 复杂度=${complexity}, 选择=${tier}, 降级链=[${fallbackChain.join(' → ')}]`,
    )

    return { config: MODELS[tier], complexity, fallbackChain }
  }

  async callWithFallback(
    fallbackChain: ModelTier[],
    messages: Anthropic.MessageParam[],
    system: string,
    tools?: Anthropic.Tool[],
  ): Promise<{ response: Anthropic.Message; usedConfig: ModelConfig }> {
    let lastError: Error | null = null

    for (const tier of fallbackChain) {
      const config = MODELS[tier]

      try {
        console.log(`[Router] 尝试 ${config.id}...`)
        const response = await anthropic.messages.create({
          model: config.id,
          max_tokens: config.maxTokens,
          system,
          messages,
          ...(tools && tools.length > 0 ? { tools } : {}),
        })

        const usage = this.budget.record(
          config,
          response.usage.input_tokens,
          response.usage.output_tokens,
        )
        console.log(
          `[Router] ${config.tier} 完成: ${usage.inputTokens} in / ${usage.outputTokens} out, $${usage.costUsd.toFixed(6)}`,
        )

        return { response, usedConfig: config }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.log(`[Router] ${config.id} 失败: ${lastError.message}`)

        const isRetryable =
          lastError.message.includes('rate') ||
          lastError.message.includes('overloaded') ||
          lastError.message.includes('529') ||
          lastError.message.includes('503')

        if (!isRetryable) {
          throw lastError
        }
      }
    }

    throw lastError ?? new Error('所有模型均不可用')
  }
}

const calculatorTool: Anthropic.Tool = {
  name: 'calculator',
  description: '执行数学计算',
  input_schema: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: '数学表达式，如 "2 + 3 * 4"',
      },
    },
    required: ['expression'],
  },
}

function executeCalculator(expression: string): string {
  const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '')
  if (sanitized !== expression) {
    return '错误：表达式包含非法字符'
  }

  try {
    const result = new Function(`return (${sanitized})`)() as number
    return String(result)
  } catch {
    return `错误：无法计算表达式 "${expression}"`
  }
}

async function costAwareAgentLoop(userMessages: string[]): Promise<void> {
  const budget = new BudgetTracker(0.01)
  const router = new ModelRouter(budget)
  const tools: Anthropic.Tool[] = [calculatorTool]

  const systemPrompt = [
    '你是一个成本感知的 AI 助手。',
    '用最简洁的方式回答问题。',
    '如果需要计算，使用 calculator 工具。',
  ].join('\n')

  for (let turn = 0; turn < userMessages.length; turn += 1) {
    const userMsg = userMessages[turn]
    console.log(`\n${'='.repeat(60)}`)
    console.log(`用户 [Turn ${turn}]: ${userMsg}`)
    console.log('='.repeat(60))

    if (budget.isOverBudget()) {
      console.log('[Agent] 预算已耗尽，停止处理')
      break
    }

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMsg }]
    const { fallbackChain } = router.selectModel(userMsg, tools.length, turn)

    let done = false
    while (!done) {
      const { response, usedConfig } = await router.callWithFallback(
        fallbackChain,
        messages,
        systemPrompt,
        tools,
      )

      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      )

      if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('')
        console.log(`\n助手 [${usedConfig.tier}]: ${text}`)
        done = true
      } else {
        messages.push({ role: 'assistant', content: response.content })

        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((toolUse) => {
          if (toolUse.name === 'calculator') {
            const input =
              typeof toolUse.input === 'object' && toolUse.input !== null
                ? (toolUse.input as { expression: string })
                : { expression: '' }

            const result = executeCalculator(input.expression)
            console.log(`[Tool] calculator("${input.expression}") = ${result}`)

            return {
              type: 'tool_result' as const,
              tool_use_id: toolUse.id,
              content: result,
            }
          }

          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: `未知工具: ${toolUse.name}`,
          }
        })

        messages.push({ role: 'user', content: toolResults })
      }
    }
  }

  budget.printSummary()
}

async function main(): Promise<void> {
  const questions = [
    '今天是星期几？',
    '帮我计算一下，如果每月 API 花费 $150，其中 60% 是简单查询，把简单查询从 Sonnet 切到 Haiku 后每月能省多少钱？假设 Haiku 价格是 Sonnet 的 1/4。',
    '请深入分析 Anthropic Haiku、Sonnet、Opus 三个模型在 Agent 场景下的性能与成本权衡，从推理能力、响应延迟、工具调用准确性三个维度进行比较。',
  ]

  await costAwareAgentLoop(questions)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
