import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const chapters = [
  { dir: '01-agent-basics', title: '第一篇：Agent 基础架构' },
  { dir: '02-agent-core', title: '第二篇：Agent 核心系统' },
  { dir: '03-tool-system', title: '第三篇：工具系统' },
  { dir: '04-session-management', title: '第四篇：会话管理' },
  { dir: '05-provider-system', title: '第五篇：多模型支持' },
  { dir: '06-mcp-integration', title: '第六篇：MCP 协议集成' },
  { dir: '07-tui-interface', title: '第七篇：TUI 终端界面' },
  { dir: '08-http-api-server', title: '第八篇：HTTP API 服务器' },
  { dir: '09-data-persistence', title: '第九篇：数据持久化' },
  { dir: '10-multi-platform-ui', title: '第十篇：多端 UI 开发' },
  { dir: '11-code-intelligence', title: '第十一篇：代码智能' },
  { dir: '12-plugins-extensions', title: '第十二篇：插件与扩展' },
  { dir: '13-deployment-infrastructure', title: '第十三篇：部署与基础设施' },
  { dir: '14-testing-quality', title: '第十四篇：测试与质量保证' },
  { dir: '15-advanced-topics', title: '第十五篇：高级主题与最佳实践' },
  // 第五部分：oh-my-openagent 插件系统
  { dir: 'oh-prelude', title: '第17章：为什么需要多个 Agent？' },
  { dir: '16-plugin-overview', title: '第18章：oh-my-openagent 插件系统概述' },
  { dir: 'oh-config', title: '第19章：配置系统实战' },
  { dir: '17-multi-model-orchestration', title: '第20章：多模型编排系统' },
  { dir: '18-hooks-architecture', title: '第21章：Hooks 三层架构' },
  { dir: '19-tool-extension', title: '第22章：工具扩展系统' },
  { dir: 'oh-flow', title: '第23章：一条消息的完整旅程' },
  { dir: '20-best-practices', title: '第24章：实战案例与最佳实践' },
];

const docsDir = 'docs';

for (const chapter of chapters) {
  const filePath = join(docsDir, chapter.dir, 'index.md');
  const content = readFileSync(filePath, 'utf-8');

  const frontmatter = `---
title: ${chapter.title}
description: ${chapter.title}的详细内容
---

`;

  const newContent = frontmatter + content;
  writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✓ ${chapter.title}`);
}

console.log('\n完成！');
