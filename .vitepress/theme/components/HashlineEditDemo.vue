<template>
  <div class="he-root">
    <div class="he-header">传统 edit vs hashline-edit 对比</div>
    <div class="he-body">
      <!-- 左：传统 edit -->
      <div class="he-panel" :class="{ 'panel-fail': leftFailed }">
        <div class="he-panel-title" :class="{ fail: leftFailed }">
          传统 edit（字符串匹配）
        </div>
        <div class="he-file">
          <div
            v-for="(line, i) in leftLines"
            :key="i"
            class="he-line"
            :class="{ highlight: leftHighlight === i, fail: leftFailed && leftHighlight === i }"
          >
            <span class="he-lnum">{{ i + 1 }}</span>
            <span class="he-code">{{ line }}</span>
          </div>
        </div>
        <div class="he-op" v-if="leftOp">
          <div class="he-op-label">AI 编辑请求</div>
          <div class="he-op-code">
            <div>old: <span class="he-old">"{{ leftOp.old }}"</span></div>
            <div>new: <span class="he-new">"{{ leftOp.new }}"</span></div>
          </div>
        </div>
        <div class="he-result fail" v-if="leftFailed">
          匹配失败：文件已被修改，old_string 找不到
        </div>
      </div>

      <!-- 右：hashline-edit -->
      <div class="he-panel" :class="{ 'panel-ok': rightOk }">
        <div class="he-panel-title" :class="{ ok: rightOk }">
          hashline-edit（LINE#ID 锚点）
        </div>
        <div class="he-file">
          <div
            v-for="(line, i) in rightLines"
            :key="i"
            class="he-line"
            :class="{
              highlight: rightHighlight === i,
              ok: rightOk && rightHighlight === i
            }"
          >
            <span class="he-hash">{{ line.hash }}</span>
            <span class="he-code">{{ line.code }}</span>
          </div>
        </div>
        <div class="he-op" v-if="rightOp">
          <div class="he-op-label">AI 编辑请求</div>
          <div class="he-op-code">
            <div>pos: <span class="he-hash-ref">"{{ rightOp.pos }}"</span></div>
            <div>lines: <span class="he-new">"{{ rightOp.lines }}"</span></div>
          </div>
        </div>
        <div class="he-result ok" v-if="rightOk">
          LINE#ID 命中，哈希验证通过，写入成功
        </div>
      </div>
    </div>

    <div class="he-footer">
      <button class="btn" @click="restart">重新播放</button>
      <span class="he-status">{{ statusText }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const leftLines = ref([
  'function hello() {',
  '  return "world"',
  '}',
])

const rightLinesBase = [
  { hash: '11#VK|', code: 'function hello() {' },
  { hash: '22#XJ|', code: '  return "world"' },
  { hash: '33#MB|', code: '}' },
]

const rightLines = ref([...rightLinesBase])
const leftHighlight = ref<number | null>(null)
const rightHighlight = ref<number | null>(null)
const leftOp = ref<{ old: string; new: string } | null>(null)
const rightOp = ref<{ pos: string; lines: string } | null>(null)
const leftFailed = ref(false)
const rightOk = ref(false)
const phase = ref(0)
let timer: ReturnType<typeof setTimeout> | null = null

const statusText = computed(() => {
  if (phase.value === 0) return '等待开始...'
  if (phase.value === 1) return 'AI 读取文件，同时文件被另一个操作修改...'
  if (phase.value === 2) return '传统 edit 尝试匹配 old_string...'
  if (phase.value === 3) return '左侧匹配失败；hashline-edit 通过 LINE#ID 精准定位...'
  return '对比完成：LINE#ID 不受文件变动影响'
})

function delay(ms: number) {
  return new Promise<void>(r => { timer = setTimeout(r, ms) })
}

async function run() {
  phase.value = 1

  // Simulate: file gets modified (line inserted at top)
  await delay(800)
  leftLines.value = ['// 新插入的注释行', ...leftLines.value]

  await delay(600)

  // AI sends edit request based on old content
  leftOp.value = { old: 'function hello() {', new: 'function hello(name: string) {' }
  rightOp.value = { pos: '22#XJ', lines: '  return `Hello, ${name}!`' }
  phase.value = 2

  // Left: scan for old_string
  await delay(600)
  leftHighlight.value = 0  // points to the comment line (wrong)

  await delay(700)
  leftHighlight.value = 1  // finds original function line

  await delay(500)

  // Left fails: old_string was "function hello() {" but context changed
  leftFailed.value = true
  leftHighlight.value = 1
  phase.value = 3

  // Right: use LINE#ID
  await delay(400)
  rightHighlight.value = 1  // 22#XJ always points to line 2

  await delay(800)
  rightOk.value = true
  rightLines.value = [
    { hash: '11#VK|', code: 'function hello() {' },
    { hash: '22#XJ|', code: '  return `Hello, ${name}!`' },
    { hash: '33#MB|', code: '}' },
  ]

  phase.value = 4
}

function restart() {
  if (timer) clearTimeout(timer)
  leftLines.value = ['function hello() {', '  return "world"', '}']
  rightLines.value = [...rightLinesBase]
  leftHighlight.value = null
  rightHighlight.value = null
  leftOp.value = null
  rightOp.value = null
  leftFailed.value = false
  rightOk.value = false
  phase.value = 0
  timer = setTimeout(() => run(), 300)
}

onMounted(() => { timer = setTimeout(() => run(), 700) })
onUnmounted(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.he-root {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
  background: var(--vp-c-bg-soft);
  font-size: 13px;
}

.he-header {
  font-weight: 600;
  font-size: 14px;
  text-align: center;
  color: var(--vp-c-text-1);
  margin-bottom: 16px;
}

.he-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.he-panel {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  background: var(--vp-c-bg);
  transition: border-color 0.3s;
}

.he-panel.panel-fail { border-color: #ef4444; }
.he-panel.panel-ok   { border-color: #10b981; }

.he-panel-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.he-panel-title.fail { color: #ef4444; }
.he-panel-title.ok   { color: #10b981; }

.he-file {
  background: #0d1117;
  border-radius: 4px;
  padding: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  margin-bottom: 10px;
}

.he-line {
  display: flex;
  gap: 8px;
  padding: 2px 4px;
  border-radius: 3px;
  animation: lineIn 0.3s ease;
  transition: background 0.3s;
}

@keyframes lineIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.he-line.highlight { background: #1e293b; }
.he-line.fail      { background: #3b0a0a; }
.he-line.ok        { background: #052e16; }

.he-lnum {
  color: #4b5563;
  min-width: 16px;
  text-align: right;
  user-select: none;
}

.he-hash {
  color: #6366f1;
  min-width: 60px;
  user-select: none;
  font-size: 10px;
}

.he-line.ok .he-hash { color: #34d399; }

.he-code { color: #e5e7eb; }

.he-line.fail .he-code { color: #f87171; }
.he-line.ok .he-code   { color: #6ee7b7; }

.he-op {
  background: #0d1117;
  border-radius: 4px;
  padding: 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  margin-bottom: 8px;
}

.he-op-label {
  color: #6b7280;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.he-op-code { color: #9ca3af; line-height: 1.8; }

.he-old  { color: #f87171; }
.he-new  { color: #34d399; }
.he-hash-ref { color: #a78bfa; }

.he-result {
  font-size: 11px;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  animation: fadeIn 0.4s ease;
}

.he-result.fail { background: #3b0a0a; color: #f87171; }
.he-result.ok   { background: #052e16; color: #34d399; }

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Footer */
.he-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.he-status {
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
