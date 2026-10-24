# hpoenixf's Blog

**前端工程、AI Agent 应用与系统架构的实践笔记。**

- [阅读博客](https://hpoenixf.com/) · [作者简介](https://hpoenixf.com/about)
- [ETF Agent Engineering Notes：55 篇公开工程文章](https://hpoenixf.github.io/eff-agent-article/) · [GitHub 文集源码](https://github.com/hpoenixf/eff-agent-article)
- [AI Agent 研发工程实践](https://hpoenixf.github.io/eff-agent-article/engineering) · [金融科技 × Agent 专题](https://hpoenixf.github.io/eff-agent-article/fintech)

## 新增机制精讲（2026-10-24）

[HIL：用户回复怎样接回原研究](https://hpoenixf.com/blog/agent-durable-human-interaction-response-adoption) · [时间语义：今天与市场 Session](https://hpoenixf.com/blog/agent-temporal-semantics-market-calendar) · [Shadow Credits：请求、Token 与已知用量](https://hpoenixf.com/blog/agent-personal-credits-shadow-accounting)。三篇共享既有工程案例与严格验收限定；博客维护中文正文，阅读站另提供完整英文版。

## 从哪里开始阅读

| 关注方向 | 推荐文章 |
| --- | --- |
| **前端工程 / AI-native UI** | [想聊就聊：异步后台研究](https://hpoenixf.com/blog/agent-background-research-collaborative-experience)、[Relay 数据建模与缓存问题](https://hpoenixf.com/blog/relay-id-issue)、[体验一致性工程](https://hpoenixf.com/blog/design-quality-assurance)、[Agent 渐进回答与修订](https://hpoenixf.github.io/eff-agent-article/articles/agent-progressive-answer-coherence) |
| **Agent 应用开发** | [定时研究](https://hpoenixf.com/blog/agent-autonomous-scheduled-research)、[Main 上下文压缩](https://hpoenixf.com/blog/agent-main-run-context-compaction)、[MCP Host 接入链路](https://hpoenixf.com/blog/mcp-host-from-discovery-to-consumption)、[一次研究怎样穿过六层系统](https://hpoenixf.github.io/eff-agent-article/articles/017-prompt-to-answer-six-layer-panorama)、[Subagent 协作](https://hpoenixf.github.io/eff-agent-article/articles/agent-subagent-context-specialization)、[Python 计算与交付](https://hpoenixf.github.io/eff-agent-article/articles/agent-python-compute-workbench-evolution) |
| **Agent 系统架构** | [Model / Runtime / MCP / Skill 职责](https://hpoenixf.github.io/eff-agent-article/articles/agent-model-runtime-mcp-skill-boundaries)、[授权边界](https://hpoenixf.github.io/eff-agent-article/articles/011-model-understands-code-authorizes)、[Run 终结权](https://hpoenixf.github.io/eff-agent-article/articles/agent-veto-authority-and-run-termination)、[A34 Tool Surface：工具可见性与真实演进](https://hpoenixf.com/blog/agent-model-capability-presentation-tool-surface)、[A35：Prompt Injection 与内容信任](https://hpoenixf.com/blog/agent-content-trust-prompt-injection)、[多生态 Hook](https://hpoenixf.com/blog/agent-multi-ecosystem-hook-execution)、[代码越来越便宜，为什么系统却越来越难升级？](https://hpoenixf.com/blog/code-cheaper-systems-harder-to-evolve) |
| **金融科技 × 投研 Agent** | [只读 Portfolio MCP](https://hpoenixf.com/blog/portfolio-mcp-readonly-investment-data)、[金融 MCP 多供应商建设与复盘](https://hpoenixf.com/blog/mcp-market-responsibility-retrospective)、[Python 执行与投研结论](https://hpoenixf.com/blog/financial-agent-python-result-consumption)、[金融数值的精度与口径](https://hpoenixf.com/blog/031-fintech-data-time-and-reproducible-numbers)、[A35：内容安全与信任](https://hpoenixf.com/blog/agent-content-trust-prompt-injection)、[金融可信工程：合规／安全／可靠／可审查](https://hpoenixf.github.io/eff-agent-article/fintech) |
| **用 AI 开发软件** | [Spec 与 Evidence](https://hpoenixf.github.io/eff-agent-article/articles/026-agent-spec-evidence-workflow)、[周报大 Spec 如何分三期交付](https://hpoenixf.com/blog/agent-weekly-review-staged-delivery)、[文档按需加载、长期记忆与旧知识退出](https://hpoenixf.github.io/eff-agent-article/articles/027-agent-context-document-history) |

以上是公开写作与系统设计案例的阅读路径；**本仓库是博客站点代码，不是 Agent Runtime 的开源实现**。未公开的系统源码、生产指标或内部测试无法仅由文章独立验证。

## 本仓库

博客基于 **Next.js 15、React、TypeScript、Contentlayer2/MDX 与 Tailwind CSS** 构建。文章见 [`data/blog/`](data/blog/)，作者信息见 [`data/authors/default.mdx`](data/authors/default.mdx)，线上发布由 [GitHub Pages workflow](.github/workflows/pages.yml) 执行。

```bash
pnpm install --frozen-lockfile
pnpm build
```

阅读站点与文章库独立维护：博客按时间线浏览，[Engineering Notes](https://github.com/hpoenixf/eff-agent-article) 按模块机制、系统架构和研发实践组织可连续阅读的专题。

文章合并后，旧稿保留短阅读指引，并在 frontmatter 用 `mergedInto` 指向主稿 slug、`canonicalUrl` 指向主稿地址。旧 URL 继续生成并标记 `noindex, follow`，同时退出首页、列表、搜索、标签计数、RSS、sitemap 和前后篇导航；`draft` 仍按原有规则处理未发布文章。
