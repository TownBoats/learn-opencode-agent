<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { AgentMessage, MultiAgentWorkflowDetailedProps } from './types'

const props = withDefaults(defineProps<MultiAgentWorkflowDetailedProps>(), {
  autoPlay: false,
  playSpeed: 1200,
})

const visibleMessages = ref<AgentMessage[]>([])
const isRunning = ref(false)
const currentStep = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const allDone = computed(() => currentStep.value >= props.messages.length)

function start() {
  if (isRunning.value || allDone.value) return
  isRunning.value = true
  timer = setInterval(() => {
    if (currentStep.value < props.messages.length) {
      visibleMessages.value.push(props.messages[currentStep.value])
      currentStep.value++
    } else {
      stop()
    }
  }, props.playSpeed)
}

function stop() {
  isRunning.value = false
  if (timer) { clearInterval(timer); timer = null }
}

function reset() {
  stop()
  visibleMessages.value = []
  currentStep.value = 0
}

function agentColor(agentId: string) {
  const colors: Record<string, string> = {
    orchestrator: '#0d9488',
    planner: '#3b82f6',
    coder: '#8b5cf6',
    reviewer: '#f59e0b',
    executor: '#ec4899',
  }
  return colors[agentId] ?? '#6b7280'
}

function msgTypeLabel(t: string) {
  const labels: Record<string, string> = {
    task: '任务',
    result: '结果',
    tool_call: '工具调用',
    tool_result: '工具结果',
    decision: '决策',
  }
  return labels[t] ?? t
}

onUnmounted(() => stop())
if (props.autoPlay) start()
</script>

<template>
  <div class="mawd-root">
    <div class="mawd-header">
      <div class="mawd-title-row">
        <span class="mawd-indicator" :class="{ running: isRunning }"></span>
        <span class="mawd-title">多 Agent 协作工作流</span>
        <span class="mawd-badge">Ch26 · Multi-Agent</span>
      </div>
      <div class="mawd-actions">
        <button class="mawd-btn-primary" :class="{ active: isRunning }" @click="isRunning ? stop() : start()">
          {{ isRunning ? '暂停' : allDone ? '已完成' : '开始' }}
        </button>
        <button class="mawd-btn-ghost" @click="reset">重置</button>
      </div>
    </div>

    <!-- Agent legend -->
    <div class="mawd-agents">
      <div v-for="agent in agents" :key="agent.id" class="mawd-agent-tag" :style="{ borderColor: agentColor(agent.id) }">
        <span class="mawd-agent-dot" :style="{ background: agentColor(agent.id) }"></span>
        <span class="mawd-agent-name">{{ agent.name }}</span>
        <span class="mawd-agent-role">{{ agent.role }}</span>
      </div>
    </div>

    <!-- Message stream -->
    <div class="mawd-stream">
      <div v-if="visibleMessages.length === 0" class="mawd-empty">点击「开始」观察 Agent 间的协作消息流</div>
      <div
        v-for="(msg, i) in visibleMessages"
        :key="i"
        class="mawd-msg"
        :class="`msg-${msg.type}`"
        :style="{ borderLeftColor: agentColor(msg.from) }"
      >
        <div class="mawd-msg-header">
          <span class="mawd-msg-from" :style="{ color: agentColor(msg.from) }">{{ msg.from }}</span>
          <svg class="mawd-msg-arrow" viewBox="0 0 16 8" fill="none"><path d="M0 4h14M10 1l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="mawd-msg-to">{{ msg.to }}</span>
          <span class="mawd-msg-type-badge">{{ msgTypeLabel(msg.type) }}</span>
        </div>
        <div class="mawd-msg-content">{{ msg.content }}</div>
        <div v-if="msg.metadata" class="mawd-msg-meta">
          <span v-for="(v, k) in msg.metadata" :key="k" class="mawd-meta-tag">{{ k }}: {{ v }}</span>
        </div>
      </div>
    </div>

    <!-- Progress -->
    <div class="mawd-footer">
      <div class="mawd-progress-track">
        <div class="mawd-progress-fill" :style="{ width: `${(currentStep / props.messages.length) * 100}%` }"></div>
      </div>
      <span class="mawd-progress-label">{{ currentStep }} / {{ props.messages.length }} 条消息</span>
    </div>
  </div>
</template>

<style scoped>
.mawd-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.mawd-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.mawd-title-row { display: flex; align-items: center; gap: 0.625rem; }
.mawd-indicator { width: 8px; height: 8px; border-radius: 50%; background: var(--vp-c-text-3); transition: background 0.3s; flex-shrink: 0; }
.mawd-indicator.running { background: var(--vp-c-brand-1); box-shadow: 0 0 8px var(--vp-c-brand-1); }
.mawd-title { font-size: 1rem; font-weight: 600; color: var(--vp-c-text-1); }
.mawd-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 10px; background: rgba(13, 148, 136, 0.1); color: var(--vp-c-brand-1); font-weight: 500; }
.mawd-actions { display: flex; gap: 0.5rem; }
.mawd-btn-primary { background: var(--vp-c-brand-1); color: #fff; border: none; padding: 0.375rem 0.875rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.2s; }
.mawd-btn-primary.active { background: #0f766e; }
.mawd-btn-ghost { background: transparent; border: 1px solid var(--vp-c-divider); padding: 0.375rem 0.875rem; border-radius: 6px; font-size: 0.875rem; cursor: pointer; color: var(--vp-c-text-1); }

.mawd-agents { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.mawd-agent-tag { display: flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.625rem; border-radius: 20px; border: 1px solid; background: var(--vp-c-bg); }
.mawd-agent-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.mawd-agent-name { font-size: 0.75rem; font-weight: 600; color: var(--vp-c-text-1); }
.mawd-agent-role { font-size: 0.6875rem; color: var(--vp-c-text-3); }

.mawd-stream {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 380px;
  overflow-y: auto;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.875rem;
}
.mawd-empty { font-size: 0.75rem; color: var(--vp-c-text-3); text-align: center; padding: 2rem 0; }

.mawd-msg {
  border-left: 3px solid;
  padding: 0.5rem 0.75rem;
  border-radius: 0 6px 6px 0;
  background: var(--vp-c-bg-soft);
  transition: opacity 0.3s;
}
.mawd-msg-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.3rem; flex-wrap: wrap; }
.mawd-msg-from { font-size: 0.75rem; font-weight: 700; font-family: var(--vp-font-family-mono); }
.mawd-msg-arrow { width: 14px; height: 7px; color: var(--vp-c-text-3); }
.mawd-msg-to { font-size: 0.75rem; color: var(--vp-c-text-2); font-family: var(--vp-font-family-mono); }
.mawd-msg-type-badge { font-size: 0.625rem; padding: 1px 5px; border-radius: 4px; background: var(--vp-c-bg); color: var(--vp-c-text-3); border: 1px solid var(--vp-c-divider); margin-left: auto; }
.mawd-msg-content { font-size: 0.8125rem; color: var(--vp-c-text-1); line-height: 1.6; }
.mawd-msg-meta { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }
.mawd-meta-tag { font-size: 0.625rem; padding: 1px 5px; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 4px; color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); }

.mawd-footer { display: flex; align-items: center; gap: 0.75rem; }
.mawd-progress-track { flex: 1; height: 4px; background: var(--vp-c-divider); border-radius: 2px; overflow: hidden; }
.mawd-progress-fill { height: 100%; background: var(--vp-c-brand-1); border-radius: 2px; transition: width 0.4s ease; }
.mawd-progress-label { font-size: 0.6875rem; color: var(--vp-c-text-3); white-space: nowrap; }
</style>
