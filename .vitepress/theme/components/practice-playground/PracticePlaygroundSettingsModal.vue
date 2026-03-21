<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import type { PracticePlaygroundConfig } from './practicePlaygroundTypes'

const props = defineProps<{
  open: boolean
  config: PracticePlaygroundConfig
}>()

const emit = defineEmits<{
  close: []
  save: [config: PracticePlaygroundConfig]
  clear: []
}>()

const draft = ref<PracticePlaygroundConfig>({ ...props.config, apiKey: '' })
const isApiKeyVisible = ref(false)
const hasStoredApiKey = ref(false)
const isReplacingApiKey = ref(true)
const previousFocusedElement = ref<HTMLElement | null>(null)
const modalCardRef = ref<HTMLElement | null>(null)
const closeButtonRef = ref<HTMLButtonElement | null>(null)
const apiKeyInputRef = ref<HTMLInputElement | null>(null)
const baseUrlInputRef = ref<HTMLInputElement | null>(null)
const modelInputRef = ref<HTMLInputElement | null>(null)
const dialogTitleId = 'practice-playground-settings-title'
const dialogDescId = 'practice-playground-settings-desc'
const securityTipId = 'practice-playground-settings-security-tip'
const saveStatusId = 'practice-playground-settings-save-status'
const apiKeyStatusId = 'practice-playground-settings-api-key-status'
const apiKeyOverwriteHintId = 'practice-playground-settings-api-key-overwrite-hint'
const apiKeyErrorId = 'practice-playground-settings-api-key-error'
const baseUrlErrorId = 'practice-playground-settings-base-url-error'
const modelErrorId = 'practice-playground-settings-model-error'

function syncDraftFromProps() {
  const storedApiKey = props.config.apiKey.trim()
  hasStoredApiKey.value = Boolean(storedApiKey)
  isReplacingApiKey.value = !hasStoredApiKey.value
  draft.value = {
    ...props.config,
    apiKey: '',
  }
  isApiKeyVisible.value = false
}

watch(
  () => props.config,
  () => {
    syncDraftFromProps()
  },
  { deep: true, immediate: true },
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      previousFocusedElement.value = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      syncDraftFromProps()
      document.body.style.overflow = 'hidden'
      void nextTick(() => {
        focusPreferredField()
      })
      return
    }

    document.body.style.overflow = ''
    previousFocusedElement.value?.focus()
    previousFocusedElement.value = null
  },
)

const maskedApiKeyLabel = computed(() => {
  if (isReplacingApiKey.value) {
    return draft.value.apiKey.trim() ? '待保存新值' : '未填写'
  }
  return hasStoredApiKey.value ? '已填写' : '未填写'
})
const normalizedCurrentConfig = computed(() => ({
  apiKey: props.config.apiKey.trim(),
  baseURL: props.config.baseURL.trim(),
  model: props.config.model.trim(),
}))
const normalizedDraftConfig = computed(() => ({
  apiKey: isReplacingApiKey.value ? draft.value.apiKey.trim() : normalizedCurrentConfig.value.apiKey,
  baseURL: draft.value.baseURL.trim(),
  model: draft.value.model.trim(),
}))
const apiKeyError = computed(() => (
  normalizedDraftConfig.value.apiKey ? '' : '请输入 API Key。'
))
const baseUrlError = computed(() => (
  normalizedDraftConfig.value.baseURL ? '' : '请输入接口地址。'
))
const modelError = computed(() => (
  normalizedDraftConfig.value.model ? '' : '请输入模型名称。'
))
const hasPendingChanges = computed(() => {
  return normalizedDraftConfig.value.apiKey !== normalizedCurrentConfig.value.apiKey
    || normalizedDraftConfig.value.baseURL !== normalizedCurrentConfig.value.baseURL
    || normalizedDraftConfig.value.model !== normalizedCurrentConfig.value.model
})
const saveDisabledReason = computed(() => {
  if (apiKeyError.value) return apiKeyError.value
  if (baseUrlError.value) return baseUrlError.value
  if (modelError.value) return modelError.value
  if (!hasPendingChanges.value) return '当前没有需要保存的变更。'
  return ''
})
const isSaveDisabled = computed(() => Boolean(saveDisabledReason.value))

function handleFieldChange(field: keyof PracticePlaygroundConfig, value: string) {
  draft.value = {
    ...draft.value,
    [field]: value,
  }
}

function handleStartReplacingApiKey() {
  isReplacingApiKey.value = true
  isApiKeyVisible.value = false
  draft.value = {
    ...draft.value,
    apiKey: '',
  }
  void nextTick(() => {
    apiKeyInputRef.value?.focus()
  })
}

function handleSave() {
  if (isSaveDisabled.value) return

  emit('save', {
    ...draft.value,
    ...normalizedDraftConfig.value,
  })
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    emit('close')
    return
  }

  if (event.key === 'Tab') {
    trapFocusInsideModal(event)
  }
}

function focusPreferredField() {
  if (apiKeyError.value) {
    apiKeyInputRef.value?.focus()
    return
  }

  if (baseUrlError.value) {
    baseUrlInputRef.value?.focus()
    return
  }

  if (modelError.value) {
    modelInputRef.value?.focus()
    return
  }

  if (isReplacingApiKey.value) {
    apiKeyInputRef.value?.focus()
    return
  }

  baseUrlInputRef.value?.focus()
  if (document.activeElement === baseUrlInputRef.value) return
  closeButtonRef.value?.focus()
}

function getFocusableElements(): HTMLElement[] {
  if (!modalCardRef.value) return []

  return Array.from(
    modalCardRef.value.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    if (element.getAttribute('aria-hidden') === 'true') return false
    if (element.tabIndex < 0) return false
    if ('offsetParent' in element && element.offsetParent === null && element !== document.activeElement) {
      return false
    }
    return true
  })
}

function trapFocusInsideModal(event: KeyboardEvent) {
  const focusableElements = getFocusableElements()
  if (focusableElements.length === 0) {
    event.preventDefault()
    closeButtonRef.value?.focus()
    return
  }

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement as HTMLElement | null

  if (!activeElement || !modalCardRef.value?.contains(activeElement)) {
    event.preventDefault()
    firstElement.focus()
    return
  }

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault()
    lastElement.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault()
    firstElement.focus()
  }
}

function buildAriaDescribedBy(ids: Array<string | false | null | undefined>): string | undefined {
  const resolved = ids.filter(Boolean).join(' ')
  return resolved || undefined
}

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-backdrop"
      @click.self="emit('close')"
    >
      <section
        ref="modalCardRef"
        class="modal-card"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="dialogTitleId"
        :aria-describedby="buildAriaDescribedBy([dialogDescId, securityTipId, saveStatusId])"
      >
        <header class="modal-header">
          <div>
            <h2 :id="dialogTitleId">在线运行设置</h2>
            <p :id="dialogDescId">配置只保存在当前浏览器本地，不会提交到仓库。</p>
          </div>
          <button ref="closeButtonRef" type="button" class="icon-button" @click="emit('close')">关闭</button>
        </header>

        <div class="modal-body">
          <label class="config-item">
            <span>API Key</span>
            <div v-if="isReplacingApiKey" class="secret-input-row">
              <input
                ref="apiKeyInputRef"
                :type="isApiKeyVisible ? 'text' : 'password'"
                :value="draft.apiKey"
                placeholder="sk-..."
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                :aria-invalid="Boolean(apiKeyError)"
                :aria-describedby="buildAriaDescribedBy([
                  apiKeyStatusId,
                  !isReplacingApiKey && apiKeyOverwriteHintId,
                  apiKeyError && apiKeyErrorId,
                ])"
                @input="handleFieldChange('apiKey', ($event.target as HTMLInputElement).value)"
              />
              <button type="button" class="subtle-button" @click="isApiKeyVisible = !isApiKeyVisible">
                {{ isApiKeyVisible ? '隐藏 Key' : '显示 Key' }}
              </button>
            </div>
            <div v-else class="stored-secret-row">
              <p>已保存 API Key；出于安全原因，这里不会回显完整值。</p>
              <button type="button" class="subtle-button" @click="handleStartReplacingApiKey">
                重新输入
              </button>
            </div>
            <small :id="apiKeyStatusId">当前状态：{{ maskedApiKeyLabel }}</small>
            <small v-if="!isReplacingApiKey" :id="apiKeyOverwriteHintId">重新输入后会覆盖当前已保存的 Key。</small>
            <small v-if="apiKeyError" :id="apiKeyErrorId" class="field-error">{{ apiKeyError }}</small>
          </label>

          <label class="config-item">
            <span>接口地址（baseURL）</span>
            <input
              ref="baseUrlInputRef"
              type="text"
              :value="draft.baseURL"
              placeholder="https://api.openai.com/v1"
              autocapitalize="off"
              spellcheck="false"
              :aria-invalid="Boolean(baseUrlError)"
              :aria-describedby="baseUrlError ? baseUrlErrorId : undefined"
              @input="handleFieldChange('baseURL', ($event.target as HTMLInputElement).value)"
            />
            <small v-if="baseUrlError" :id="baseUrlErrorId" class="field-error">{{ baseUrlError }}</small>
          </label>

          <label class="config-item">
            <span>模型（model）</span>
            <input
              ref="modelInputRef"
              type="text"
              :value="draft.model"
              placeholder="gpt-4o"
              autocapitalize="off"
              spellcheck="false"
              :aria-invalid="Boolean(modelError)"
              :aria-describedby="modelError ? modelErrorId : undefined"
              @input="handleFieldChange('model', ($event.target as HTMLInputElement).value)"
            />
            <small v-if="modelError" :id="modelErrorId" class="field-error">{{ modelError }}</small>
          </label>
        </div>

        <footer class="modal-footer">
          <p :id="securityTipId" class="security-tip">
            安全提示：请勿在公共设备保存敏感配置，离开前建议清空配置。
          </p>
          <div class="actions-row">
            <button type="button" class="ghost-button" @click="emit('clear')">清空配置</button>
            <button
              type="button"
              class="primary-button"
              :disabled="isSaveDisabled"
              :aria-describedby="saveStatusId"
              @click="handleSave"
            >
              保存到本地
            </button>
          </div>
          <p :id="saveStatusId" :class="['save-status', { error: isSaveDisabled }]">
            {{ saveDisabledReason || '配置准备就绪，保存后会立即用于当前工作台。' }}
          </p>
        </footer>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: color-mix(in srgb, var(--vp-c-black) 40%, transparent);
  display: grid;
  place-items: center;
  padding: 20px;
}

.modal-card {
  width: min(640px, 100%);
  border-radius: 18px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  display: grid;
  gap: 0;
}

.modal-header,
.modal-footer {
  padding: 18px 20px;
}

.modal-header {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--vp-c-divider);
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-header p {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.icon-button,
.subtle-button,
.ghost-button,
.primary-button {
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  display: grid;
  gap: 14px;
}

.config-item {
  display: grid;
  gap: 8px;
}

.config-item span {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.config-item input {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
}

.config-item small {
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.field-error {
  color: #b42318;
}

.secret-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.stored-secret-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--vp-c-bg-soft);
}

.stored-secret-row p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.modal-footer {
  border-top: 1px solid var(--vp-c-divider);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.security-tip {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.5;
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.primary-button {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.primary-button:disabled,
.ghost-button:disabled,
.subtle-button:disabled,
.icon-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.save-status {
  margin: 0 0 0 auto;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.5;
}

.save-status.error {
  color: #b42318;
}

@media (max-width: 700px) {
  .modal-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .save-status {
    margin-left: 0;
  }
}
</style>
