<script setup lang="ts">
import type { PlanTaskNode, DemoStepStatus } from './types'

const props = defineProps<{ node: PlanTaskNode; depth?: number }>()
const depth = props.depth ?? 0

const statusLabel: Record<DemoStepStatus, string> = {
  pending: '待执行',
  active: '执行中',
  done: '已完成',
  blocked: '被阻塞',
}
</script>

<template>
  <div class="node-wrapper" :style="{ paddingLeft: depth > 0 ? '1.5rem' : '0' }">
    <div class="node-item" :class="node.status">
      <div class="node-header">
        <span class="priority-tag" :class="node.priority">{{ node.priority.toUpperCase() }}</span>
        <span class="node-title">{{ node.title }}</span>
        <span class="status-badge" :class="node.status">{{ statusLabel[node.status] }}</span>
      </div>
      <div class="node-meta">
        <span class="dep-hint" v-if="node.dependsOn.length">
          依赖: {{ node.dependsOn.join(', ') }}
        </span>
        <span class="token-hint">~{{ node.estimatedTokens }} tokens</span>
      </div>
    </div>
    <div v-if="node.children?.length" class="node-children">
      <PlanningTreeNodeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.node-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.node-wrapper::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--vp-c-divider);
}

.node-wrapper:first-child::before {
  top: 1.5rem;
}

.node-item {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
  background: var(--vp-c-bg);
  transition: border-color 0.3s, box-shadow 0.3s;
  position: relative;
}

.node-item.pending {
  border-color: var(--vp-c-divider);
  opacity: 0.85;
}

.node-item.active {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15);
  animation: pulse-border 1.5s ease-in-out infinite;
}

.node-item.done {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.node-item.blocked {
  border: 1px dashed #ef4444;
  opacity: 0.6;
}

@keyframes pulse-border {
  0%, 100% { box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.15); }
  50% { box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.25); }
}

.node-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.node-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  flex: 1;
}

.priority-tag {
  font-size: 0.625rem;
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.priority-tag.p0 { background: #fee2e2; color: #991b1b; }
.priority-tag.p1 { background: #fef3c7; color: #92400e; }
.priority-tag.p2 { background: #ede9fe; color: #5b21b6; }

.status-badge {
  font-size: 0.6875rem;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 500;
}

.status-badge.pending { background: var(--vp-c-bg-soft); color: var(--vp-c-text-2); }
.status-badge.active { background: rgba(13, 148, 136, 0.12); color: var(--vp-c-brand-1); }
.status-badge.done { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.status-badge.blocked { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.node-meta {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.3rem;
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.node-children {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 1rem;
  border-left: 1px solid var(--vp-c-divider);
  margin-left: 1rem;
}
</style>
