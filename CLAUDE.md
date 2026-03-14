# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A VitePress-based e-book site: **从零构建 AI Coding Agent — OpenCode 源码剖析与实战**. It documents the OpenCode source code across 15 chapters plus auxiliary pages (reading map, glossary, version notes, release checklist).

## Commands

All commands run from `docs/book/`:

```bash
bun dev        # start dev server
bun build      # build static site
bun preview    # preview built site
```

## Site Structure

- **Config**: `.vitepress/config.mts` — `srcDir` is set to `docs/`, so all content paths are relative to `docs/`
- **Chapters**: `docs/NN-slug/index.md` (01–15)
- **Auxiliary pages**: `docs/reading-map.md`, `docs/version-notes.md`, `docs/glossary.md`, `docs/release-checklist.md`
- **Home page**: `docs/index.md` (uses `layout: home` with Vue component imports)
- **Custom theme**: `.vitepress/theme/` — extends default theme, adds `LearningPath.vue` and `TechStackGrid.vue`

## Frontmatter Convention

Every chapter page must have:

```md
---
title: 第N篇：章节标题
description: 章节标题的详细内容
---
```

Do **not** include an H1 that duplicates the `title` — VitePress renders the title from frontmatter automatically.

## Utility Scripts

Two helper scripts exist at the repo root of `docs/book/`:

- `add-frontmatter.ts` — prepends frontmatter to chapter files
- `remove-duplicate-titles.ts` — strips H1 that duplicates frontmatter title

**Warning**: Both scripts hardcode the path `src/content/docs` (a leftover from an old Astro setup). The actual content lives under `docs/`. These scripts will fail as-is — update the `docsDir` constant to `docs` before running.

## Chapter–Draft Mapping

Source drafts live in `../` (the parent `docs/` folder). The canonical mapping is in `../CLAUDE.md`. When editing chapter content, keep the site version (`docs/NN-slug/index.md`) and the draft (e.g., `../第一篇-Agent基础架构.md`) in sync.

## Navigation

Sidebar and nav are fully defined in `.vitepress/config.mts`. Adding a new page requires manually adding it to `themeConfig.sidebar` and/or `themeConfig.nav`.
