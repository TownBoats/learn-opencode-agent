<script setup lang="ts">
import type { TopologyNodeStatus } from './types'

defineProps<{
  label: string
  status: TopologyNodeStatus
  x: number
  y: number
}>()
</script>

<template>
  <g :transform="`translate(${x}, ${y})`" class="tl-root">
    <text text-anchor="middle" dominant-baseline="middle" class="tl-text" :class="{ 'tl-down': status === 'down' }">
      {{ label }}
    </text>
    <circle v-if="status !== 'healthy'" cx="28" cy="-14" r="4" :class="['tl-dot', status]" />
  </g>
</template>

<style scoped>
.tl-root { pointer-events: none; user-select: none; }
.tl-text { font-size: 10px; font-weight: 600; fill: var(--vp-c-text-1); }
.tl-down { opacity: 0.45; }
.tl-dot { stroke: none; }
.tl-dot.degraded { fill: #f59e0b; }
.tl-dot.down { fill: #ef4444; }
</style>
