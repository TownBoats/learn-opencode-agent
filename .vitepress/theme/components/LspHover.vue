<template>
  <div class="lh-root">
    <div class="lh-header">LSP Hover 请求流（textDocument/hover）</div>

    <div class="lh-body">
      <!-- 左：代码编辑器模拟 -->
      <div class="lh-editor">
        <div class="ed-titlebar">editor.ts</div>
        <div class="ed-code">
          <div class="code-line" v-for="(line, i) in codeLines" :key="i">
            <span class="line-num">{{ i + 1 }}</span>
            <span
              class="line-content"
              :class="{ highlighted: i === hoverLine }"
            >{{ line }}</span>
          </div>
          <!-- Hover popup -->
          <transition name="popup">
            <div v-if="showPopup" class="hover-popup">
              <div class="popup-type">{{ popupType }}</div>
              <div class="popup-doc">{{ popupDoc }}</div>
            </div>
          </transition>
        </div>
      </div>

      <!-- 右：消息流 -->
      <div class="lh-flow">
        <div
          v-for="(step, i) in visibleSteps"
          :key="i"
          class="flow-step"
          :class="[step.kind, { entering: i === visibleSteps.length - 1 }]"
        >
          <div class="flow-dot" :class="step.kind" />
          <div class="flow-content">
            <div class="flow-title">{{ step.title }}</div>
            <div class="flow-desc" v-if="step.desc">{{ step.desc }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="lh-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="lh-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const codeLines = [
  'import { Session } from "./session"',
  '',
  'async function run(session: Session) {',
  '  const result = await session.send({',
  '    role: "user", content: prompt',
  '  })',
  '  return result',
  '}',
]

interface FlowStep { kind: string; title: string; desc: string }

const allSteps: FlowStep[] = [
  { kind: 'cursor',  title: '光标悬停',               desc: 'session.send — 第 4 行' },
  { kind: 'request', title: 'textDocument/hover',     desc: 'line: 3, character: 24' },
  { kind: 'process', title: 'tsserver 查询类型',       desc: '查找 SessionClient.send 定义' },
  { kind: 'response',title: 'hover 响应',              desc: 'contents: MarkedString[]' },
  { kind: 'render',  title: 'Hover Popup 渲染',        desc: '类型信息 + JSDoc 文档' },
]

const hoverLine = ref(-1)
const showPopup = ref(false)
const popupType = ref('')
const popupDoc = ref('')
const visibleSteps = ref<FlowStep[]>([])
const statusText = ref('等待鼠标悬停...')
let timer: ReturnType<typeof setTimeout> | null = null

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  await delay(600)

  // Hover cursor over line 3 (0-indexed)
  hoverLine.value = 3
  visibleSteps.value = [...visibleSteps.value, allSteps[0]]
  statusText.value = '用户悬停在 session.send 上'
  await delay(700)

  // Send request
  visibleSteps.value = [...visibleSteps.value, allSteps[1]]
  statusText.value = 'LSP 客户端发送 hover 请求'
  await delay(700)

  // Process
  visibleSteps.value = [...visibleSteps.value, allSteps[2]]
  statusText.value = 'tsserver 分析类型...'
  await delay(900)

  // Response
  visibleSteps.value = [...visibleSteps.value, allSteps[3]]
  statusText.value = '语言服务器返回类型信息'
  await delay(600)

  // Render popup
  visibleSteps.value = [...visibleSteps.value, allSteps[4]]
  popupType.value = '(method) SessionClient.send(msg: Message): Promise<Result>'
  popupDoc.value = '发送消息并等待 LLM 流式响应，返回完整 Result。'
  showPopup.value = true
  statusText.value = 'Hover Popup 显示 — 类型推断完成'
}

function restart() {
  if (timer) clearTimeout(timer)
  hoverLine.value = -1
  showPopup.value = false
  popupType.value = ''
  popupDoc.value = ''
  visibleSteps.value = []
  statusText.value = '等待鼠标悬停...'
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.lh-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.lh-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.lh-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* Editor */
.lh-editor {
  flex: 1;
  background: #1e1e2e;
  border-radius: 8px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  position: relative;
}

.ed-titlebar {
  background: #181825;
  color: #cdd6f4;
  font-size: 11px;
  padding: 6px 12px;
  border-bottom: 1px solid #313244;
}

.ed-code {
  padding: 10px 0;
  position: relative;
}

.code-line {
  display: flex;
  align-items: center;
  padding: 1px 0;
  font-size: 11px;
  transition: background 0.3s;
}

.line-num {
  color: #585b70;
  width: 30px;
  text-align: right;
  padding-right: 12px;
  flex-shrink: 0;
  user-select: none;
}

.line-content {
  color: #cdd6f4;
  white-space: pre;
  flex: 1;
  padding-right: 8px;
  border-radius: 2px;
  transition: background 0.3s;
}
.line-content.highlighted {
  background: #2a2a40;
  box-shadow: inset 2px 0 0 #89b4fa;
}

/* Hover popup */
.hover-popup {
  position: absolute;
  top: 52px;
  left: 30px;
  right: 8px;
  background: #2a2a3d;
  border: 1px solid #585b70;
  border-radius: 6px;
  padding: 10px 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
  z-index: 10;
}

.popup-type {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  color: #89dceb;
  margin-bottom: 6px;
  word-break: break-all;
}

.popup-doc {
  font-size: 10px;
  color: #a6adc8;
  font-family: var(--vp-font-family-base);
  line-height: 1.5;
}

.popup-enter-active, .popup-leave-active { transition: opacity 0.3s, transform 0.3s; }
.popup-enter-from { opacity: 0; transform: translateY(-4px); }
.popup-leave-to   { opacity: 0; }

/* Flow steps */
.lh-flow {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.flow-step {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 7px 0;
  position: relative;
  animation: stepIn 0.3s ease;
}

@keyframes stepIn {
  from { opacity: 0; transform: translateX(6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.flow-step::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  bottom: -7px;
  width: 2px;
  background: var(--vp-c-divider);
}
.flow-step:last-child::before { display: none; }

.flow-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 1px;
  border: 2px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.3s;
}
.flow-dot.cursor   { border-color: #94a3b8; background: #e2e8f0; }
.flow-dot.request  { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); }
.flow-dot.process  { border-color: #f59e0b; background: #fef3c7; }
.flow-dot.response { border-color: #8b5cf6; background: #ede9fe; }
.flow-dot.render   { border-color: #10b981; background: #d1fae5; }

.flow-content { flex: 1; }
.flow-title {
  font-weight: 600;
  font-size: 11px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}
.flow-desc {
  font-size: 10px;
  color: var(--vp-c-text-2);
  margin-top: 1px;
}

/* Footer */
.lh-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.lh-status {
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
