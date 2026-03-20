#!/usr/bin/env bun

/**
 * 批量替换文档中的 Anthropic SDK 相关文案为 OpenAI SDK
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { join } from 'path'

async function getAllMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  await walk(dir)
  return files
}

async function replaceInFile(filePath: string): Promise<boolean> {
  try {
    let content = await readFile(filePath, 'utf-8')
    let changed = false

    // 1. 替换包名
    if (content.includes('@anthropic-ai/sdk')) {
      content = content.replace(/@anthropic-ai\/sdk/g, 'openai')
      changed = true
    }

    // 2. 替换环境变量名
    if (content.includes('ANTHROPIC_API_KEY')) {
      content = content.replace(/ANTHROPIC_API_KEY/g, 'OPENAI_API_KEY')
      changed = true
    }

    // 3. 替换 "Anthropic SDK" 文案
    if (content.includes('Anthropic SDK')) {
      content = content.replace(/Anthropic SDK/g, 'OpenAI SDK')
      changed = true
    }

    // 4. 替换 import 语句
    if (content.includes("import Anthropic from '@anthropic-ai/sdk'")) {
      content = content.replace(/import Anthropic from '@anthropic-ai\/sdk'/g, "import OpenAI from 'openai'")
      changed = true
    }

    // 5. 替换客户端初始化
    if (content.includes('new Anthropic()')) {
      content = content.replace(/new Anthropic\(\)/g, 'new OpenAI()')
      changed = true
    }
    if (content.includes('const anthropic = new Anthropic()')) {
      content = content.replace(/const anthropic = new Anthropic\(\)/g, 'const client = new OpenAI()')
      changed = true
    }

    // 6. 替换 Anthropic 类型引用
    content = content.replace(/Anthropic\.Tool/g, 'OpenAI.ChatCompletionTool')
    content = content.replace(/Anthropic\.MessageParam/g, 'OpenAI.ChatCompletionMessageParam')
    content = content.replace(/Anthropic\.TextBlock/g, 'OpenAI.ChatCompletionMessage')
    content = content.replace(/Anthropic\.ToolResultBlockParam/g, 'OpenAI.ChatCompletionToolMessageParam')
    content = content.replace(/Anthropic\.ToolUseBlock/g, 'OpenAI.ChatCompletionMessageToolCall')
    content = content.replace(/Anthropic\.Message/g, 'OpenAI.ChatCompletion')
    content = content.replace(/Anthropic\.ContentBlock/g, 'OpenAI.ChatCompletionContentPart')
    content = content.replace(/Anthropic\.ImageBlockParam/g, 'OpenAI.ChatCompletionContentPartImage')

    // 7. 替换模型名称
    content = content.replace(/claude-opus-4-6/g, 'gpt-4o')
    content = content.replace(/claude-sonnet-4-20250514/g, 'gpt-4o')
    content = content.replace(/claude-sonnet-4-6/g, 'gpt-4o')
    content = content.replace(/claude-haiku-4-5-20251001/g, 'gpt-4o-mini')
    content = content.replace(/claude-haiku-4-5/g, 'gpt-4o-mini')

    // 8. 替换 Anthropic 公司/产品名称（保留必要的历史引用）
    // 只替换明确指 SDK 或 API 的部分
    content = content.replace(/Anthropic API/g, 'OpenAI API')
    content = content.replace(/Anthropic 的/g, 'OpenAI 的')
    content = content.replace(/Anthropic SDK/g, 'OpenAI SDK')

    // 9. 替换 Embedding 模型引用
    content = content.replace(/Anthropic voyage-3/g, 'OpenAI text-embedding-3-large')
    content = content.replace(/voyage-3/g, 'text-embedding-3-large')

    // 10. 替换 API 调用方法
    content = content.replace(/anthropic\.messages\.create/g, 'client.chat.completions.create')
    content = content.replace(/client\.messages\.create/g, 'client.chat.completions.create')

    if (changed) {
      await writeFile(filePath, content, 'utf-8')
      return true
    }
    return false
  } catch (error) {
    console.error(`✗ ${filePath}:`, error)
    return false
  }
}

async function main(): Promise<void> {
  console.log('开始批量替换文档中的 Anthropic SDK 文案...\n')

  // 查找所有 Markdown 文件
  const files = await getAllMarkdownFiles('docs')

  let changedCount = 0
  for (const file of files) {
    const changed = await replaceInFile(file)
    if (changed) {
      console.log(`✓ ${file}`)
      changedCount++
    }
  }

  console.log(`\n完成！共修改 ${changedCount} 个文件`)
}

main().catch(console.error)
