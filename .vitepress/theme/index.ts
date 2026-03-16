// .vitepress/theme/index.ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import ReActLoop from './components/ReActLoop.vue'
import StreamingDemo from './components/StreamingDemo.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ReActLoop', ReActLoop)
    app.component('StreamingDemo', StreamingDemo)
  }
} satisfies Theme
