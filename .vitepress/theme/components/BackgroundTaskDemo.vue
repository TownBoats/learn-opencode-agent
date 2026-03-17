<template>
  <div class="bt-root">
    <div class="bt-header">Background Agent 并行执行</div>
    <div class="bt-body">
      <!-- 主对话 -->
      <div class="bt-main">
        <div class="bt-lane-title">主对话（持续运行）</div>
        <div class="bt-chat">
          <div
            v-for="(msg, i) in chatMessages"
            :key="i"
            class="bt-msg"
            :class="msg.role"
          >
            <span class="bt-msg-role">{{ msg.role === 'user' ? '用户' : 'Sisyphus' }}</span>
            <span class="bt-msg-text">{{ msg.text }}</span>
          </div>
        </div>
      </div>

      <!-- 分隔 -->
      <div class="bt-divider">
        <div class="bt-divider-line"></div>
        <div class="bt-divider-label">并行</div>
        <div class="bt-divider-line"></div>
      </div>

      <!-- 后台任务 -->
      <div class="bt-tasks">
        <div class="bt-lane-title">后台任务（OpenCode 子会话）</div>
        <div class="bt-task-grid">
          <div
            v-for="(task, i) in tasks"
            :key="i"
            class="bt-task"
            :class="task.status"
          >
            <div class="bt-task-header">
              <span class="bt-task-agent">{{ task.agent }}</span>
              <span class="bt-task-badge" :class="task.status">{{ statusLabel(task.status) }}</span>
            </div>
            <div class="bt-task-desc">{{ task.desc }}</div>
            <div class="bt-task-bar" v-if="task.status === 'running'">
              <div class="bt-task-progress"></div>
            </div>
            <div class="bt-task-result" v-if="task.result">{{ task.result }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bt-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="bt-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

type TaskStatus = 'pending' | 'running' | 'completed' | 'error'

interface Task {
  agent: string
  desc: string
  status: TaskStatus
  result: string
}

interface ChatMsg {
  role: 'user' | 'agent'
  text: string
}

const chatMessages = ref<ChatMsg[]>([])
const tasks = ref<Task[]>([])
let timer: ReturnType<typeof setTimeout> | null = null
const phase = ref(0)

const statusText = computed(() => {
  if (phase.value === 0) return '等待开始...'
  if (phase.value < 3) return 'Sisyphus 分解任务，后台并行启动中...'
  if (phase.value < 6) return '主对话继续，后台 Agent 同步执行中...'
  return '后台任务完成，结果已通知主会话'
})

function statusLabel(s: TaskStatus) {
  if (s === 'pending') return '待运行'
  if (s === 'running') return '运行中'
  if (s === 'completed') return '已完成'
  return '出错'
}

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  phase.value = 1

  // Step1: user message
  await delay(600)
  chatMessages.value = [{ role: 'user', text: '实现登录页面和登录 API，要同时做' }]

  // Step2: Sisyphus responds and creates tasks
  await delay(900)
  chatMessages.value = [...chatMessages.value, { role: 'agent', text: '好，我拆成前后端并行执行' }]

  tasks.value = [
    { agent: 'Hephaestus', desc: '实现 Express 登录 API', status: 'pending', result: '' },
    { agent: 'Hephaestus', desc: '构建登录页面 UI', status: 'pending', result: '' },
    { agent: 'Explore', desc: '检查现有认证代码', status: 'pending', result: '' },
  ]

  phase.value = 2
  await delay(700)

  // Step3: tasks start running
  tasks.value[0].status = 'running'
  await delay(300)
  tasks.value[1].status = 'running'
  await delay(300)
  tasks.value[2].status = 'running'
  phase.value = 3

  // Step4: main chat continues
  await delay(800)
  chatMessages.value = [...chatMessages.value, { role: 'user', text: '顺便把单元测试也加上' }]
  await delay(700)
  chatMessages.value = [...chatMessages.value, { role: 'agent', text: '好，测试任务加入队列' }]

  phase.value = 4

  // Step5: explore finishes first
  await delay(1000)
  tasks.value[2].status = 'completed'
  tasks.value[2].result = '发现 /src/auth/token.ts，已传递给后续任务'

  // Step6: API task finishes
  await delay(1200)
  tasks.value[0].status = 'completed'
  tasks.value[0].result = 'POST /api/login 实现完成，含 JWT 签发'

  phase.value = 5

  // Step7: UI task finishes
  await delay(900)
  tasks.value[1].status = 'completed'
  tasks.value[1].result = 'LoginPage.tsx 完成，已对接 /api/login'

  // Step8: notify main
  await delay(600)
  chatMessages.value = [...chatMessages.value, { role: 'agent', text: '后台任务全部完成，登录功能已就绪' }]

  phase.value = 6
}

function restart() {
  if (timer) clearTimeout(timer)
  chatMessages.value = []
  tasks.value = []
  phase.value = 0
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.bt-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.bt-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.bt-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bt-lane-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin-bottom: 8px;
}

/* Main chat */
.bt-chat {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 10px;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bt-msg {
  display: flex;
  gap: 8px;
  align-items: baseline;
  animation: msgIn 0.3s ease;
}

@keyframes msgIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.bt-msg-role {
  font-size: 10px;
  font-weight: 700;
  min-width: 52px;
  flex-shrink: 0;
}

.bt-msg.user .bt-msg-role { color: #60a5fa; }
.bt-msg.agent .bt-msg-role { color: #a78bfa; }

.bt-msg-text {
  font-size: 12px;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}

/* Divider */
.bt-divider {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bt-divider-line {
  flex: 1;
  height: 1px;
  background: var(--vp-c-divider);
  border-top: 1px dashed var(--vp-c-divider);
}

.bt-divider-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Task grid */
.bt-task-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.bt-task {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all 0.3s;
}

.bt-task.running {
  border-color: #f59e0b;
  background: #1c1200;
}

.bt-task.completed {
  border-color: #10b981;
  background: #052e16;
}

.bt-task.error {
  border-color: #ef4444;
  background: #2d0a0a;
}

.bt-task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.bt-task-agent {
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}

.bt-task.completed .bt-task-agent { color: #34d399; }
.bt-task.running .bt-task-agent   { color: #fbbf24; }

.bt-task-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
}

.bt-task-badge.pending   { background: #1e293b; color: #64748b; }
.bt-task-badge.running   { background: #1c1200; color: #fbbf24; }
.bt-task-badge.completed { background: #052e16; color: #34d399; }
.bt-task-badge.error     { background: #2d0a0a; color: #f87171; }

.bt-task-desc {
  font-size: 11px;
  color: var(--vp-c-text-2);
  margin-bottom: 6px;
  line-height: 1.4;
}

.bt-task-bar {
  height: 3px;
  background: #1c1200;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.bt-task-progress {
  height: 100%;
  background: #f59e0b;
  border-radius: 2px;
  animation: progress 2s linear infinite;
}

@keyframes progress {
  from { width: 0%; margin-left: 0; }
  50%  { width: 60%; }
  to   { width: 0%; margin-left: 100%; }
}

.bt-task-result {
  font-size: 10px;
  color: #6ee7b7;
  font-family: var(--vp-font-family-mono);
  line-height: 1.4;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Footer */
.bt-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.bt-status {
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
