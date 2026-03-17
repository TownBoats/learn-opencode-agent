<template>
  <div class="wva-root">
    <div class="wva-header">Workflow vs Agent — 决策模式对比</div>

    <div class="wva-body">
      <!-- 左：固定 Workflow -->
      <div class="wva-panel">
        <div class="panel-title workflow">固定 Workflow</div>
        <div class="panel-subtitle">步骤预定义，顺序执行</div>
        <div class="wf-steps">
          <div
            v-for="(step, i) in wfSteps"
            :key="i"
            class="wf-step"
            :class="{ active: wfActive === i, done: wfActive > i }"
          >
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-label">{{ step }}</div>
          </div>
          <div v-if="wfBlocked" class="wf-blocked">
            遇到意外情况 — 流程中断
          </div>
        </div>
      </div>

      <!-- 分隔 -->
      <div class="wva-vs">VS</div>

      <!-- 右：动态 Agent -->
      <div class="wva-panel">
        <div class="panel-title agent">动态 Agent</div>
        <div class="panel-subtitle">感知 → 思考 → 行动</div>
        <div class="ag-loop">
          <div
            v-for="(ev, i) in agEvents"
            :key="i"
            class="ag-ev"
            :class="[ev.kind, { entering: i === agEvents.length - 1 }]"
          >
            <span class="ag-icon">{{ ev.icon }}</span>
            <span class="ag-text">{{ ev.text }}</span>
          </div>
          <div v-if="agEvents.length === 0" class="ag-idle">等待启动...</div>
        </div>
      </div>
    </div>

    <div class="wva-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="wva-caption">{{ caption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const wfSteps = ['解析需求', '读取文件', '生成代码', '运行测试', '提交结果']
const wfActive = ref(-1)
const wfBlocked = ref(false)

interface AgEvent { kind: string; icon: string; text: string }
const agEvents = ref<AgEvent[]>([])
const caption = ref('等待开始...')

let timer: ReturnType<typeof setTimeout> | null = null

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  // Workflow side
  for (let i = 0; i < wfSteps.length; i++) {
    wfActive.value = i
    caption.value = `Workflow: 执行步骤 ${i + 1} — ${wfSteps[i]}`
    await delay(600)
    if (i === 2) {
      // unexpected block
      wfBlocked.value = true
      caption.value = 'Workflow 遇到未预期情况 — 流程中断'
      break
    }
  }

  await delay(500)

  // Agent side
  const events: AgEvent[] = [
    { kind: 'observe', icon: '👁', text: '观察：读取任务描述' },
    { kind: 'think',   icon: '🧠', text: '思考：需要先理解代码结构' },
    { kind: 'act',     icon: '🔧', text: '行动：调用 read_file 工具' },
    { kind: 'observe', icon: '👁', text: '观察：发现测试失败' },
    { kind: 'think',   icon: '🧠', text: '思考：调整策略，先修 bug' },
    { kind: 'act',     icon: '🔧', text: '行动：调用 edit_file 工具' },
    { kind: 'observe', icon: '👁', text: '观察：测试通过' },
    { kind: 'done',    icon: '✅', text: '完成：动态适应，任务成功' },
  ]

  for (const ev of events) {
    agEvents.value = [...agEvents.value, ev]
    caption.value = `Agent: ${ev.text}`
    await delay(ev.kind === 'think' ? 700 : 550)
  }

  caption.value = 'Agent 动态决策，Workflow 固定路径 — 核心差异'
}

function restart() {
  if (timer) clearTimeout(timer)
  wfActive.value = -1
  wfBlocked.value = false
  agEvents.value = []
  caption.value = '等待开始...'
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.wva-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.wva-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.wva-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.wva-panel {
  flex: 1;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  min-height: 200px;
}

.panel-title {
  font-weight: 700;
  font-size: 13px;
  text-align: center;
  margin-bottom: 4px;
  padding: 4px 8px;
  border-radius: 4px;
}
.panel-title.workflow { background: #dbeafe; color: #1d4ed8; }
.panel-title.agent    { background: #d1fae5; color: #065f46; }

.panel-subtitle {
  font-size: 10px;
  color: var(--vp-c-text-2);
  text-align: center;
  margin-bottom: 12px;
}

/* Workflow steps */
.wf-steps { display: flex; flex-direction: column; gap: 6px; }

.wf-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s;
}
.wf-step.active {
  background: #dbeafe;
  border-color: #3b82f6;
}
.wf-step.done {
  background: #f0fdf4;
  border-color: #10b981;
  opacity: 0.7;
}

.step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--vp-c-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
  transition: background 0.3s;
}
.wf-step.active .step-num { background: #3b82f6; color: white; }
.wf-step.done .step-num   { background: #10b981; color: white; }

.step-label { font-size: 11px; color: var(--vp-c-text-1); }

.wf-blocked {
  margin-top: 8px;
  padding: 6px 8px;
  background: #fee2e2;
  border: 1px solid #ef4444;
  border-radius: 6px;
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  text-align: center;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* VS divider */
.wva-vs {
  font-weight: 900;
  font-size: 16px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
  margin-top: 80px;
}

/* Agent loop */
.ag-loop { display: flex; flex-direction: column; gap: 5px; }
.ag-idle { font-size: 11px; color: var(--vp-c-text-3); text-align: center; padding: 20px 0; }

.ag-ev {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 11px;
  animation: evIn 0.3s ease;
}
@keyframes evIn {
  from { opacity: 0; transform: translateX(6px); }
  to   { opacity: 1; transform: translateX(0); }
}

.ag-ev.observe { background: #eff6ff; color: #1e40af; }
.ag-ev.think   { background: #fef3c7; color: #92400e; }
.ag-ev.act     { background: #f0fdf4; color: #065f46; }
.ag-ev.done    { background: #d1fae5; color: #065f46; font-weight: 700; }

.ag-icon { font-size: 13px; flex-shrink: 0; }
.ag-text { flex: 1; }

/* Footer */
.wva-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.wva-caption {
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
