<script setup lang="ts">
import { ref, computed } from 'vue'
import type { SecurityScenario, SecurityRule } from './types'

const props = defineProps<{ scenarios: SecurityScenario[], rules: SecurityRule[] }>()

const currentIdx = ref(0)
const isRunning = ref(false)
const verdict = ref<'allow' | 'block' | null>(null)
const matchedRules = ref<string[]>([])
const showTrace = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

const scenario = computed<SecurityScenario>(() => props.scenarios[currentIdx.value])

function selectScenario(idx: number) {
  if (isRunning.value) return
  currentIdx.value = idx
  reset()
}

function runCheck() {
  if (isRunning.value) return
  reset()
  isRunning.value = true
  showTrace.value = true

  const s = scenario.value
  const triggered: string[] = []

  for (const rule of props.rules) {
    const hit = s.attackVector?.toLowerCase().includes(rule.id) ||
      s.input.toLowerCase().includes(rule.triggerKeyword ?? '')
    if (hit) triggered.push(rule.id)
  }

  timer = setTimeout(() => {
    matchedRules.value = triggered
    verdict.value = s.expectedVerdict
    isRunning.value = false
  }, 900)
}

function reset() {
  if (timer) { clearTimeout(timer); timer = null }
  isRunning.value = false
  verdict.value = null
  matchedRules.value = []
}

const verdictLabel = computed(() => {
  if (verdict.value === 'allow') return '允许'
  if (verdict.value === 'block') return '拦截'
  return '—'
})
</script>

<template>
  <div class="sbd-root">
    <div class="sbd-header">
      <div class="sbd-title-row">
        <span class="sbd-title">安全边界检查演示</span>
        <span class="sbd-badge">Ch31 · Security</span>
      </div>
      <div class="sbd-actions">
        <button class="sbd-btn-primary" :disabled="isRunning" @click="runCheck">
          {{ isRunning ? '检查中…' : '执行安全检查' }}
        </button>
        <button class="sbd-btn-ghost" @click="reset">重置</button>
      </div>
    </div>

    <!-- Scenario tabs -->
    <div class="sbd-tabs">
      <button
        v-for="(s, i) in scenarios"
        :key="s.meta.id"
        class="sbd-tab"
        :class="{ active: currentIdx === i, [s.meta.tone]: true }"
        @click="selectScenario(i)"
      >
        {{ s.meta.label }}
      </button>
    </div>

    <div class="sbd-body">
      <!-- Input -->
      <div class="sbd-panel">
        <div class="sbd-panel-header">用户输入</div>
        <div class="sbd-input-box">{{ scenario.input }}</div>
        <div v-if="scenario.attackVector" class="sbd-attack-label">
          攻击向量: <code>{{ scenario.attackVector }}</code>
        </div>
      </div>

      <!-- Rules -->
      <div class="sbd-panel">
        <div class="sbd-panel-header">安全规则层</div>
        <div class="sbd-rules">
          <div
            v-for="rule in rules"
            :key="rule.id"
            class="sbd-rule"
            :class="{
              triggered: matchedRules.includes(rule.id),
              scanning: isRunning,
            }"
          >
            <div class="sbd-rule-top">
              <span class="sbd-rule-name">{{ rule.name }}</span>
              <span class="sbd-rule-level" :class="rule.level">{{ rule.level }}</span>
            </div>
            <div class="sbd-rule-desc">{{ rule.description }}</div>
            <div v-if="matchedRules.includes(rule.id)" class="sbd-rule-hit">规则命中</div>
          </div>
        </div>
      </div>

      <!-- Verdict -->
      <div class="sbd-panel">
        <div class="sbd-panel-header">判决结果</div>
        <div v-if="verdict" class="sbd-verdict" :class="verdict">
          <div class="sbd-verdict-icon">
            <svg v-if="verdict === 'allow'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </div>
          <div class="sbd-verdict-content">
            <div class="sbd-verdict-label">{{ verdictLabel }}</div>
            <div class="sbd-verdict-reason">{{ scenario.reason }}</div>
          </div>
        </div>
        <div v-else class="sbd-empty">等待检查执行…</div>

        <div v-if="verdict && matchedRules.length > 0" class="sbd-matched-rules">
          <div class="sbd-mr-header">命中规则</div>
          <div v-for="rid in matchedRules" :key="rid" class="sbd-mr-tag">{{ rid }}</div>
        </div>

        <div v-if="scenario.recommendation && verdict" class="sbd-recommendation">
          {{ scenario.recommendation }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sbd-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.sbd-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.sbd-title-row { display: flex; align-items: center; gap: 0.625rem; }
.sbd-title { font-size: 1rem; font-weight: 600; color: var(--vp-c-text-1); }
.sbd-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: 500; }
.sbd-actions { display: flex; gap: 0.5rem; }
.sbd-btn-primary { background: var(--vp-c-brand-1); color: #fff; border: none; padding: 0.375rem 0.875rem; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; }
.sbd-btn-primary:disabled { opacity: 0.6; cursor: default; }
.sbd-btn-ghost { background: transparent; border: 1px solid var(--vp-c-divider); padding: 0.375rem 0.875rem; border-radius: 6px; font-size: 0.875rem; cursor: pointer; color: var(--vp-c-text-1); }

.sbd-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.sbd-tab { padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8125rem; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; transition: all 0.2s; }
.sbd-tab.active.negative { background: #ef4444; color: #fff; border-color: #ef4444; }
.sbd-tab.active.positive { background: #10b981; color: #fff; border-color: #10b981; }
.sbd-tab.active.neutral { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }

.sbd-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

.sbd-panel {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.sbd-panel-header { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-text-3); padding-bottom: 0.3rem; border-bottom: 1px solid var(--vp-c-divider); }

.sbd-input-box { font-size: 0.8125rem; color: var(--vp-c-text-1); line-height: 1.6; padding: 0.5rem; background: var(--vp-c-bg-soft); border-radius: 4px; font-family: var(--vp-font-family-mono); }
.sbd-attack-label { font-size: 0.6875rem; color: var(--vp-c-text-3); }
.sbd-attack-label code { font-size: 0.6875rem; background: rgba(239, 68, 68, 0.08); color: #ef4444; padding: 1px 4px; border-radius: 3px; }

.sbd-rules { display: flex; flex-direction: column; gap: 0.5rem; }
.sbd-rule {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.5rem 0.625rem;
  transition: all 0.3s;
}
.sbd-rule.scanning { animation: scan-pulse 0.8s ease-in-out infinite alternate; }
.sbd-rule.triggered { border-color: #ef4444; background: rgba(239, 68, 68, 0.04); }

@keyframes scan-pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.sbd-rule-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
.sbd-rule-name { font-size: 0.8125rem; font-weight: 600; color: var(--vp-c-text-1); }
.sbd-rule-level { font-size: 0.625rem; padding: 1px 5px; border-radius: 4px; font-weight: 700; }
.sbd-rule-level.critical { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.sbd-rule-level.high { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.sbd-rule-level.medium { background: rgba(13, 148, 136, 0.1); color: var(--vp-c-brand-1); }
.sbd-rule-desc { font-size: 0.75rem; color: var(--vp-c-text-2); }
.sbd-rule-hit { font-size: 0.625rem; font-weight: 700; color: #ef4444; margin-top: 0.2rem; }

.sbd-empty { font-size: 0.75rem; color: var(--vp-c-text-3); text-align: center; padding: 1rem 0; }

.sbd-verdict {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid;
}
.sbd-verdict.allow { background: rgba(16, 185, 129, 0.06); border-color: #10b981; }
.sbd-verdict.block { background: rgba(239, 68, 68, 0.06); border-color: #ef4444; }

.sbd-verdict-icon { width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px; }
.sbd-verdict.allow .sbd-verdict-icon { color: #10b981; }
.sbd-verdict.block .sbd-verdict-icon { color: #ef4444; }

.sbd-verdict-label { font-size: 1rem; font-weight: 700; color: var(--vp-c-text-1); }
.sbd-verdict-reason { font-size: 0.75rem; color: var(--vp-c-text-2); margin-top: 0.2rem; line-height: 1.5; }

.sbd-matched-rules { display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center; }
.sbd-mr-header { font-size: 0.6875rem; color: var(--vp-c-text-3); }
.sbd-mr-tag { font-size: 0.6875rem; padding: 1px 6px; background: rgba(239, 68, 68, 0.08); color: #ef4444; border-radius: 4px; font-weight: 600; font-family: var(--vp-font-family-mono); }

.sbd-recommendation { font-size: 0.75rem; color: var(--vp-c-text-2); line-height: 1.6; padding: 0.5rem 0.75rem; border-left: 3px solid var(--vp-c-brand-1); background: var(--vp-c-bg-soft); border-radius: 0 4px 4px 0; }

@media (max-width: 768px) {
  .sbd-body { grid-template-columns: 1fr; }
}
</style>
