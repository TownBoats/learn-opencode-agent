<script setup lang="ts">
import type { RunCommandProps } from './types'
import { ref } from 'vue'

const props = withDefaults(defineProps<RunCommandProps>(), {
  hint: '',
  verified: false,
})

const copied = ref(false)

function getHintText() {
  if (props.hint) return props.hint
  if (props.verified) return '当前仓库已提供对应文件，完成前置准备后可直接执行。'
  return '推荐入口命令。若仓库内尚无对应示例文件，请先按正文创建文件并完成前置准备。'
}

function copy() {
  if (typeof navigator === 'undefined') return
  navigator.clipboard.writeText(props.command).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 1800)
  }).catch(() => {
    // clipboard API unavailable or permission denied — silently ignore
  })
}
</script>

<template>
  <div class="run-command">
    <div class="command-row">
      <span class="prompt">$</span>
      <code class="command-text">{{ command }}</code>
      <button class="copy-btn" @click="copy">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <p class="command-hint">{{ getHintText() }}</p>
  </div>
</template>

<style scoped>
.run-command {
  background: #1c1917;
  border: 1px solid #292524;
  border-radius: 8px;
  padding: 12px 16px;
  margin: 20px 0;
  font-family: monospace;
}

.command-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prompt {
  color: #f97316;
  font-size: 14px;
  user-select: none;
}

.command-text {
  flex: 1;
  color: #f5f5f4;
  font-size: 14px;
  background: transparent;
  padding: 0;
  border-radius: 0;
}

.copy-btn {
  background: #292524;
  color: #a8a29e;
  border: 1px solid #44403c;
  border-radius: 5px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
}

.copy-btn:hover {
  color: #f97316;
  border-color: #f97316;
}

.command-hint {
  margin: 10px 0 0;
  color: #a8a29e;
  font-size: 12px;
  line-height: 1.5;
  font-family: inherit;
}
</style>
