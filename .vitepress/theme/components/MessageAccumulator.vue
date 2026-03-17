<template>
  <div class="ma-root">
    <div class="ma-header">messages 数组增长过程</div>

    <div class="ma-body">
      <!-- 左侧：消息列表 -->
      <div class="ma-list" ref="listRef">
        <div
          v-for="(msg, i) in visibleMessages"
          :key="i"
          class="ma-msg"
          :class="[msg.type, { entering: i === visibleMessages.length - 1 }]"
        >
          <span class="ma-badge" :class="msg.type">{{ msg.badge }}</span>
          <span class="ma-content">{{ msg.content }}</span>
        </div>
        <div v-if="!done && visibleMessages.length > 0" class="ma-thinking">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </div>
      </div>

      <!-- 右侧：统计面板 -->
      <div class="ma-stats">
        <div class="stat-block">
          <div class="stat-val">{{ visibleMessages.length }}</div>
          <div class="stat-label">messages</div>
        </div>
        <div class="stat-block" :class="{ warn: tokens > 120 }">
          <div class="stat-val">~{{ tokens }}</div>
          <div class="stat-label">tokens</div>
        </div>
        <div class="stat-block">
          <div class="stat-val">{{ round }}</div>
          <div class="stat-label">Loop 轮次</div>
        </div>

        <!-- token 进度条 -->
        <div class="token-bar-wrap">
          <div class="token-bar-label">Context 占用</div>
          <div class="token-bar">
            <div
              class="token-bar-fill"
              :class="{ warn: tokens > 120 }"
              :style="{ width: Math.min(tokens / 2, 100) + '%' }"
            />
          </div>
          <div class="token-bar-cap">上限 200k</div>
        </div>
      </div>
    </div>

    <!-- 图例 + 控制 -->
    <div class="ma-footer">
      <div class="ma-legend">
        <span class="leg user">user</span>
        <span class="leg tc">tool_call</span>
        <span class="leg tr">tool_result</span>
        <span class="leg ast">assistant</span>
      </div>
      <div class="ma-ctrl">
        <button class="btn" @click="restart">重新播放</button>
        <span class="ma-status">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

interface Msg {
  type: 'user' | 'tc' | 'tr' | 'ast'
  badge: string
  content: string
  tokens: number  // cumulative tokens after this message
  round: number
}

// 场景：把 config.ts 里的 port 改成 8080
const scenario: Msg[] = [
  { type: 'user', badge: 'user',        content: '帮我把 config.ts 里的 port 改成 8080',         tokens: 15,  round: 0 },
  { type: 'tc',   badge: 'tool_call',   content: 'read({ filePath: "config.ts" })',              tokens: 35,  round: 1 },
  { type: 'tr',   badge: 'tool_result', content: 'export const config = {\n  port: 3000,\n  host: "0.0.0.0"\n}', tokens: 90, round: 1 },
  { type: 'tc',   badge: 'tool_call',   content: 'edit({ filePath: "config.ts", old: "3000", new: "8080" })',     tokens: 115, round: 2 },
  { type: 'tr',   badge: 'tool_result', content: '已修改 1 处，第 2 行（config.ts:2）',          tokens: 130, round: 2 },
  { type: 'ast',  badge: 'assistant',   content: '已将 port 从 3000 改为 8080，config.ts 第 2 行已更新。',       tokens: 152, round: 3 },
]

const visibleMessages = ref<Msg[]>([])
const done = ref(false)
const listRef = ref<HTMLElement | null>(null)

let timer: ReturnType<typeof setTimeout> | null = null

const tokens = computed(() =>
  visibleMessages.value.length > 0
    ? visibleMessages.value[visibleMessages.value.length - 1].tokens
    : 0
)
const round = computed(() =>
  visibleMessages.value.length > 0
    ? visibleMessages.value[visibleMessages.value.length - 1].round
    : 0
)
const statusText = computed(() => {
  if (done.value) return 'finish_reason: stop — 循环结束'
  if (visibleMessages.value.length === 0) return '等待开始...'
  const last = visibleMessages.value[visibleMessages.value.length - 1]
  if (last.type === 'tc') return `第 ${last.round} 轮：工具执行中...`
  if (last.type === 'tr') return `第 ${last.round} 轮：结果写入 messages`
  return `第 ${last.round} 轮：LLM 生成中...`
})

function delay(ms: number): Promise<void> {
  return new Promise(resolve => { timer = setTimeout(resolve, ms) })
}

async function runScenario() {
  for (const msg of scenario) {
    await delay(msg.type === 'user' ? 600 : msg.type === 'tc' ? 900 : msg.type === 'tr' ? 700 : 1000)
    visibleMessages.value = [...visibleMessages.value, msg]
    await nextTick()
    if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
  }
  await delay(400)
  done.value = true
}

function restart() {
  if (timer) clearTimeout(timer)
  visibleMessages.value = []
  done.value = false
  runScenario()
}

onMounted(() => { timer = setTimeout(() => runScenario(), 600) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.ma-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.ma-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.ma-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.ma-list {
  flex: 1;
  min-height: 200px;
  max-height: 260px;
  overflow-y: auto;
  background: #111;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ma-msg {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  animation: msgIn 0.3s ease;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ma-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  min-width: 72px;
  text-align: center;
}

.ma-badge.user   { background: #1e3a5f; color: #93c5fd; }
.ma-badge.tc     { background: #3b1f5e; color: #c4b5fd; }
.ma-badge.tr     { background: #1a3a2a; color: #6ee7b7; }
.ma-badge.ast    { background: #3a2a10; color: #fcd34d; }

.ma-content { color: #d1d5db; line-height: 1.5; }

.ma-thinking {
  display: flex;
  gap: 4px;
  padding: 6px 4px;
  align-items: center;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #4b5563;
  animation: blink 1.2s ease infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 1; }
}

/* 右侧统计 */
.ma-stats {
  width: 120px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-block {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  transition: border-color 0.3s;
}

.stat-block.warn {
  border-color: #f59e0b;
}

.stat-val {
  font-size: 22px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
  transition: color 0.3s;
}

.stat-block.warn .stat-val { color: #f59e0b; }

.stat-label {
  font-size: 10px;
  color: var(--vp-c-text-2);
  margin-top: 2px;
}

.token-bar-wrap {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 8px 10px;
}

.token-bar-label {
  font-size: 10px;
  color: var(--vp-c-text-2);
  margin-bottom: 6px;
}

.token-bar {
  height: 6px;
  background: var(--vp-c-divider);
  border-radius: 3px;
  overflow: hidden;
}

.token-bar-fill {
  height: 100%;
  background: var(--vp-c-brand-1);
  border-radius: 3px;
  transition: width 0.5s ease, background 0.3s;
}

.token-bar-fill.warn { background: #f59e0b; }

.token-bar-cap {
  font-size: 9px;
  color: var(--vp-c-text-3);
  margin-top: 4px;
  text-align: right;
}

/* 底部 */
.ma-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.ma-legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.leg {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
}
.leg.user { background: #1e3a5f; color: #93c5fd; }
.leg.tc   { background: #3b1f5e; color: #c4b5fd; }
.leg.tr   { background: #1a3a2a; color: #6ee7b7; }
.leg.ast  { background: #3a2a10; color: #fcd34d; }

.ma-ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ma-status {
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
