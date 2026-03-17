<template>
  <div class="pf-root">
    <div class="pf-header">Provider 限流重试（session/retry.ts）</div>

    <div class="pf-body">
      <!-- 左：调用时间线 -->
      <div class="pf-timeline">
        <div
          v-for="(ev, i) in visibleEvents"
          :key="i"
          class="tl-ev"
          :class="[ev.kind, { entering: i === visibleEvents.length - 1 }]"
        >
          <div class="tl-dot" :class="ev.kind" />
          <div class="tl-content">
            <div class="tl-title">{{ ev.title }}</div>
            <div class="tl-desc" v-if="ev.desc">{{ ev.desc }}</div>
          </div>
          <!-- 倒计时 -->
          <div v-if="ev.kind === 'wait' && countdown > 0" class="tl-countdown">{{ countdown }}s</div>
          <div v-if="ev.kind === 'wait' && countdown === 0 && !retried" class="tl-countdown done">就绪</div>
        </div>
      </div>

      <!-- 右：retryable 分类表 -->
      <div class="pf-retryable">
        <div class="rt-title">retryable() 错误分类</div>
        <div
          v-for="r in retryRules"
          :key="r.code"
          class="rt-row"
          :class="[r.decision, { highlight: highlightCode === r.code }]"
        >
          <span class="rt-code">{{ r.code }}</span>
          <span class="rt-label">{{ r.label }}</span>
          <span class="rt-decision" :class="r.decision">{{ r.decision === 'yes' ? '重试' : '不重试' }}</span>
        </div>
        <div class="rt-note">匹配当前错误 → 429</div>
      </div>
    </div>

    <div class="pf-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="pf-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface TlEvent { kind: string; title: string; desc: string }

const allEvents: TlEvent[] = [
  { kind: 'request',  title: '调用 #1',                 desc: 'POST api.anthropic.com/v1/messages' },
  { kind: 'error',    title: '429 Too Many Requests',   desc: 'retry-after: 3' },
  { kind: 'classify', title: 'retryable() 检查',        desc: '429 → 限流，可重试' },
  { kind: 'wait',     title: '等待 retry-after',        desc: '读取响应头：retry-after = 3s' },
  { kind: 'request',  title: '调用 #2',                 desc: 'POST api.anthropic.com/v1/messages' },
  { kind: 'success',  title: '200 OK',                  desc: '流式响应开始，text-delta 事件发出' },
]

const retryRules = [
  { code: '429', label: '限流',      decision: 'yes' },
  { code: '503', label: '服务过载',  decision: 'yes' },
  { code: '408', label: '超时',      decision: 'yes' },
  { code: '400', label: '参数错误',  decision: 'no'  },
  { code: 'ctx', label: '上下文溢出', decision: 'no' },
  { code: 'sig', label: '用户中止',  decision: 'no'  },
]

const visibleEvents = ref<TlEvent[]>([])
const countdown = ref(0)
const retried = ref(false)
const highlightCode = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (visibleEvents.value.length === 0) return '等待开始...'
  const last = visibleEvents.value[visibleEvents.value.length - 1]
  if (last.kind === 'success') return '重试成功，Token 流开始输出'
  if (countdown.value > 0) return `等待 ${countdown.value}s 后重试...`
  if (last.kind === 'error') return '429 Rate Limit — 检查 retry-after 响应头'
  return last.title
})

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function runCountdown(seconds: number) {
  countdown.value = seconds
  while (countdown.value > 0) {
    await delay(1000)
    countdown.value--
  }
}

async function run() {
  await delay(500)

  for (let i = 0; i < allEvents.length; i++) {
    const ev = allEvents[i]

    if (ev.kind === 'wait') {
      visibleEvents.value = [...visibleEvents.value, ev]
      await runCountdown(3)
      retried.value = false
      await delay(400)
    } else if (ev.kind === 'classify') {
      visibleEvents.value = [...visibleEvents.value, ev]
      highlightCode.value = '429'
      await delay(900)
    } else if (ev.kind === 'request' && i > 0) {
      retried.value = true
      highlightCode.value = ''
      visibleEvents.value = [...visibleEvents.value, ev]
      await delay(700)
    } else {
      visibleEvents.value = [...visibleEvents.value, ev]
      await delay(700)
    }
  }
}

function restart() {
  if (timer) clearTimeout(timer)
  visibleEvents.value = []
  countdown.value = 0
  retried.value = false
  highlightCode.value = ''
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.pf-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.pf-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.pf-body {
  display: flex;
  gap: 16px;
}

/* Timeline */
.pf-timeline {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.tl-ev {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 8px 0;
  position: relative;
  animation: evIn 0.3s ease;
}

@keyframes evIn {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.tl-ev::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 22px;
  bottom: -8px;
  width: 2px;
  background: var(--vp-c-divider);
}
.tl-ev:last-child::before { display: none; }

.tl-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.3s;
}
.tl-dot.request  { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.tl-dot.error    { border-color: #ef4444; background: #fee2e2; }
.tl-dot.classify { border-color: #f59e0b; background: #fef3c7; }
.tl-dot.wait     { border-color: #6b7280; background: #374151; }
.tl-dot.success  { border-color: #10b981; background: #d1fae5; }

.tl-content { flex: 1; }

.tl-title {
  font-weight: 600;
  font-size: 12px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}
.tl-ev.error .tl-title   { color: #ef4444; }
.tl-ev.success .tl-title { color: #10b981; }
.tl-ev.wait .tl-title    { color: #9ca3af; }

.tl-desc {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-top: 2px;
  font-family: var(--vp-font-family-mono);
}

.tl-countdown {
  font-family: var(--vp-font-family-mono);
  font-size: 18px;
  font-weight: 700;
  color: #f59e0b;
  min-width: 40px;
  text-align: right;
  animation: countPulse 1s ease infinite;
}
.tl-countdown.done { color: #10b981; animation: none; font-size: 14px; }

@keyframes countPulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}

/* Retryable panel */
.pf-retryable {
  width: 160px;
  flex-shrink: 0;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
}

.rt-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  margin-bottom: 8px;
  text-align: center;
  font-family: var(--vp-font-family-base);
}

.rt-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
  transition: all 0.3s;
}

.rt-row.highlight {
  background: #1e3a5f;
  box-shadow: 0 0 0 1px #3b82f6;
}

.rt-code {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  min-width: 28px;
}

.rt-row.highlight .rt-code { color: #93c5fd; }

.rt-label {
  font-size: 10px;
  color: var(--vp-c-text-2);
  flex: 1;
}

.rt-decision {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}
.rt-decision.yes { background: #0f2a1a; color: #34d399; }
.rt-decision.no  { background: #2a0f0f; color: #f87171; }

.rt-note {
  font-size: 9px;
  color: #3b82f6;
  text-align: center;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--vp-c-divider);
  font-family: var(--vp-font-family-mono);
}

/* Footer */
.pf-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.pf-status {
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
