// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ReActLoop from './components/ReActLoop.vue'
import StreamingDemo from './components/StreamingDemo.vue'
import MessageAccumulator from './components/MessageAccumulator.vue'
import PermissionFlow from './components/PermissionFlow.vue'
import McpHandshake from './components/McpHandshake.vue'
import SseBroadcast from './components/SseBroadcast.vue'
import ContextCompaction from './components/ContextCompaction.vue'
import ProviderFallback from './components/ProviderFallback.vue'
import WorkflowVsAgent from './components/WorkflowVsAgent.vue'
import LspHover from './components/LspHover.vue'
import ConnectionGate from './components/ConnectionGate.vue'
import StarCTA from './components/StarCTA.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ReActLoop', ReActLoop)
    app.component('StreamingDemo', StreamingDemo)
    app.component('MessageAccumulator', MessageAccumulator)
    app.component('PermissionFlow', PermissionFlow)
    app.component('McpHandshake', McpHandshake)
    app.component('SseBroadcast', SseBroadcast)
    app.component('ContextCompaction', ContextCompaction)
    app.component('ProviderFallback', ProviderFallback)
    app.component('WorkflowVsAgent', WorkflowVsAgent)
    app.component('LspHover', LspHover)
    app.component('ConnectionGate', ConnectionGate)
    app.component('StarCTA', StarCTA)
  }
} satisfies Theme
