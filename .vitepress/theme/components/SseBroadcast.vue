<template>
  <div class="sse-root">
    <div class="sse-header">SSE 事件广播：一份事件，三端同步（GET /event）</div>

    <div class="sse-body">
      <!-- 左：processor.ts 事件发射源 -->
      <div class="sse-source">
        <div class="col-title">processor.ts</div>
        <div class="source-log">
          <div
            v-for="(ev, i) in emittedEvents"
            :key="i"
            class="source-ev"
            :class="[ev.kind, { active: i === emittedEvents.length - 1 }]"
          >
            <span class="ev-type">{{ ev.type }}</span>
            <span class="ev-payload">{{ ev.payload }}</span>
          </div>
          <div v-if="!done && emittedEvents.length > 0" class="source-cursor">Bus.publish ▶</div>
        </div>
      </div>

      <!-- 中：广播箭头 -->
      <div class="sse-channel">
        <div class="ch-label">GET /event</div>
        <div class="ch-pipe" :class="{ active: broadcasting }">
          <div class="ch-flow" v-if="broadcasting" />
        </div>
        <div class="ch-label-small">SSE 事件总线</div>
      </div>

      <!-- 右：三端客户端 -->
      <div class="sse-clients">
        <div
          v-for="client in clients"
          :key="client.id"
          class="client-card"
          :class="{ pulse: client.pulse }"
        >
          <div class="client-title">{{ client.name }}</div>
          <div class="client-log">
            <div
              v-for="(line, j) in client.lines"
              :key="j"
              class="client-line"
              :class="line.kind"
            >{{ line.text }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="sse-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="sse-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'

interface EmittedEvent { type: string; payload: string; kind: string }
interface ClientLine { text: string; kind: string }
interface Client { id: string; name: string; lines: ClientLine[]; pulse: boolean }

const allEvents: EmittedEvent[] = [
  { type: 'server.connected',  payload: '',                          kind: 'sys' },
  { type: 'text-delta',        payload: '"正在分析代码..."',          kind: 'text' },
  { type: 'tool-call',         payload: 'read("config.ts")',         kind: 'tool' },
  { type: 'tool-result',       payload: '"读取成功 (42行)"',          kind: 'result' },
  { type: 'text-delta',        payload: '"port 已从 3000 → 8080"',   kind: 'text' },
  { type: 'session.complete',  payload: '',                          kind: 'sys' },
]

const clientLineMap: Record<string, ClientLine> = {
  'server.connected': { text: '已连接', kind: 'sys' },
  'text-delta-0':     { text: '正在分析代码...', kind: 'text' },
  'tool-call':        { text: 'read("config.ts")', kind: 'tool' },
  'tool-result':      { text: '读取成功 (42行)', kind: 'result' },
  'text-delta-1':     { text: 'port 已从 3000 → 8080', kind: 'text' },
  'session.complete': { text: '完成', kind: 'sys' },
}

function makeClients(): Client[] {
  return [
    { id: 'tui',     name: 'TUI (终端)',   lines: [], pulse: false },
    { id: 'web',     name: 'Web (浏览器)', lines: [], pulse: false },
    { id: 'desktop', name: 'Desktop',     lines: [], pulse: false },
  ]
}

const emittedEvents = ref<EmittedEvent[]>([])
const broadcasting = ref(false)
const done = ref(false)
const clients = reactive<Client[]>(makeClients())

const statusText = computed(() => {
  if (done.value) return '三端均已同步，session.complete 收到'
  if (emittedEvents.value.length === 0) return '等待开始...'
  const last = emittedEvents.value[emittedEvents.value.length - 1]
  return `Bus.publish → ${last.type}`
})

let timer: ReturnType<typeof setTimeout> | null = null

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

function pushToClients(lineKey: string) {
  const line = clientLineMap[lineKey]
  if (!line) return
  clients.forEach(c => {
    c.lines.push({ ...line })
    c.pulse = true
    setTimeout(() => { c.pulse = false }, 400)
  })
}

async function run() {
  await delay(500)
  broadcasting.value = true

  let textDeltaIdx = 0
  for (const ev of allEvents) {
    await delay(900)
    emittedEvents.value = [...emittedEvents.value, ev]
    // push to all clients simultaneously
    const lineKey = ev.type === 'text-delta'
      ? `text-delta-${textDeltaIdx++}`
      : ev.type
    pushToClients(lineKey)
    await delay(300)
  }

  await delay(400)
  done.value = true
  broadcasting.value = false
}

function restart() {
  if (timer) clearTimeout(timer)
  emittedEvents.value = []
  done.value = false
  broadcasting.value = false
  clients.splice(0, clients.length, ...makeClients())
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.sse-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.sse-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.sse-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

/* Source */
.sse-source {
  width: 180px;
  flex-shrink: 0;
}

.col-title {
  font-weight: 700;
  font-size: 11px;
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  text-align: center;
  margin-bottom: 8px;
  padding: 4px;
  background: var(--vp-c-brand-soft);
  border-radius: 4px;
}

.source-log {
  background: #111;
  border-radius: 8px;
  padding: 10px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.source-ev {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 6px;
  border-radius: 4px;
  animation: evIn 0.25s ease;
  font-family: var(--vp-font-family-mono);
}

@keyframes evIn {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
}

.source-ev.active { box-shadow: 0 0 0 1px var(--vp-c-brand-1); }
.source-ev.sys    { background: #1a1a2e; }
.source-ev.text   { background: #1a1a1a; }
.source-ev.tool   { background: #1e3a5f; }
.source-ev.result { background: #1a3a2a; }

.ev-type {
  font-size: 10px;
  font-weight: 700;
  color: #9ca3af;
}
.source-ev.text .ev-type   { color: #60a5fa; }
.source-ev.tool .ev-type   { color: #93c5fd; }
.source-ev.result .ev-type { color: #6ee7b7; }
.source-ev.sys .ev-type    { color: #a78bfa; }

.ev-payload {
  font-size: 10px;
  color: #6b7280;
}

.source-cursor {
  font-size: 10px;
  color: var(--vp-c-brand-1);
  animation: cursorBlink 1s ease infinite;
  font-family: var(--vp-font-family-mono);
  padding: 2px 6px;
}

@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

/* Channel */
.sse-channel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 70px;
  flex-shrink: 0;
  padding-top: 24px;
}

.ch-label {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 700;
  color: #f59e0b;
  text-align: center;
  padding: 3px 6px;
  background: #2a1f00;
  border-radius: 4px;
  white-space: nowrap;
}

.ch-label-small {
  font-size: 9px;
  color: var(--vp-c-text-3);
  text-align: center;
  line-height: 1.3;
}

.ch-pipe {
  width: 3px;
  height: 80px;
  background: var(--vp-c-divider);
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.ch-pipe.active {
  background: #374151;
}

.ch-flow {
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  height: 20px;
  background: linear-gradient(to bottom, transparent, #f59e0b, transparent);
  animation: flowDown 0.8s linear infinite;
}

@keyframes flowDown {
  from { top: -20px; }
  to   { top: 100%; }
}

/* Clients */
.sse-clients {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.client-card {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.client-card.pulse {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px var(--vp-c-brand-soft);
}

.client-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  margin-bottom: 5px;
  font-family: var(--vp-font-family-base);
}

.client-log {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 28px;
}

.client-line {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  animation: lineIn 0.2s ease;
}

@keyframes lineIn {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

.client-line.sys    { background: var(--vp-c-bg-soft); color: #a78bfa; }
.client-line.text   { background: var(--vp-c-bg-soft); color: var(--vp-c-text-1); }
.client-line.tool   { background: #1e3a5f; color: #93c5fd; }
.client-line.result { background: #1a3a2a; color: #6ee7b7; }

/* Footer */
.sse-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sse-status {
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
