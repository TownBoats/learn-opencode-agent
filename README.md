# OpenCode 电子书站点

VitePress 电子书项目：**从零构建 AI Coding Agent — OpenCode 源码剖析与实战**

## 技术栈

- **VitePress** - 静态站点生成器
- **Vue 3** - 自定义组件
- **Mermaid** - 图表渲染
- **Bun** - 包管理器和运行时

## 关键文件

- 站点配置：`.vitepress/config.mts`
- 首页：`docs/index.md`
- 章节内容：`docs/*/index.md`
- 自定义组件：`.vitepress/theme/components/`

## 目录结构

```text
.
├── .vitepress/
│   ├── config.mts              # VitePress 配置
│   └── theme/                  # 自定义主题和组件
├── docs/                       # 内容目录
│   ├── index.md                # 首页
│   ├── 00-what-is-ai-agent/    # 第1章
│   ├── 01-agent-basics/        # 第2章
│   ├── ...
│   ├── 15-advanced-topics/     # 第16章
│   ├── reading-map.md          # 阅读地图
│   ├── glossary.md             # 术语表
│   ├── version-notes.md        # 版本说明
│   └── release-checklist.md    # 发布清单
├── add-frontmatter.ts          # 工具脚本
├── remove-duplicate-titles.ts  # 工具脚本
└── package.json
```

## 本地开发

```bash
bun install
bun dev
```

默认在 `http://localhost:5173` 启动开发服务器。

## 构建与预览

```bash
bun build    # 构建到 .vitepress/dist
bun preview  # 预览构建结果
```

## 生产部署

使用 Caddy 在 3000 端口提供服务：

```bash
bun start
```

## 内容维护

电子书内容位于 `docs/` 目录：

- `docs/00-what-is-ai-agent/index.md` - 第1章：什么是 AI Agent
- `docs/01-agent-basics/index.md` - 第2章：AI Agent 的核心组件
- `docs/02-agent-core/index.md` - 第3章：OpenCode 项目介绍
- ...
- `docs/15-advanced-topics/index.md` - 第16章：高级主题与最佳实践

## 维护约定

- **Frontmatter 必需**：每个章节必须包含 `title` 和 `description`
- **无重复标题**：VitePress 自动渲染 frontmatter 中的 title，正文中不要再写 `# 标题`
- **侧边栏配置**：在 `.vitepress/config.mts` 中手动维护，不自动生成
- **发布前检查**：执行 `bun build` 确保构建成功
- **辅助页面同步**：修改章节结构时，同步更新阅读地图、版本说明、术语表、发布清单

## 工具脚本

- `add-frontmatter.ts` - 批量添加 frontmatter 到章节文件
- `remove-duplicate-titles.ts` - 移除与 frontmatter 重复的 H1 标题

**注意**：两个脚本都硬编码了章节列表，添加/删除章节时需手动更新脚本。
