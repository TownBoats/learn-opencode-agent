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

async function runAgent(userMessage: string): Promise<void> {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userMessage },
  ]

  while (true) {
    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      tools,
      messages,
    })

    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
      console.log(`Agent: ${text}`)
      return
    }

    if (response.stop_reason !== 'tool_use') {
      console.log(`未处理的 stop_reason: ${response.stop_reason ?? 'null'}`)
      return
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      console.log(`Tool call: ${block.name}(${JSON.stringify(block.input)})`)

      let result: string
      if (block.name === 'get_weather') {
        const input = block.input as { city?: string }
        result = getWeather(input.city ?? '')
      } else {
        result = `Unknown tool: ${block.name}`
      }

      console.log(`Tool result: ${result}`)

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: result,
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }
}

runAgent('北京今天天气怎么样？适合出去跑步吗？').catch((error) => {
  console.error(error)
  process.exitCode = 1
})
