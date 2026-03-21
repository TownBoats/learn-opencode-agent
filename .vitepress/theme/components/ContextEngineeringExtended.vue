<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContextCandidate, ContextEngineeringExtendedProps } from './types'

const props = defineProps<ContextEngineeringExtendedProps>()

const selectedIds = ref<Set<string>>(new Set())
const filterType = ref<string>('all')
const sortBy = ref<'relevance' | 'recency' | 'tokens'>('relevance')

const typeOptions = computed(() => {
  const types = new Set(props.candidates.map(c => c.type))
  return ['all', ...types]
})

const filteredCandidates = computed(() => {
  let list = props.candidates
  if (filterType.value !== 'all') {
    list = list.filter(c => c.type === filterType.value)
  }
  return [...list].sort((a, b) => {
    if (sortBy.value === 'relevance') return b.relevanceScore - a.relevanceScore
    if (sortBy.value === 'recency') return b.recencyScore - a.recencyScore
    return a.tokens - b.tokens
  })
})

function toggleSelect(id: string) {
  const s = new Set(selectedIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedIds.value = s
}

const selectedItems = computed(() =>
  props.candidates.filter(c => selectedIds.value.has(c.id))
)

const totalSelectedTokens = computed(() =>
  selectedItems.value.reduce((s, c) => s + c.tokens, 0)
)

const budgetUsed = computed(() =>
  props.tokenBudget ? Math.min(1, totalSelectedTokens.value / props.tokenBudget) : 0
)

const budgetClass = computed(() => {
  const r = budgetUsed.value
  if (r > 0.9) return 'danger'
  if (r > 0.7) return 'warning'
  return 'brand'
})

function relevanceBar(score: number) {
  return `${Math.round(score * 100)}%`
}

function typeColor(type: string) {
  const colors: Record<string, string> = {
    file: '#0d9488',
    memory: '#8b5cf6',
    tool_result: '#f59e0b',
    conversation: '#3b82f6',
    document: '#ec4899',
  }
  return colors[type] ?? '#6b7280'
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    file: '文件',
    memory: '记忆',
    tool_result: '工具结果',
    conversation: '对话',
    document: '文档',
  }
  return labels[type] ?? type
}
</script>

<template>
  <div class="cee-root">
    <div class="cee-header">
      <div class="cee-title-row">
        <span class="cee-title">上下文工程扩展演示</span>
        <span class="cee-badge">Ch28 · Context</span>
      </div>
      <div class="cee-budget" v-if="tokenBudget">
        <span class="cee-budget-label">Token 预算</span>
        <div class="cee-budget-track">
          <div class="cee-budget-fill" :class="budgetClass" :style="{ width: `${budgetUsed * 100}%` }"></div>
        </div>
        <span class="cee-budget-val">{{ totalSelectedTokens }} / {{ tokenBudget }}</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="cee-controls">
      <div class="cee-filter-tabs">
        <button
          v-for="t in typeOptions"
          :key="t"
          class="cee-filter-tab"
          :class="{ active: filterType === t }"
          @click="filterType = t"
        >
          {{ t === 'all' ? '全部' : typeLabel(t) }}
        </button>
      </div>
      <div class="cee-sort">
        <label class="cee-sort-label">排序:</label>
        <select v-model="sortBy" class="cee-sort-select">
          <option value="relevance">相关度</option>
          <option value="recency">最近</option>
          <option value="tokens">Token 少优先</option>
        </select>
      </div>
    </div>

    <div class="cee-body">
      <!-- Candidate list -->
      <div class="cee-list">
        <div
          v-for="item in filteredCandidates"
          :key="item.id"
          class="cee-item"
          :class="{ selected: selectedIds.has(item.id) }"
          @click="toggleSelect(item.id)"
        >
          <div class="cee-item-check">
            <div class="cee-checkbox" :class="{ checked: selectedIds.has(item.id) }">
              <svg v-if="selectedIds.has(item.id)" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="cee-item-body">
            <div class="cee-item-top">
              <span class="cee-item-label">{{ item.label }}</span>
              <span class="cee-type-tag" :style="{ background: `${typeColor(item.type)}18`, color: typeColor(item.type) }">
                {{ typeLabel(item.type) }}
              </span>
              <span class="cee-token-count">{{ item.tokens }} tok</span>
            </div>
            <div v-if="item.preview" class="cee-item-preview">{{ item.preview }}</div>
            <div class="cee-score-row">
              <span class="cee-score-label">相关度</span>
              <div class="cee-score-track">
                <div class="cee-score-fill" :style="{ width: relevanceBar(item.relevanceScore), background: typeColor(item.type) }"></div>
              </div>
              <span class="cee-score-val">{{ Math.round(item.relevanceScore * 100) }}%</span>
            </div>
          </div>
        </div>
        <div v-if="filteredCandidates.length === 0" class="cee-empty">无匹配项</div>
      </div>

      <!-- Selected summary -->
      <div class="cee-sidebar">
        <div class="cee-sidebar-header">已选上下文 ({{ selectedItems.length }})</div>
        <div v-if="selectedItems.length === 0" class="cee-empty">点击左侧条目选择</div>
        <div v-else class="cee-selected-list">
          <div v-for="item in selectedItems" :key="item.id" class="cee-selected-item">
            <span class="cee-selected-name">{{ item.label }}</span>
            <span class="cee-selected-tokens">{{ item.tokens }}</span>
          </div>
        </div>
        <div v-if="selectedItems.length > 0" class="cee-selected-total">
          <span>合计</span>
          <span class="cee-total-val">{{ totalSelectedTokens }} tokens</span>
        </div>
        <div v-if="tokenBudget && totalSelectedTokens > tokenBudget" class="cee-overflow-warn">
          超出预算 {{ totalSelectedTokens - tokenBudget }} tokens，建议移除低相关度项
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cee-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cee-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.cee-title-row { display: flex; align-items: center; gap: 0.625rem; }
.cee-title { font-size: 1rem; font-weight: 600; color: var(--vp-c-text-1); }
.cee-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 10px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-weight: 500; }

.cee-budget { display: flex; align-items: center; gap: 0.5rem; }
.cee-budget-label { font-size: 0.6875rem; color: var(--vp-c-text-3); white-space: nowrap; }
.cee-budget-track { width: 120px; height: 6px; background: var(--vp-c-divider); border-radius: 3px; overflow: hidden; }
.cee-budget-fill { height: 100%; border-radius: 3px; transition: width 0.4s ease; }
.cee-budget-fill.brand { background: var(--vp-c-brand-1); }
.cee-budget-fill.warning { background: #f59e0b; }
.cee-budget-fill.danger { background: #ef4444; }
.cee-budget-val { font-size: 0.75rem; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-2); white-space: nowrap; }

.cee-controls { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
.cee-filter-tabs { display: flex; gap: 0.375rem; flex-wrap: wrap; }
.cee-filter-tab { padding: 0.25rem 0.625rem; border-radius: 20px; font-size: 0.75rem; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; transition: all 0.2s; }
.cee-filter-tab.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }

.cee-sort { display: flex; align-items: center; gap: 0.375rem; }
.cee-sort-label { font-size: 0.75rem; color: var(--vp-c-text-3); }
.cee-sort-select { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); padding: 3px 8px; border-radius: 5px; font-size: 0.75rem; color: var(--vp-c-text-1); cursor: pointer; }

.cee-body { display: grid; grid-template-columns: 1fr 220px; gap: 0.75rem; }

.cee-list { display: flex; flex-direction: column; gap: 0.375rem; max-height: 360px; overflow-y: auto; }

.cee-item {
  display: flex;
  gap: 0.625rem;
  padding: 0.625rem 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cee-item.selected { border-color: var(--vp-c-brand-1); background: rgba(13, 148, 136, 0.03); }

.cee-item-check { padding-top: 2px; }
.cee-checkbox {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--vp-c-divider);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.cee-checkbox.checked { background: var(--vp-c-brand-1); border-color: var(--vp-c-brand-1); color: #fff; }
.cee-checkbox svg { width: 10px; height: 10px; }

.cee-item-body { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; min-width: 0; }
.cee-item-top { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
.cee-item-label { font-size: 0.8125rem; font-weight: 600; color: var(--vp-c-text-1); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cee-type-tag { font-size: 0.625rem; padding: 1px 5px; border-radius: 4px; font-weight: 600; flex-shrink: 0; }
.cee-token-count { font-size: 0.625rem; color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); flex-shrink: 0; }
.cee-item-preview { font-size: 0.75rem; color: var(--vp-c-text-2); line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cee-score-row { display: flex; align-items: center; gap: 0.375rem; }
.cee-score-label { font-size: 0.625rem; color: var(--vp-c-text-3); white-space: nowrap; }
.cee-score-track { flex: 1; height: 3px; background: var(--vp-c-divider); border-radius: 2px; overflow: hidden; }
.cee-score-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.cee-score-val { font-size: 0.625rem; color: var(--vp-c-text-2); font-family: var(--vp-font-family-mono); }

.cee-empty { font-size: 0.75rem; color: var(--vp-c-text-3); text-align: center; padding: 1rem 0; }

.cee-sidebar {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-self: start;
}
.cee-sidebar-header { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-3); padding-bottom: 0.375rem; border-bottom: 1px solid var(--vp-c-divider); }

.cee-selected-list { display: flex; flex-direction: column; gap: 0.3rem; }
.cee-selected-item { display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; padding: 0.2rem 0; }
.cee-selected-name { color: var(--vp-c-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px; }
.cee-selected-tokens { font-size: 0.6875rem; color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); flex-shrink: 0; }

.cee-selected-total { display: flex; justify-content: space-between; align-items: center; padding-top: 0.375rem; border-top: 1px solid var(--vp-c-divider); font-size: 0.75rem; color: var(--vp-c-text-2); }
.cee-total-val { font-weight: 700; color: var(--vp-c-text-1); font-family: var(--vp-font-family-mono); }

.cee-overflow-warn { font-size: 0.6875rem; color: #ef4444; line-height: 1.5; padding: 0.375rem 0.5rem; background: rgba(239, 68, 68, 0.06); border-radius: 4px; border: 1px solid rgba(239, 68, 68, 0.2); }

@media (max-width: 768px) {
  .cee-body { grid-template-columns: 1fr; }
  .cee-sidebar { order: -1; }
}
</style>
