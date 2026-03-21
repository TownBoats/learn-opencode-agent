<template>
  <div class="p-studio">
    <div class="p-toolbar">
      <div class="p-template-select">
        <label>选择模板</label>
        <select v-model="selectedTemplateId" @change="loadTemplate">
          <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>
      <div class="p-actions">
        <button class="p-btn" @click="copyPrompt">
          <span v-if="copied">已复制!</span>
          <span v-else>复制 Prompt</span>
        </button>
        <button class="p-btn" @click="exportJson">导出 JSON</button>
      </div>
    </div>

    <div class="p-main">
      <div class="p-editor">
        <div 
          v-for="section in editableSections" 
          :key="section.id"
          class="p-section-item"
          :class="{ active: activeSectionId === section.id }"
          @click="activeSectionId = section.id"
        >
          <div class="p-section-header">
            <div class="p-section-meta">
              <input 
                type="checkbox" 
                v-model="section.enabled" 
                :disabled="section.required"
                @change="onInput"
              />
              <span class="p-section-label">{{ section.label }}</span>
              <span v-if="section.required" class="p-tag-req">必填</span>
            </div>
            <span class="p-section-tokens" :class="{ over: isOverLimit(section) }">
              {{ estimateTokens(section.content) }} / {{ section.maxTokens }}
            </span>
          </div>
          <div v-if="section.enabled" class="p-section-body">
            <p class="p-section-desc">{{ section.description }}</p>
            <textarea
              v-model="section.content"
              class="p-textarea"
              placeholder="请输入内容..."
              @input="onInput"
            ></textarea>
          </div>
        </div>
      </div>

      <div class="p-sidebar">
        <div class="p-card preview-card">
          <div class="p-card-header">预览 (实时组装)</div>
          <div class="p-preview-content">
            <div 
              v-for="section in assembledSections" 
              :key="section.id"
              class="p-preview-section"
              :class="{ highlighted: activeSectionId === section.id }"
            >
              <div class="p-preview-label">## {{ section.label }}</div>
              <pre>{{ section.content || ' (空) ' }}</pre>
            </div>
          </div>
          <div class="p-budget-bar">
            <div class="p-budget-info">
              <span>Token 预算 (估算)</span>
              <span>{{ totalTokens }} / {{ maxBudget }}</span>
            </div>
            <div class="p-meter-bg">
              <div 
                class="p-meter-fill" 
                :class="budgetStatus"
                :style="{ width: `${Math.min(100, (totalTokens / maxBudget) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <PromptLintPanel 
          :issues="lintIssues" 
          @select-section="id => activeSectionId = id"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { PromptDesignStudioProps, PromptSection, PromptLintIssue } from './types'
import PromptLintPanel from './PromptLintPanel.vue'

const props = defineProps<PromptDesignStudioProps>()

interface EditableSection extends PromptSection { enabled: boolean }
interface DraftSection { id: string; content: string; enabled: boolean }

const selectedTemplateId = ref(props.initialTemplateId || props.templates[0]?.id)
const editableSections = ref<EditableSection[]>([])
const activeSectionId = ref('')
const copied = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const maxBudget = 2000

function loadTemplate() {
  const t = props.templates.find(x => x.id === selectedTemplateId.value)
  if (!t) return
  
  editableSections.value = t.sections.map(s => ({
    ...s,
    enabled: s.required || s.content.length > 0
  }))
  if (editableSections.value.length > 0) {
    activeSectionId.value = editableSections.value[0].id
  }
}

function estimateTokens(text: string) {
  return text ? Math.ceil(text.length / 2.5) : 0
}

const isOverLimit = (section: EditableSection) => {
  return estimateTokens(section.content) > section.maxTokens
}

const assembledSections = computed(() => {
  return editableSections.value.filter(s => s.enabled)
})

const totalTokens = computed(() => {
  return assembledSections.value.reduce((acc, s) => acc + estimateTokens(s.content), 0)
})

const budgetStatus = computed(() => {
  const ratio = totalTokens.value / maxBudget
  if (ratio > 1) return 'danger'
  if (ratio > 0.8) return 'warning'
  return 'brand'
})

const lintIssues = computed(() => {
  const issues: PromptLintIssue[] = []
  
  editableSections.value.forEach(s => {
    if (s.required && s.enabled && !s.content.trim()) {
      issues.push({
        id: `err-req-${s.id}`,
        severity: 'error',
        sectionId: s.id,
        message: `缺少必填内容: ${s.label}`,
        suggestion: `该章节对模型稳定性至关重要，請填充具體指令。`
      })
    }
    if (s.enabled && isOverLimit(s)) {
      issues.push({
        id: `warn-limit-${s.id}`,
        severity: 'warning',
        sectionId: s.id,
        message: `${s.label} 超出 Token 限制`,
        suggestion: `建議精簡描述，當前估算 ${estimateTokens(s.content)} tokens，上限 ${s.maxTokens}。`
      })
    }
  })

  const hasSafety = editableSections.value.some(s => s.enabled && s.label.includes('安全'))
  if (!hasSafety) {
    issues.push({
      id: 'warn-safety',
      severity: 'warning',
      sectionId: '',
      message: '缺少安全約束章節',
      suggestion: '建議添加安全邊界（如禁止洩露系統提示詞）以增強防禦。'
    })
  }

  const hasFormat = editableSections.value.some(s => s.enabled && (s.label.includes('格式') || s.label.includes('輸出')))
  if (!hasFormat) {
    issues.push({
      id: 'info-format',
      severity: 'info',
      sectionId: '',
      message: '建議添加輸出格式要求',
      suggestion: '明確指定 JSON 或 Markdown 格式可以顯著提高工具調用成功率。'
    })
  }

  return issues
})

function onInput() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    saveDraft()
  }, 300)
}

function saveDraft() {
  const data = {
    templateId: selectedTemplateId.value,
    sections: editableSections.value.map(s => ({ id: s.id, content: s.content, enabled: s.enabled }))
  }
  localStorage.setItem('prompt-studio-draft', JSON.stringify(data))
}

function loadDraft() {
  const saved = localStorage.getItem('prompt-studio-draft')
  if (!saved) {
    loadTemplate()
    return
  }
  try {
    const data = JSON.parse(saved)
    selectedTemplateId.value = data.templateId
    const template = props.templates.find(t => t.id === data.templateId)
    if (!template) {
      loadTemplate()
      return
    }
    editableSections.value = template.sections.map(s => {
      const draft = data.sections.find((ds: DraftSection) => ds.id === s.id)
      return {
        ...s,
        content: draft ? draft.content : s.content,
        enabled: draft ? draft.enabled : (s.required || s.content.length > 0)
      }
    })
    activeSectionId.value = editableSections.value[0]?.id || ''
  } catch (e) {
    loadTemplate()
  }
}

function copyPrompt() {
  const text = assembledSections.value
    .map(s => `## ${s.label}\n${s.content}`)
    .join('\n\n')
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function exportJson() {
  const data = {
    name: "Custom Prompt",
    sections: assembledSections.value.map(s => ({ id: s.id, label: s.label, content: s.content }))
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'prompt-design.json'
  a.click()
}

onMounted(() => {
  loadDraft()
})
</script>

<style scoped>
.p-studio {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 24px 0;
  height: 700px;
}

.p-toolbar {
  padding: 12px 20px;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.p-template-select { display: flex; align-items: center; gap: 12px; }
.p-template-select label { font-size: 13px; font-weight: 600; color: var(--vp-c-text-2); }
.p-template-select select {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--vp-c-text-1);
}
.p-actions { display: flex; gap: 8px; }
.p-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s;
  color: var(--vp-c-text-1);
  cursor: pointer;
}
.p-btn:hover { border-color: var(--vp-c-brand-1); color: var(--vp-c-brand-1); }

.p-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.p-editor {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-right: 1px solid var(--vp-c-divider);
}

.p-section-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
  cursor: pointer;
  background: var(--vp-c-bg-soft);
}

.p-section-item.active {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-bg);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.p-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.p-section-meta { display: flex; align-items: center; gap: 8px; }
.p-section-label { font-size: 14px; font-weight: 600; color: var(--vp-c-text-1); }
.p-tag-req { font-size: 10px; padding: 1px 6px; background: var(--vp-c-danger-soft); color: var(--vp-c-danger-1); border-radius: 4px; }
.p-section-tokens { font-size: 11px; font-family: var(--vp-font-family-mono); color: var(--vp-c-text-3); }
.p-section-tokens.over { color: var(--vp-c-danger-1); }
.p-section-desc { font-size: 12px; color: var(--vp-c-text-2); margin-bottom: 10px; line-height: 1.5; }

.p-textarea {
  width: 100%;
  height: 120px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  padding: 12px;
  font-size: 13px;
  font-family: var(--vp-font-family-mono);
  resize: vertical;
  color: var(--vp-c-text-1);
}

.p-textarea:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.p-sidebar {
  width: 340px;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  overflow-y: auto;
}

.p-card { background: var(--vp-c-bg); border: 1px solid var(--vp-c-divider); border-radius: 8px; display: flex; flex-direction: column; }
.p-card-header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-text-3);
  border-bottom: 1px solid var(--vp-c-divider);
  letter-spacing: 0.05em;
}
.preview-card { flex: 1; overflow: hidden; }
.p-preview-content { flex: 1; overflow-y: auto; padding: 16px; font-size: 12px; font-family: var(--vp-font-family-mono); }
.p-preview-section { margin-bottom: 20px; padding: 8px; border-radius: 6px; transition: background 0.2s; }
.p-preview-section.highlighted { background: var(--vp-c-brand-soft); outline: 1px solid var(--vp-c-brand-1); }
.p-preview-label { color: var(--vp-c-brand-1); font-weight: 700; margin-bottom: 6px; font-size: 11px; }
.p-preview-section pre { margin: 0; white-space: pre-wrap; color: var(--vp-c-text-1); line-height: 1.6; }
.p-budget-bar { padding: 16px; border-top: 1px solid var(--vp-c-divider); background: var(--vp-c-bg-soft); }
.p-budget-info { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 8px; color: var(--vp-c-text-2); }
.p-meter-bg { height: 8px; background: var(--vp-c-divider); border-radius: 4px; overflow: hidden; }
.p-meter-fill { height: 100%; transition: width 0.3s ease, background-color 0.3s; }
.p-meter-fill.brand { background: var(--vp-c-brand-1); }
.p-meter-fill.warning { background: var(--vp-c-warning-1); }
.p-meter-fill.danger { background: var(--vp-c-danger-1); }

@media (max-width: 960px) {
  .p-studio { height: auto; max-height: none; }
  .p-main { flex-direction: column; }
  .p-sidebar { width: 100%; border-top: 1px solid var(--vp-c-divider); border-left: none; }
  .p-editor { border-right: none; }
}
</style>
