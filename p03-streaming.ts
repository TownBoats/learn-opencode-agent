import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: '查询指定城市的当前天气',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '城市名称，如"北京"、"上海"',
        },
      },
      required: ['city'],
    },
  },
]

function getWeather(city: string): string {
  const data: Record<string, string> = {
    北京: '晴，22°C，东南风 3 级',
    上海: '多云，18°C，东风 2 级',
    广州: '小雨，26°C，南风 2 级',
  }
  return data[city] ?? `暂无 ${city} 的天气数据`
}

function executeTool(name: string, input: Record<string, string>): string {
  if (name === 'get_weather') {
    return getWeather(input.city)
  }
  return `Unknown tool: ${name}`
}

async function runStreamingAgent(userMessage: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  while (true) {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      tools,
      messages,
    })

    const contentBlocks: Anthropic.ContentBlockParam[] = []
    let currentToolUse: {
      id: string
      name: string
      inputJson: string
    } | null = null
    let stopReason: string | null = null

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolUse = {
            id: event.content_block.id,
            name: event.content_block.name,
            inputJson: '',
          }
          process.stdout.write(`\n[调用工具: ${event.content_block.name} `)
        }

        if (event.content_block.type === 'text') {
          contentBlocks.push({ type: 'text', text: '' })
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          process.stdout.write(event.delta.text)
          const lastBlock = contentBlocks[contentBlocks.length - 1]
          if (lastBlock?.type === 'text') {
            lastBlock.text += event.delta.text
          }
        }

        if (event.delta.type === 'input_json_delta' && currentToolUse) {
          currentToolUse.inputJson += event.delta.partial_json
        }
      }

      if (event.type === 'content_block_stop' && currentToolUse) {
        let parsedInput: Record<string, string> = {}
        try {
          parsedInput = JSON.parse(currentToolUse.inputJson) as Record<string, string>
        } catch {
          parsedInput = {}
        }

        process.stdout.write(`${JSON.stringify(parsedInput)}]\n`)
        contentBlocks.push({
          type: 'tool_use',
          id: currentToolUse.id,
          name: currentToolUse.name,
          input: parsedInput,
        })
        currentToolUse = null
      }

      if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason ?? null
      }
    }

    messages.push({ role: 'assistant', content: contentBlocks })

    if (stopReason === 'end_turn') {
      process.stdout.write('\n')
      return
    }

    if (stopReason !== 'tool_use') {
      process.stdout.write(`\n[未处理的 stop_reason: ${stopReason ?? 'null'}]\n`)
      return
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of contentBlocks) {
      if (block.type !== 'tool_use') continue

      const input = block.input as Record<string, string>
      const result = executeTool(block.name, input)

      console.log(`[工具结果: ${result}]`)

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }
}

process.stdout.write('> 北京天气怎么样，适合跑步吗？\n')
runStreamingAgent('北京天气怎么样，适合跑步吗？').catch((error) => {
  console.error(error)
  process.exitCode = 1
})
