import Anthropic from '@anthropic-ai/sdk'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const anthropic = new Anthropic()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

function hasTextContent(
  value: unknown,
): value is { content: Array<{ type: string; text?: string }> } {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as Record<string, unknown>)['content'])
  )
}

async function connectMcpServer(client: Client): Promise<Anthropic.Tool[]> {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(__dirname, 'p14-mcp-server.ts')],
    cwd: __dirname,
  })

  await client.connect(transport)
  console.log('[MCP Server 已启动]')

  const { tools } = await client.listTools()
  const toolNames = tools.map((tool) => tool.name).join(', ')
  console.log(`[已发现工具: ${toolNames}]\n`)

  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description ?? '',
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
  }))
}

async function callToolViaMcp(
  client: Client,
  toolName: string,
  toolInput: Record<string, unknown>,
): Promise<string> {
  console.log(`Tool call via MCP: ${toolName}(${JSON.stringify(toolInput)})`)

  const result = await client.callTool({
    name: toolName,
    arguments: toolInput,
  })

  if (!hasTextContent(result)) {
    return '工具返回了非标准 content 结果'
  }

  const text = result.content
    .filter((item): item is { type: 'text'; text: string } => item.type === 'text')
    .map((item) => item.text)
    .join('')

  console.log(`Tool result: ${text}\n`)
  return text
}

async function runAgent(
  client: Client,
  tools: Anthropic.Tool[],
  userMessage: string,
): Promise<void> {
  console.log(`用户: ${userMessage}\n`)

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMessage }]

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      tools,
      messages,
    })

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    )
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    )

    if (response.stop_reason === 'end_turn' || toolUseBlocks.length === 0) {
      const finalText = textBlocks.map((block) => block.text).join('')
      console.log(`Agent: ${finalText}`)
      break
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      const toolInput =
        typeof toolUse.input === 'object' && toolUse.input !== null
          ? (toolUse.input as Record<string, unknown>)
          : {}

      const resultText = await callToolViaMcp(client, toolUse.name, toolInput)
      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: resultText,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }
}

async function main(): Promise<void> {
  const client = new Client(
    { name: 'p14-demo-client', version: '1.0.0' },
    { capabilities: {} },
  )

  const tools = await connectMcpServer(client)
  await runAgent(client, tools, '现在几点了？再给我一个 1-100 的随机数')
  await client.close()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
