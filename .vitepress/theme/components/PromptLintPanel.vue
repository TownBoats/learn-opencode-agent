<template>
  <div class="p-lint-panel">
    <div class="p-lint-header">
      <span class="p-lint-title">Prompt 诊断</span>
      <span class="p-lint-count" :class="`count-${maxSeverity}`" v-if="issues.length">
        {{ issues.length }} 个问题
      </span>
    </div>
    <div v-if="issues.length === 0" class="p-lint-empty">
      ✅ 未发现严重问题，Prompt 结构良好
    </div>
    <div v-else class="p-lint-list">
      <div 
        v-for="issue in sortedIssues" 
        :key="issue.id" 
        class="p-lint-item"
        :class="`severity-${issue.severity}`"
        @click="$emit('select-section', issue.sectionId)"
      >
        <div class="p-lint-icon">
          <!-- Error Icon -->
          <svg v-if="issue.severity === 'error'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <!-- Warning Icon -->
          <svg v-else-if="issue.severity === 'warning'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <!-- Info Icon -->
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </div>
        <div class="p-lint-content">
          <div class="p-lint-msg">{{ issue.message }}</div>
          <div class="p-lint-suggest">{{ issue.suggestion }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PromptLintIssue, PromptLintSeverity } from './types'

const props = defineProps<{
  issues: PromptLintIssue[]
}>()

defineEmits<{
  (e: 'select-section', id: string): void
}>()

const severityOrder: Record<PromptLintSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2
}

const sortedIssues = computed(() => {
  return [...props.issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
})

const maxSeverity = computed(() => {
  if (props.issues.some(i => i.severity === 'error')) return 'error'
  if (props.issues.some(i => i.severity === 'warning')) return 'warning'
  return 'info'
})
</script>

<style scoped>
.p-lint-panel {
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
}

.p-lint-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.p-lint-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.p-lint-count {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.count-error { background: color-mix(in srgb, var(--vp-c-danger-1) 15%, transparent); color: var(--vp-c-danger-1); }
.count-warning { background: color-mix(in srgb, var(--vp-c-warning-1) 15%, transparent); color: var(--vp-c-warning-1); }
.count-info { background: color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent); color: var(--vp-c-brand-1); }

.p-lint-empty {
  font-size: 13px;
  color: var(--vp-c-text-2);
  text-align: center;
  padding: 12px 0;
}

.p-lint-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.p-lint-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.p-lint-item:hover {
  transform: translateX(4px);
}

.severity-error { border-left-color: var(--vp-c-danger-1); }
.severity-warning { border-left-color: var(--vp-c-warning-1); }
.severity-info { border-left-color: var(--vp-c-brand-1); }

.p-lint-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.severity-error .p-lint-icon { color: var(--vp-c-danger-1); }
.severity-warning .p-lint-icon { color: var(--vp-c-warning-1); }
.severity-info .p-lint-icon { color: var(--vp-c-brand-1); }

.p-lint-content { flex: 1; }

.p-lint-msg {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin-bottom: 2px;
}

.p-lint-suggest {
  font-size: 11px;
  color: var(--vp-c-text-2);
  line-height: 1.4;
}
</style>
