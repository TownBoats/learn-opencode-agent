<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { RagScenario, RagAccuracyDemoProps, RagChunk } from './types'

const props = withDefaults(defineProps<RagAccuracyDemoProps>(), {
  autoPlay: false,
})

const currentScenarioIdx = ref(0)
const isRunning = ref(false)
const step = ref<'idle' | 'retrieving' | 'ranking' | 'generating' | 'done'>('idle')
const visibleChunks = ref<RagChunk[]>([])
const finalAnswer = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

const scenario = computed<RagScenario>(() => props.scenarios[currentScenarioIdx.value])

watch(currentScenarioIdx, () => {
  reset()
})

function selectScenario(idx: number) {
  if (isRunning.value) return
  currentScenarioIdx.value = idx
}

async function runDemo() {
  if (isRunning.value) return
  reset()
  isRunning.value = true

  step.value = 'retrieving'
  await delay(800)

  step.value = 'ranking'
  const sorted = [...scenario.value.chunks].sort((a, b) => b.score - a.score)
  for (const chunk of sorted) {
    visibleChunks.value.push(chunk)
    await delay(200)
  }

  step.value = 'generating'
  await delay(600)

  step.value = 'done'
  finalAnswer.value = scenario.value.expectedAnswer
  isRunning.value = false
}

function reset() {
  if (timer) { clearTimeout(timer); timer = null }
  isRunning.value = false
  step.value = 'idle'
  visibleChunks.value = []
  finalAnswer.value = ''
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => { timer = setTimeout(resolve, ms) })
}

function scoreColor(score: number) {
  if (score >= 0.8) return 'score-high'
  if (score >= 0.5) return 'score-mid'
  return 'score-low'
}

const precision = computed(() => {
  if (visibleChunks.value.length === 0) return 0
  const relevant = visibleChunks.value.filter(c => c.isRelevant).length
  return Math.round((relevant / visibleChunks.value.length) * 100)
})

const recall = computed(() => {
  const totalRelevant = scenario.value.chunks.filter(c => c.isRelevant).length
  if (totalRelevant === 0) return 0
  const retrieved = visibleChunks.value.filter(c => c.isRelevant).length
  return Math.round((retrieved / totalRelevant) * 100)
})

const stepLabel: Record<typeof step.value, string> = {
  idle: '就绪',
  retrieving: '检索中…',
  ranking: '排序中…',
  generating: '生成中…',
  done: '完成',
}
</script>

<template>
  <div class="rag-root">
    <div class="rag-header">
      <div class="rag-title-row">
        <span class="rag-indicator" :class="{ running: isRunning }"></span>
        <span class="rag-title">RAG 检索准确性演示</span>
        <span class="rag-badge">Ch25 · RAG</span>
      </div>
      <div class="rag-actions">
        <button class="rag-btn-primary" :disabled="isRunning" @click="runDemo">
          {{ isRunning ? stepLabel[step] : '运行检索' }}
        </button>
        <button class="rag-btn-ghost" @click="reset">重置</button>
      </div>
    </div>

    <!-- Scenario selector -->
    <div class="rag-scenarios">
      <button
        v-for="(s, i) in scenarios"
        :key="s.meta.id"
        class="rag-scenario-btn"
        :class="{ active: currentScenarioIdx === i }"
        @click="selectScenario(i)"
      >
        {{ s.meta.label }}
      </button>
    </div>

    <!-- Query -->
    <div class="rag-query-box">
      <span class="rag-query-label">查询</span>
      <span class="rag-query-text">{{ scenario.query }}</span>
    </div>

    <div class="rag-body">
      <!-- Retrieved chunks -->
      <div class="rag-col">
        <div class="rag-col-header">
          召回文档
          <span v-if="step !== 'idle'" class="rag-count-tag">{{ visibleChunks.length }} / {{ scenario.chunks.length }}</span>
        </div>
        <div class="rag-chunk-list">
          <div
            v-for="chunk in visibleChunks"
            :key="chunk.id"
            class="rag-chunk"
            :class="{ relevant: chunk.isRelevant, irrelevant: !chunk.isRelevant }"
          >
            <div class="rag-chunk-top">
              <span class="rag-chunk-src">{{ chunk.source }}</span>
              <span class="rag-score-badge" :class="scoreColor(chunk.score)">
                {{ (chunk.score * 100).toFixed(0) }}%
              </span>
            </div>
            <div class="rag-chunk-text">{{ chunk.text }}</div>
            <div class="rag-chunk-relevant-tag" v-if="step === 'done'">
              {{ chunk.isRelevant ? '相关' : '噪声' }}
            </div>
          </div>
          <div v-if="visibleChunks.length === 0" class="rag-empty">
            {{ step === 'idle' ? '点击「运行检索」开始' : '检索中…' }}
          </div>
        </div>
      </div>

      <!-- Metrics + Answer -->
      <div class="rag-col">
        <div class="rag-col-header">评估指标</div>
        <div class="rag-metrics">
          <div class="rag-metric-item">
            <span class="rag-metric-label">准确率 (Precision)</span>
            <div class="rag-meter-bg">
              <div class="rag-meter-fill" :style="{ width: `${precision}%` }" :class="precision >= 70 ? 'good' : 'bad'"></div>
            </div>
            <span class="rag-metric-val">{{ precision }}%</span>
          </div>
          <div class="rag-metric-item">
            <span class="rag-metric-label">召回率 (Recall)</span>
            <div class="rag-meter-bg">
              <div class="rag-meter-fill" :style="{ width: `${recall}%` }" :class="recall >= 70 ? 'good' : 'bad'"></div>
            </div>
            <span class="rag-metric-val">{{ recall }}%</span>
          </div>
        </div>

        <div class="rag-col-header" style="margin-top: 1rem">生成答案</div>
        <div class="rag-answer-box">
          <div v-if="finalAnswer" class="rag-answer-text">{{ finalAnswer }}</div>
          <div v-else class="rag-empty">等待检索完成…</div>
        </div>

        <div v-if="step === 'done'" class="rag-eval-note">
          <span class="rag-eval-tag" :class="scenario.meta.tone">{{ scenario.meta.label }}</span>
          {{ scenario.evaluation }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rag-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rag-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
.rag-title-row { display: flex; align-items: center; gap: 0.625rem; }
.rag-indicator { width: 8px; height: 8px; border-radius: 50%; background: var(--vp-c-text-3); transition: background 0.3s; flex-shrink: 0; }
.rag-indicator.running { background: var(--vp-c-brand-1); box-shadow: 0 0 8px var(--vp-c-brand-1); }
.rag-title { font-size: 1rem; font-weight: 600; color: var(--vp-c-text-1); }
.rag-badge { font-size: 0.6875rem; padding: 2px 8px; border-radius: 10px; background: rgba(13, 148, 136, 0.1); color: var(--vp-c-brand-1); font-weight: 500; }
.rag-actions { display: flex; gap: 0.5rem; }

.rag-btn-primary {
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  padding: 0.375rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}
.rag-btn-primary:disabled { opacity: 0.6; cursor: default; }
.rag-btn-ghost { background: transparent; border: 1px solid var(--vp-c-divider); padding: 0.375rem 0.875rem; border-radius: 6px; font-size: 0.875rem; cursor: pointer; color: var(--vp-c-text-1); }

.rag-scenarios { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.rag-scenario-btn { padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.8125rem; border: 1px solid var(--vp-c-divider); background: var(--vp-c-bg); color: var(--vp-c-text-2); cursor: pointer; transition: all 0.2s; }
.rag-scenario-btn.active { background: var(--vp-c-brand-1); color: #fff; border-color: var(--vp-c-brand-1); }

.rag-query-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.rag-query-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--vp-c-brand-1); flex-shrink: 0; padding-top: 1px; }
.rag-query-text { font-size: 0.875rem; color: var(--vp-c-text-1); line-height: 1.6; }

.rag-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.rag-col { display: flex; flex-direction: column; gap: 0.5rem; }

.rag-col-header {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.rag-count-tag { font-size: 0.6875rem; padding: 1px 6px; border-radius: 10px; background: rgba(13, 148, 136, 0.1); color: var(--vp-c-brand-1); font-weight: 600; }

.rag-chunk-list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 280px; overflow-y: auto; }

.rag-chunk {
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 0.625rem 0.75rem;
  background: var(--vp-c-bg);
  position: relative;
  transition: border-color 0.2s;
}
.rag-chunk.relevant { border-left: 3px solid #10b981; }
.rag-chunk.irrelevant { border-left: 3px solid #ef4444; opacity: 0.7; }

.rag-chunk-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
.rag-chunk-src { font-size: 0.6875rem; color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); }
.rag-score-badge { font-size: 0.625rem; padding: 1px 5px; border-radius: 4px; font-weight: 700; }
.score-high { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.score-mid { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.score-low { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.rag-chunk-text { font-size: 0.8125rem; color: var(--vp-c-text-2); line-height: 1.5; }
.rag-chunk-relevant-tag { font-size: 0.625rem; margin-top: 0.3rem; color: var(--vp-c-text-3); }

.rag-empty { font-size: 0.75rem; color: var(--vp-c-text-3); text-align: center; padding: 1rem 0; }

.rag-metrics { display: flex; flex-direction: column; gap: 0.75rem; }
.rag-metric-item { display: flex; flex-direction: column; gap: 0.25rem; }
.rag-metric-label { font-size: 0.75rem; color: var(--vp-c-text-2); }
.rag-meter-bg { height: 6px; background: var(--vp-c-divider); border-radius: 3px; overflow: hidden; }
.rag-meter-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
.rag-meter-fill.good { background: #10b981; }
.rag-meter-fill.bad { background: #ef4444; }
.rag-metric-val { font-size: 0.75rem; font-weight: 700; color: var(--vp-c-text-1); font-family: var(--vp-font-family-mono); }

.rag-answer-box { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 6px; padding: 0.75rem; min-height: 80px; }
.rag-answer-text { font-size: 0.8125rem; color: var(--vp-c-text-1); line-height: 1.7; }

.rag-eval-note {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  padding: 0.5rem 0.75rem;
  background: var(--vp-c-bg);
  border-radius: 6px;
  border-left: 3px solid var(--vp-c-brand-1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.rag-eval-tag {
  font-size: 0.625rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
  align-self: flex-start;
}
.rag-eval-tag.positive { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.rag-eval-tag.negative { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.rag-eval-tag.neutral { background: rgba(13, 148, 136, 0.1); color: var(--vp-c-brand-1); }

@media (max-width: 768px) {
  .rag-body { grid-template-columns: 1fr; }
}
</style>
