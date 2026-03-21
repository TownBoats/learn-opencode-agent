# 首页优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构 `docs/index.md`，精简 Hero 按钮、合并冗余段落、上移价值主张、删除重叠内容，使首页信息层次更清晰。

**Architecture:** 仅修改 `docs/index.md` 一个文件，不改任何 Vue 组件或配置文件。所有现有组件引用保持不变，只调整段落顺序和文字内容。

**Tech Stack:** VitePress 1.5, Markdown, YAML frontmatter

**Spec:** `docs/superpowers/specs/2026-03-21-homepage-optimization-design.md`

---

### Task 1：精简 Hero actions（6 个 → 3 个）

**Files:**
- Modify: `docs/index.md`（frontmatter actions 区域）

- [ ] **Step 1：编辑 frontmatter，保留 3 个按钮，移除 3 个**

  将 Hero actions 改为：
  ```yaml
  actions:
    - theme: brand
      text: 开始阅读理论篇
      link: /00-what-is-ai-agent/index
    - theme: brand
      text: 动手实践 23 个项目
      link: /practice/
    - theme: alt
      text: 阅读地图
      link: /reading-map
  ```

- [ ] **Step 2：本地验证 Hero 区域只有 3 个按钮**

  运行 `bun dev`，打开 `http://localhost:5173`，确认 Hero 只有三个按钮，无断行。

---

### Task 2：合并"这三条线"+"学习方式"为一段

**Files:**
- Modify: `docs/index.md`（这三条线 + 学习方式 两个 H2 节）

- [ ] **Step 1：用合并后的内容替换两个段落**

  将现有的"这三条线分别回答什么"和"学习方式"两节替换为：

  ```markdown
  ## 这本书解决什么问题

  - **理论篇**：回答"OpenCode 这类 AI Coding Agent 是怎么实现的"，重点是看懂真实源码的主链路与工程边界。
  - **实践篇**：回答"如果你自己来做，最小可运行版本该怎么搭起来"，重点是把核心模式落到可执行 TypeScript 示例。
  - **中级篇**：回答"当你碰到稳定性、协作、成本、安全这些工程问题时，应该按什么专题继续深化"。

  建议**理论与实践穿插学习**：看完理论篇第 1-4 章后，先跑通实践篇 P1-P4，建立感性认知后再深入后续章节。
  ```

- [ ] **Step 2：确认删除了"学习方式"整节及重叠内容**

  grep 确认文件中不再出现"学习方式"：
  ```bash
  grep "学习方式" docs/index.md
  # 期望：无输出
  ```

---

### Task 3：上移"你会得到什么"和"适合人群"

**Files:**
- Modify: `docs/index.md`（段落顺序调整）

- [ ] **Step 1：将两节从底部剪切，插入到"这本书解决什么问题"之后、"双轨学习体系"之前**

  新顺序：
  ```
  ## 这本书解决什么问题
  ## 你会得到什么
  ## 适合人群
  ## 双轨学习体系
  ```

- [ ] **Step 2：确认顺序正确**

  ```bash
  grep "^## " docs/index.md
  # 期望顺序：这本书解决什么问题 → 你会得到什么 → 适合人群 → 双轨学习体系 → 核心学习路径 → ...
  ```

---

### Task 4：删除"这本书怎么读"整节

**Files:**
- Modify: `docs/index.md`

- [ ] **Step 1：删除"这本书怎么读"H2 及其下的全部内容**

- [ ] **Step 2：确认删除**

  ```bash
  grep "这本书怎么读" docs/index.md
  # 期望：无输出
  ```

---

### Task 5：底部辅助入口追加链接和 blockquote

**Files:**
- Modify: `docs/index.md`（辅助阅读入口节）

- [ ] **Step 1：将"阅读边界" blockquote 从现有位置删除**

  现有 blockquote 在"辅助阅读入口"节之后，先删除。

- [ ] **Step 2：在"辅助阅读入口"节末尾追加链接和 blockquote**

  ```markdown
  ## 辅助阅读入口

  - [阅读地图](/reading-map)：先选路线，再决定按哪条主链路进入全书。
  - [版本说明](/version-notes)：确认本书基于哪份源码、写到什么边界。
  - [术语表](/glossary)：统一理解 `Agent`、`Subagent`、`Primary Agent`、`运行时`、`工作台` 等高频概念。
  - [封版清单](/release-checklist)：查看当前版本完成度、已知非阻塞项和发布前检查项。
  - [阅读中级篇](/intermediate/)：进入第 25-32 章，深化 RAG、多智能体、成本与安全等工程专题。
  - [Star 支持本书](https://github.com/qqzhangyanhua/learn-opencode-agent)：觉得有用的话，给个 Star 鼓励一下。
  - [查看源码基线](https://github.com/anomalyco/opencode/tree/f8475649da1cd7a6d49f8f30ee2fad374c2f4fcc)：本书基于此 commit 进行解析。

  > **阅读边界**：本书默认以 commit 锚定的源码基线为准，重点解释已经落在仓库里的结构、主链路和工程约束；只有在明确说明"追踪最新实现"时，才额外回到 `dev` 分支对照差异。若文档与代码不一致，以当前仓库给出的源码快照与入口文件为准。
  ```

---

### Task 6：完整视觉验收

- [ ] **Step 1：运行开发服务器**

  ```bash
  cd docs/book && bun dev
  ```

- [ ] **Step 2：逐项确认**

  - [ ] Hero 只有 3 个按钮，不换行
  - [ ] "这本书解决什么问题"在第一个 H2 位置
  - [ ] "你会得到什么"和"适合人群"在"双轨学习体系"之前
  - [ ] "这本书怎么读"和"学习方式"两节已消失
  - [ ] 底部辅助入口包含中级篇 / Star / 源码基线链接
  - [ ] blockquote 在底部辅助入口最后

- [ ] **Step 3：提交**

  ```bash
  git add docs/book/docs/index.md
  git commit -m "refactor(homepage): 精简 Hero 按钮、上移价值主张、删除冗余段落"
  ```
