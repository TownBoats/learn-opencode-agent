<template>
  <div class="streaming-demo">
    <div class="demo-title">流式输出演示</div>
    <div class="demo-scene">
      <div class="scene-header">
        <span class="scene-label">用户输入</span>
        <span class="user-msg">帮我重构 src/utils/parser.ts 的 parseConfig 函数</span>
      </div>
      <div class="output-area">
        <div class="output-header">
          <span class="dot" :class="{ pulse: isStreaming }"></span>
          <span class="output-label">{{ isStreaming ? 'Agent 思考中...' : isIdle ? '等待开始' : '完成' }}</span>
          <span v-if="currentToolName" class="tool-badge">{{ currentToolName }}</span>
        </div>

        <div class="tool-calls" v-if="toolEvents.length">
          <div v-for="(evt, i) in toolEvents" :key="i" class="tool-event" :class="evt.kind">
            <span class="tool-icon">{{ evt.kind === 'call' ? '⚡' : '✓' }}</span>
            <span class="tool-name">{{ evt.name }}</span>
            <span class="tool-arg">{{ evt.arg }}</span>
          </div>
        </div>

        <div class="text-output" v-if="displayedText || streamCursor">
          <span>{{ displayedText }}</span><span v-if="streamCursor" class="cursor">|</span>
        </div>
      </div>
    </div>
    <div class="controls">
      <button class="btn" @click="restart">重新播放</button>
      <div class="legend">
        <span class="legend-item call">工具调用</span>
        <span class="legend-item result">工具结果</span>
        <span class="legend-item text-chunk">文本流</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ToolEvent {
  kind: 'call' | 'result'
  name: string
  arg: string
}

type SceneEvent =
  | { type: 'tool-call'; name: string; arg: string }
  | { type: 'tool-result'; name: string; arg: string }
  | { type: 'text'; chunk: string }
  | { type: 'done' }

const scenario: SceneEvent[] = [
  { type: 'tool-call',   name: 'read_file', arg: 'src/utils/parser.ts' },
  { type: 'tool-result', name: 'read_file', arg: '已读取 148 行' },
  { type: 'tool-call',   name: 'grep',      arg: 'parseConfig' },
  { type: 'tool-result', name: 'grep',      arg: '找到 3 处引用' },
  { type: 'text', chunk: '分析完成。' },
  { type: 'text', chunk: '发现两个问题：' },
  { type: 'text', chunk: '\n1. 参数验证与解析逻辑耦合' },
  { type: 'text', chunk: '\n2. 错误处理使用 throw，建议改为返回 Result 类型' },
  { type: 'tool-call',   name: 'edit_file', arg: 'src/utils/parser.ts' },
  { type: 'tool-result', name: 'edit_file', arg: '已修改 12 行' },
  { type: 'text', chunk: '\n\n重构完成。' },
  { type: 'text', chunk: '函数从 48 行缩减至 22 行，' },
  { type: 'text', chunk: '职责更清晰。' },
  { type: 'done' },
]

const isStreaming = ref(false)
const isIdle = ref(true)
const currentToolName = ref('')
const toolEvents = ref<ToolEvent[]>([])
const displayedText = ref('')
const streamCursor = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null
let cursorTimer: ReturnType<typeof setInterval> | null = null

function startCursor() {
  streamCursor.value = true
  if (cursorTimer) clearInterval(cursorTimer)
  cursorTimer = setInterval(() => {
    streamCursor.value = !streamCursor.value
  }, 500)
}

function stopCursor() {
  streamCursor.value = false
  if (cursorTimer) { clearInterval(cursorTimer); cursorTimer = null }
}

function runEvent(index: number) {
  if (index >= scenario.length) return
  const evt = scenario[index]

  if (evt.type === 'tool-call') {
    currentToolName.value = evt.name
    toolEvents.value.push({ kind: 'call', name: evt.name, arg: evt.arg })
    timer = setTimeout(() => runEvent(index + 1), 600)
  } else if (evt.type === 'tool-result') {
    currentToolName.value = ''
    toolEvents.value.push({ kind: 'result', name: evt.name, arg: evt.arg })
    timer = setTimeout(() => runEvent(index + 1), 400)
  } else if (evt.type === 'text') {
    startCursor()
    let charIdx = 0
    const chunk = evt.chunk
    function typeChar() {
      if (charIdx < chunk.length) {
        displayedText.value += chunk[charIdx++]
        timer = setTimeout(typeChar, 40)
      } else {
        timer = setTimeout(() => runEvent(index + 1), 200)
      }
    }
    typeChar()
  } else if (evt.type === 'done') {
    isStreaming.value = false
    stopCursor()
    streamCursor.value = false
  }
}

function restart() {
  if (timer) clearTimeout(timer)
  stopCursor()
  isStreaming.value = true
  isIdle.value = false
  currentToolName.value = ''
  toolEvents.value = []
  displayedText.value = ''
  timer = setTimeout(() => runEvent(0), 400)
}

onMounted(() => {
  timer = setTimeout(() => restart(), 800)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
  if (cursorTimer) clearInterval(cursorTimer)
})
</script>

<style scoped>
.streaming-demo {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.demo-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
  margin-bottom: 14px;
  text-align: center;
}

.demo-scene {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  min-height: 200px;
}

.scene-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #333;
}

.scene-label {
  font-size: 11px;
  background: #333;
  color: #aaa;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.user-msg {
  color: #e2e8f0;
  font-family: var(--vp-font-family-base);
  font-size: 13px;
}

.output-area {
  min-height: 100px;
}

.output-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
  flex-shrink: 0;
}

.dot.pulse {
  background: #38bdf8;
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.output-label {
  font-size: 11px;
  color: #888;
  font-family: var(--vp-font-family-base);
}

.tool-badge {
  font-size: 11px;
  background: #1d4ed8;
  color: #93c5fd;
  padding: 2px 8px;
  border-radius: 4px;
  animation: fadeIn 0.2s ease;
}

.tool-calls {
  margin-bottom: 8px;
}

.tool-event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.tool-event.call   { background: #1e3a5f; }
.tool-event.result { background: #1a3a2a; }

.tool-icon { font-size: 12px; }
.tool-name {
  color: #93c5fd;
  font-weight: 600;
  min-width: 80px;
}

.tool-event.result .tool-name { color: #6ee7b7; }
.tool-arg { color: #94a3b8; }

.text-output {
  color: #e2e8f0;
  font-family: var(--vp-font-family-base);
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  padding: 4px 8px;
  background: #111;
  border-radius: 4px;
  min-height: 40px;
}

.cursor {
  display: inline-block;
  color: #38bdf8;
  animation: none;
  font-weight: 100;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

.btn:hover {
  background: var(--vp-c-brand-1);
  color: white;
}

.legend {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.legend-item {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.legend-item.call    { background: #1e3a5f; color: #93c5fd; }
.legend-item.result  { background: #1a3a2a; color: #6ee7b7; }
.legend-item.text-chunk { background: var(--vp-c-bg); color: var(--vp-c-text-2); border: 1px solid var(--vp-c-divider); }
</style>
