#!/usr/bin/env bun

/**
 * 批量替换脚本（已完成）
 * 所有 p01-p23 文件已从 Anthropic SDK 转换为 OpenAI SDK
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const files = [
  'p08-graphrag.ts',
  'p09-hybrid-retrieval.ts',
  'p10-react-loop.ts',
  'p11-planning.ts',
  'p12-reflection.ts',
  'p13-multimodal.ts',
  'p14-mcp.ts',
  'p15-multi-agent.ts',
  'p16-subagent.ts',
  'p17-agent-comm.ts',
  'p18-model-routing.ts',
  'p19-security.ts',
  'p20-observability.ts',
  'p21-evaluation.ts',
  'p22-project.ts',
  'p23-production.ts',
]

function replaceImports(content: string): string {
  return content.replace(
    /import Anthropic from '@anthropic-ai\/sdk'/g,
    "import OpenAI from 'openai'"
  )
}

function replaceClientInit(content: string): string {
  return content.replace(
    /const client = new Anthropic\(\)/g,
    'const client = new OpenAI()'
  )
}

function replaceToolDefinitions(content: string): string {
  // OpenAI.ChatCompletionTool[] 格式
  content = content.replace(
    /const tools: Anthropic\.Tool\[\] = \[/g,
    'const tools: OpenAI.ChatCompletionTool[] = ['
  )

  // 工具结构转换：name + input_schema -> type: 'function' + function: { name + parameters }
  content = content.replace(
    /\{\s*name: '([^']+)',\s*description: '([^']+)',\s*input_schema: (\{[\s\S]*?\})\s*\}/g,
    (match, name, desc, schema) => {
      return `{
    type: 'function',
    function: {
      name: '${name}',
      description: '${desc}',
      parameters: ${schema}
    }
  }`
    }
  )

  return content
}

function replaceMessageTypes(content: string): string {
  return content
    .replace(/Anthropic\.MessageParam/g, 'OpenAI.ChatCompletionMessageParam')
    .replace(/Anthropic\.TextBlock/g, 'OpenAI.ChatCompletionMessage')
    .replace(/Anthropic\.ToolResultBlockParam/g, 'OpenAI.ChatCompletionToolMessageParam')
}

function replaceApiCalls(content: string): string {
  // client.messages.create -> client.chat.completions.create
  content = content.replace(
    /client\.messages\.create\(/g,
    'client.chat.completions.create('
  )

  // model 名称替换
  content = content.replace(
    /model: 'claude-opus-4-6'/g,
    "model: 'gpt-4o'"
  )
  content = content.replace(
    /model: 'claude-haiku-4-5-20251001'/g,
    "model: 'gpt-4o-mini'"
  )
  content = content.replace(
    /model: 'claude-sonnet-4-5'/g,
    "model: 'gpt-4o'"
  )

  // 移除 max_tokens（OpenAI 使用不同的参数名）
  content = content.replace(
    /,?\s*max_tokens: \d+,?\s*/g,
    ''
  )

  // system prompt 处理：从参数移到 messages 数组
  content = content.replace(
    /system: ([^,\n]+),\s*messages: (\[[\s\S]*?\])/g,
    (match, systemPrompt, messagesArray) => {
      // 如果 systemPrompt 是变量或表达式
      return `messages: [{ role: 'system', content: ${systemPrompt} }, ...${messagesArray}]`
    }
  )

  return content
}

function replaceResponseHandling(content: string): string {
  // response.content -> response.choices[0].message
  content = content.replace(
    /response\.content\s*\.filter\(\(block\): block is Anthropic\.TextBlock => block\.type === 'text'\)\s*\.map\(\(block\) => block\.text\)\s*\.join\(''\)/g,
    "response.choices[0].message.content ?? ''"
  )

  // response.stop_reason -> response.choices[0].finish_reason
  content = content.replace(
    /response\.stop_reason === 'end_turn'/g,
    "response.choices[0].finish_reason === 'stop'"
  )
  content = content.replace(
    /response\.stop_reason === 'tool_use'/g,
    "response.choices[0].finish_reason === 'tool_calls'"
  )
  content = content.replace(
    /response\.stop_reason/g,
    'response.choices[0].finish_reason'
  )

  return content
}

function replaceToolHandling(content: string): string {
  // 工具调用处理
  content = content.replace(
    /for \(const block of response\.content\) \{\s*if \(block\.type !== 'tool_use'\) continue/g,
    `const message = response.choices[0].message
    messages.push(message)

    if (!message.tool_calls) continue

    for (const toolCall of message.tool_calls) {
      if (toolCall.type !== 'function') continue`
  )

  // block.name -> toolCall.function.name
  content = content.replace(
    /block\.name/g,
    'toolCall.function.name'
  )

  // block.input -> JSON.parse(toolCall.function.arguments)
  content = content.replace(
    /const input = block\.input as/g,
    'const input = JSON.parse(toolCall.function.arguments) as'
  )

  // tool_result -> tool role message
  content = content.replace(
    /toolResults\.push\(\{\s*type: 'tool_result',\s*tool_use_id: block\.id,\s*content: ([^}]+)\s*\}\)/g,
    `messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: $1
      })`
  )

  // 移除 toolResults 数组的 push 到 messages
  content = content.replace(
    /messages\.push\(\{ role: 'user', content: toolResults \}\)/g,
    ''
  )

  return content
}

async function processFile(filename: string): Promise<void> {
  const filePath = join(process.cwd(), filename)

  try {
    let content = await readFile(filePath, 'utf-8')

    // 应用所有替换
    content = replaceImports(content)
    content = replaceClientInit(content)
    content = replaceToolDefinitions(content)
    content = replaceMessageTypes(content)
    content = replaceApiCalls(content)
    content = replaceResponseHandling(content)
    content = replaceToolHandling(content)

    await writeFile(filePath, content, 'utf-8')
    console.log(`✓ ${filename}`)
  } catch (error) {
    console.error(`✗ ${filename}:`, error)
  }
}

async function main(): Promise<void> {
  console.log('批量替换脚本（所有文件已完成转换）\n')

  for (const file of files) {
    await processFile(file)
  }

  console.log('\n完成！')
}

main().catch(console.error)
