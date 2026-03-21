<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { PlanTaskNode, PlanningTreeDemoProps, DemoStepStatus } from './types'
import PlanningTreeNodeItem from './PlanningTreeNodeItem.vue'

const props = withDefaults(defineProps<PlanningTreeDemoProps>(), {
  autoPlay: false,
  playSpeed: 1500,
})

// Deep clone to avoid mutating props
const localTasks = ref<PlanTaskNode[]>(JSON.parse(JSON.stringify(props.tasks)))
const executionLog = ref<{ time: string; msg: string; type: 'info' | 'success' | 'warn' }[]>([])
const isRunning = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

function flattenTasks(nodes: PlanTaskNode[]): PlanTaskNode[] {
  return nodes.reduce<PlanTaskNode[]>((acc, node) => {
    acc.push(node)
    if (node.children?.length) acc.push(...flattenTasks(node.children))
    return acc
  }, [])
}

const flatTasks = computed(() => flattenTasks(localTasks.value))

const doneIds = computed(() => new Set(flatTasks.value.filter(t => t.status === 'done').map(t => t.id)))

function isReady(task: PlanTaskNode): boolean {
  return task.status === 'pending' && task.dependsOn.every(dep => doneIds.value.has(dep))
}

const readyQueue = computed(() => flatTasks.value.filter(isReady))
const blockedQueue = computed(() => flatTasks.value.filter(t => t.status === 'pending' && !isReady(t)))

function updateStatus(id: string, status: DemoStepStatus) {
  const task = flatTasks.value.find(t => t.id === id)
  if (task) task.status = status
}

function addLog(msg: string, type: 'info' | 'success' | 'warn') {
  const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  executionLog.value.unshift({ time, msg, type })
  if (executionLog.value.length > 15) executionLog.value.pop()
}

function runNextStep() {
  if (readyQueue.value.length === 0) {
    const allDone = flatTasks.value.every(t => t.status === 'done' || t.status === 'blocked')
    if (allDone) {
      stopDemo()
      addLog('规划执行完毕', 'info')
    }
    return
  }

  const priorityOrder: Record<'p0' | 'p1' | 'p2', number> = { p0: 0, p1: 1, p2: 2 }
  const task = [...readyQueue.value].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])[0]

  updateStatus(task.id, 'active')
  addLog(`开始: ${task.title}`, 'info')

  setTimeout(() => {
    updateStatus(task.id, 'done')
    addLog(`完成: ${task.title}`, 'success')
  }, (props.playSpeed ?? 1500) * 0.6)
}

function startDemo() {
  if (isRunning.value) return
  isRunning.value = true
  addLog('开始执行规划...', 'info')
  timer = setInterval(runNextStep, props.playSpeed ?? 1500)
}

function stopDemo() {
  isRunning.value = false
  if (timer !== null) {
    clearInterval(timer)
    timer = null
  }
}

function resetDemo() {
  stopDemo()
  localTasks.value = JSON.parse(JSON.stringify(props.tasks))
  executionLog.value = []
}

onUnmounted(() => stopDemo())

if (props.autoPlay) startDemo()
</script>

<template>
  <div class="ptd-root">
    <div class="ptd-header">
      <div class="ptd-title-row">
        <span class="ptd-indicator" :class="{ running: isRunning }" />
        <span class="ptd-title">任务规划与依赖调度</span>
        <span class="ptd-badge">Ch27 · Planning</span>
      </div>
      <div class="ptd-actions">
        <button class="ptd-btn-primary" :class="{ active: isRunning }" @click="isRunning ? stopDemo() : startDemo()">
          {{ isRunning ? '暂停' : '执行规划' }}
        </button>
        <button class="ptd-btn-ghost" @click="resetDemo">重置</button>
      </div>
    </div>

    <div class="ptd-body">
      <div class="ptd-tree">
        <PlanningTreeNodeItem
          v-for="task in localTasks"
          :key="task.id"
          :node="task"
          :depth="0"
        />
      </div>

      <aside class="ptd-sidebar">
        <section class="ptd-block">
          <div class="ptd-block-header">就绪队列</div>
          <div v-if="readyQueue.length === 0" class="ptd-empty">无就绪任务</div>
          <div v-for="t in readyQueue" :key="t.id" class="ptd-q-item ready">
            <span class="ptd-p-tag" :class="t.priority">{{ t.priority.toUpperCase() }}</span>
            <span class="ptd-q-text">{{ t.title }}</span>
          </div>
        </section>

        <section class="ptd-block">
          <div class="ptd-block-header">阻塞队列</div>
          <div v-if="blockedQueue.length === 0" class="ptd-empty">无阻塞任务</div>
          <div v-for="t in blockedQueue" :key="t.id" class="ptd-q-item blocked">
            {{ t.title }}
          </div>
        </section>

        <section class="ptd-block ptd-log">
          <div class="ptd-block-header">调度日志</div>
          <div class="ptd-log-view">
            <div v-for="(log, i) in executionLog" :key="i" class="ptd-log-line" :class="log.type">
              <span class="ptd-log-ts">{{ log.time }}</span>
              {{ log.msg }}
            </div>
            <div v-if="executionLog.length === 0" class="ptd-empty">等待执行...</div>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.ptd-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin: 1.5rem 0;
}

.ptd-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.ptd-title-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.ptd-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-text-3);
  transition: background 0.3s, box-shadow 0.3s;
  flex-shrink: 0;
}

.ptd-indicator.running {
  background: var(--vp-c-brand-1);
  box-shadow: 0 0 8px var(--vp-c-brand-1);
}

.ptd-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.ptd-badge {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(13, 148, 136, 0.1);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.ptd-actions {
  display: flex;
  gap: 0.5rem;
}

.ptd-btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.ptd-btn-primary.active {
  background: #0f766e;
}

.ptd-btn-ghost {
  background: transparent;
  border: 1px solid var(--vp-c-divider);
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  color: var(--vp-c-text-1);
}

.ptd-body {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 1.25rem;
  min-height: 380px;
}

.ptd-tree {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 1.25rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.ptd-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ptd-block {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ptd-block-header {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-2);
  padding-bottom: 0.3rem;
  border-bottom: 1px solid var(--vp-c-divider);
  margin-bottom: 0.25rem;
}

.ptd-q-item {
  font-size: 0.8125rem;
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
}

.ptd-q-item.ready {
  border-left: 3px solid var(--vp-c-brand-1);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ptd-q-item.blocked {
  color: var(--vp-c-text-3);
  font-style: italic;
  opacity: 0.65;
}

.ptd-p-tag {
  font-size: 0.625rem;
  padding: 1px 4px;
  border-radius: 3px;
  font-weight: 700;
  flex-shrink: 0;
}

.ptd-p-tag.p0 { background: #fee2e2; color: #991b1b; }
.ptd-p-tag.p1 { background: #fef3c7; color: #92400e; }
.ptd-p-tag.p2 { background: #ede9fe; color: #5b21b6; }

.ptd-q-text {
  font-size: 0.8125rem;
  color: var(--vp-c-text-1);
}

.ptd-empty {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  text-align: center;
  padding: 0.4rem;
}

.ptd-log {
  flex: 1;
}

.ptd-log-view {
  font-family: var(--vp-font-family-mono);
  font-size: 0.6875rem;
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.ptd-log-line {
  line-height: 1.5;
  color: var(--vp-c-text-2);
}

.ptd-log-line.success { color: #10b981; }
.ptd-log-line.info { color: var(--vp-c-brand-1); }
.ptd-log-line.warn { color: #f59e0b; }

.ptd-log-ts {
  color: var(--vp-c-text-3);
  margin-right: 0.4rem;
}

@media (max-width: 768px) {
  .ptd-body {
    grid-template-columns: 1fr;
  }

  .ptd-sidebar {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .ptd-log {
    grid-column: span 2;
  }
}
</style>
