// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ReActLoop from './components/ReActLoop.vue'
import StreamingDemo from './components/StreamingDemo.vue'
import MessageAccumulator from './components/MessageAccumulator.vue'
import PermissionFlow from './components/PermissionFlow.vue'
import McpHandshake from './components/McpHandshake.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ReActLoop', ReActLoop)
    app.component('StreamingDemo', StreamingDemo)
    app.component('MessageAccumulator', MessageAccumulator)
    app.component('PermissionFlow', PermissionFlow)
    app.component('McpHandshake', McpHandshake)
  }
} satisfies Theme
