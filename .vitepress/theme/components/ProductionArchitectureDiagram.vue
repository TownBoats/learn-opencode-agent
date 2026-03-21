<script setup lang="ts">
import { ref, computed } from 'vue'
import type { TopologyNode, TopologyLink, ProductionArchitectureDiagramProps } from './types'
import TopologyNodeLabel from './TopologyNodeLabel.vue'

const props = withDefaults(defineProps<ProductionArchitectureDiagramProps>(), {
  showLegend: true,
})

const selectedId = ref<string | null>(null)
const hoverNodeId = ref<string | null>(null)

const selected = computed(() => props.nodes.find(n => n.id === selectedId.value) ?? null)

function nodeX(n: TopologyNode) { return n.x }
function nodeY(n: TopologyNode) { return n.y }

function isHighlightedLink(link: TopologyLink) {
  if (!selectedId.value) return false
  return link.source === selectedId.value || link.target === selectedId.value
}

function nodeStroke(n: TopologyNode) {
  if (selectedId.value === n.id) return '#0d9488'
  if (hoverNodeId.value === n.id) return '#5eead4'
  if (n.status === 'down') return '#ef4444'
  if (n.status === 'degraded') return '#f59e0b'
  return 'var(--vp-c-divider)'
}

function nodeStrokeWidth(n: TopologyNode) {
  return selectedId.value === n.id || hoverNodeId.value === n.id ? 2.5 : 1.5
}

function nodeFill(n: TopologyNode) {
  if (n.status === 'down') return 'rgba(239,68,68,0.08)'
  if (n.status === 'degraded') return 'rgba(245,158,11,0.08)'
  return 'var(--vp-c-bg)'
}

function linkStroke(link: TopologyLink) {
  if (isHighlightedLink(link)) return '#0d9488'
  if (link.type === 'alert') return '#ef4444'
  if (link.type === 'data') return 'var(--vp-c-brand-1)'
  return 'var(--vp-c-divider)'
}

function linkOpacity(link: TopologyLink) {
  if (!selectedId.value) return 1
  return isHighlightedLink(link) ? 1 : 0.2
}

function nodeOpacity(n: TopologyNode) {
  if (!selectedId.value) return 1
  if (selectedId.value === n.id) return 1
  const connected = props.links.some(l => l.source === selectedId.value && l.target === n.id ||
    l.target === selectedId.value && l.source === n.id)
  return connected ? 1 : 0.3
}

function linkDash(link: TopologyLink) {
  if (link.type === 'alert') return '4 2'
  if (link.type === 'control') return '6 3'
  return 'none'
}

function onNodeClick(n: TopologyNode) {
  selectedId.value = selectedId.value === n.id ? null : n.id
}
</script>

<template>
  <div class="pad-root">
    <div class="pad-header">
      <div class="pad-title-row">
        <span class="pad-title">{{ title }}</span>
        <span class="pad-badge">Ch30 · Production</span>
      </div>
      <div v-if="selected" class="pad-detail">
        <span class="pad-detail-name">{{ selected.label }}</span>
        <span class="pad-detail-role">{{ selected.role }}</span>
        <span class="pad-status-dot" :class="selected.status">{{ selected.status }}</span>
      </div>
      <div v-else class="pad-hint">点击节点查看详情与连接关系</div>
    </div>

    <div class="pad-canvas-wrap">
      <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" class="pad-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--vp-c-divider)" />
          </marker>
          <marker id="arrowhead-brand" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#0d9488" />
          </marker>
          <marker id="arrowhead-alert" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>

        <!-- Links -->
        <line
          v-for="(link, i) in links"
          :key="`link-${i}`"
          :x1="nodeX(nodes.find(n => n.id === link.source)!)"
          :y1="nodeY(nodes.find(n => n.id === link.source)!)"
          :x2="nodeX(nodes.find(n => n.id === link.target)!)"
          :y2="nodeY(nodes.find(n => n.id === link.target)!)"
          :stroke="linkStroke(link)"
          :stroke-opacity="linkOpacity(link)"
          :stroke-dasharray="linkDash(link)"
          stroke-width="1.5"
          :marker-end="isHighlightedLink(link) ? 'url(#arrowhead-brand)' : link.type === 'alert' ? 'url(#arrowhead-alert)' : 'url(#arrowhead)'"
          class="pad-link"
        />

        <!-- Nodes -->
        <g
          v-for="node in nodes"
          :key="node.id"
          :transform="`translate(${nodeX(node)}, ${nodeY(node)})`"
          @click="onNodeClick(node)"
          @mouseenter="hoverNodeId = node.id"
          @mouseleave="hoverNodeId = null"
          :style="{ opacity: nodeOpacity(node) }"
          class="pad-node"
        >
          <rect
            :x="-node.width / 2"
            :y="-node.height / 2"
            :width="node.width"
            :height="node.height"
            :fill="nodeFill(node)"
            :stroke="nodeStroke(node)"
            :stroke-width="nodeStrokeWidth(node)"
            rx="6"
            class="pad-node-rect"
          />
          <TopologyNodeLabel
            :label="node.label"
            :status="node.status"
            :x="0"
            :y="0"
          />
        </g>
      </svg>
    </div>

    <div v-if="showLegend" class="pad-legend">
      <span class="pad-legend-item"><span class="pad-legend-line solid"></span>数据流</span>
      <span class="pad-legend-item"><span class="pad-legend-line dashed"></span>控制</span>
      <span class="pad-legend-item"><span class="pad-legend-line alert"></span>告警</span>
      <span class="pad-legend-item"><span class="pad-legend-dot healthy"></span>健康</span>
      <span class="pad-legend-item"><span class="pad-legend-dot degraded"></span>降级</span>
      <span class="pad-legend-item"><span class="pad-legend-dot down"></span>宕机</span>
    </div>
  </div>
</template>

<style scoped>
.pad-root {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pad-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pad-title-row { display: flex; align-items: center; gap: 0.625rem; }

.pad-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.pad-badge {
  font-size: 0.6875rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(13, 148, 136, 0.1);
  color: var(--vp-c-brand-1);
  font-weight: 500;
}

.pad-hint {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
}

.pad-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
}

.pad-detail-name { font-weight: 600; color: var(--vp-c-text-1); }
.pad-detail-role { color: var(--vp-c-text-2); }

.pad-status-dot {
  font-size: 0.6875rem;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.pad-status-dot.healthy { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.pad-status-dot.degraded { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.pad-status-dot.down { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.pad-canvas-wrap {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.pad-svg { width: 100%; display: block; }

.pad-node { cursor: pointer; }

.pad-node-rect {
  transition: stroke 0.2s, stroke-width 0.2s, fill 0.2s;
}

.pad-link { transition: stroke-opacity 0.3s; }

.pad-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding-top: 0.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.pad-legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: var(--vp-c-text-2);
}

.pad-legend-line {
  display: inline-block;
  width: 24px;
  height: 2px;
}

.pad-legend-line.solid { background: var(--vp-c-brand-1); }
.pad-legend-line.dashed { background: repeating-linear-gradient(90deg, var(--vp-c-divider) 0, var(--vp-c-divider) 4px, transparent 4px, transparent 7px); }
.pad-legend-line.alert { background: repeating-linear-gradient(90deg, #ef4444 0, #ef4444 4px, transparent 4px, transparent 7px); }

.pad-legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pad-legend-dot.healthy { background: #10b981; }
.pad-legend-dot.degraded { background: #f59e0b; }
.pad-legend-dot.down { background: #ef4444; }
</style>
