# hpoenixf's Blog

**前端工程、AI Agent 应用与系统架构的实践笔记。**

- [阅读博客](https://hpoenixf.com/) · [作者简介](https://hpoenixf.com/about)
- [ETF Agent Engineering Notes：40 篇公开工程文章](https://hpoenixf.github.io/eff-agent-article/) · [GitHub 文集源码](https://github.com/hpoenixf/eff-agent-article)
- [AI Agent 研发工程实践](https://hpoenixf.github.io/eff-agent-article/engineering) · [金融科技 × Agent 专题](https://hpoenixf.github.io/eff-agent-article/fintech)

## 从哪里开始阅读

| 关注方向 | 推荐文章 |
| --- | --- |
| **前端工程 / AI-native UI** | [Relay 数据建模与缓存问题](https://hpoenixf.com/blog/relay-id-issue)、[体验一致性工程](https://hpoenixf.com/blog/design-quality-assurance)、[Agent 渐进回答与修订](https://hpoenixf.github.io/eff-agent-article/articles/agent-progressive-answer-coherence) |
| **Agent 应用开发** | [一次研究怎样穿过六层系统](https://hpoenixf.github.io/eff-agent-article/articles/017-prompt-to-answer-six-layer-panorama)、[Subagent 协作](https://hpoenixf.github.io/eff-agent-article/articles/agent-subagent-context-specialization)、[Python 计算与交付](https://hpoenixf.github.io/eff-agent-article/articles/agent-python-compute-workbench-evolution) |
| **Agent 系统架构** | [Model / Runtime / MCP / Skill 职责](https://hpoenixf.github.io/eff-agent-article/articles/agent-model-runtime-mcp-skill-boundaries)、[授权边界](https://hpoenixf.github.io/eff-agent-article/articles/011-model-understands-code-authorizes)、[Run 终结权](https://hpoenixf.github.io/eff-agent-article/articles/agent-veto-authority-and-run-termination)、[多生态 Hook](https://hpoenixf.com/blog/agent-multi-ecosystem-hook-execution)、[代码越来越便宜，为什么系统却越来越难升级？](https://hpoenixf.com/blog/code-cheaper-systems-harder-to-evolve) |
| **金融科技 × 投研 Agent** | [Python 执行与投研结论](https://hpoenixf.com/blog/financial-agent-python-result-consumption)、[金融数值的精度与口径](https://hpoenixf.com/blog/031-fintech-data-time-and-reproducible-numbers)、[金融科技 × Agent 文集](https://hpoenixf.github.io/eff-agent-article/fintech) |
| **用 AI 开发软件** | [Spec 与 Evidence](https://hpoenixf.github.io/eff-agent-article/articles/026-agent-spec-evidence-workflow)、[文档按需加载与 History](https://hpoenixf.github.io/eff-agent-article/articles/027-agent-context-document-history) |

以上是公开写作与系统设计案例的阅读路径；**本仓库是博客站点代码，不是 Agent Runtime 的开源实现**。未公开的系统源码、生产指标或内部测试无法仅由文章独立验证。

## 本仓库

博客基于 **Next.js 15、React、TypeScript、Contentlayer2/MDX 与 Tailwind CSS** 构建。文章见 [`data/blog/`](data/blog/)，作者信息见 [`data/authors/default.mdx`](data/authors/default.mdx)，线上发布由 [GitHub Pages workflow](.github/workflows/pages.yml) 执行。

```bash
pnpm install --frozen-lockfile
pnpm build
```

阅读站点与文章库独立维护：博客按时间线浏览，[Engineering Notes](https://github.com/hpoenixf/eff-agent-article) 按模块机制、系统架构和研发实践组织可连续阅读的专题。
