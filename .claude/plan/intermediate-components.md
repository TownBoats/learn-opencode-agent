# 📋 实施计划：中级篇 Vue 交互组件（第 25-32 章）

> 生成时间：2026-03-21
> CODEX_SESSION: 019d10af-c50e-78b2-a469-1d743a627d40
> GEMINI_SESSION: ef4af121-f7e4-48d9-ad9a-14c5dbc557c4

---

## 任务类型
- [x] 前端（Vue 3 SFC + TypeScript）

---

## 技术方案（Codex + Gemini 综合最优解）

**架构分层**：
```
types.ts              ← 所有领域类型（统一前缀：Rag*/Plan*/Prompt*/Topology*/Security*/Cost*）
composables/          ← 4 个可复用 composable（播放控制/预算/场景切换/依赖计算）
components/           ← 6 个新组件 + 2 个复用包装
theme/index.ts        ← 手工注册，不改注册模式
```

**关键决策**：
- 依赖线用轻量 SVG（固定坐标，不做自由拖拽）
- 编辑器用 `<textarea>`（不引入 Monaco Editor）
- 图表用自定义 SVG（不引入 Chart.js）
- Ch26/28 复用现有组件做包装壳（不重写）
- SecurityBoundaryDemo 采用 5 阶段管道（与 PermissionFlow.vue 一致）

---

## 实施步骤

### Step 1：扩展 types.ts（添加 8 章领域类型）

**文件**：`.vitepress/theme/components/types.ts`（追加）

```typescript
// ===== 通用工具类型 =====
export type DemoTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'
export type DemoPlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed'
export type DemoStepStatus = 'pending' | 'active' | 'done' | 'blocked'

export interface DemoBudget {
  used: number
  total: number
  reserved?: number
  warningAt?: number
  dangerAt?: number
}

export interface DemoScenarioMeta {
  id: string
  title: string
  summary: string
}

// ===== Ch25: RAG 检索准确性 =====
export interface RagChunk {
  id: string
  source: string
  title: string
  excerpt: string
  tokenCount: number
  semanticScore: number
  lexicalScore: number
  finalScore: number
  includedInContext: boolean
}

export interface RagScenario {
  meta: DemoScenarioMeta
  query: string
  answerGoal: string
  contextBudget: DemoBudget
  chunks: RagChunk[]
  failureMode: 'low-recall' | 'bad-ranking' | 'context-overload' | 'source-conflict'
}

export interface RagAccuracyDemoProps {
  scenarios: RagScenario[]
  autoPlay?: boolean
}

// ===== Ch27: Planning 机制 =====
export interface PlanTaskNode {
  id: string
  title: string
  description: string
  status: DemoStepStatus
  priority: 'p0' | 'p1' | 'p2'
  estimatedTokens: number
  dependsOn: string[]
  children?: PlanTaskNode[]
}

export interface PlanningTreeDemoProps {
  tasks: PlanTaskNode[]
  autoPlay?: boolean
  playSpeed?: number
}

// ===== Ch29: System Prompt 设计 =====
export interface PromptSection {
  id: string
  label: string
  description: string
  required: boolean
  maxTokens: number
  content: string
}

export interface PromptLintIssue {
  id: string
  severity: 'info' | 'warning' | 'error'
  sectionId: string
  message: string
  suggestion: string
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  tags: string[]
  sections: PromptSection[]
}

export interface PromptDesignStudioProps {
  templates: PromptTemplate[]
  initialTemplateId?: string
}

// ===== Ch30: 生产架构 =====
export interface TopologyNode {
  id: string
  label: string
  layer: 'edge' | 'gateway' | 'orchestrator' | 'worker' | 'provider' | 'storage' | 'observability'
  x: number
  y: number
  status: 'healthy' | 'degraded' | 'down'
}

export interface TopologyLink {
  id: string
  from: string
  to: string
  mode: 'sync' | 'async' | 'stream' | 'replication'
  redundant?: boolean
  highlighted?: boolean
}

export type ProductionScenario = 'normal' | 'provider-failover' | 'worker-failure' | 'scale-out'

export interface ProductionArchitectureDiagramProps {
  nodes: TopologyNode[]
  links: TopologyLink[]
  initialScenario?: ProductionScenario
}

// ===== Ch31: 安全与边界 =====
export type SecurityStage = 'input' | 'policy' | 'permission' | 'sandbox' | 'audit'
export type SecurityDecision = 'allow' | 'ask' | 'deny'

export interface SecurityRule {
  id: string
  stage: SecurityStage
  label: string
  decision: SecurityDecision
  rationale: string
}

export interface SecurityScenario {
  meta: DemoScenarioMeta
  inputPayload: string
  isMalicious: boolean
  rules: SecurityRule[]
  auditLog: string[]
}

export interface SecurityBoundaryDemoProps {
  scenarios: SecurityScenario[]
  autoPlay?: boolean
}

// ===== Ch32: 性能与成本 =====
export type CacheStrategy = 'none' | 'lru' | 'ttl' | 'semantic'
export type ModelTier = 'flagship' | 'balanced' | 'fast' | 'local'

export interface CostBreakdownItem {
  id: string
  label: string
  inputTokens: number
  outputTokens: number
  cacheHitRate: number
  modelTier: ModelTier
  costUsd: number
}

export interface CostScenario {
  meta: DemoScenarioMeta
  cacheStrategy: CacheStrategy
  requestsPerHour: number
  items: CostBreakdownItem[]
  totalCostUsd: number
  savingsVsBaseline: number
}

export interface CostOptimizationDashboardProps {
  scenarios: CostScenario[]
  baselineScenarioId: string
}
```

**预期产物**：types.ts 新增约 150 行，无 `any` 类型，全部 export。

---

### Step 2：创建 composables 目录（4 个可复用逻辑）

**目录**：`.vitepress/theme/composables/`

#### 2.1 `useDemoPlayer.ts`
```typescript
// 统一播放控制：play/pause/restart/cleanup + reduced-motion
export function useDemoPlayer(options: {
  steps: number
  intervalMs: number
  onStep: (step: number) => void
  onComplete?: () => void
}) {
  const status = ref<DemoPlaybackStatus>('idle')
  const currentStep = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const play = () => { /* ... */ }
  const pause = () => { /* ... */ }
  const restart = () => { /* ... */ }

  onUnmounted(() => { if (timer) clearInterval(timer) })

  return { status, currentStep, play, pause, restart }
}
```

#### 2.2 `useBudgetMeter.ts`
```typescript
// Token 预算计算：ratio/tone/label
export function useBudgetMeter(budget: Ref<DemoBudget>) {
  const ratio = computed(() => budget.value.used / budget.value.total)
  const tone = computed((): DemoTone => {
    if (ratio.value >= (budget.value.dangerAt ?? 0.9)) return 'danger'
    if (ratio.value >= (budget.value.warningAt ?? 0.7)) return 'warning'
    return 'neutral'
  })
  const label = computed(() => `${budget.value.used.toLocaleString()} / ${budget.value.total.toLocaleString()}`)
  return { ratio, tone, label }
}
```

#### 2.3 `useScenarioSelection.ts`
```typescript
// 场景切换：current/select/reset
export function useScenarioSelection<T extends { meta: DemoScenarioMeta }>(
  scenarios: Ref<T[]>,
  initialId?: string
) {
  const currentId = ref(initialId ?? scenarios.value[0]?.meta.id ?? '')
  const current = computed(() => scenarios.value.find(s => s.meta.id === currentId.value))
  const select = (id: string) => { currentId.value = id }
  const reset = () => { currentId.value = initialId ?? scenarios.value[0]?.meta.id ?? '' }
  return { currentId, current, select, reset }
}
```

#### 2.4 `useDependencyGraph.ts`
```typescript
// 依赖图计算：ready/blocked/execution order
export function useDependencyGraph(tasks: Ref<PlanTaskNode[]>) {
  const flatTasks = computed(() => flattenTasks(tasks.value))

  const readyTasks = computed(() =>
    flatTasks.value.filter(t =>
      t.status === 'pending' &&
      t.dependsOn.every(dep =>
        flatTasks.value.find(ft => ft.id === dep)?.status === 'done'
      )
    )
  )

  const blockedTasks = computed(() =>
    flatTasks.value.filter(t =>
      t.status === 'pending' && !readyTasks.value.find(r => r.id === t.id)
    )
  )

  return { flatTasks, readyTasks, blockedTasks }
}
```

**预期产物**：4 个 composable 文件，每个 < 80 行。

---

### Step 3：P0 组件开发

#### 3.1 `PlanningTreeDemo.vue`（第 27 章）

**布局**：
```
┌─────────────────────────────────────────────────────────┐
│  标题区：当前场景 / 播放控制                              │
├───────────────────────┬─────────────────────────────────┤
│  任务树（嵌套 DOM）   │  右侧面板：                      │
│  ├─ 根任务            │  ├─ Ready Queue                  │
│  │  ├─ 子任务 A       │  ├─ Blocked Queue                │
│  │  └─ 子任务 B       │  └─ 执行日志                     │
│  └─ 依赖 SVG 连线     │                                  │
└───────────────────────┴─────────────────────────────────┘
```

**关键实现**：
- 树用递归组件 `PlanTaskNodeItem.vue`（子组件拆分，避免超 500 行）
- 依赖线用 `<svg>` + `<line>`，坐标从 DOM `getBoundingClientRect()` 计算
- 状态样式：`pending`=灰边框，`active`=brand 色脉冲，`done`=填充绿，`blocked`=虚线红边
- 使用 `useDemoPlayer` + `useDependencyGraph`

**文件拆分**：
- `PlanningTreeDemo.vue`（主组件，< 300 行）
- `PlanningTreeNodeItem.vue`（递归子组件，< 150 行）

---

#### 3.2 `PromptDesignStudio.vue`（第 29 章）

**布局**：
```
┌──────────────────┬──────────────────────────────────────┐
│  左侧：          │  右侧：                               │
│  模板选择下拉    │  ┌────────────────────────────────┐   │
│  ─────────────   │  │  Assembled Prompt 预览          │   │
│  Section 清单    │  │  (高亮当前选中 section)         │   │
│  ├─ [x] 角色定义 │  └────────────────────────────────┘   │
│  ├─ [x] 能力边界 │  Token 预算条                         │
│  ├─ [ ] 安全边界 │  Lint 问题列表                        │
│  └─ [x] 输出格式 │                                      │
│                  │  [复制] [导出 JSON]                   │
│  textarea 编辑区 │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**关键实现**：
- 左侧 `<textarea>` 编辑，防抖 300ms 更新预览
- 右侧用 `v-html` + `computed` 高亮（简单字符串替换，不引入解析库）
- Token 预算条复用 `useBudgetMeter`
- Lint 规则：纯函数，输入 sections 输出 PromptLintIssue[]
- 本地存储草稿：`localStorage.setItem('prompt-studio-draft', JSON.stringify(sections))`

**文件拆分**：
- `PromptDesignStudio.vue`（主组件，< 400 行）
- `PromptLintPanel.vue`（Lint 面板子组件，< 100 行）

---

#### 3.3 `ProductionArchitectureDiagram.vue`（第 30 章）

**布局**：
```
┌──────────────────────────────────────────────────────────┐
│  场景切换：[正常] [Provider 降级] [Worker 故障] [扩容]   │
├──────────────────────────────────────────────────────────┤
│           SVG 拓扑图（固定坐标，5层）                     │
│  Edge → API Gateway → Orchestrator → Workers/Provider    │
│                                   ↓                      │
│                            Storage / Observability        │
│  ──── 健康链路（实线）   - - - 故障链路（虚线）           │
│  ●  健康节点            ○  降级节点       ✕ 宕机节点      │
├──────────────────────────────────────────────────────────┤
│  状态面板：当前瓶颈 / 单点分析 / 恢复路径说明             │
└──────────────────────────────────────────────────────────┘
```

**关键实现**：
- SVG `viewBox` 固定，节点用 `<circle>` + `<text>`，链路用 `<path>`
- `@keyframes flow-pulse` 实现链路脉冲动画
- 场景切换更新 `node.status` 和 `link.highlighted`
- 使用 `useScenarioSelection`

**文件拆分**：
- `ProductionArchitectureDiagram.vue`（主组件，< 350 行）
- `TopologyNodeLabel.vue`（节点标签子组件，< 80 行）

---

### Step 4：P1 组件开发

#### 4.1 `RagAccuracyDemo.vue`（第 25 章）

**布局**：三栏（查询场景 | Chunk 评分列表 | Context 预算 + 回答质量）

**关键实现**：
- Chunk 相关度条形条（`ScoreBar`，CSS 渐变 + 宽度绑定）
- 用颜色区分 `includedInContext`（Teal）vs 被截断（灰）
- `failureMode` 对应不同高亮提示
- 使用 `useBudgetMeter` + `useScenarioSelection`

---

#### 4.2 `SecurityBoundaryDemo.vue`（第 31 章）

**布局**：5 阶段管道（与 PermissionFlow.vue 风格一致）

```
[输入校验] → [风险分类] → [权限检查] → [沙箱执行] → [审计日志]
   pass/deny     allow/ask      allow/deny    pass/block    logged
```

**关键实现**：
- 逐阶段延迟动画（stagger 200ms）
- `deny` 在任意阶段都终止链条并显示原因
- 审计日志滚动展示
- 使用 `useDemoPlayer` + `useScenarioSelection`

---

#### 4.3 `CostOptimizationDashboard.vue`（第 32 章）

**布局**：
```
┌────────────────────────────────────────────────────────────┐
│  场景对比：[无缓存] [LRU缓存] [小模型分流] [上下文压缩]   │
├──────────┬──────────┬──────────┬───────────────────────────┤
│ 总成本   │ Input    │ Output   │ 缓存命中率                │
│ $X.XX    │ XXXk tok │ XXXk tok │ XX%                       │
├──────────┴──────────┴──────────┴───────────────────────────┤
│  vs 基线节省：XX%（Teal 渐变进度条）                       │
│  SVG 折线图：时间 → 成本趋势（各策略一条线）               │
└────────────────────────────────────────────────────────────┘
```

**关键实现**：
- SVG 折线图：`<polyline>` + `points` 计算（无 Chart.js）
- 实时计算节省比例：`computed(() => ...)`
- 使用 `useBudgetMeter`（Token 预算） + `useScenarioSelection`

---

### Step 5：P2 复用包装组件

#### 5.1 `MultiAgentWorkflowDetailed.vue`（第 26 章）

**策略**：不重写现有动画，做包装壳：
- 顶部嵌入 `<MultiAgentCollab />` 或 `<AgentDispatchDemo />`
- 下方增加"通信事件表 + 聚合结果面板"
- 新增类型：`AgentMessage`（放入 types.ts）

#### 5.2 `ContextEngineeringExtended.vue`（第 28 章）

**策略**：在 `ContextCompaction.vue` 前加两阶段：
- `select`：候选上下文筛选（ContextCandidate 列表）
- `rank`：优先级排序（拖动或按钮调整顺序）
- 原 `compress` 阶段保持不变
- 新增类型：`ContextCandidate`（放入 types.ts）

---

### Step 6：注册到 theme/index.ts

追加 8 个组件的 import + globalComponents 注册：

```typescript
import RagAccuracyDemo from './components/RagAccuracyDemo.vue'
import MultiAgentWorkflowDetailed from './components/MultiAgentWorkflowDetailed.vue'
import PlanningTreeDemo from './components/PlanningTreeDemo.vue'
import ContextEngineeringExtended from './components/ContextEngineeringExtended.vue'
import PromptDesignStudio from './components/PromptDesignStudio.vue'
import ProductionArchitectureDiagram from './components/ProductionArchitectureDiagram.vue'
import SecurityBoundaryDemo from './components/SecurityBoundaryDemo.vue'
import CostOptimizationDashboard from './components/CostOptimizationDashboard.vue'
```

---

### Step 7：创建章节目录和内容文件

为 8 个新章节创建目录和 `index.md`：

```
docs/
├── 21-rag-accuracy/index.md        # Ch25
├── 22-multi-agent-collab/index.md  # Ch26
├── 23-planning/index.md            # Ch27
├── 24-context-engineering/index.md # Ch28
├── 25-system-prompt/index.md       # Ch29
├── 26-production-arch/index.md     # Ch30
├── 27-security/index.md            # Ch31
└── 28-cost-performance/index.md    # Ch32
```

每个 index.md 包含：
- frontmatter（title + description）
- `<SourceSnapshotCard>` 锚定版本
- 组件使用示例（含 Props 示例数据）
- `<StarCTA>` 章末引导

---

### Step 8：更新侧边栏配置

在 `.vitepress/config.mts` 的 `sidebar['/']` 添加中级篇分组：

```typescript
{
  text: '中级篇：优化与生产化',
  items: [
    { text: '第 25 章：RAG 为什么总是答不准？', link: '/21-rag-accuracy/' },
    { text: '第 26 章：多智能体协作实战', link: '/22-multi-agent-collab/' },
    { text: '第 27 章：Planning 机制', link: '/23-planning/' },
    { text: '第 28 章：上下文工程实战', link: '/24-context-engineering/' },
    { text: '第 29 章：System Prompt 设计', link: '/25-system-prompt/' },
    { text: '第 30 章：生产架构', link: '/26-production-arch/' },
    { text: '第 31 章：安全与边界', link: '/27-security/' },
    { text: '第 32 章：性能与成本', link: '/28-cost-performance/' },
  ]
}
```

---

### Step 9：验证

```bash
cd /Users/zhangyanhua/AI/opencode/docs/book

# TypeScript 类型检查
bunx vue-tsc --noEmit

# 构建验证
bun build

# 行数检查（确保无文件超 500 行）
wc -l .vitepress/theme/components/*.vue | sort -rn | head -20
```

---

## 关键文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `.vitepress/theme/components/types.ts` | 修改 | 追加 ~150 行新类型 |
| `.vitepress/theme/composables/useDemoPlayer.ts` | 新建 | 通用播放控制 |
| `.vitepress/theme/composables/useBudgetMeter.ts` | 新建 | Token 预算计算 |
| `.vitepress/theme/composables/useScenarioSelection.ts` | 新建 | 场景切换 |
| `.vitepress/theme/composables/useDependencyGraph.ts` | 新建 | 依赖图计算 |
| `.vitepress/theme/components/PlanningTreeDemo.vue` | 新建 | Ch27，P0 |
| `.vitepress/theme/components/PlanningTreeNodeItem.vue` | 新建 | Ch27 子组件 |
| `.vitepress/theme/components/PromptDesignStudio.vue` | 新建 | Ch29，P0 |
| `.vitepress/theme/components/PromptLintPanel.vue` | 新建 | Ch29 子组件 |
| `.vitepress/theme/components/ProductionArchitectureDiagram.vue` | 新建 | Ch30，P0 |
| `.vitepress/theme/components/TopologyNodeLabel.vue` | 新建 | Ch30 子组件 |
| `.vitepress/theme/components/RagAccuracyDemo.vue` | 新建 | Ch25，P1 |
| `.vitepress/theme/components/SecurityBoundaryDemo.vue` | 新建 | Ch31，P1 |
| `.vitepress/theme/components/CostOptimizationDashboard.vue` | 新建 | Ch32，P1 |
| `.vitepress/theme/components/MultiAgentWorkflowDetailed.vue` | 新建 | Ch26，P2 包装壳 |
| `.vitepress/theme/components/ContextEngineeringExtended.vue` | 新建 | Ch28，P2 包装壳 |
| `.vitepress/theme/index.ts` | 修改 | 追加 8 组件注册 |
| `.vitepress/config.mts` | 修改 | 添加中级篇侧边栏 |
| `docs/21-28-*/index.md` | 新建（×8） | 章节内容文件 |

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| types.ts 体积过大 | 按章节前缀命名（Rag*/Plan*/Prompt*/Topology*/Security*/Cost*） |
| 组件超 500 行 | 子组件拆分（已规划 PlanningTreeNodeItem、PromptLintPanel、TopologyNodeLabel） |
| SVG 连线坐标计算复杂 | 使用固定坐标方案，不做自动布局 |
| 动画泄漏 | 统一走 useDemoPlayer，onUnmounted 强制 cleanup |
| 视觉不一致 | 只用现有 CSS 变量（--vp-c-brand-1 等），不新增孤立色板 |
| P2 复用风格断层 | 外层壳组件包裹，不修改已有组件内部 |

---

## SESSION_ID（供 /ccg:execute 使用）

- CODEX_SESSION: 019d10af-c50e-78b2-a469-1d743a627d40
- GEMINI_SESSION: ef4af121-f7e4-48d9-ad9a-14c5dbc557c4
