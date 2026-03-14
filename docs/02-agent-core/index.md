---
title: 第二篇：Agent 核心系统
description: 第二篇：Agent 核心系统的详细内容
---


> **对应路径**：`packages/opencode/src/agent/`
> **前置阅读**：第一篇 Agent 基础架构
> **学习目标**：理解 OpenCode 里的 Agent 不是一个抽象角色名，而是一组把模型、权限、提示词和模式绑在一起的运行时配置

---

## 核心概念速览

很多初学者第一次看 Agent 代码时，会默认它应该是：

- 一个独立进程
- 一个复杂状态机
- 或者一个“超级类”

但在 OpenCode 当前仓库里，更接近真实情况的是：

**Agent 首先是一份配置协议，然后才是运行时角色。**

这份协议至少决定了四件事：

1. 用什么模型
2. 能做什么事
3. 什么时候需要问用户
4. 应该以什么提示词和行为风格工作

所以这一篇真正要解决的问题不是“Agent 是什么概念”，而是：

**OpenCode 怎么把 Agent 做成一个可配置、可切换、可受限的系统入口。**

## 本章导读

### 这一章解决什么问题

这一章要回答的是：

- Agent 在 OpenCode 里到底是什么数据结构
- 模型、权限、提示词、模式是怎样绑在一起的
- 为什么 Agent 首先是配置协议，而不是“超级类”
- 用户配置如何覆盖内置默认值

### 必看入口

- [packages/opencode/src/agent/agent.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/agent/agent.ts)：内置 Agent 定义与模式声明
- [packages/opencode/src/permission/next.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/permission/next.ts)：权限规则与询问策略
- [packages/opencode/src/session/system.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/session/system.ts)：系统提示词装配
- [packages/opencode/src/config/config.ts](https://github.com/anomalyco/opencode/blob/dev/packages/opencode/src/config/config.ts)：用户配置加载与覆盖

### 先抓一条主链路

先把下面这条链路看懂：

```text
agent/agent.ts
  -> 选择 mode / permission / prompt
  -> session/system.ts 组装系统提示词
  -> permission/next.ts 决定是否允许工具执行
  -> config/config.ts 接受用户配置覆盖
```

这条链路先解决“Agent 如何成为一个可运行角色”，后面再进入各个字段细节。

### 初学者阅读顺序

1. 先读 `agent.ts`，只看内置 Agent 有哪些差异。
2. 再读 `session/system.ts`，理解 prompt 不是写死的一段话，而是动态拼装结果。
3. 最后回到 `permission/next.ts` 和 `config/config.ts`，确认权限和配置怎样真正生效。

### 最容易误解的点

- Agent 不是独立进程，也不是复杂继承体系，首先是一份配置协议。
- prompt 不是只有 `prompt/*.txt`，真正发送给模型的系统提示词还会叠加环境、Skill、规则等上下文。
- `mode` 不只是显示标签，它会影响可用工具、权限边界和协作方式。

## 2.1 Agent 定义与配置系统

### Agent 首先是一份运行时协议

在 OpenCode 中，**Agent 不是一个单独进程，而是一份可被系统消费的配置协议**。它至少同时决定：

- 模型和采样参数
- 可用工具与权限边界
- 系统提示词与行为风格
- 当前角色属于 `Primary Agent` 还是 `Subagent`

### Agent.Info 数据结构

打开 `packages/opencode/src/agent/agent.ts`，先看 `Info` 这份 schema：

```typescript
export const Info = z.object({
  name: z.string(),                    // Agent 名称
  description: z.string().optional(),  // 描述（显示在 UI）
  mode: z.enum(["subagent", "primary", "all"]),  // 模式
  native: z.boolean().optional(),      // 是否内置
  hidden: z.boolean().optional(),      // 是否隐藏
  topP: z.number().optional(),         // Top-P 采样
  temperature: z.number().optional(),  // 温度参数
  color: z.string().optional(),        // UI 颜色
  permission: PermissionNext.Ruleset,  // 权限规则集
  model: z.object({                    // 指定模型（可选）
    modelID: ModelID.zod,
    providerID: ProviderID.zod,
  }).optional(),
  variant: z.string().optional(),      // 变体
  prompt: z.string().optional(),       // 自定义提示词
  options: z.record(z.string(), z.any()),  // 其他选项
  steps: z.number().int().positive().optional(),  // 推理步数
})
```

这份结构里最值得先抓的字段是：
- `mode`：决定 Agent 的使用场景（后面详细讲）
- `permission`：最重要的字段，控制工具访问权限
- `prompt`：自定义系统提示词，覆盖默认提示

### 内置 Agent

OpenCode 内置的几类 Agent 也都集中定义在 `agent.ts` 里。读这一段时，不必把它当“角色清单”，更应该把它当“产品策略表”来看。

#### 1. build（默认 Agent）

```typescript
build: {
  name: "build",
  description: "The default agent. Executes tools based on configured permissions.",
  mode: "primary",
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      question: "allow",      // 允许提问
      plan_enter: "allow",    // 允许进入计划模式
    }),
    user,
  ),
}
```

这个默认 Agent 对应的是最完整的开发工作流：
- 默认 Agent，启动 OpenCode 时使用
- 可以调用所有工具（根据权限）
- 可以提问用户、进入计划模式

#### 2. plan（计划模式 Agent）

```typescript
plan: {
  name: "plan",
  description: "Plan mode. Disallows all edit tools.",
  mode: "primary",
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      question: "allow",
      plan_exit: "allow",
      edit: {
        "*": "deny",  // 禁止所有编辑操作
        [path.join(".opencode", "plans", "*.md")]: "allow",  // 只能编辑计划文件
      },
    }),
    user,
  ),
}
```

这里最值得注意的是“计划模式”并不是另一套 UI，而是另一套更收紧的权限协议：
- 只读模式，不能修改代码
- 只能编辑 `.opencode/plans/` 下的计划文件
- 用于任务规划阶段

#### 3. explore（代码探索 Agent）

```typescript
explore: {
  name: "explore",
  description: "Fast agent specialized for exploring codebases.",
  mode: "subagent",  // 注意：这是 `subagent` 模式
  prompt: PROMPT_EXPLORE,  // 使用专门的提示词
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      "*": "deny",           // 默认拒绝所有
      grep: "allow",         // 只允许搜索工具
      glob: "allow",
      read: "allow",
      bash: "allow",
      webfetch: "allow",
      websearch: "allow",
      codesearch: "allow",
    }),
    user,
  ),
}
```

这个 Agent 体现的是“角色分工先于提示词花样”：
- 专门用于代码搜索
- 不能修改任何文件
- 使用专门的提示词（`prompt/explore.txt`）

#### 4. general（通用 `Subagent`）

```typescript
general: {
  name: "general",
  description: "General-purpose agent for researching complex questions.",
  mode: "subagent",
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      todoread: "deny",   // 不能读取 TODO
      todowrite: "deny",  // 不能写入 TODO
    }),
    user,
  ),
}
```

它和 `build` 的差别不在名字，而在协作边界：
- 用于并行执行多个任务
- 权限与 build 类似，但不能操作 TODO

#### 5. 隐藏 Agent（compaction、title、summary）

```typescript
compaction: {
  name: "compaction",
  mode: "primary",
  hidden: true,  // 不显示在 UI
  prompt: PROMPT_COMPACTION,
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      "*": "deny",  // 不能调用任何工具
    }),
    user,
  ),
}
```

这些隐藏 Agent 更像系统内部工种：
- `compaction`：压缩对话历史
- `title`：生成会话标题
- `summary`：生成会话摘要

这些 Agent 不需要工具，只需要 LLM 的文本生成能力。

### 自定义 Agent

你可以在 `.opencode/agent/` 目录创建自定义 Agent。

**示例**：`.opencode/agent/translator.md`

```markdown
---
description: Translate content for a specified locale
mode: subagent
model: opencode/gemini-3-pro
---

You are a professional translator.

Translate the user's content into the requested target locale.

Requirements:
- Preserve meaning, intent, tone, and formatting
- Preserve all technical terms
- Do not modify fenced code blocks
- Output ONLY the translation
```

**配置说明**：
- `---` 之间是 YAML 前置元数据
- `description`：Agent 描述
- `mode`：模式（`subagent` / `primary` / `all`）
- `model`：指定模型（可选）
- 正文是系统提示词

**加载机制**（同样位于 `agent.ts`）：

```typescript
for (const [key, value] of Object.entries(cfg.agent ?? {})) {
  if (value.disable) {
    delete result[key]  // 禁用 Agent
    continue
  }
  let item = result[key]
  if (!item)
    item = result[key] = {
      name: key,
      mode: "all",
      permission: PermissionNext.merge(defaults, user),
      options: {},
      native: false,
    }
  // 合并配置
  if (value.model) item.model = Provider.parseModel(value.model)
  item.prompt = value.prompt ?? item.prompt
  item.permission = PermissionNext.merge(
    item.permission,
    PermissionNext.fromConfig(value.permission ?? {})
  )
}
```

**流程**：
1. 读取 `~/.opencode/config.json` 中的 `agent` 配置
2. 如果 Agent 不存在，创建新的
3. 合并权限规则
4. 覆盖模型、提示词等配置

---

## 2.2 权限系统设计（Permission System）

### 权限系统在 Agent 里承担什么角色？

AI Agent 可以调用工具修改文件、执行命令。如果没有权限控制：
- 可能误删重要文件
- 可能读取敏感信息（`.env` 文件）
- 可能执行危险命令

**权限系统的目标**：在灵活性和安全性之间找到平衡。

### 权限规则的数据结构

打开 `packages/opencode/src/permission/next.ts`，先看规则结构：

```typescript
export const Rule = z.object({
  permission: z.string(),  // 权限名称（如 "read", "edit", "bash"）
  pattern: z.string(),     // 匹配模式（如 "*.env", "/tmp/*"）
  action: Action,          // 动作：allow/deny/ask
})

export const Action = z.enum(["allow", "deny", "ask"])
```

**三种动作**：
- `allow`：直接允许，不询问用户
- `deny`：直接拒绝
- `ask`：询问用户是否允许

### 默认权限规则

`agent.ts` 里先定义了一组默认规则：

```typescript
const defaults = PermissionNext.fromConfig({
  "*": "allow",  // 默认允许所有操作
  doom_loop: "ask",  // 检测到死循环时询问
  external_directory: {
    "*": "ask",  // 访问外部目录时询问
    ...Object.fromEntries(whitelistedDirs.map((dir) => [dir, "allow"])),
  },
  question: "deny",  // 默认不允许提问（`Primary Agent` 会覆盖）
  plan_enter: "deny",
  plan_exit: "deny",
  read: {
    "*": "allow",
    "*.env": "ask",      // 读取 .env 文件时询问
    "*.env.*": "ask",
    "*.env.example": "allow",  // .env.example 可以直接读
  },
})
```

**设计思想**：
- 默认信任 Agent（`"*": "allow"`）
- 对敏感操作额外保护（`.env` 文件、外部目录）
- 用户可以通过配置覆盖

### 权限合并机制

```typescript
const user = PermissionNext.fromConfig(cfg.permission ?? {})

const result = {
  build: {
    permission: PermissionNext.merge(
      defaults,  // 1. 默认规则
      PermissionNext.fromConfig({
        question: "allow",  // 2. Agent 特定规则
      }),
      user,  // 3. 用户自定义规则（优先级最高）
    ),
  },
}
```

**合并顺序**：
1. 默认规则（`defaults`）
2. Agent 特定规则
3. 用户配置（`~/.opencode/config.json`）

**后面的规则会覆盖前面的**。

### 权限匹配算法

`permission/next.ts` 里会把配置转换成真正可匹配的 ruleset：

```typescript
export function fromConfig(permission: Config.Permission) {
  const ruleset: Ruleset = []
  for (const [key, value] of Object.entries(permission)) {
    if (typeof value === "string") {
      // 简单规则：{ "read": "allow" }
      ruleset.push({
        permission: key,
        action: value,
        pattern: "*",
      })
      continue
    }
    // 复杂规则：{ "read": { "*.env": "ask" } }
    ruleset.push(
      ...Object.entries(value).map(([pattern, action]) => ({
        permission: key,
        pattern: expand(pattern),  // 展开 ~ 和 $HOME
        action
      })),
    )
  }
  return ruleset
}
```

**匹配流程**：
1. 遍历所有规则
2. 使用通配符匹配（`*` 匹配任意字符）
3. 返回第一个匹配的规则

**示例**：

```json
{
  "permission": {
    "read": {
      "*": "allow",
      "*.env": "ask",
      "/tmp/*": "deny"
    }
  }
}
```

- 读取 `src/index.ts`：匹配 `"*": "allow"` → 允许
- 读取 `.env`：匹配 `"*.env": "ask"` → 询问用户
- 读取 `/tmp/test.txt`：匹配 `"/tmp/*": "deny"` → 拒绝

### 实际应用：保护敏感文件

**场景**：Agent 想读取 `.env` 文件。

**流程**：
1. Agent 调用 `read` 工具，参数 `file_path=".env"`
2. 权限系统检查规则，匹配到 `"*.env": "ask"`
3. 发送权限请求到前端（TUI/Web）
4. 用户选择：
   - `once`：本次允许
   - `always`：总是允许（保存到配置）
   - `reject`：拒绝

**对应代码**：`permission/next.ts` 里紧接着定义了权限请求与回复结构

```typescript
export const Request = z.object({
  id: PermissionID.zod,
  sessionID: SessionID.zod,
  permission: z.string(),      // "read"
  patterns: z.string().array(), // [".env"]
  metadata: z.record(z.string(), z.any()),
  tool: z.object({
    messageID: MessageID.zod,
    callID: z.string(),
  }).optional(),
})

export const Reply = z.enum(["once", "always", "reject"])
```

---

## 2.3 Agent 模式切换（`primary` / `subagent`）

### 三种模式

```typescript
mode: z.enum(["subagent", "primary", "all"])
```

#### 1. primary 模式

可以把它理解成“面向用户的主执行角色”：
- 用户直接交互的 `Primary Agent`
- 可以调用 `Subagent`
- 可以提问用户
- 可以进入计划模式

典型内置角色是 `build`、`plan`。

对应的使用场景大致是：
```bash
# 启动 OpenCode，默认使用 build Agent（primary）
bun dev

# 用户输入
> 帮我重构这个函数

# build Agent 处理请求
```

#### 2. `subagent` 模式

它更像“被 `Primary Agent` 调度的专用工种”：
- 由 `Primary Agent` 调用
- 不能直接与用户交互
- 不能调用其他 `Subagent`
- 用于并行执行任务

典型例子有 `explore`、`general`、`translator`。

对应的调用方式更接近下面这样：
```typescript
// Primary Agent 调用 explore Subagent
Agent.call({
  agent: "explore",
  prompt: "找到所有处理用户认证的文件"
})
```

#### 3. all 模式

这一类既可以作为 `primary`，也可以作为 `subagent`，但在当前仓库里并不常见：
- 既可以作为 `primary`，也可以作为 `subagent`
- 灵活但少用

### `primary` 与 `subagent` 的区别

| 特性 | primary | subagent |
|------|---------|----------|
| 用户交互 | ✅ 可以 | ❌ 不可以 |
| 调用工具 | ✅ 所有工具 | ✅ 受限工具 |
| 调用 `Subagent` | ✅ 可以 | ❌ 不可以 |
| 提问用户 | ✅ 可以 | ❌ 不可以 |
| 进入计划模式 | ✅ 可以 | ❌ 不可以 |

### `Subagent` 在这里解决什么问题？

如果用户问“分析这个项目的架构”，系统通常至少要同时做下面几件事：
1. 读取 README
2. 分析目录结构
3. 查找配置文件
4. 搜索关键代码

如果全由 `Primary Agent` 串行执行，整体等待时间会很长。

更符合当前仓库思路的做法，是并行调用多个 `Subagent`：

```typescript
// `Primary Agent` 的伪代码
const tasks = [
  Agent.call({ agent: "explore", prompt: "找到所有配置文件" }),
  Agent.call({ agent: "explore", prompt: "分析目录结构" }),
  Agent.call({ agent: "general", prompt: "总结 README 内容" }),
]

const results = await Promise.all(tasks)
// 汇总结果
```

### 实际例子：explore Agent

`agent.ts` 里的 `explore` 是一个很典型的例子：

```typescript
explore: {
  name: "explore",
  mode: "subagent",  // 只能被调用，不能直接使用
  prompt: PROMPT_EXPLORE,  // 专门的提示词
  permission: PermissionNext.merge(
    defaults,
    PermissionNext.fromConfig({
      "*": "deny",  // 默认拒绝所有
      grep: "allow",  // 只允许搜索工具
      glob: "allow",
      read: "allow",
      bash: "allow",
    }),
  ),
}
```

它的提示词（`agent/prompt/explore.txt`）也很能说明角色定位：

```
You are a file search specialist. You excel at thoroughly navigating and exploring codebases.

Your strengths:
- Rapidly finding files using glob patterns
- Searching code and text with powerful regex patterns
- Reading and analyzing file contents

Guidelines:
- Use Glob for broad file pattern matching
- Use Grep for searching file contents with regex
- Use Read when you know the specific file path
- Do not create any files, or run bash commands that modify the user's system
```

这里能看出三层约束是一起生效的：
- 提示词明确告诉 Agent 它的职责（搜索）
- 权限限制确保它不能修改文件
- mode 确保它只能被调用，不能直接使用

---

## 2.4 Prompt 工程与系统提示词

### 系统提示词的组成

`packages/opencode/src/session/system.ts` 里可以直接看到系统提示词的拼装方式：

```typescript
export namespace SystemPrompt {
  export function instructions() {
    return PROMPT_CODEX.trim()  // 基础指令
  }

  export function provider(model: Provider.Model) {
    // 根据模型选择提示词
    if (model.api.id.includes("gpt-5")) return [PROMPT_CODEX]
    if (model.api.id.includes("gpt-") || model.api.id.includes("o1"))
      return [PROMPT_BEAST]
    if (model.api.id.includes("gemini-")) return [PROMPT_GEMINI]
    if (model.api.id.includes("claude")) return [PROMPT_ANTHROPIC]
    return [PROMPT_ANTHROPIC_WITHOUT_TODO]
  }

  export async function environment(model: Provider.Model) {
    // 环境信息
    return [
      `You are powered by the model named ${model.api.id}`,
      `Working directory: ${Instance.directory}`,
      `Platform: ${process.platform}`,
      `Today's date: ${new Date().toDateString()}`,
    ].join("\n")
  }

  export async function skills(agent: Agent.Info) {
    // 可用的 Skill 列表
    const list = await Skill.available(agent)
    return Skill.fmt(list, { verbose: true })
  }
}
```

也就是说，最终真正发给模型的系统提示词更接近：
```
[基础指令] + [模型特定提示] + [环境信息] + [Skill 列表] + [Agent 自定义提示]
```

### 不同模型的提示词差异

#### Claude 提示词（`session/prompt/anthropic.txt`）

```
You are Claude Code, Anthropic's official CLI for Claude.

You are an interactive agent that helps users with software engineering tasks.

# System
- All text you output outside of tool use is displayed to the user
- Tools are executed in a user-selected permission mode
- Tool results may include <system-reminder> tags

# Doing tasks
- The user will primarily request you to perform software engineering tasks
- You are highly capable and often allow users to complete ambitious tasks
- In general, do not propose changes to code you haven't read
...
```

这一版更强调身份、规则和任务边界：
- 强调身份（Claude Code）
- 详细的任务指南
- 明确的规则（不要过度工程、不要猜测）

#### GPT 提示词（`session/prompt/beast.txt`）

```
You are an AI coding assistant.

Your task is to help users with software development tasks.

Key principles:
- Be concise and direct
- Only make changes that are directly requested
- Don't add features beyond what was asked
...
```

这一版更短，也更强调收敛执行：
- 更简洁
- 强调"不要过度设计"

#### Gemini 提示词（`session/prompt/gemini.txt`）

```
You are a helpful AI assistant for software development.

Guidelines:
- Provide clear, actionable responses
- Use tools to interact with the codebase
- Ask clarifying questions when needed
...
```

这一版更通用，也更强调必要时提问：
- 更通用
- 强调提问

### Agent 自定义提示词

**示例**：`explore` Agent 的提示词（`agent/prompt/explore.txt`）

```
You are a file search specialist.

Your strengths:
- Rapidly finding files using glob patterns
- Searching code and text with powerful regex patterns

Guidelines:
- Use Glob for broad file pattern matching
- Use Grep for searching file contents
- Do not create any files
```

这类 Agent 自定义提示词通常遵循几个简单原则：
1. **明确身份**："You are a file search specialist"
2. **列出能力**："Your strengths"
3. **给出指南**："Guidelines"
4. **设置边界**："Do not create any files"

### Prompt 工程的最佳实践

#### 1. 使用具体的例子

❌ **不好**：
```
Use the Read tool to read files.
```

✅ **好**：
```
Use Read when you know the specific file path you need to read.
Example: Read("src/index.ts")
```

#### 2. 明确禁止的行为

❌ **不好**：
```
Be careful with files.
```

✅ **好**：
```
Do not create any files, or run bash commands that modify the user's system state in any way.
```

#### 3. 分层组织信息

```
# System
- 系统级信息

# Doing tasks
- 任务执行指南

# Using tools
- 工具使用规则
```

#### 4. 针对模型调整

不同模型有不同的"性格"：
- Claude：喜欢详细的指令
- GPT：喜欢简洁的指令
- Gemini：需要更多例子

---

## 2.5 Agent 生命周期管理

### Agent 的创建

**入口**：用户创建会话时指定 Agent

```typescript
// API 调用
POST /session/create
{
  "workspaceId": "...",
  "agent": "build",  // 指定 Agent
  "model": "claude-sonnet-4"
}
```

**流程**（`session/session.ts`）：
1. 查找 Agent 配置（`Agent.get("build")`）
2. 加载权限规则
3. 构建系统提示词
4. 初始化 LLM 客户端

### Agent 的执行

**消息处理流程**：

```
用户输入
  ↓
Session.message()
  ↓
构建系统提示词
  ↓
调用 LLM（streamObject）
  ↓
解析工具调用
  ↓
权限检查
  ↓
执行工具
  ↓
返回结果给 LLM
  ↓
LLM 生成最终响应
```

**代码位置**：`session/processor.ts`

### Agent 的切换

**场景 1**：用户手动切换

```bash
# TUI 中按快捷键切换 Agent
Ctrl+A → 选择 "plan" Agent
```

**场景 2**：`Primary Agent` 调用 `Subagent`

```typescript
// `Primary Agent` 使用 Agent 工具
{
  "tool": "agent",
  "parameters": {
    "agent": "explore",
    "prompt": "找到所有测试文件"
  }
}
```

**实现**（`tool/agent.ts`）：
1. 创建子会话（Session.create）
2. 使用指定的 Agent
3. 执行任务
4. 返回结果给 `Primary Agent`

### Agent 的销毁

**触发条件**：
- 会话结束
- 用户删除会话
- 切换到其他 Agent

**清理工作**：
- 关闭 LLM 连接
- 清理临时文件
- 保存会话历史

---

## 本章小结

### 核心概念

1. **Agent 是配置，不是进程**
   - 定义了权限、提示词、模型参数
   - 通过 `Agent.Info` 数据结构描述

2. **权限系统是安全的基石**
   - 三种动作：allow/deny/ask
   - 规则合并：defaults → agent → user
   - 通配符匹配：`*.env`、`/tmp/*`

3. **`primary` 与 `subagent` 的分工**
   - `primary`：用户交互、任务编排
   - `subagent`：专注执行、并行处理

4. **Prompt 工程的重要性**
   - 不同模型需要不同的提示词
   - 明确身份、能力、边界
   - 使用具体例子

### 关键代码位置

| 功能 | 文件路径 |
|------|---------|
| Agent 定义 | `packages/opencode/src/agent/agent.ts` |
| 权限系统 | `packages/opencode/src/permission/next.ts` |
| 系统提示词 | `packages/opencode/src/session/system.ts` |
| 提示词模板 | `packages/opencode/src/agent/prompt/*.txt` |
| 自定义 Agent | `.opencode/agent/*.md` |

### 实践建议

1. **创建自定义 Agent**
   ```bash
   mkdir -p .opencode/agent
   cat > .opencode/agent/reviewer.md << 'EOF'
   ---
   description: Code review specialist
   mode: subagent
   ---

   You are a code reviewer. Focus on:
   - Code quality
   - Potential bugs
   - Best practices
   EOF
   ```

2. **配置权限规则**
   ```json
   {
     "agent": {
       "build": {
         "permission": {
           "bash": {
             "*": "ask",
             "git *": "allow"
           }
         }
       }
     }
   }
   ```

3. **测试 Agent**
   ```bash
   # 启动 OpenCode
   bun dev

   # 切换到 plan Agent
   Ctrl+A → 选择 "plan"

   # 尝试编辑文件（应该被拒绝）
   > 修改 src/index.ts
   ```

### 源码阅读路径

1. 先读 `packages/opencode/src/agent/agent.ts`，把 `build`、`plan`、`general`、`explore` 四个内置 Agent 的差异记清楚。
2. 再读 `packages/opencode/src/session/system.ts`，看系统提示词怎样把环境、Skill 和 Agent prompt 拼起来。
3. 最后回到 `packages/opencode/src/config/config.ts`，确认用户配置是怎么覆盖默认 Agent 定义的。

### 动手练习

1. 对比 `build` 和 `plan` 的权限差异，写出它们分别更适合什么任务。
2. 试着设计一个你自己的自定义 Agent，只用文字写出它的 `mode`、`permission`、`prompt` 和适用场景。

### 下一篇预告

**第三篇：工具系统（Tool System）**

我们将深入 `packages/opencode/src/tool/` 目录，学习：
- 工具注册与发现机制
- 文件操作工具（Read/Write/Edit）
- 代码搜索工具（Glob/Grep）
- LSP 集成与代码智能
- 如何开发自定义工具

---

### 思考题

1. 为什么 `explore` Agent 的权限是 `"*": "deny"` 而不是默认的 `"*": "allow"`？
2. 如果你要创建一个"只读审查"Agent，应该如何配置权限？
3. `Primary Agent` 和 `Subagent` 的最大区别是什么？为什么不能让 `Subagent` 调用 `Subagent`？

（提示：答案都在本章的代码示例中）
