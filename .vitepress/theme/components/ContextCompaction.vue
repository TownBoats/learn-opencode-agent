<template>
  <div class="cc-root">
    <div class="cc-header">上下文压缩触发过程（session/compaction.ts）</div>

    <div class="cc-body">
      <!-- 左：消息列表 -->
      <div class="cc-list-wrap">
        <div class="cc-list" ref="listRef">
          <div
            v-for="(msg, i) in messages"
            :key="msg.id"
            class="cc-msg"
            :class="[msg.type, { collapsing: msg.collapsing, collapsed: msg.collapsed }]"
          >
            <span class="cc-badge" :class="msg.type">{{ msg.badge }}</span>
            <span class="cc-content">{{ msg.collapsed ? '[已压缩]' : msg.content }}</span>
          </div>

          <div v-if="phase === 'compacting'" class="cc-summary-gen">
            <span class="spin" /> 调用 LLM 生成历史摘要...
          </div>
          <div v-if="summaryMsg" class="cc-msg summary entering">
            <span class="cc-badge summary">summary</span>
            <span class="cc-content">{{ summaryMsg }}</span>
          </div>
        </div>
      </div>

      <!-- 右：状态面板 -->
      <div class="cc-panel">
        <!-- Token 进度条 -->
        <div class="panel-block">
          <div class="panel-label">Context 占用</div>
          <div class="token-bar">
            <div class="token-fill" :class="barClass" :style="{ width: barWidth + '%' }" />
            <div class="token-reserved" :style="{ width: reservedWidth + '%' }" title="reserved 预留空间" />
          </div>
          <div class="token-nums">
            <span :class="{ warn: tokens > 140000, danger: tokens > 180000 }">{{ fmtK(tokens) }}</span>
            <span class="token-sep">/</span>
            <span>200k</span>
          </div>
        </div>

        <!-- isOverflow 状态 -->
        <div class="panel-block" :class="{ active: overflowCheck }">
          <div class="panel-label">isOverflow()</div>
          <div class="overflow-check">
            <div class="ov-row">
              <span class="ov-key">context limit</span>
              <span class="ov-val">200k</span>
            </div>
            <div class="ov-row">
              <span class="ov-key">reserved</span>
              <span class="ov-val">8k</span>
            </div>
            <div class="ov-row">
              <span class="ov-key">max output</span>
              <span class="ov-val">8k</span>
            </div>
            <div class="ov-row result" :class="overflowResult">
              <span class="ov-key">overflow?</span>
              <span class="ov-val">{{ overflowText }}</span>
            </div>
          </div>
        </div>

        <!-- 阶段状态 -->
        <div class="panel-block">
          <div class="panel-label">当前阶段</div>
          <div class="phase-badge" :class="phase">{{ phaseLabel }}</div>
        </div>
      </div>
    </div>

    <div class="cc-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="cc-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Msg {
  id: number
  type: string
  badge: string
  content: string
  tokens: number
  prunable: boolean
  collapsing: boolean
  collapsed: boolean
}

let idSeq = 0
function m(type: string, badge: string, content: string, tokens: number, prunable = false): Msg {
  return { id: idSeq++, type, badge, content, tokens, prunable, collapsing: false, collapsed: false }
}

// 初始消息（已有历史）
const initialMsgs: Msg[] = [
  m('user', 'user',        '帮我重构认证模块',                          2000),
  m('tc',   'tool_call',   'glob("src/auth/**/*.ts")',                  1500),
  m('tr',   'tool_result', '找到 12 个文件:\nlogin.ts, register.ts...', 8000,  true),
  m('ast',  'assistant',   '已扫描文件，开始分析...',                    1000),
  m('tc',   'tool_call',   'read("src/auth/login.ts")',                  1500),
  m('tr',   'tool_result', 'export async function login(...) {\n  // 148 行代码\n  ...', 12000, true),
]

// 新增消息（会导致溢出）
const newMsgs: Msg[] = [
  m('tc',   'tool_call',   'read("src/auth/register.ts")',              1500),
  m('tr',   'tool_result', 'export async function register(...) {\n  // 203 行代码\n  ...', 18000, true),
  m('ast',  'assistant',   '分析完成，发现 3 处安全问题...',              2000),
  m('tc',   'tool_call',   'grep("bcrypt", "src/auth/")',               1500),
  m('tr',   'tool_result', '找到 8 处密码哈希调用\nlogin.ts:23, register.ts:41...', 6000, true),
]

const messages = ref<Msg[]>([...initialMsgs])
const phase = ref<string>('accumulating')
const overflowCheck = ref(false)
const overflowResult = ref('')
const summaryMsg = ref('')
const listRef = ref<HTMLElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null

const tokens = computed(() => messages.value.reduce((s, m) => s + m.tokens, 0))

const barWidth = computed(() => Math.min(tokens.value / 2000, 100))
const reservedWidth = computed(() => (16000 / 200000) * 100)  // 16k reserved

const barClass = computed(() => {
  if (tokens.value > 180000) return 'danger'
  if (tokens.value > 140000) return 'warn'
  return ''
})

const overflowText = computed(() => {
  if (overflowResult.value === 'yes') return 'true — 触发压缩'
  if (overflowResult.value === 'no')  return 'false'
  return '...'
})

const phaseLabel = computed(() => ({
  accumulating: '消息积累中',
  checking:     '检测 isOverflow()',
  pruning:      'prune() 折叠旧工具输出',
  compacting:   '调用 LLM 生成摘要',
  done:         '压缩完成，可继续',
}[phase.value] || phase.value))

const statusText = computed(() => {
  if (phase.value === 'done') return `压缩后 ~${fmtK(tokens.value)}，为下一轮预留了空间`
  if (phase.value === 'accumulating') return `当前 ${fmtK(tokens.value)} tokens，持续增长...`
  return phaseLabel.value
})

function fmtK(n: number) {
  return n >= 1000 ? Math.round(n / 1000) + 'k' : String(n)
}

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  // 阶段1：消息逐条积累
  await delay(600)
  for (const msg of newMsgs) {
    await delay(700)
    messages.value = [...messages.value, msg]
    await nextTick()
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  }

  // 阶段2：isOverflow 检测
  await delay(600)
  phase.value = 'checking'
  overflowCheck.value = true
  overflowResult.value = ''
  await delay(800)
  overflowResult.value = 'yes'

  // 阶段3：prune — 旧工具输出折叠
  await delay(700)
  phase.value = 'pruning'
  const prunableIndices = messages.value
    .map((m, i) => ({ m, i }))
    .filter(({ m }) => m.prunable)
    .map(({ i }) => i)

  for (const idx of prunableIndices) {
    await delay(300)
    messages.value[idx].collapsing = true
    await delay(350)
    messages.value[idx].collapsed = true
    messages.value[idx].tokens = 200  // 压缩后 token 数骤降
    messages.value = [...messages.value]  // trigger reactivity
  }

  // 阶段4：LLM 生成摘要
  await delay(500)
  phase.value = 'compacting'
  await delay(1500)
  summaryMsg.value = '[摘要] 已扫描 auth 模块 12 个文件，发现 bcrypt 使用 8 处，3 个安全问题（login.ts、register.ts），准备重构...'

  // 阶段5：完成
  await delay(600)
  phase.value = 'done'
  overflowCheck.value = false
  overflowResult.value = ''
}

function restart() {
  if (timer) clearTimeout(timer)
  idSeq = 0
  messages.value = initialMsgs.map(m => ({ ...m, collapsing: false, collapsed: false }))
  phase.value = 'accumulating'
  overflowCheck.value = false
  overflowResult.value = ''
  summaryMsg.value = ''
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.cc-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.cc-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.cc-body {
  display: flex;
  gap: 16px;
}

/* List */
.cc-list-wrap {
  flex: 1;
  overflow: hidden;
}

.cc-list {
  background: #111;
  border-radius: 8px;
  padding: 10px;
  min-height: 200px;
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cc-msg {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  animation: msgIn 0.3s ease;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  transition: all 0.4s ease;
  overflow: hidden;
  max-height: 100px;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(5px); }
  to   { opacity: 1; transform: translateY(0); }
}

.cc-msg.collapsing { max-height: 0; opacity: 0.3; }
.cc-msg.collapsed  { max-height: 22px; opacity: 0.5; }

.cc-msg.entering { animation: msgIn 0.4s ease; }

.cc-badge {
  flex-shrink: 0;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 3px;
  min-width: 66px;
  text-align: center;
}
.cc-badge.user    { background: #1e3a5f; color: #93c5fd; }
.cc-badge.tc      { background: #3b1f5e; color: #c4b5fd; }
.cc-badge.tr      { background: #1a3a2a; color: #6ee7b7; }
.cc-badge.ast     { background: #3a2a10; color: #fcd34d; }
.cc-badge.summary { background: #1a3a2a; color: #34d399; font-size: 8px; }

.cc-content {
  color: #9ca3af;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.cc-msg.collapsed .cc-content { color: #4b5563; font-style: italic; }

.cc-summary-gen {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #0f2a1a;
  border-radius: 4px;
  font-size: 11px;
  color: #6ee7b7;
  font-family: var(--vp-font-family-base);
  animation: msgIn 0.3s ease;
}

.spin {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid #1a3a2a;
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Panel */
.cc-panel {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-block {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
  transition: border-color 0.3s;
}

.panel-block.active { border-color: #f59e0b; }

.panel-label {
  font-size: 10px;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
  font-family: var(--vp-font-family-mono);
}

/* Token bar */
.token-bar {
  height: 8px;
  background: #374151;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  display: flex;
}

.token-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  transition: width 0.6s ease, background 0.3s;
  border-radius: 4px 0 0 4px;
}
.token-fill.warn   { background: #f59e0b; }
.token-fill.danger { background: #ef4444; }

.token-reserved {
  height: 100%;
  background: rgba(168, 85, 247, 0.4);
}

.token-nums {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  margin-top: 4px;
}

.token-nums .warn   { color: #f59e0b; }
.token-nums .danger { color: #ef4444; }
.token-sep { color: var(--vp-c-divider); }

/* Overflow check */
.overflow-check { display: flex; flex-direction: column; gap: 4px; }

.ov-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  font-family: var(--vp-font-family-mono);
}
.ov-key { color: var(--vp-c-text-3); }
.ov-val { color: var(--vp-c-text-2); }

.ov-row.result { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--vp-c-divider); }
.ov-row.result.yes .ov-val { color: #ef4444; font-weight: 700; }
.ov-row.result.no  .ov-val { color: #10b981; }

/* Phase badge */
.phase-badge {
  font-size: 11px;
  font-family: var(--vp-font-family-base);
  padding: 5px 8px;
  border-radius: 5px;
  text-align: center;
  transition: all 0.3s;
}
.phase-badge.accumulating { background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); }
.phase-badge.checking     { background: #2a1f00; color: #fbbf24; }
.phase-badge.pruning      { background: #1a1a2e; color: #a78bfa; }
.phase-badge.compacting   { background: #0f2a1a; color: #34d399; }
.phase-badge.done         { background: #0f2a1a; color: #10b981; font-weight: 700; }

/* Footer */
.cc-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cc-status {
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
