---
layout: home
title: AI Agent 实战手册
description: 23 个项目，按章节拆解 TypeScript Agent 实现，从工具调用到生产部署全覆盖
pageClass: practice-page
---

<script setup>
import PracticeTerminalHero from '../../.vitepress/theme/components/PracticeTerminalHero.vue'
import PracticePhaseGrid from '../../.vitepress/theme/components/PracticePhaseGrid.vue'
import PracticeTagCloud from '../../.vitepress/theme/components/PracticeTagCloud.vue'
</script>

<div class="practice-hero-section">

<PracticeTerminalHero />

# AI Agent 实战手册

**23 个项目 · 可跟打实现 · Anthropic SDK + TypeScript**

<div class="practice-actions">
  <a href="/practice/setup" class="btn-secondary">开始前先看</a>
  <a href="/practice/p01-minimal-agent/" class="btn-primary">从 P1 开始</a>
  <a href="#phases" class="btn-secondary">课程大纲</a>
  <a href="#run-index" class="btn-secondary">运行索引</a>
  <a href="/" class="btn-secondary">← 返回理论篇</a>
</div>

> 第一次进入实践篇，建议先看 [实践环境准备](/practice/setup)。当前实践篇已经覆盖 `P1-P23` 的仓库内示例文件，可直接按章节命令运行。

</div>

## 课程阶段 {#phases}

<PracticePhaseGrid :phases="[
  { id: 1, title: 'Agent 基础', subtitle: '工具调用 / 多轮对话 / 流式输出 / 错误处理', chapterCount: 4, link: '/practice/p01-minimal-agent/' },
  { id: 2, title: '记忆与知识', subtitle: '记忆系统 / 记忆增强检索 / RAG / GraphRAG', chapterCount: 5, link: '/practice/p05-memory-arch/' },
  { id: 3, title: '推理与规划', subtitle: 'ReAct Loop / Planning / Reflection', chapterCount: 3, link: '/practice/p10-react-loop/' },
  { id: 4, title: '感知扩展', subtitle: '多模态智能体 / MCP 协议接入', chapterCount: 2, link: '/practice/p13-multimodal/' },
  { id: 5, title: '多 Agent 协作', subtitle: '编排模式 / 子 Agent / 通信协议', chapterCount: 3, link: '/practice/p15-multi-agent/' },
  { id: 6, title: '生产化', subtitle: '模型路由 / 安全 / 可观测性 / 评估', chapterCount: 4, link: '/practice/p18-model-routing/' },
  { id: 7, title: '综合实战', subtitle: 'Code Review Agent 完整项目 / 部署清单', chapterCount: 2, link: '/practice/p22-project/' },
]" />

## 技术覆盖

<PracticeTagCloud :tags="[
  'Anthropic SDK', 'Tool Calling', 'Streaming', 'Multi-turn',
  'Memory System', 'RAG', 'GraphRAG', 'Hybrid Retrieval',
  'ReAct', 'Planning', 'Reflection', 'Multimodal',
  'MCP', 'Multi-Agent', 'Cost Control', 'Security',
  'Observability', 'Evaluation', 'Production Deploy',
]" />

## 运行索引 {#run-index}

如果你已经完成环境准备，可以直接从这里复制命令进入任意章节：

### 先看依赖分组

按当前仓库里的真实示例脚本，第三方依赖可以先这样理解：

| 依赖组 | 章节范围 | 需要安装 |
|--------|----------|----------|
| 通用基础组 | `P1-P23` | `@anthropic-ai/sdk` |
| MCP 扩展组 | `P14` | `@modelcontextprotocol/sdk` |

补充说明：

- 除 `P14` 外，其余章节当前都只依赖 `@anthropic-ai/sdk` 和 Node 内置模块。
- `P23` 的健康检查示例使用的是 `node:http`，不需要额外安装 Web 框架。

### 阶段 1：Agent 基础

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P1 | [最小 Agent](/practice/p01-minimal-agent/) | `bun run p01-minimal-agent.ts` |
| P2 | [多轮对话](/practice/p02-multi-turn/) | `bun run p02-multi-turn.ts` |
| P3 | [流式输出](/practice/p03-streaming/) | `bun run p03-streaming.ts` |
| P4 | [错误处理](/practice/p04-error-handling/) | `bun run p04-error-handling.ts` |

### 阶段 2：记忆与知识

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P5 | [记忆架构](/practice/p05-memory-arch/) | `bun run p05-memory-arch.ts` |
| P6 | [记忆检索](/practice/p06-memory-retrieval/) | `bun run p06-memory-retrieval.ts` |
| P7 | [RAG 基础](/practice/p07-rag-basics/) | `bun run p07-rag-basics.ts` |
| P8 | [GraphRAG](/practice/p08-graphrag/) | `bun run p08-graphrag.ts` |
| P9 | [混合检索](/practice/p09-hybrid-retrieval/) | `bun run p09-hybrid-retrieval.ts` |

### 阶段 3：推理与规划

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P10 | [ReAct Loop](/practice/p10-react-loop/) | `bun run p10-react-loop.ts` |
| P11 | [Planning](/practice/p11-planning/) | `bun run p11-planning.ts` |
| P12 | [Reflection](/practice/p12-reflection/) | `bun run p12-reflection.ts` |

### 阶段 4：感知扩展

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P13 | [多模态](/practice/p13-multimodal/) | `bun run p13-multimodal.ts` |
| P14 | [MCP 协议接入](/practice/p14-mcp/) | `bun run p14-mcp.ts` |

### 阶段 5：多 Agent 协作

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P15 | [多 Agent 编排](/practice/p15-multi-agent/) | `bun run p15-multi-agent.ts` |
| P16 | [Sub-Agent](/practice/p16-subagent/) | `bun run p16-subagent.ts` |
| P17 | [Agent 通信](/practice/p17-agent-comm/) | `bun run p17-agent-comm.ts` |

### 阶段 6：生产化

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P18 | [模型路由](/practice/p18-model-routing/) | `bun run p18-model-routing.ts` |
| P19 | [安全防护](/practice/p19-security/) | `bun run p19-security.ts` |
| P20 | [可观测性](/practice/p20-observability/) | `bun run p20-observability.ts` |
| P21 | [评估体系](/practice/p21-evaluation/) | `bun run p21-evaluation.ts` |

### 阶段 7：综合实战

| 章节 | 页面 | 运行命令 |
|------|------|----------|
| P22 | [Code Review Agent](/practice/p22-project/) | `bun run p22-project.ts` |
| P23 | [生产部署清单](/practice/p23-production/) | `bun run p23-production.ts` |

补充说明：

- `P14` 章节除了 `p14-mcp.ts` 外，还需要仓库根目录的 `p14-mcp-server.ts` 配合运行。
- 运行前仍建议先看 [实践环境准备](/practice/setup)，重点确认依赖和 `ANTHROPIC_API_KEY`。

<style scoped>
.practice-hero-section {
  text-align: center;
  padding: 60px 24px 40px;
}

.practice-hero-section h1 {
  font-size: 2.4em;
  font-weight: 700;
  color: #f5f5f4;
  margin: 16px 0 8px;
  letter-spacing: -0.02em;
}

.practice-hero-section p {
  color: #a8a29e;
  font-size: 15px;
  margin-bottom: 28px;
}

.practice-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.btn-primary {
  background: #ea580c;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 14px;
  text-decoration: none;
  transition: background 0.2s, transform 0.2s;
}

.btn-primary:hover {
  background: #c2410c;
  transform: translateY(-1px);
}

.btn-secondary {
  background: transparent;
  color: #a8a29e;
  border: 1px solid #44403c;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  text-decoration: none;
  transition: border-color 0.2s, color 0.2s;
}

.btn-secondary:hover {
  border-color: #f97316;
  color: #f97316;
}
</style>
