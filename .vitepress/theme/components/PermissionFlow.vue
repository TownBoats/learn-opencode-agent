<template>
  <div class="pf-root">
    <div class="pf-header">权限决策流程（permission/next.ts）</div>

    <div class="pf-body">
      <!-- 左：流程步骤 -->
      <div class="pf-steps">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="pf-step"
          :class="{ active: phase >= step.phase, current: phase === step.phase }"
        >
          <div class="step-dot" :class="stepDotClass(step.phase)" />
          <div class="step-text">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-desc" v-if="phase >= step.phase">{{ step.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 右：规则匹配 + 确认框 -->
      <div class="pf-panel">
        <!-- 规则列表 -->
        <div v-if="phase >= 2 && phase < 5" class="rules-panel">
          <div class="rules-title">当前规则列表（按优先级）</div>
          <div
            v-for="(rule, i) in rules"
            :key="i"
            class="rule-row"
            :class="{
              checking: ruleCheckIndex === i,
              matched: matchedRuleIndex === i,
              skipped: ruleCheckIndex > i && matchedRuleIndex !== i
            }"
          >
            <span class="rule-perm">{{ rule.permission }}</span>
            <span class="rule-pattern">{{ rule.pattern }}</span>
            <span class="rule-action" :class="rule.action">{{ rule.action }}</span>
            <span v-if="ruleCheckIndex === i" class="rule-checking-icon">...</span>
            <span v-if="matchedRuleIndex === i" class="rule-match-icon">← 匹配</span>
          </div>
        </div>

        <!-- ask 确认框 -->
        <div v-if="phase === 4" class="ask-box">
          <div class="ask-title">权限请求</div>
          <div class="ask-cmd">
            <span class="ask-label">命令</span>
            <code class="ask-code">bash("rm -rf build/")</code>
          </div>
          <div class="ask-desc">此操作将永久删除 build/ 目录，无法撤销。</div>
          <div class="ask-actions">
            <button class="ask-btn allow" @click="decide('allow')">允许</button>
            <button class="ask-btn always" @click="decide('always')">始终允许</button>
            <button class="ask-btn deny" @click="decide('deny')">拒绝</button>
          </div>
        </div>

        <!-- 结果 -->
        <div v-if="phase >= 5" class="result-box" :class="decision">
          <div class="result-icon">{{ resultIcon }}</div>
          <div class="result-title">{{ resultTitle }}</div>
          <div class="result-desc">{{ resultDesc }}</div>
        </div>
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

interface Step { phase: number; title: string; desc: string }
interface Rule { permission: string; pattern: string; action: 'allow' | 'deny' | 'ask' }

const steps: Step[] = [
  { phase: 1, title: 'LLM 发起工具调用', desc: 'bash({ command: "rm -rf build/" })' },
  { phase: 2, title: '检查权限规则列表', desc: '遍历合并后的规则集（配置文件 + Agent 默认）' },
  { phase: 3, title: '匹配到 bash → ask', desc: '第一条匹配规则，action = "ask"' },
  { phase: 4, title: '暂停执行，等待确认', desc: '发布权限请求事件，UI 弹出确认框' },
  { phase: 5, title: '执行结果', desc: '' },
]

const rules: Rule[] = [
  { permission: 'read',    pattern: '**/*',        action: 'allow' },
  { permission: 'edit',    pattern: 'src/**',      action: 'allow' },
  { permission: 'edit',    pattern: '*.lock',      action: 'deny'  },
  { permission: 'execute', pattern: 'bash',        action: 'ask'   },
]

const phase = ref(0)
const ruleCheckIndex = ref(-1)
const matchedRuleIndex = ref(-1)
const decision = ref<'allow' | 'always' | 'deny' | ''>('')
let timer: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (phase.value === 0) return '等待开始...'
  if (phase.value === 4) return '等待用户确认...'
  if (phase.value >= 5) {
    if (decision.value === 'allow') return '工具执行完毕'
    if (decision.value === 'always') return '已添加规则，工具执行完毕'
    if (decision.value === 'deny')  return '工具调用被拒绝，错误消息返回 LLM'
  }
  return `阶段 ${phase.value}`
})

const resultIcon = computed(() => {
  if (decision.value === 'deny') return '✗'
  return '✓'
})

const resultTitle = computed(() => {
  if (decision.value === 'allow')  return '工具执行：bash("rm -rf build/")'
  if (decision.value === 'always') return '已添加规则 + 工具执行'
  if (decision.value === 'deny')   return '权限拒绝，返回 LLM'
  return ''
})

const resultDesc = computed(() => {
  if (decision.value === 'allow')  return '删除成功（build/ 目录已清空），结果作为 tool_result 返回'
  if (decision.value === 'always') return '新增规则：execute/bash → allow，后续调用不再询问'
  if (decision.value === 'deny')   return 'tool_result: "Permission denied for bash"，LLM 将尝试其他方案'
  return ''
})

function stepDotClass(p: number) {
  if (phase.value > p) return 'done'
  if (phase.value === p) return 'active'
  return ''
}

function delay(ms: number) {
  return new Promise<void>(resolve => { timer = setTimeout(resolve, ms) })
}

async function runFlow() {
  await delay(500)
  phase.value = 1
  await delay(900)
  phase.value = 2
  ruleCheckIndex.value = 0

  for (let i = 0; i < rules.length; i++) {
    await delay(600)
    ruleCheckIndex.value = i
    // bash rule is at index 3 — it matches
    if (rules[i].permission === 'execute') {
      await delay(400)
      matchedRuleIndex.value = i
      phase.value = 3
      await delay(700)
      phase.value = 4  // wait for user
      return
    }
  }
}

function decide(action: 'allow' | 'always' | 'deny') {
  decision.value = action
  phase.value = 5
}

function restart() {
  if (timer) clearTimeout(timer)
  phase.value = 0
  ruleCheckIndex.value = -1
  matchedRuleIndex.value = -1
  decision.value = ''
  timer = setTimeout(() => runFlow(), 300)
}

onMounted(() => { timer = setTimeout(() => runFlow(), 700) })
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

/* Steps */
.pf-steps {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.pf-step {
  display: flex;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  opacity: 0.4;
  transition: opacity 0.3s;
  position: relative;
}

.pf-step::before {
  content: '';
  position: absolute;
  left: 12px;
  top: 28px;
  bottom: -8px;
  width: 2px;
  background: var(--vp-c-divider);
}
.pf-step:last-child::before { display: none; }

.pf-step.active  { opacity: 1; }
.pf-step.current { background: var(--vp-c-brand-soft); }

.step-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid var(--vp-c-divider);
  flex-shrink: 0;
  margin-top: 3px;
  background: var(--vp-c-bg);
  transition: all 0.3s;
}
.step-dot.active { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-1); }
.step-dot.done   { border-color: #10b981; background: #10b981; }

.step-title {
  font-weight: 600;
  font-size: 12px;
  color: var(--vp-c-text-1);
  line-height: 1.4;
}
.step-desc {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-top: 2px;
  font-family: var(--vp-font-family-mono);
  line-height: 1.4;
}

/* Panel */
.pf-panel {
  flex: 1;
  min-height: 200px;
}

.rules-panel {
  background: #111;
  border-radius: 8px;
  padding: 12px;
}

.rules-title {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 8px;
  font-family: var(--vp-font-family-base);
}

.rule-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  margin-bottom: 4px;
  color: #9ca3af;
  transition: all 0.3s;
}

.rule-row.checking {
  background: #1e3a5f;
  color: #e2e8f0;
}
.rule-row.matched {
  background: #1a3a2a;
  color: #6ee7b7;
  font-weight: 600;
}
.rule-row.skipped { opacity: 0.4; }

.rule-perm    { color: #93c5fd; min-width: 56px; }
.rule-pattern { color: #fcd34d; flex: 1; }
.rule-action.allow { color: #6ee7b7; }
.rule-action.deny  { color: #f87171; }
.rule-action.ask   { color: #fbbf24; }
.rule-checking-icon { color: #60a5fa; font-size: 14px; }
.rule-match-icon    { color: #34d399; font-size: 11px; font-weight: 700; }

/* Ask box */
.ask-box {
  background: #111;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  padding: 14px 16px;
  animation: askIn 0.3s ease;
}

@keyframes askIn {
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
}

.ask-title {
  font-weight: 700;
  font-size: 13px;
  color: #fbbf24;
  margin-bottom: 10px;
}

.ask-cmd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ask-label {
  font-size: 10px;
  background: #3a2a10;
  color: #fcd34d;
  padding: 2px 6px;
  border-radius: 4px;
}

.ask-code {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: #e2e8f0;
  background: #1a1a1a;
  padding: 2px 8px;
  border-radius: 4px;
}

.ask-desc {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 12px;
  font-family: var(--vp-font-family-base);
}

.ask-actions {
  display: flex;
  gap: 8px;
}

.ask-btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: opacity 0.2s;
}
.ask-btn:hover { opacity: 0.85; }
.ask-btn.allow  { background: #10b981; color: white; }
.ask-btn.always { background: #3b82f6; color: white; }
.ask-btn.deny   { background: #ef4444; color: white; }

/* Result */
.result-box {
  border-radius: 8px;
  padding: 16px;
  animation: resultIn 0.35s ease;
}

@keyframes resultIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.result-box.allow, .result-box.always {
  background: #0f2a1a;
  border: 1px solid #10b981;
}
.result-box.deny {
  background: #2a0f0f;
  border: 1px solid #ef4444;
}

.result-icon {
  font-size: 24px;
  margin-bottom: 6px;
  font-weight: 700;
}
.result-box.allow .result-icon,
.result-box.always .result-icon { color: #10b981; }
.result-box.deny .result-icon  { color: #ef4444; }

.result-title {
  font-size: 13px;
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
  margin-bottom: 6px;
  color: #e2e8f0;
}

.result-desc {
  font-size: 12px;
  color: #9ca3af;
  font-family: var(--vp-font-family-base);
  line-height: 1.5;
}

/* Footer */
.pf-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
