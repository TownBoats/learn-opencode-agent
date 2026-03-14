<script setup lang="ts">
interface Chapter {
  name: string
  link: string
}

interface Phase {
  number: string
  title: string
  description: string
  chapters: Chapter[]
}

const phases: Phase[] = [
  {
    number: '01',
    title: '建立全局认知',
    description: '先看懂 OpenCode 是什么系统，再进入内部实现',
    chapters: [
      { name: 'Agent 基础架构', link: '/01-agent-basics/index' },
      { name: 'Agent 核心系统', link: '/02-agent-core/index' },
      { name: '工具系统', link: '/03-tool-system/index' },
      { name: '会话管理', link: '/04-session-management/index' }
    ]
  },
  {
    number: '02',
    title: '进入运行时主链路',
    description: '理解模型、协议、HTTP 与存储怎样协同工作',
    chapters: [
      { name: '多模型支持', link: '/05-provider-system/index' },
      { name: 'MCP 协议集成', link: '/06-mcp-integration/index' },
      { name: 'HTTP API 服务器', link: '/08-http-api-server/index' },
      { name: '数据持久化', link: '/09-data-persistence/index' }
    ]
  },
  {
    number: '03',
    title: '理解交互与扩展',
    description: '把 TUI、多端界面、代码智能和扩展体系串起来',
    chapters: [
      { name: 'TUI 终端界面', link: '/07-tui-interface/index' },
      { name: '多端 UI 开发', link: '/10-multi-platform-ui/index' },
      { name: '代码智能', link: '/11-code-intelligence/index' },
      { name: '插件与扩展', link: '/12-plugins-extensions/index' }
    ]
  },
  {
    number: '04',
    title: '完成工程化闭环',
    description: '最后再看部署、测试与可迁移的工程经验',
    chapters: [
      { name: '部署与基础设施', link: '/13-deployment-infrastructure/index' },
      { name: '测试与质量保证', link: '/14-testing-quality/index' },
      { name: '高级主题与最佳实践', link: '/15-advanced-topics/index' }
    ]
  }
]
</script>

<template>
  <div class="path-container">
    <div
      v-for="(phase, index) in phases"
      :key="phase.number"
      class="phase-card"
    >
      <!-- 阶段连接箭头（最后一项不显示） -->
      <div v-if="index < phases.length - 1" class="phase-connector" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 10h12M12 6l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>

      <div class="phase-header">
        <span class="phase-number" aria-hidden="true">{{ phase.number }}</span>
        <div class="phase-title-group">
          <h3 class="phase-title">{{ phase.title }}</h3>
          <span class="chapter-badge">{{ phase.chapters.length }} 章</span>
        </div>
      </div>

      <p class="phase-desc">{{ phase.description }}</p>

      <ul class="chapter-list" :aria-label="`${phase.title}章节列表`">
        <li v-for="chapter in phase.chapters" :key="chapter.link">
          <a :href="chapter.link">
            <svg class="arrow-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ chapter.name }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.path-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 28px;
  margin-bottom: 60px;
  position: relative;
}

@media (max-width: 768px) {
  .path-container {
    grid-template-columns: 1fr;
  }
}

/* ===== 阶段卡片 ===== */
.phase-card {
  padding: 24px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  box-shadow: var(--card-shadow-light);
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
  position: relative;
  overflow: hidden;
}

/* 顶部品牌色条 */
.phase-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), #3b82f6);
  opacity: 0;
  transition: opacity 0.25s ease;
}

.phase-card:hover::before {
  opacity: 1;
}

.phase-card:hover {
  transform: translateY(-3px);
  border-color: rgba(13, 148, 136, 0.3);
  box-shadow: var(--card-shadow-hover);
}

/* ===== 阶段连接器（绝对定位在卡片右侧） ===== */
.phase-connector {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: var(--vp-c-brand-1);
  opacity: 0.4;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--vp-c-bg);
  border-radius: 50%;
}

@media (max-width: 768px) {
  .phase-connector {
    display: none;
  }
}

/* ===== 卡片头部 ===== */
.phase-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.phase-number {
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-brand-1);
  font-weight: 700;
  font-size: 1.375rem;
  line-height: 1;
  min-width: 2.5rem;
  opacity: 0.85;
}

.phase-title-group {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.phase-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

/* 章节数量徽章 */
.chapter-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 20px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* ===== 描述文字 ===== */
.phase-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}

/* ===== 章节列表 ===== */
.chapter-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chapter-list a {
  color: var(--vp-c-text-2);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.18s ease;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  line-height: 1.5;
}

.arrow-icon {
  flex-shrink: 0;
  color: var(--vp-c-brand-1);
  opacity: 0.35;
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.chapter-list a:hover {
  color: var(--vp-c-brand-1);
}

.chapter-list a:hover .arrow-icon {
  opacity: 1;
  transform: translateX(2px);
}

.chapter-list a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
  border-radius: 4px;
}

/* ===== 响应式 ===== */
@media (max-width: 640px) {
  .phase-card {
    padding: 20px;
  }

  .phase-number {
    font-size: 1.2rem;
  }

  .phase-title {
    font-size: 1rem;
  }

  .phase-desc {
    font-size: 0.85rem;
  }

  .chapter-list a {
    font-size: 0.825rem;
  }
}
</style>
