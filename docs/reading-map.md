---
title: 阅读地图
description: 这本电子书的推荐阅读顺序与章节关系图
---

# 阅读地图

如果你是第一次系统阅读一个真实 AI Coding Agent 仓库，最常见的问题不是“内容不够”，而是“信息太多，不知道先读哪一篇”。

这一页只做一件事：给你一张可以直接执行的阅读路线图。

## 推荐起点

如果你是 Agent 开发初学者，默认按下面顺序读：

1. 第一篇：建立 OpenCode 的系统总图
2. 第二篇：理解 Agent 是如何被定义和约束的
3. 第三篇：理解工具怎样进入 Agent 能力边界
4. 第四篇：理解会话怎样把模型、工具和状态串起来

读完这四篇后，再决定往哪条路线深入，效率会高很多。

## 总体结构图

```text
第一层：先建立全局认知
  01 Agent 基础架构
  02 Agent 核心系统
  03 工具系统
  04 会话管理

第二层：再进入运行时主链路
  05 多模型支持
  06 MCP 协议集成
  08 HTTP API 服务器
  09 数据持久化

第三层：再理解交互与扩展
  07 TUI 终端界面
  10 多端 UI 开发
  11 代码智能
  12 插件与扩展

第四层：最后看工程化闭环
  13 部署与基础设施
  14 测试与质量保证
  15 高级主题与最佳实践
```

## 三条阅读路线

### 路线 A：从零入门 Agent 实现

适合：

- 第一次系统学习 Agent 开发
- 还没有搭过完整的工具调用和会话系统
- 希望先建立整体认知，而不是先啃某个细节模块

建议顺序：

1. [第一篇：Agent 基础架构](/01-agent-basics/index)
2. [第二篇：Agent 核心系统](/02-agent-core/index)
3. [第三篇：工具系统](/03-tool-system/index)
4. [第四篇：会话管理](/04-session-management/index)
5. [第五篇：多模型支持](/05-provider-system/index)
6. [第八篇：HTTP API 服务器](/08-http-api-server/index)

这条线的目标，是先看懂“一个 Agent 系统怎样跑起来”。

### 路线 B：从运行时到产品化

适合：

- 已经理解基本 Agent 概念
- 更想知道多模型、协议、持久化、云端产品边界怎么落地
- 关心“真实项目为什么会长成现在这个架构”

建议顺序：

1. [第五篇：多模型支持](/05-provider-system/index)
2. [第六篇：MCP 协议集成](/06-mcp-integration/index)
3. [第八篇：HTTP API 服务器](/08-http-api-server/index)
4. [第九篇：数据持久化](/09-data-persistence/index)
5. [第十三篇：部署与基础设施](/13-deployment-infrastructure/index)
6. [第十四篇：测试与质量保证](/14-testing-quality/index)

这条线的目标，是看懂“从本地运行时到产品级系统”的演进路径。

### 路线 C：从交互界面到扩展生态

适合：

- 对 TUI、Web、Desktop、IDE 集成更感兴趣
- 想理解代码智能和插件/Skill 体系
- 更关心“用户怎么和 Agent 协作”

建议顺序：

1. [第七篇：TUI 终端界面](/07-tui-interface/index)
2. [第十篇：多端 UI 开发](/10-multi-platform-ui/index)
3. [第十一篇：代码智能](/11-code-intelligence/index)
4. [第十二篇：插件与扩展](/12-plugins-extensions/index)

这条线的目标，是看懂“交互层和扩展层怎样让 Agent 真正可用”。

## 章节依赖关系

如果你只想知道“某一篇之前至少该看什么”，可以按下面这张简化依赖图走：

```text
01 -> 02 -> 03 -> 04
04 -> 05 -> 06
04 + 07 -> 08
04 + 08 -> 09
07 + 08 + 09 -> 10
03 -> 11
03 + 06 -> 12
01 + 08 + 10 -> 13
03 + 08 + 10 -> 14
02 + 03 + 04 + 14 -> 15
```

## 如果你时间有限

### 只读 4 篇

读这四篇：

1. [第一篇：Agent 基础架构](/01-agent-basics/index)
2. [第二篇：Agent 核心系统](/02-agent-core/index)
3. [第三篇：工具系统](/03-tool-system/index)
4. [第四篇：会话管理](/04-session-management/index)

这四篇足够帮你建立一个真实 Agent 系统的主骨架。

### 只读 8 篇

在前四篇基础上，加上：

5. [第五篇：多模型支持](/05-provider-system/index)
6. [第六篇：MCP 协议集成](/06-mcp-integration/index)
7. [第八篇：HTTP API 服务器](/08-http-api-server/index)
8. [第九篇：数据持久化](/09-data-persistence/index)

这 8 篇足够让你看懂 OpenCode 的核心运行时闭环。

## 最后建议

不要试图一次性记住所有目录和所有文件。

更有效的方式是：

1. 先按这张地图选一条线
2. 每篇只抓“入口文件 + 主链路 + 最容易误解的点”
3. 看完一篇，再决定要不要继续深入代码细节

如果你已经准备好了，建议从 [第一篇：Agent 基础架构](/01-agent-basics/index) 开始。
