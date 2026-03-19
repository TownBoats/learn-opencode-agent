import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function messageToText(message: Anthropic.MessageParam): string {
  if (typeof message.content === 'string') return message.content

  return message.content
    .map((block) => {
      if (block.type === 'text') return block.text
      return ''
    })
    .join('')
}

class ChatSession {
  private messages: Anthropic.MessageParam[] = []
  private readonly systemPrompt: string
  private readonly maxTokenEstimate: number

  constructor(systemPrompt: string, maxTokenEstimate = 4000) {
    this.systemPrompt = systemPrompt
    this.maxTokenEstimate = maxTokenEstimate
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({ role, content })
  }

  estimateHistoryTokens(): number {
    const historyText = this.messages.map(messageToText).join('')
    return estimateTokens(historyText) + estimateTokens(this.systemPrompt)
  }

  trimHistory(maxTokenEstimate: number): void {
    while (
      this.messages.length > 2 &&
      this.estimateHistoryTokens() > maxTokenEstimate
    ) {
      this.messages.splice(0, 2)
      console.log(
        `  [trim] 历史过长，删除最旧一对消息，剩余 ${this.messages.length} 条`,
      )
    }
  }

  getHistoryLength(): number {
    return this.messages.length
  }

  async chat(userInput: string): Promise<string> {
    this.addMessage('user', userInput)
    this.trimHistory(this.maxTokenEstimate)

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: this.systemPrompt,
      messages: this.messages,
    })

    const assistantText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    this.addMessage('assistant', assistantText)
    return assistantText
  }
}

async function main(): Promise<void> {
  const session = new ChatSession(
    '你是一名简洁的编程助手，回答控制在 100 字以内。',
    2000,
  )

  const turns = [
    '用 TypeScript 写一个计算数组平均值的函数',
    '改成支持忽略 undefined 值',
    '加上单元测试',
    '把这个函数改成支持加权平均',
  ]

  for (let index = 0; index < turns.length; index += 1) {
    const userInput = turns[index]
    console.log(`\n--- 第 ${index + 1} 轮 ---`)
    console.log(`用户：${userInput}`)

    const reply = await session.chat(userInput)

    console.log(`助手：${reply}`)
    console.log(
      `历史长度：${session.getHistoryLength()} 条，估算 Token：${session.estimateHistoryTokens()}`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
