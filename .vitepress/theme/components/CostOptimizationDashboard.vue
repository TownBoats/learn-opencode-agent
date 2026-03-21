<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CostScenario, CostBreakdownItem } from './types'

const props = defineProps<{ scenarios: CostScenario[] }>()

const currentIdx = ref(0)
const showOptimized = ref(false)

const scenario = computed<CostScenario>(() => props.scenarios[currentIdx.value])

const baseline = computed<CostBreakdownItem[]>(() => scenario.value.baseline)
const optimized = computed<CostBreakdownItem[]>(() => scenario.value.optimized)

const activeItems = computed(() => showOptimized.value ? optimized.value : baseline.value)

const totalCost = computed(() => activeItems.value.reduce((s, i) => s + i.costUsd, 0))
const totalTokens = computed(() => activeItems.value.reduce((s, i) => s + i.tokens, 0))

const baselineCost = computed(() => baseline.value.reduce((s, i) => s + i.costUsd, 0))
const optimizedCost = computed(() => optimized.value.reduce((s, i) => s + i.costUsd, 0))
const savings = computed(() => baselineCost.value - optimizedCost.value)
const savingsPct = computed(() => baselineCost.value > 0 ? Math.round((savings.value / baselineCost.value) * 100) : 0)

const maxCost = computed(() => Math.max(...baseline.value.map(i => i.costUsd), ...optimized.value.map(i => i.costUsd), 0.001))

function barWidth(item: CostBreakdownItem) {
  return `${Math.round((item.costUsd / maxCost.value) * 100)}%`
}

function categoryColor(category: string) {
  const map: Record<string, string> = {
    input: '#0d9488',
    output: '#3b82f6',
    cache: '#10b981',
    tool: '#f59e0b',
    embed: '#8b5cf6',
  }
  return map[category] ?? '#6b7280'
}

function formatCost(v: number) {
  return v < 0.01 ? `$${(v * 1000).toFixed(2)}m` : `$${v.toFixed(4)}`
}
function formatTokens(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
}
</script>

<template>
  <div class="cod-root">
    <div class="cod-header">
      <div class="cod-title-row">
        <span class="cod-title">成本优化仪表盘</span>
        <span class="cod-badge">Ch32 · Cost</span>
      </div>
      <div class="cod-toggle">
        <button class="cod-toggle-btn" :class="{ active: !showOptimized }" @click="showOptimized = false">基线</button>
        <button class="cod-toggle-btn" :class="{ active: showOptimized }" @click="showOptimized = true">优化后</button>
      </div>
    </div>

    <!-- Scenario selector -->
    <div class="cod-scenarios">
      <button
        v-for="(s, i) in scenarios"
        :key="s.meta.id"
        class="cod-scenario-btn"
        :class="{ active: currentIdx === i }"
        @click="currentIdx = i; showOptimized = false"
      >
        {{ s.meta.label }}
      </button>
    </div>

    <!-- Summary cards -->
    <div class="cod-summary">
      <div class="cod-card">
        <div class="cod-card-label">总成本</div>
        <div class="cod-card-value" :class="showOptimized ? 'green' : ''">{{ formatCost(totalCost) }}</div>
        <div class="cod-card-sub">本次请求</div>
      </div>
      <div class="cod-card">
        <div class="cod-card-label">总 Token</div>
        <div class="cod-card-value">{{ formatTokens(totalTokens) }}</div>
        <div class="cod-card-sub">输入 + 输出</div>
      </div>
      <div class="cod-card highlight" v-if="showOptimized">
        <div class="cod-card-label">节省</div>
        <div class="cod-card-value green">{{ formatCost(savings) }}</div>
        <div class="cod-card-sub">-{{ savingsPct }}%</div>
      </div>
      <div class="cod-card" v-else>
        <div class="cod-card-label">可节省</div>
        <div class="cod-card-value hint">{{ formatCost(savings) }}</div>
        <div class="cod-card-sub">-{{ savingsPct }}%</div>
      </div>
    </div>

    <!-- Cost breakdown bars -->
    <div class="cod-breakdown">
      <div class="cod-breakdown-header">消耗明细</div>
      <div class="cod-bars">
        <div v-for="item in activeItems" :key="item.label" class="cod-bar-row">
          <div class="cod-bar-label">{{ item.label }}</div>
          <div class="cod-bar-track">
            <div
              class="cod-bar-fill"
              :style="{ width: barWidth(item), background: categoryColor(item.category) }"
            ></div>
          </div>
          <div class="cod-bar-cost">{{ formatCost(item.costUsd) }}</div>
          <div class="cod-bar-tokens">{{ formatTokens(item.tokens) }} tok</div>
        </div>
      </div>
    </div>

    <!-- Optimization tips -->
    <div v-if="scenario.tips?.length" class="cod-tips">
      <div class="cod-tips-header">优化建议</div>
      <div v-for="tip in scenario.tips" :key="tip.id" class="cod-tip-item">
        <div class="cod-tip-top">
          <span class="cod-tip-title">{{ tip.title }}</span>
          <span class="cod-tip-saving">节省 {{ tip.estimatedSaving }}</span>
        </div>
        <div class="cod-tip-desc">{{ tip.description }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cod-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.cod-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.cod-title-row { display: flex; align-items: center; gap: 0.625rem; }
.cod-title { font-size: 1rem; font-weight: 600; color: var(--vp-c-text-1); }
.cod-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 10px; background: rgba(245, 158, 11, 0.1); color: #f59e0b; font-weight: 500; }

.cod-toggle { display: flex; background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 6px; overflow: hidden; }
.cod-toggle-btn { padding: 0.3rem 0.875rem; font-size: 0.8125rem; border: none; background: transparent; cursor: pointer; color: var(--vp-c-text-2); transition: all 0.2s; }
.cod-toggle-btn.active { background: var(--vp-c-brand-1); color: #fff; }

.cod-scenarios { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.cod-scenario-btn { padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8125rem; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; transition: all 0.2s; }
.cod-scenario-btn.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }

.cod-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
.cod-card { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 0.875rem; display: flex; flex-direction: column; gap: 0.2rem; }
.cod-card.highlight { border-color: #10b981; background: rgba(16, 185, 129, 0.04); }
.cod-card-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-3); }
.cod-card-value { font-size: 1.25rem; font-weight: 700; color: var(--vp-c-text-1); font-family: var(--vp-font-family-mono); }
.cod-card-value.green { color: #10b981; }
.cod-card-value.hint { color: var(--vp-c-text-3); }
.cod-card-sub { font-size: 0.6875rem; color: var(--vp-c-text-3); }

.cod-breakdown { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 8px; padding: 0.875rem; }
.cod-breakdown-header { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-3); margin-bottom: 0.75rem; padding-bottom: 0.375rem; border-bottom: 1px solid var(--vp-c-divider); }

.cod-bars { display: flex; flex-direction: column; gap: 0.625rem; }
.cod-bar-row { display: grid; grid-template-columns: 100px 1fr 60px 50px; align-items: center; gap: 0.5rem; }
.cod-bar-label { font-size: 0.75rem; color: var(--vp-c-text-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cod-bar-track { height: 8px; background: var(--vp-c-divider); border-radius: 4px; overflow: hidden; }
.cod-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.cod-bar-cost { font-size: 0.75rem; font-weight: 600; color: var(--vp-c-text-1); font-family: var(--vp-font-family-mono); text-align: right; }
.cod-bar-tokens { font-size: 0.6875rem; color: var(--vp-c-text-3); text-align: right; }

.cod-tips { display: flex; flex-direction: column; gap: 0.5rem; }
.cod-tips-header { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-3); }
.cod-tip-item { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-left: 3px solid var(--vp-c-brand-1); border-radius: 0 6px 6px 0; padding: 0.625rem 0.75rem; }
.cod-tip-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
.cod-tip-title { font-size: 0.8125rem; font-weight: 600; color: var(--vp-c-text-1); }
.cod-tip-saving { font-size: 0.75rem; font-weight: 600; color: #10b981; font-family: var(--vp-font-family-mono); }
.cod-tip-desc { font-size: 0.75rem; color: var(--vp-c-text-2); line-height: 1.6; }

@media (max-width: 768px) {
  .cod-summary { grid-template-columns: repeat(2, 1fr); }
  .cod-bar-row { grid-template-columns: 80px 1fr 50px; }
  .cod-bar-tokens { display: none; }
}
</style>
