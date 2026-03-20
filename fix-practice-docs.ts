#!/usr/bin/env bun

/**
 * 修复实践篇文档中的错误引用
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

    // 1. 修复错误的 import 语句
    if (content.includes("import Anthropic from 'openai'")) {
      content = content.replace(/import Anthropic from 'openai'/g, "import OpenAI from 'openai'")
      changed = true
    }

    // 2. 修复变量声明
    if (content.includes('private client: Anthropic')) {
      content = content.replace(/private client: Anthropic/g, 'private client: OpenAI')
      changed = true
    }

    // 3. 修复 AnthropicError 引用
    if (content.includes('AnthropicError:')) {
      content = content.replace(/AnthropicError:/g, 'OpenAI.APIError:')
      changed = true
    }

    if (content.includes('instanceof Anthropic.APIError')) {
      content = content.replace(/instanceof Anthropic\.APIError/g, 'instanceof OpenAI.APIError')
      changed = true
    }

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
  console.log('开始修复实践篇文档中的错误引用...\n')

  const files = await getAllMarkdownFiles('docs/practice')

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
