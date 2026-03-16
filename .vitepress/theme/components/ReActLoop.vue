<template>
  <div class="react-loop">
    <div class="loop-title">ReAct 执行循环</div>
    <div class="loop-track">
      <div
        v-for="(step, i) in steps"
        :key="i"
        class="step"
        :class="{ active: currentStep === i, done: isDone(i) }"
      >
        <div class="step-icon">{{ step.icon }}</div>
        <div class="step-label">{{ step.label }}</div>
        <div class="step-desc">{{ step.desc }}</div>
      </div>
    </div>
    <div class="loop-log">
      <div
        v-for="(line, i) in logLines"
        :key="i"
        class="log-line"
        :class="line.type"
      >
        <span class="log-prefix">{{ line.prefix }}</span>
        <span class="log-text">{{ line.text }}</span>
      </div>
    </div>
    <div class="loop-controls">
      <button class="btn" @click="restart">重新播放</button>
      <span class="loop-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

interface Step {
  icon: string
  label: string
  desc: string
}

interface LogLine {
  type: 'think' | 'act' | 'observe' | 'done'
  prefix: string
  text: string
}

const steps: Step[] = [
  { icon: '🧠', label: 'Think', desc: '分析任务，决策下一步' },
  { icon: '⚡', label: 'Act', desc: '调用工具执行操作' },
  { icon: '👁', label: 'Observe', desc: '查看工具执行结果' },
]

const scenario: LogLine[] = [
  { type: 'think',   prefix: '[思考]', text: '用户想分析代码质量，先看项目结构' },
  { type: 'act',     prefix: '[行动]', text: 'glob("src/**/*.ts")' },
  { type: 'observe', prefix: '[观察]', text: '发现 32 个 TypeScript 文件' },
  { type: 'think',   prefix: '[思考]', text: '需要搜索 any 类型使用情况' },
  { type: 'act',     prefix: '[行动]', text: 'grep("any", "src/")' },
  { type: 'observe', prefix: '[观察]', text: '发现 15 处使用了 any 类型' },
  { type: 'think',   prefix: '[思考]', text: '信息足够，可以生成分析报告' },
  { type: 'done',    prefix: '[完成]', text: '输出代码质量报告，任务结束' },
]

const currentStep = ref(-1)
const logLines = ref<LogLine[]>([])
const finished = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (finished.value) return '任务完成'
  if (currentStep.value < 0) return '准备开始...'
  return `执行中（第 ${Math.ceil((currentStep.value + 1) / 3)} 轮）`
})

function isDone(i: number): boolean {
  return finished.value || currentStep.value > i
}

function getStepIndex(logIndex: number): number {
  const type = scenario[logIndex].type
  if (type === 'think') return 0
  if (type === 'act') return 1
  if (type === 'observe') return 2
  return 2
}

function runStep(index: number) {
  if (index >= scenario.length) {
    finished.value = true
    currentStep.value = -1
    return
  }
  const line = scenario[index]
  currentStep.value = getStepIndex(index)
  logLines.value.push(line)

  const delay = line.type === 'think' ? 1200 : line.type === 'act' ? 900 : 700
  timer = setTimeout(() => runStep(index + 1), delay)
}

function restart() {
  if (timer) clearTimeout(timer)
  currentStep.value = -1
  logLines.value = []
  finished.value = false
  timer = setTimeout(() => runStep(0), 400)
}

onMounted(() => {
  timer = setTimeout(() => runStep(0), 600)
})

onUnmounted(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.react-loop {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}

.loop-title {
  font-family: var(--vp-font-family-base);
  font-weight: 600;
  font-size: 14px;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
  text-align: center;
}

.loop-track {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  justify-content: center;
}

.step {
  flex: 1;
  max-width: 160px;
  padding: 12px 8px;
  border-radius: 8px;
  border: 2px solid var(--vp-c-divider);
  text-align: center;
  transition: all 0.3s ease;
  background: var(--vp-c-bg);
}

.step.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.step.done {
  border-color: var(--vp-c-green-1);
  background: var(--vp-c-green-soft);
  opacity: 0.7;
}

.step-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.step-label {
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-size: 13px;
}

.step-desc {
  color: var(--vp-c-text-2);
  font-size: 11px;
  margin-top: 4px;
  font-family: var(--vp-font-family-base);
}

.loop-log {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 12px;
  min-height: 120px;
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.log-line {
  display: flex;
  gap: 8px;
  padding: 3px 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-4px); }
  to   { opacity: 1; transform: translateX(0); }
}

.log-prefix {
  font-weight: 700;
  min-width: 60px;
}

.log-line.think .log-prefix  { color: #a78bfa; }
.log-line.act .log-prefix    { color: #38bdf8; }
.log-line.observe .log-prefix{ color: #34d399; }
.log-line.done .log-prefix   { color: #f59e0b; }

.log-text {
  color: var(--vp-c-text-1);
}

.loop-controls {
  display: flex;
  align-items: center;
  gap: 12px;
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

.loop-status {
  color: var(--vp-c-text-2);
  font-size: 12px;
}
</style>
