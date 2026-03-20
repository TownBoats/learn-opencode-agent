# 核心概念动画系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 VitePress 电子书站点新增 5 个核心概念动画（2个 CSS + 3个 Lottie），帮助新手快速理解 AI Agent 核心概念

**Architecture:** 混合方案（CSS + Lottie），共享统一的滚动触发基础设施。核心组件包括：useIntersectionObserver Hook（滚动触发）、AnimationContainer（容器）、LottiePlayer（Lottie 播放器）。CSS 动画用于简单流程演示，Lottie 动画用于复杂视觉表达。

**Tech Stack:** Vue 3, TypeScript, CSS, lottie-web, Intersection Observer API

**Spec Document:** `/Users/zhangyanhua/AI/opencode/docs/book/.superpowers/space/0320.md`

---

## 文件结构概览

### 新增文件

**核心基础设施（3个）：**
- `.vitepress/theme/components/animations/core/useIntersectionObserver.ts` - 滚动触发 Hook
- `.vitepress/theme/components/animations/core/AnimationContainer.vue` - 动画容器组件
- `.vitepress/theme/components/animations/core/LottiePlayer.vue` - Lottie 播放器组件

**CSS 动画（2个）：**
- `.vitepress/theme/components/animations/css/WhatIsAgent.vue` - 什么是 Agent 动画
- `.vitepress/theme/components/animations/css/MultiTurnDialog.vue` - 多轮对话动画

**Lottie 动画（3个）：**
- `.vitepress/theme/components/animations/lottie/FunctionCalling.vue` - 工具调用动画
- `.vitepress/theme/components/animations/lottie/MultiAgentCollab.vue` - 多 Agent 协作动画
- `.vitepress/theme/components/animations/lottie/MemorySystem.vue` - 记忆系统动画

**Lottie JSON 文件（3个）：**
- `.vitepress/theme/components/animations/lottie/assets/function-calling.json`
- `.vitepress/theme/components/animations/lottie/assets/multi-agent-collab.json`
- `.vitepress/theme/components/animations/lottie/assets/memory-system.json`

### 修改文件

- `.vitepress/theme/components/types.ts` - 新增动画相关类型定义
- `.vitepress/theme/index.ts` - 注册新组件
- `package.json` - 新增 lottie-web 依赖
- `CLAUDE.md` - 更新组件清单

---

## Week 1: 基础设施 + CSS 动画

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 lottie-web**

```bash
cd /Users/zhangyanhua/AI/opencode/docs/book
bun add lottie-web
```

Expected output: `lottie-web@5.12.2` added to dependencies

- [ ] **Step 2: 验证安装**

```bash
bun pm ls | grep lottie-web
```

Expected output: `lottie-web@5.12.2`

- [ ] **Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "deps: add lottie-web for animation system"
```

---

### Task 2: 创建目录结构

**Files:**
- Create: `.vitepress/theme/components/animations/` (directory structure)

- [ ] **Step 1: 创建动画目录**

```bash
cd /Users/zhangyanhua/AI/opencode/docs/book
mkdir -p .vitepress/theme/components/animations/core
mkdir -p .vitepress/theme/components/animations/css
mkdir -p .vitepress/theme/components/animations/lottie/assets
```

- [ ] **Step 2: 验证目录结构**

```bash
tree .vitepress/theme/components/animations -L 2
```

Expected output:
```
.vitepress/theme/components/animations
├── core
├── css
└── lottie
    └── assets
```

- [ ] **Step 3: Commit**

```bash
git add .vitepress/theme/components/animations/.gitkeep
git commit -m "chore: create animation directory structure"
```

Note: 如果 git 不跟踪空目录，在每个目录下创建 `.gitkeep` 文件

---

### Task 3: 新增类型定义

**Files:**
- Modify: `.vitepress/theme/components/types.ts`

- [ ] **Step 1: 在 types.ts 末尾添加动画类型**

在文件末尾添加：

```typescript
// ===== 动画系统类型 =====

export interface AnimationContainerProps {
  title?: string
  statusText?: string
}

export interface LottiePlayerProps {
  animationData: object
  autoplay?: boolean
  loop?: boolean
  speed?: number
}

export interface AnimationStage {
  key: string
  label: string
  duration: number
}

export interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}
```

- [ ] **Step 2: 验证类型定义**

```bash
cd /Users/zhangyanhua/AI/opencode/docs/book
bun run typecheck
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add .vitepress/theme/components/types.ts
git commit -m "types: add animation system type definitions"
```

---

### Task 4: 实现滚动触发 Hook

**Files:**
- Create: `.vitepress/theme/components/animations/core/useIntersectionObserver.ts`

- [ ] **Step 1: 创建 Hook 文件**

```typescript
import { ref, onMounted, onUnmounted, Ref } from 'vue'

export interface UseIntersectionObserverOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver(
  target: Ref<HTMLElement | null>,
  options: UseIntersectionObserverOptions = {}
) {
  const isVisible = ref(false)
  const hasTriggered = ref(false)

  const {
    threshold = 0.3,
    rootMargin = '0px',
    triggerOnce = true
  } = options

  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isVisible.value = true
            hasTriggered.value = true

            if (triggerOnce && observer) {
              observer.disconnect()
            }
          } else if (!triggerOnce) {
            isVisible.value = false
          }
        })
      },
      { threshold, rootMargin }
    )

    observer.observe(target.value)
  })

  onUnmounted(() => {
    if (observer) {
      observer.disconnect()
    }
  })

  return { isVisible, hasTriggered }
}
```

- [ ] **Step 2: 验证类型检查**

```bash
bun run typecheck
```

Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add .vitepress/theme/components/animations/core/useIntersectionObserver.ts
git commit -m "feat(animation): add intersection observer hook for scroll trigger"
```

---

