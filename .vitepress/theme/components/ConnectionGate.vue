<template>
  <div class="cg-root">
    <div class="cg-header">ConnectionGate — 启动健康检查流程</div>

    <div class="cg-body">
      <!-- 状态机可视化 -->
      <div class="cg-states">
        <div
          v-for="(s, i) in states"
          :key="i"
          class="cg-state"
          :class="[s.id, { active: current === s.id, passed: passed.includes(s.id) }]"
        >
          <div class="state-dot" :class="[s.id, { active: current === s.id, passed: passed.includes(s.id) }]" />
          <div class="state-info">
            <div class="state-name">{{ s.name }}</div>
            <div class="state-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 右：事件日志 -->
      <div class="cg-log">
        <div class="log-title">运行日志</div>
        <div
          v-for="(ev, i) in logEvents"
          :key="i"
          class="log-ev"
          :class="[ev.kind, { entering: i === logEvents.length - 1 }]"
        >
          <span class="log-time">{{ ev.time }}</span>
          <span class="log-msg">{{ ev.msg }}</span>
        </div>
        <div v-if="logEvents.length === 0" class="log-idle">等待启动...</div>
      </div>
    </div>

    <!-- 最终 UI 渲染区 -->
    <transition name="ui-show">
      <div v-if="uiReady" class="cg-ui-ready">
        连接成功 — 业务 UI 渲染
      </div>
    </transition>

    <div class="cg-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="cg-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface State { id: string; name: string; desc: string }

const states: State[] = [
  { id: 'idle',       name: 'idle',       desc: '初始状态' },
  { id: 'blocking',   name: 'blocking',   desc: '首次连接（最少 1.2s）' },
  { id: 'connecting', name: 'connecting', desc: '健康检查轮询中' },
  { id: 'connected',  name: 'connected',  desc: '连接就绪' },
]

interface LogEvent { kind: string; time: string; msg: string }

const current = ref('idle')
const passed = ref<string[]>([])
const logEvents = ref<LogEvent[]>([])
const uiReady = ref(false)
const statusText = ref('等待启动...')
let timer: ReturnType<typeof setTimeout> | null = null
let startTime = 0

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

function ts() {
  return `+${((Date.now() - startTime) / 1000).toFixed(1)}s`
}

function log(kind: string, msg: string) {
  logEvents.value = [...logEvents.value, { kind, time: ts(), msg }]
}

function moveTo(id: string) {
  passed.value = [...passed.value, current.value]
  current.value = id
}

async function run() {
  startTime = Date.now()
  await delay(400)

  // blocking phase
  moveTo('blocking')
  log('info', 'checkMode = blocking')
  log('info', '启动最小等待计时 (1.2s)')
  statusText.value = 'blocking 模式：强制等待 1.2s 显示动画'
  await delay(1200)

  // connecting phase
  moveTo('connecting')
  log('ping', 'GET /healthz → 轮询中...')
  statusText.value = '健康检查：轮询 /healthz'
  await delay(700)

  log('ping', 'GET /healthz → 200 OK')
  log('info', 'checkMode = background')
  statusText.value = '服务器响应正常'
  await delay(400)

  // connected
  moveTo('connected')
  log('success', '连接成功，渲染业务 UI')
  uiReady.value = true
  statusText.value = '业务 UI 渲染完成 — 用户可以交互'
}

function restart() {
  if (timer) clearTimeout(timer)
  current.value = 'idle'
  passed.value = []
  logEvents.value = []
  uiReady.value = false
  statusText.value = '等待启动...'
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.cg-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.cg-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.cg-body {
  display: flex;
  gap: 16px;
}

/* State machine */
.cg-states {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cg-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.4s;
}

.cg-state.active   { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.cg-state.passed   { opacity: 0.55; }

.state-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.3s;
}
.state-dot.idle       { border-color: #94a3b8; }
.state-dot.blocking   { border-color: #f59e0b; background: #fef3c7; }
.state-dot.connecting { border-color: #3b82f6; background: #dbeafe; }
.state-dot.connected  { border-color: #10b981; background: #d1fae5; }

.state-dot.active {
  box-shadow: 0 0 0 3px var(--vp-c-brand-soft);
  animation: pulse 1.2s ease infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.2); }
}

.state-dot.passed { animation: none; }

.state-name {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-1);
}
.state-desc {
  font-size: 10px;
  color: var(--vp-c-text-2);
  margin-top: 1px;
}

/* Log panel */
.cg-log {
  width: 200px;
  flex-shrink: 0;
  background: #0d1117;
  border-radius: 8px;
  padding: 10px;
  font-family: var(--vp-font-family-mono);
}

.log-title {
  font-size: 10px;
  font-weight: 700;
  color: #58a6ff;
  margin-bottom: 8px;
  border-bottom: 1px solid #30363d;
  padding-bottom: 4px;
}

.log-idle {
  font-size: 10px;
  color: #484f58;
  text-align: center;
  padding: 10px 0;
}

.log-ev {
  display: flex;
  gap: 6px;
  font-size: 10px;
  padding: 2px 0;
  animation: logIn 0.25s ease;
}
@keyframes logIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.log-time { color: #484f58; flex-shrink: 0; }
.log-ev.info    .log-msg { color: #8b949e; }
.log-ev.ping    .log-msg { color: #58a6ff; }
.log-ev.success .log-msg { color: #3fb950; }

/* Ready banner */
.cg-ui-ready {
  margin-top: 12px;
  padding: 10px 16px;
  background: #0f2a1a;
  border: 1px solid #10b981;
  border-radius: 8px;
  color: #34d399;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
  animation: slideIn 0.4s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ui-show-enter-active { animation: slideIn 0.4s ease; }

/* Footer */
.cg-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cg-status {
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
