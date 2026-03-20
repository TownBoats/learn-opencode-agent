<template>
  <div class="rf-root">
    <div class="rf-header">runtimeFallback：模型自动切换</div>
    <div class="rf-body">
      <!-- 左：事件时间线 -->
      <div class="rf-timeline">
        <div
          v-for="(ev, i) in visibleEvents"
          :key="i"
          class="rf-ev"
          :class="ev.kind"
        >
          <div class="rf-dot" :class="ev.kind"></div>
          <div class="rf-content">
            <div class="rf-title">{{ ev.title }}</div>
            <div class="rf-desc" v-if="ev.desc">{{ ev.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 右：Fallback 链 -->
      <div class="rf-chain">
        <div class="rf-chain-title">Fallback 链（Sisyphus）</div>
        <div
          v-for="(m, i) in models"
          :key="i"
          class="rf-model"
          :class="{
            current: currentModel === i,
            failed: failedModels.includes(i),
            success: successModel === i,
          }"
        >
          <div class="rf-model-dot" :class="{
            current: currentModel === i,
            failed: failedModels.includes(i),
            success: successModel === i,
          }"></div>
          <div class="rf-model-info">
            <div class="rf-model-name">{{ m.name }}</div>
            <div class="rf-model-provider">{{ m.provider }}</div>
          </div>
          <div class="rf-model-status" v-if="failedModels.includes(i)">429</div>
          <div class="rf-model-status ok" v-if="successModel === i">OK</div>
        </div>
      </div>
    </div>

    <div class="rf-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="rf-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Event {
  kind: 'request' | 'error' | 'detect' | 'switch' | 'retry' | 'success'
  title: string
  desc: string
}

interface Model {
  name: string
  provider: string
}

const models: Model[] = [
  { name: 'gpt-4o max', provider: 'OpenAI' },
  { name: 'k2p5', provider: 'Kimi (月之暗面)' },
  { name: 'gpt-5.4 medium', provider: 'OpenAI' },
  { name: 'glm-5', provider: 'Zhipu AI' },
]

const visibleEvents = ref<Event[]>([])
const currentModel = ref<number | null>(null)
const failedModels = ref<number[]>([])
const successModel = ref<number | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null
const done = ref(false)

const statusText = computed(() => {
  if (done.value) return 'Kimi 接管任务，任务继续执行'
  if (successModel.value !== null) return '切换成功，继续执行'
  if (failedModels.value.length > 0) return 'OpenAI API 限流，切换到下一个模型...'
  if (currentModel.value !== null) return '调用中...'
  return '等待开始...'
})

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  // Try first model
  currentModel.value = 0
  await delay(700)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'request', title: '调用 gpt-4o', desc: 'POST api.openai.com/v1/chat/completions'
  }]

  await delay(900)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'error', title: '429 Too Many Requests', desc: 'OpenAI API 限流'
  }]
  failedModels.value = [0]

  await delay(600)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'detect', title: 'runtimeFallback 检测到错误', desc: '识别为可恢复的 API 限流'
  }]

  await delay(800)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'switch', title: '切换到 Kimi (k2p5)', desc: 'Fallback 链第 2 项'
  }]
  currentModel.value = 1

  await delay(700)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'retry', title: '重新提交任务', desc: '同等上下文，换 Kimi 执行'
  }]

  await delay(800)
  visibleEvents.value = [...visibleEvents.value, {
    kind: 'success', title: '200 OK — 任务继续', desc: 'Kimi 开始流式响应'
  }]
  successModel.value = 1
  done.value = true
}

function restart() {
  if (timer) clearTimeout(timer)
  visibleEvents.value = []
  currentModel.value = null
  failedModels.value = []
  successModel.value = null
  done.value = false
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.rf-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.rf-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.rf-body {
  display: flex;
  gap: 16px;
}

/* Timeline */
.rf-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.rf-ev {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 0;
  position: relative;
  animation: evIn 0.3s ease;
}

@keyframes evIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.rf-ev::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 22px;
  bottom: -8px;
  width: 2px;
  background: var(--vp-c-divider);
}
.rf-ev:last-child::before { display: none; }

.rf-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.3s;
}

.rf-dot.request { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.rf-dot.error   { border-color: #ef4444; background: #fee2e2; }
.rf-dot.detect  { border-color: #f59e0b; background: #fef3c7; }
.rf-dot.switch  { border-color: #a78bfa; background: #ede9fe; }
.rf-dot.retry   { border-color: #60a5fa; background: #dbeafe; }
.rf-dot.success { border-color: #10b981; background: #d1fae5; }

.rf-content { flex: 1; }

.rf-title {
  font-weight: 600;
  font-size: 12px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}

.rf-ev.error .rf-title   { color: #ef4444; }
.rf-ev.success .rf-title { color: #10b981; }
.rf-ev.switch .rf-title  { color: #a78bfa; }

.rf-desc {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-top: 2px;
  font-family: var(--vp-font-family-mono);
}

/* Fallback chain */
.rf-chain {
  width: 180px;
  flex-shrink: 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
}

.rf-chain-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 10px;
  text-align: center;
}

.rf-model {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  transition: all 0.4s;
  position: relative;
}

.rf-model.current {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.rf-model.failed {
  opacity: 0.45;
}

.rf-model.success {
  border-color: #10b981;
  background: #052e16;
}

.rf-model-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  flex-shrink: 0;
  transition: all 0.3s;
}

.rf-model-dot.current { background: var(--vp-c-brand-1); }
.rf-model-dot.failed  { background: #ef4444; }
.rf-model-dot.success { background: #10b981; }

.rf-model-info { flex: 1; }

.rf-model-name {
  font-size: 10px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  line-height: 1.3;
}

.rf-model.success .rf-model-name { color: #34d399; }

.rf-model-provider {
  font-size: 9px;
  color: var(--vp-c-text-3);
  margin-top: 1px;
}

.rf-model-status {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: #2d0a0a;
  color: #f87171;
  font-family: var(--vp-font-family-mono);
}

.rf-model-status.ok {
  background: #052e16;
  color: #34d399;
}

/* Footer */
.rf-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.rf-status {
  font-size: 11px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.btn:hover { background: var(--vp-c-brand-1); color: white; }
</style>
