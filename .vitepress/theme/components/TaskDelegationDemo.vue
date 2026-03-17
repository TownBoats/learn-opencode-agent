<template>
  <div class="td-root">
    <div class="td-header">task 委托：同步 vs 异步</div>
    <div class="td-body">
      <!-- 同步 -->
      <div class="td-mode">
        <div class="td-mode-title sync">同步委托（run_in_background: false）</div>
        <div class="td-timeline">
          <div
            v-for="(seg, i) in syncSegs"
            :key="i"
            class="td-seg"
            :class="[seg.actor, seg.state, { active: seg.active }]"
            :style="{ flex: seg.weight }"
          >
            <div class="td-seg-label">{{ seg.label }}</div>
          </div>
        </div>
        <div class="td-legend">
          <span class="td-actor sisyphus">Sisyphus</span>
          <span class="td-actor wait">等待中（阻塞）</span>
          <span class="td-actor subagent">子 Agent</span>
        </div>
        <div class="td-note sync-note" v-if="syncNote">{{ syncNote }}</div>
      </div>

      <!-- 分隔 -->
      <div class="td-vs">VS</div>

      <!-- 异步 -->
      <div class="td-mode">
        <div class="td-mode-title async">异步委托（run_in_background: true）</div>
        <div class="td-parallel">
          <div class="td-lane">
            <div class="td-lane-label">Sisyphus</div>
            <div class="td-timeline">
              <div
                v-for="(seg, i) in asyncSisSeg"
                :key="i"
                class="td-seg"
                :class="[seg.actor, seg.state, { active: seg.active }]"
                :style="{ flex: seg.weight }"
              >
                <div class="td-seg-label">{{ seg.label }}</div>
              </div>
            </div>
          </div>
          <div class="td-lane">
            <div class="td-lane-label">后台 Agent</div>
            <div class="td-timeline">
              <div
                v-for="(seg, i) in asyncAgentSeg"
                :key="i"
                class="td-seg"
                :class="[seg.actor, seg.state, { active: seg.active }]"
                :style="{ flex: seg.weight }"
              >
                <div class="td-seg-label">{{ seg.label }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="td-note async-note" v-if="asyncNote">{{ asyncNote }}</div>
      </div>
    </div>

    <div class="td-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="td-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Seg {
  actor: string
  state: string
  label: string
  weight: number
  active: boolean
}

const syncSegs = ref<Seg[]>([])
const asyncSisSeg = ref<Seg[]>([])
const asyncAgentSeg = ref<Seg[]>([])
const syncNote = ref('')
const asyncNote = ref('')
const phase = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (phase.value === 0) return '等待开始...'
  if (phase.value === 1) return '同步委托：Sisyphus 发出任务后阻塞等待...'
  if (phase.value === 2) return '同步委托完成；异步委托：两条线并行进行...'
  return '对比完成：异步委托节省了等待时间'
})

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  phase.value = 1

  // Sync timeline build up
  syncSegs.value = [
    { actor: 'sisyphus', state: 'active', label: '发出委托', weight: 1, active: true },
  ]
  await delay(600)

  syncSegs.value = [
    { actor: 'sisyphus', state: '', label: '发出委托', weight: 1, active: false },
    { actor: 'wait', state: 'active', label: '等待子 Agent...', weight: 3, active: true },
  ]
  await delay(1200)

  syncSegs.value = [
    { actor: 'sisyphus', state: '', label: '发出委托', weight: 1, active: false },
    { actor: 'wait', state: '', label: '等待', weight: 3, active: false },
    { actor: 'subagent', state: 'active', label: '子 Agent 执行', weight: 2, active: true },
  ]
  await delay(800)

  syncSegs.value = [
    { actor: 'sisyphus', state: '', label: '发出委托', weight: 1, active: false },
    { actor: 'wait', state: '', label: '等待', weight: 3, active: false },
    { actor: 'subagent', state: '', label: '子 Agent 执行', weight: 2, active: false },
    { actor: 'sisyphus', state: 'done', label: '收到结果，继续', weight: 1.5, active: false },
  ]
  syncNote.value = '总耗时 = 委托 + 等待 + 执行 + 返回'

  phase.value = 2

  // Async timelines build up simultaneously
  await delay(400)

  asyncSisSeg.value = [
    { actor: 'sisyphus', state: 'active', label: '发出委托', weight: 1, active: true },
  ]
  asyncAgentSeg.value = [
    { actor: 'idle', state: '', label: '', weight: 1, active: false },
  ]
  await delay(500)

  asyncSisSeg.value = [
    { actor: 'sisyphus', state: '', label: '发出委托', weight: 1, active: false },
    { actor: 'sisyphus', state: 'active', label: '继续其他工作', weight: 3.5, active: true },
  ]
  asyncAgentSeg.value = [
    { actor: 'idle', state: '', label: '', weight: 1, active: false },
    { actor: 'subagent', state: 'active', label: '后台执行中', weight: 2, active: true },
  ]
  await delay(1000)

  asyncSisSeg.value = [
    { actor: 'sisyphus', state: '', label: '发出委托', weight: 1, active: false },
    { actor: 'sisyphus', state: '', label: '继续其他工作', weight: 3.5, active: false },
    { actor: 'sisyphus', state: 'done', label: '收到通知', weight: 1, active: false },
  ]
  asyncAgentSeg.value = [
    { actor: 'idle', state: '', label: '', weight: 1, active: false },
    { actor: 'subagent', state: '', label: '后台执行中', weight: 2, active: false },
    { actor: 'subagent', state: 'done', label: '完成', weight: 0.5, active: false },
  ]
  asyncNote.value = '总耗时 ≈ max(主线程, 后台) — 节省了等待时间'

  phase.value = 3
}

function restart() {
  if (timer) clearTimeout(timer)
  syncSegs.value = []
  asyncSisSeg.value = []
  asyncAgentSeg.value = []
  syncNote.value = ''
  asyncNote.value = ''
  phase.value = 0
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.td-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.td-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.td-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.td-mode {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
}

.td-mode-title {
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 10px;
  font-family: var(--vp-font-family-mono);
}

.td-mode-title.sync  { color: #f59e0b; }
.td-mode-title.async { color: #34d399; }

.td-vs {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-3);
  letter-spacing: 0.1em;
}

.td-timeline {
  display: flex;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  gap: 2px;
  margin-bottom: 8px;
}

.td-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.5s ease;
  animation: segIn 0.4s ease;
  overflow: hidden;
}

@keyframes segIn {
  from { opacity: 0; transform: scaleX(0.5); }
  to   { opacity: 1; transform: scaleX(1); }
}

.td-seg-label {
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 6px;
}

/* Actor colors */
.td-seg.sisyphus { background: #1e1b4b; }
.td-seg.sisyphus .td-seg-label { color: #a78bfa; }
.td-seg.sisyphus.active { background: #312e81; }
.td-seg.sisyphus.done { background: #1e1b4b; border: 1px solid #7c3aed; }
.td-seg.sisyphus.done .td-seg-label { color: #c4b5fd; }

.td-seg.wait { background: #1c1200; }
.td-seg.wait .td-seg-label { color: #6b7280; }
.td-seg.wait.active { background: #1c1200; animation: waitPulse 1.2s ease infinite; }

@keyframes waitPulse {
  0%, 100% { background: #1c1200; }
  50%       { background: #291a00; }
}

.td-seg.subagent { background: #052e16; }
.td-seg.subagent .td-seg-label { color: #6ee7b7; }
.td-seg.subagent.active { background: #064e3b; }
.td-seg.subagent.done { border: 1px solid #10b981; }

.td-seg.idle { background: var(--vp-c-bg-soft); }
.td-seg.idle .td-seg-label { color: transparent; }

.td-legend {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
}

.td-actor {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
}

.td-actor.sisyphus { background: #1e1b4b; color: #a78bfa; }
.td-actor.wait     { background: #1c1200; color: #6b7280; }
.td-actor.subagent { background: #052e16; color: #6ee7b7; }

.td-note {
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  animation: fadeIn 0.4s ease;
}

.td-note.sync-note  { background: #1c1200; color: #fbbf24; }
.td-note.async-note { background: #052e16; color: #34d399; }

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Parallel lanes */
.td-parallel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.td-lane {
  display: flex;
  align-items: center;
  gap: 8px;
}

.td-lane-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--vp-c-text-3);
  min-width: 60px;
  text-align: right;
}

.td-lane .td-timeline {
  flex: 1;
  margin-bottom: 0;
}

/* Footer */
.td-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.td-status {
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
