<script setup lang="ts">
interface TechItem {
  name: string
  category: string
  description: string
}

interface TechGroup {
  label: string
  items: TechItem[]
}

const groups: TechGroup[] = [
  {
    label: '运行时 & 语言',
    items: [
      { name: 'Bun', category: 'Runtime', description: 'JS 运行时与包管理' },
      { name: 'TypeScript', category: 'Language', description: '静态类型语言' },
      { name: 'Rust', category: 'Language', description: '系统级性能语言' }
    ]
  },
  {
    label: '前端 & 桌面',
    items: [
      { name: 'SolidJS', category: 'UI Framework', description: '高性能响应式框架' },
      { name: 'Tauri', category: 'Desktop', description: 'Rust 驱动的桌面应用' }
    ]
  },
  {
    label: '数据 & 基础设施',
    items: [
      { name: 'Drizzle ORM', category: 'Database', description: 'TypeScript ORM' },
      { name: 'SQLite', category: 'Database', description: '嵌入式关系数据库' },
      { name: 'SST', category: 'Infra', description: '云基础设施框架' },
      { name: 'Cloudflare', category: 'Platform', description: '边缘计算平台' }
    ]
  }
]
</script>

<template>
  <div class="tech-grid-wrapper">
    <div v-for="group in groups" :key="group.label" class="tech-group">
      <div class="group-label">{{ group.label }}</div>
      <div class="tech-items">
        <div
          v-for="tech in group.items"
          :key="tech.name"
          class="tech-item"
        >
          <div class="tech-name">{{ tech.name }}</div>
          <div class="tech-meta">
            <span class="tech-category">{{ tech.category }}</span>
            <span class="tech-desc">{{ tech.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tech-grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 24px;
  margin-bottom: 60px;
}

/* ===== 分组容器 ===== */
.tech-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

@media (max-width: 640px) {
  .tech-group {
    flex-direction: column;
    gap: 10px;
  }
}

/* 分组标签 */
.group-label {
  flex-shrink: 0;
  width: 130px;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-top: 14px;
  text-align: right;
  line-height: 1.4;
}

@media (max-width: 640px) {
  .group-label {
    width: auto;
    text-align: left;
    padding-top: 0;
    font-size: 0.72rem;
  }
}

/* 分组分割线 */
.tech-group::after {
  display: none;
}

/* 分割线：group-label 右侧竖线 */
.group-label {
  position: relative;
  padding-right: 16px;
}

.group-label::after {
  content: '';
  position: absolute;
  right: 0;
  top: 10px;
  bottom: -20px;
  width: 1px;
  background: var(--vp-c-divider);
}

@media (max-width: 640px) {
  .group-label::after {
    display: none;
  }
}

/* ===== 技术项目列表 ===== */
.tech-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
}

/* ===== 单个技术项 ===== */
.tech-item {
  padding: 11px 16px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  box-shadow: var(--card-shadow-light);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  cursor: default;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.tech-item:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.tech-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.tech-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tech-category {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.tech-desc {
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .tech-item {
    min-width: auto;
    padding: 9px 13px;
  }

  .tech-name {
    font-size: 0.85rem;
  }
}
</style>
