# 实践篇模块设计文档

**日期**：2026-03-19
**状态**：已批准
**项目**：从零构建 AI Coding Agent — 实践篇扩展

---

## 概述

在现有 VitePress 电子书（理论篇）基础上，新增「AI Agent 实战手册」实践篇模块。采用单 VitePress 实例 + 多路径侧边栏方案，通过 `/practice/` 路径前缀隔离，实践篇拥有独立首页、独立导航和差异化视觉风格。

**核心定位**：
- 读者：有 Anthropic/OpenAI API 调用经验，想系统学习 Agent 工程实践
- 内容：23 章，7 个阶段，每章一个可运行 TypeScript 项目
- 技术栈：OpenAI SDK + TypeScript（不依赖 OpenCode 框架）

---

## Section 1：技术架构

### VitePress 侧边栏改造

将现有平铺数组 `sidebar` 改为路径键对象，支持多书并存：

```ts
// .vitepress/config.mts
sidebar: {
  '/practice/': [
    { text: '← 返回理论篇', link: '/' },
    { text: '课程介绍', link: '/practice/' },
    {
      text: 'Phase 1 — Agent 基础',
      collapsed: false,
      items: [
        { text: 'P1：最小 Agent — 工具调用核心机制', link: '/practice/p01-minimal-agent/' },
        { text: 'P2：多轮对话与上下文管理', link: '/practice/p02-multi-turn/' },
        { text: 'P3：流式输出与实时反馈', link: '/practice/p03-streaming/' },
        { text: 'P4：错误处理与重试策略', link: '/practice/p04-error-handling/' },
      ]
    },
    {
      text: 'Phase 2 — 记忆与知识系统',
      collapsed: false,
      items: [
        { text: 'P5：记忆系统架构', link: '/practice/p05-memory-arch/' },
        { text: 'P6：记忆增强检索', link: '/practice/p06-memory-retrieval/' },
        { text: 'P7：RAG 基础', link: '/practice/p07-rag-basics/' },
        { text: 'P8：GraphRAG', link: '/practice/p08-graphrag/' },
        { text: 'P9：混合检索策略', link: '/practice/p09-hybrid-retrieval/' },
      ]
    },
    {
      text: 'Phase 3 — 推理与规划',
      collapsed: false,
      items: [
        { text: 'P10：ReAct Loop 实现', link: '/practice/p10-react-loop/' },
        { text: 'P11：Planning 机制', link: '/practice/p11-planning/' },
        { text: 'P12：Reflection 模式', link: '/practice/p12-reflection/' },
      ]
    },
    {
      text: 'Phase 4 — 感知扩展',
      collapsed: false,
      items: [
        { text: 'P13：多模态智能体', link: '/practice/p13-multimodal/' },
        { text: 'P14：MCP 协议接入', link: '/practice/p14-mcp/' },
      ]
    },
    {
      text: 'Phase 5 — 多 Agent 协作',
      collapsed: false,
      items: [
        { text: 'P15：多 Agent 编排模式', link: '/practice/p15-multi-agent/' },
        { text: 'P16：子 Agent 与任务分解', link: '/practice/p16-subagent/' },
        { text: 'P17：Agent 间通信与状态共享', link: '/practice/p17-agent-comm/' },
      ]
    },
    {
      text: 'Phase 6 — 生产化',
      collapsed: false,
      items: [
        { text: 'P18：多模型路由与成本控制', link: '/practice/p18-model-routing/' },
        { text: 'P19：Agent 安全与防注入', link: '/practice/p19-security/' },
        { text: 'P20：可观测性与调试', link: '/practice/p20-observability/' },
        { text: 'P21：评估与基准测试', link: '/practice/p21-evaluation/' },
      ]
    },
    {
      text: 'Phase 7 — 综合实战',
      collapsed: false,
      items: [
        { text: 'P22：完整项目实战 — Code Review Agent', link: '/practice/p22-project/' },
        { text: 'P23：生产部署清单', link: '/practice/p23-production/' },
      ]
    },
  ],
  '/': [
    // 现有主书侧边栏（完全保留，不做任何修改）
    // ...（略，见当前 config.mts）
  ]
}
```

### 目录结构

```
docs/book/docs/
├── index.md                          ← 主书首页（新增实践篇入口按钮）
├── practice/
│   ├── index.md                      ← 实践篇独立首页（layout: home，pageClass: practice-page）
│   ├── p01-minimal-agent/index.md
│   ├── p02-multi-turn/index.md
│   ├── p03-streaming/index.md
│   ├── p04-error-handling/index.md
│   ├── p05-memory-arch/index.md
│   ├── p06-memory-retrieval/index.md
│   ├── p07-rag-basics/index.md
│   ├── p08-graphrag/index.md
│   ├── p09-hybrid-retrieval/index.md
│   ├── p10-react-loop/index.md
│   ├── p11-planning/index.md
│   ├── p12-reflection/index.md
│   ├── p13-multimodal/index.md
│   ├── p14-mcp/index.md
│   ├── p15-multi-agent/index.md
│   ├── p16-subagent/index.md
│   ├── p17-agent-comm/index.md
│   ├── p18-model-routing/index.md
│   ├── p19-security/index.md
│   ├── p20-observability/index.md
│   ├── p21-evaluation/index.md
│   ├── p22-project/index.md
│   └── p23-production/index.md
└── （现有 00-20 章节，完全不动）
```

---

## Section 2：实践篇首页视觉设计

**风格**：终端/Hacker 深色风，与主书 Cyber Teal 形成强烈反差，突出「动手」感。

**配色**：
- 背景：`#0c0a09`（近黑）
- 卡片背景：`#1c1917`
- 边框：`#292524`
- 主色：`#ea580c` / `#f97316`（橙色系）
- 代码文字：绿色成功 `#86efac`，蓝色 Agent 输出 `#93c5fd`，黄色工具调用 `#fbbf24`

**首页结构**（`practice/index.md`）：
1. **Hero 区**：嵌入 `PracticeTerminalHero.vue`，模拟 `bun run p01` 执行动画
2. **标题**：「AI Agent 实战手册」+ 副标题「23 个项目 · 每章可运行 · OpenAI SDK + TypeScript」
3. **按钮组**：`▶ bun run p01`（主按钮）/ 课程大纲 / ← 返回理论篇
4. **Phase 网格**：`PracticePhaseGrid.vue`，4 列展示 7 个阶段
5. **技术标签云**：`PracticeTagCloud.vue`，橙色 monospace 标签

**主题隔离**：仅实践篇**首页**（`practice/index.md`）应用暗色橙色主题；P01–P23 各章节页**继承主书默认 Cyber Teal 主题**，不单独覆盖。这样侧边栏、正文排版与主书一致，只有首页形成视觉反差作为入口辨识。

在 `practice/index.md` frontmatter 中设置 `pageClass: practice-page`，通过 `custom.css` 覆盖 CSS 变量，仅作用于实践篇首页：

```css
/* custom.css 新增 */
.practice-page {
  --vp-c-brand-1: #ea580c;
  --vp-c-brand-2: #f97316;
  --vp-home-hero-name-color: #f97316;
  --vp-c-bg: #0c0a09;
  --vp-c-bg-soft: #1c1917;
  --vp-c-text-1: #f5f5f4;
  --vp-c-text-2: #a8a29e;
}
```

---

## Section 3：新增 Vue 组件

所有组件放入 `.vitepress/theme/components/`，Props 类型统一写入 `types.ts`，在 `theme/index.ts` 注册。

### 首页专用组件（3个）

#### `PracticeTerminalHero.vue`
Hero 区终端动画组件。逐字符打印预设的 CLI 执行序列，播放完毕后循环。无 Props，硬编码演示脚本即可。

**伪代码逻辑**：
```
lines = ["$ bun run p01-minimal-agent.ts", "✓ OpenAI SDK initialized", ...]
每 80ms 打印一个字符，行末暂停 600ms，全部完毕后延迟 2s 重播
```

#### `PracticePhaseGrid.vue`
展示 7 个阶段的卡片网格。Props：`phases: PracticePhase[]`。

```ts
// types.ts 新增
interface PracticePhase {
  id: number
  title: string
  subtitle: string
  chapterCount: number
  link: string
}
```

#### `PracticeTagCloud.vue`
技术标签云。Props 类型写入 `types.ts`：

```ts
// types.ts 新增
interface PracticeTagCloudProps {
  tags: string[]
}
```

### 章节专用组件（2个）

#### `ProjectCard.vue`
每章顶部项目信息卡，锚定本章可交付物。

```ts
// types.ts 新增
interface ProjectCardProps {
  title: string           // 你将构建：XXX
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string        // 预计时长，如 "45 min"
  prerequisites: string[] // 前置章节
  tags: string[]          // 技术标签
}
```

#### `RunCommand.vue`
本章运行命令展示，带一键复制按钮。Props：`command: string`。

---

## Section 4：导航整合

### 顶部导航栏

```ts
// config.mts nav 新增一项
{ text: '实践篇', link: '/practice/', activeMatch: '/practice/' }
```

位置：插入在「首页」和「阅读地图」之间。

### 主书首页入口按钮

```yaml
# docs/index.md hero.actions 新增
- theme: alt
  text: 动手实践篇 →
  link: /practice/
```

### 实践篇侧边栏顶部互跳链接

```ts
// sidebar['/practice/'] 第一项
{ text: '← 返回理论篇', link: '/' }
```

---

## 章节内容约定

每个实践章节 `pNN-xxx/index.md` 结构如下：

```md
---
title: PXX：章节标题
description: 一句话描述
pageClass: practice-chapter   （可选，用于章节级样式调整）
---

<ProjectCard
  title="你将构建：XXX"
  difficulty="beginner"
  duration="45 min"
  :prerequisites="['P01']"
  :tags="['Tool Calling', 'OpenAI SDK']"
/>

## 背景与目标
...

## 核心概念
...

## 动手实现

<RunCommand command="bun run p01-minimal-agent.ts" />

...代码讲解...

## 小结与延伸

<StarCTA />
```

---

## 实施范围

**本次实施**（最小可验证版本）：
1. 改造 `config.mts`：侧边栏转对象格式 + 实践篇侧边栏骨架
2. 创建 `practice/index.md`：实践篇首页（含 Hero、Phase 网格、标签云）
3. 新增 5 个 Vue 组件（`PracticeTerminalHero`、`PracticePhaseGrid`、`PracticeTagCloud`、`ProjectCard`、`RunCommand`）
4. 更新 `types.ts`：新增 `PracticePhase`、`ProjectCardProps`
5. 更新 `custom.css`：新增 `.practice-page` 主题变量
6. 更新主书 `index.md`：新增实践篇入口按钮
7. 更新 `theme/index.ts`：注册 5 个新组件
8. 创建 `practice/p01-minimal-agent/index.md`：第一章完整示范内容

**不在本次范围**（后续迭代）：
- P02–P23 章节正文内容（框架搭好后逐章撰写）
- `practice/index.md` 的「课程进度」追踪功能（需要本地存储，属于功能增强）
