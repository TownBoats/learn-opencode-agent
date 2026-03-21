<script setup lang="ts">
defineProps<{
  jsonText: string
  jsonError: string
}>()

const emit = defineEmits<{
  'update:json-text': [value: string]
  'format-json': []
}>()
</script>

<template>
  <section class="json-editor">
    <div class="editor-toolbar">
      <p>原始 JSON 视图</p>
      <button type="button" class="ghost-button" @click="emit('format-json')">格式化 JSON</button>
    </div>

    <textarea
      class="json-textarea"
      :value="jsonText"
      spellcheck="false"
      @input="emit('update:json-text', ($event.target as HTMLTextAreaElement).value)"
    />

    <p v-if="jsonError" class="json-error">{{ jsonError }}</p>
    <p v-else class="json-tip">JSON 解析成功后，结构化视图与运行都会使用最新模板。</p>
  </section>
</template>

<style scoped>
.json-editor {
  display: grid;
  gap: 12px;
}

.editor-toolbar {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.editor-toolbar p {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.ghost-button {
  border-radius: 10px;
  padding: 9px 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  cursor: pointer;
}

.json-textarea {
  min-height: 520px;
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  padding: 14px 16px;
  font-family: 'SFMono-Regular', 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
}

.json-error,
.json-tip {
  margin: 0;
  font-size: 13px;
}

.json-error {
  color: #b42318;
}

.json-tip {
  color: var(--vp-c-text-2);
}
</style>
