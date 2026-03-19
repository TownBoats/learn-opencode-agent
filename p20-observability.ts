import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'node:crypto'

const anthropic = new Anthropic()

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type SpanStatus = 'ok' | 'error'

interface LogEntry {
  level: LogLevel
  ts: string
  msg: string
  fields: Record<string, string | number | boolean>
}

interface Span {
  spanId: string
  parentSpanId: string | null
  name: string
  startTime: number
  endTime: number
  status: SpanStatus
  attributes: Record<string, string | number | boolean>
}

interface MetricsSummary {
  totalLlmCalls: number
  totalToolCalls: number
  totalInputTokens: number
  totalOutputTokens: number
  averageLlmLatencyMs: number
  toolCallCounts: Record<string, number>
  errorCount: number
}

class StructuredLogger {
  private readonly entries: LogEntry[] = []
  private readonly minLevel: LogLevel

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const order: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }
    return order[level] >= order[this.minLevel]
  }

  log(level: LogLevel, msg: string, fields: Record<string, string | number | boolean> = {}): void {
    const entry: LogEntry = {
      level,
      ts: new Date().toISOString(),
      msg,
      fields,
    }
    this.entries.push(entry)

    if (this.shouldLog(level)) {
      console.log(JSON.stringify(entry, null, 0))
    }
  }

  debug(msg: string, fields?: Record<string, string | number | boolean>): void {
    this.log('debug', msg, fields)
  }

  info(msg: string, fields?: Record<string, string | number | boolean>): void {
    this.log('info', msg, fields)
  }

  warn(msg: string, fields?: Record<string, string | number | boolean>): void {
    this.log('warn', msg, fields)
  }

  error(msg: string, fields?: Record<string, string | number | boolean>): void {
    this.log('error', msg, fields)
  }

  getEntries(): ReadonlyArray<LogEntry> {
    return this.entries
  }
}

class Tracer {
  private readonly spans: Span[] = []
  private readonly activeSpanStack: string[] = []

  startSpan(
    name: string,
    attributes: Record<string, string | number | boolean> = {},
  ): string {
    const spanId = randomUUID().slice(0, 8)
    const parentSpanId =
      this.activeSpanStack.length > 0 ? this.activeSpanStack[this.activeSpanStack.length - 1] : null

    this.spans.push({
      spanId,
      parentSpanId,
      name,
      startTime: Date.now(),
      endTime: 0,
      status: 'ok',
      attributes: { ...attributes },
    })
    this.activeSpanStack.push(spanId)
    return spanId
  }

  endSpan(
    spanId: string,
    extraAttributes: Record<string, string | number | boolean> = {},
  ): void {
    const span = this.spans.find((item) => item.spanId === spanId)
    if (!span) return

    span.endTime = Date.now()
    span.attributes = {
      ...span.attributes,
      ...extraAttributes,
      duration_ms: span.endTime - span.startTime,
    }

    const index = this.activeSpanStack.lastIndexOf(spanId)
    if (index !== -1) {
      this.activeSpanStack.splice(index, 1)
    }
  }

  setError(spanId: string, errorMessage: string): void {
    const span = this.spans.find((item) => item.spanId === spanId)
    if (!span) return
    span.status = 'error'
    span.attributes.error = errorMessage
  }

  printTraceTree(): void {
    console.log('\n══════════════════════════════════════════')
    console.log('            Trace 树')
    console.log('══════════════════════════════════════════')

    const roots = this.spans.filter((span) => span.parentSpanId === null)
    for (const root of roots) {
      this.printSpan(root, 0)
    }
    console.log('══════════════════════════════════════════\n')
  }

  private printSpan(span: Span, depth: number): void {
    const indent = depth === 0 ? '' : '  '.repeat(depth)
    const duration = span.endTime > 0 ? span.endTime - span.startTime : 0
    const status = span.status === 'ok' ? 'OK' : 'ERROR'
    const attrs = Object.entries(span.attributes)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join(', ')

    console.log(`${indent}${depth === 0 ? '' : '└─ '}${span.name} [${status}] ${duration}ms`)
    if (attrs.length > 0) {
      console.log(`${indent}   ${attrs}`)
    }

    const children = this.spans.filter((item) => item.parentSpanId === span.spanId)
    for (const child of children) {
      this.printSpan(child, depth + 1)
    }
  }
}

class MetricsCollector {
  private llmLatencies: number[] = []
  private totalInputTokens = 0
  private totalOutputTokens = 0
  private totalToolCalls = 0
  private readonly toolCallCounts: Record<string, number> = {}
  private errorCount = 0

  recordLlmCall(latencyMs: number, inputTokens: number, outputTokens: number): void {
    this.llmLatencies.push(latencyMs)
    this.totalInputTokens += inputTokens
    this.totalOutputTokens += outputTokens
  }

  recordToolCall(toolName: string): void {
    this.totalToolCalls += 1
    this.toolCallCounts[toolName] = (this.toolCallCounts[toolName] ?? 0) + 1
  }

  recordError(): void {
    this.errorCount += 1
  }

  getSummary(): MetricsSummary {
    const totalLlmCalls = this.llmLatencies.length
    const averageLlmLatencyMs =
      totalLlmCalls === 0
        ? 0
        : Math.round(this.llmLatencies.reduce((sum, value) => sum + value, 0) / totalLlmCalls)

    return {
      totalLlmCalls,
      totalToolCalls: this.totalToolCalls,
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      averageLlmLatencyMs,
      toolCallCounts: { ...this.toolCallCounts },
      errorCount: this.errorCount,
    }
  }

  printSummary(): void {
    const summary = this.getSummary()
    console.log('══════════════════════════════════════════')
    console.log('            指标摘要')
    console.log('══════════════════════════════════════════')
    console.log(`LLM 调用次数: ${summary.totalLlmCalls}`)
    console.log(`工具调用次数: ${summary.totalToolCalls}`)
    console.log(`输入 Token:  ${summary.totalInputTokens}`)
    console.log(`输出 Token:  ${summary.totalOutputTokens}`)
    console.log(`LLM 平均延迟: ${summary.averageLlmLatencyMs}ms`)
    console.log(`错误次数: ${summary.errorCount}`)
    console.log(`工具分布: ${JSON.stringify(summary.toolCallCounts)}`)
    console.log('══════════════════════════════════════════\n')
  }
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_docs',
    description: '搜索知识库并返回相关资料。回答前必须先调用一次这个工具。',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词' },
      },
      required: ['query'],
    } as Anthropic.Tool.InputSchema,
  },
  {
    name: 'summarize',
    description: '把输入文本压缩成三点摘要。在搜索之后需要调用这个工具整理结果。',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: '待总结文本' },
      },
      required: ['text'],
    } as Anthropic.Tool.InputSchema,
  },
]

const KNOWLEDGE = [
  'Logs 负责记录事件上下文，适合排查“发生了什么”。',
  'Traces 负责还原一次请求的完整链路，适合定位性能瓶颈和错误传播路径。',
  'Metrics 负责做聚合统计，适合监控整体健康度和趋势。',
]

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function toText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<string> {
  await sleep(60 + Math.floor(Math.random() * 80))

  if (name === 'search_docs') {
    const query = typeof input['query'] === 'string' ? input['query'] : ''
    const docs = KNOWLEDGE.filter((item) => query.length === 0 || item.includes('适合') || item.includes('负责'))
    return docs.map((doc, index) => `${index + 1}. ${doc}`).join('\n')
  }

  if (name === 'summarize') {
    const text = typeof input['text'] === 'string' ? input['text'] : ''
    return [
      '1. Logs 适合保留事件明细和参数上下文。',
      '2. Traces 适合定位一次 Agent 链路中的慢点和失败节点。',
      `3. 原始资料长度约 ${text.length} 字，建议把日志、追踪、指标统一关联到同一请求 ID。`,
    ].join('\n')
  }

  throw new Error(`未知工具: ${name}`)
}

async function runObservableAgent(userMessage: string): Promise<void> {
  const logger = new StructuredLogger('debug')
  const tracer = new Tracer()
  const metrics = new MetricsCollector()

  console.log(`用户: ${userMessage}\n`)

  const rootSpanId = tracer.startSpan('agent_turn', {
    user_message_length: userMessage.length,
  })
  logger.info('agent_start', {
    span_id: rootSpanId,
    prompt_length: userMessage.length,
  })

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }]
  const systemPrompt = [
    '你是一个讲解 Agent 可观测性的助手。',
    '回答前必须先调用 search_docs 获取资料，再调用 summarize 生成三点摘要，最后再给用户一个简短结论。',
  ].join('\n')

  for (let iteration = 1; iteration <= 6; iteration += 1) {
    const llmSpanId = tracer.startSpan('llm_call', {
      iteration,
      model: 'claude-sonnet-4-20250514',
    })
    const llmStart = Date.now()

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        tools: TOOLS,
        messages,
      })

      const latencyMs = Date.now() - llmStart
      metrics.recordLlmCall(
        latencyMs,
        response.usage.input_tokens,
        response.usage.output_tokens,
      )
      logger.info('llm_call_completed', {
        span_id: llmSpanId,
        latency_ms: latencyMs,
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      })
      tracer.endSpan(llmSpanId, {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      })

      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
      )

      if (response.stop_reason === 'end_turn' || toolUses.length === 0) {
        const answer = toText(response.content)
        logger.info('agent_completed', {
          span_id: rootSpanId,
          output_length: answer.length,
        })
        tracer.endSpan(rootSpanId, { output_length: answer.length })

        console.log('最终回答:')
        console.log(answer)
        tracer.printTraceTree()
        metrics.printSummary()
        return
      }

      messages.push({ role: 'assistant', content: response.content })
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUses) {
        const input =
          typeof toolUse.input === 'object' && toolUse.input !== null
            ? (toolUse.input as Record<string, unknown>)
            : {}
        const toolSpanId = tracer.startSpan(`tool:${toolUse.name}`, {
          tool_name: toolUse.name,
        })
        const toolStart = Date.now()

        try {
          const result = await executeTool(toolUse.name, input)
          const duration = Date.now() - toolStart
          metrics.recordToolCall(toolUse.name)
          logger.info('tool_call_completed', {
            span_id: toolSpanId,
            tool: toolUse.name,
            duration_ms: duration,
          })
          tracer.endSpan(toolSpanId, { duration_ms: duration })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: result,
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          metrics.recordError()
          logger.error('tool_call_failed', {
            span_id: toolSpanId,
            tool: toolUse.name,
            error: message,
          })
          tracer.setError(toolSpanId, message)
          tracer.endSpan(toolSpanId)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: `工具执行失败: ${message}`,
            is_error: true,
          })
        }
      }

      messages.push({ role: 'user', content: toolResults })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      metrics.recordError()
      logger.error('llm_call_failed', {
        span_id: llmSpanId,
        error: message,
      })
      tracer.setError(llmSpanId, message)
      tracer.endSpan(llmSpanId)
      tracer.setError(rootSpanId, message)
      tracer.endSpan(rootSpanId)
      throw error
    }
  }

  logger.warn('max_iterations_reached', { span_id: rootSpanId })
  tracer.endSpan(rootSpanId, { forced_stop: true })
  tracer.printTraceTree()
  metrics.printSummary()
}

async function main(): Promise<void> {
  await runObservableAgent('请解释 Agent 可观测性的三根支柱，并给我一个适合团队落地的简短建议。')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
