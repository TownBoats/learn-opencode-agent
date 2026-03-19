import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const RETRY_CONFIG = {
  maxAttempts: 4,
  baseDelay: 1000,
  jitter: 500,
  maxDelay: 30_000,
} as const

const MAX_ITERATIONS = 10
const RETRYABLE_STATUS = new Set([429, 500, 529])

const tools: Anthropic.Tool[] = [
  {
    name: 'query_database',
    description: '查询数据库中的记录。table 支持 users 和 orders，id 为记录编号',
    input_schema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: '表名：users 或 orders',
        },
        id: {
          type: 'number',
          description: '记录 ID',
        },
      },
      required: ['table', 'id'],
    },
  },
]

type ToolInput = { table: string; id: number }

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = RETRY_CONFIG.maxAttempts,
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (!(error instanceof Anthropic.APIError)) {
        throw error
      }

      if (!RETRYABLE_STATUS.has(error.status)) {
        throw error
      }

      if (attempt === maxAttempts - 1) {
        break
      }

      const exponential = RETRY_CONFIG.baseDelay * 2 ** attempt
      const jitter = Math.random() * RETRY_CONFIG.jitter
      const delay = Math.min(exponential + jitter, RETRY_CONFIG.maxDelay)

      console.log(
        `[retry] attempt ${attempt + 1}/${maxAttempts} failed` +
          ` (${error.status} ${error.error?.type ?? 'unknown'}).` +
          ` Waiting ${Math.round(delay)}ms...`,
      )

      await sleep(delay)
    }
  }

  throw lastError
}

function queryDatabase(table: string, id: number): string {
  if (Math.random() < 0.3) {
    throw new Error(`Database connection timeout: failed to query ${table}#${id}`)
  }

  const records: Record<string, Record<number, string>> = {
    users: {
      1: 'Alice (alice@example.com)',
      2: 'Bob (bob@example.com)',
    },
    orders: {
      101: 'Order #101: 3x TypeScript Book, $89.00',
      102: 'Order #102: 1x Mechanical Keyboard, $159.00',
    },
  }

  return records[table]?.[id] ?? `No record found in ${table} with id=${id}`
}

async function runAgent(userMessage: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    iterations += 1
    console.log(`\n[loop] iteration ${iterations}/${MAX_ITERATIONS}`)

    const response = await withRetry(() =>
      client.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        tools,
        messages,
      }),
    )

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
      console.log(`\nAgent: ${text}`)
      return
    }

    if (response.stop_reason !== 'tool_use') {
      console.log(`[warn] unexpected stop_reason: ${response.stop_reason ?? 'null'}`)
      return
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      const input = block.input as ToolInput
      console.log(`[tool] ${block.name}(table="${input.table}", id=${input.id})`)

      let content: string
      try {
        content = queryDatabase(input.table, input.id)
        console.log(`[tool] success: ${content}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        content = `Error: ${message}`
        console.log(`[tool] failed: ${message}`)
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  console.log(`[warn] Agent reached maxIterations (${MAX_ITERATIONS}), terminating.`)
}

runAgent('帮我查一下用户 ID 为 1 的信息，以及订单 101 的详情').catch((error) => {
  console.error(error)
  process.exitCode = 1
})
