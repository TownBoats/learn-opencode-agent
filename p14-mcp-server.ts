import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

interface GetRandomNumberParams {
  min?: number
  max?: number
}

function isGetRandomNumberParams(value: unknown): value is GetRandomNumberParams {
  if (typeof value !== 'object' || value === null) return false

  const obj = value as Record<string, unknown>
  if ('min' in obj && typeof obj['min'] !== 'number') return false
  if ('max' in obj && typeof obj['max'] !== 'number') return false
  return true
}

const server = new Server(
  {
    name: 'p14-demo-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_time',
        description: '返回当前时间，格式：YYYY-MM-DD HH:mm:ss',
        inputSchema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'get_random_number',
        description: '返回指定范围内的随机整数',
        inputSchema: {
          type: 'object' as const,
          properties: {
            min: {
              type: 'number',
              description: '最小值（包含），默认 0',
            },
            max: {
              type: 'number',
              description: '最大值（包含），默认 100',
            },
          },
          required: [],
        },
      },
    ],
  }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'get_time') {
    const now = new Date()
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes(),
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    return {
      content: [{ type: 'text', text: formatted }],
    }
  }

  if (name === 'get_random_number') {
    const params: GetRandomNumberParams = isGetRandomNumberParams(args) ? args : {}
    const min = params.min ?? 0
    const max = params.max ?? 100
    const result = Math.floor(Math.random() * (max - min + 1)) + min

    return {
      content: [{ type: 'text', text: String(result) }],
    }
  }

  return {
    content: [{ type: 'text', text: `未知工具: ${name}` }],
    isError: true,
  }
})

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
