# hpoenixf's Blog

**前端工程、AI Agent 应用与系统架构的实践笔记。**

- [阅读博客](https://hpoenixf.com/) · [作者简介](https://hpoenixf.com/about)
- [ETF Agent Engineering Notes：73 篇公开工程文章](https://hpoenixf.com/eff-agent-article/) · [GitHub 文集源码](https://github.com/hpoenixf/eff-agent-article)
- [AI Agent 研发工程实践](https://hpoenixf.com/eff-agent-article/engineering) · [金融科技 × Agent 专题](https://hpoenixf.com/eff-agent-article/fintech)

## 原则文章原址精修（2026-10-28）

[代码为什么越来越难升级](https://hpoenixf.com/eff-agent-article/articles/code-cheaper-systems-harder-to-evolve)、[局部优化怎样变成系统进步](https://hpoenixf.com/eff-agent-article/articles/local-improvement-is-not-system-progress)、[稳定什么与改变什么](https://hpoenixf.com/eff-agent-article/articles/agent-differentiated-evolution-contracts)、[旧测试怎样演进](https://hpoenixf.com/eff-agent-article/articles/test-lifecycle-refactoring-retirement-and-spec)分别采用报表图表、图片识别、工单分派与头像格式教学场景，完整中英文同批更新；已有两篇中文博客正文同步，首次发布日期保留。

## 新增研发方法文章（2026-10-28）

[测试比实现还多之后：怎样让文档、代码和测试一起向前](https://hpoenixf.com/eff-agent-article/articles/docs-code-tests-evolve-together) · [完整英文版](https://hpoenixf.com/eff-agent-article/en/articles/docs-code-tests-evolve-together)。保留真实项目统计，以订单导出教学案例讲清规范、实现、旧测试和用户结果怎样随需求共同演进。

## 新增工程复盘与架构演进（2026-10-26）

[一个 Subagent 改动，为什么拖住了我们整整一天？](https://hpoenixf.com/blog/agent-runtime-refactor-one-day-blocked) · [Agent 架构如何做到该稳定的稳定，该变化的变化？](https://hpoenixf.com/blog/agent-differentiated-evolution-contracts)。前一篇沿实际证据复盘 Runtime 责任扩散和验证阻塞；后一篇以 Child、Memory、金融计算与 Provider 解释按具体 Interface 制定的演进契约。两篇互链，完整英文版收录于阅读站。

## 新增 Owner 专文：持久控制与共享容量（2026-10-24）

[A08：Stop 指令为什么不能直接执行](https://hpoenixf.com/blog/agent-control-events-durable-owner-adoption) · [A30：HTTP 200 后为什么还要排队](https://hpoenixf.com/blog/agent-provider-admission-capacity-lease)。中文博客与阅读站原文一致，阅读站另有完整英文版；A32 目录职责深化在既有 Provider 文章，A27 继续保留真实效果证据缺口。

## 新增机制精讲（2026-10-24）

[HIL：用户回复怎样接回原研究](https://hpoenixf.com/blog/agent-durable-human-interaction-response-adoption) · [时间语义：今天与市场 Session](https://hpoenixf.com/blog/agent-temporal-semantics-market-calendar) · [Shadow Credits：请求、Token 与已知用量](https://hpoenixf.com/blog/agent-personal-credits-shadow-accounting)。三篇共享既有工程案例与严格验收限定；博客维护中文正文，阅读站另提供完整英文版。

## 从哪里开始阅读

| 关注方向 | 推荐文章 |
| --- | --- |
| **前端工程 / AI-native UI** | [想聊就聊：异步后台研究](https://hpoenixf.com/blog/agent-background-research-collaborative-experience)、[Relay 数据建模与缓存问题](https://hpoenixf.com/blog/relay-id-issue)、[体验一致性工程](https://hpoenixf.com/blog/design-quality-assurance)、[Agent 渐进回答与修订](https://hpoenixf.com/eff-agent-article/articles/agent-progressive-answer-coherence) |
| **Agent 应用开发** | [定时研究](https://hpoenixf.com/blog/agent-autonomous-scheduled-research)、[Main 上下文压缩](https://hpoenixf.com/blog/agent-main-run-context-compaction)、[MCP Host 接入链路](https://hpoenixf.com/blog/mcp-host-from-discovery-to-consumption)、[一次研究怎样穿过六层系统](https://hpoenixf.com/eff-agent-article/articles/017-prompt-to-answer-six-layer-panorama)、[Subagent 协作](https://hpoenixf.com/eff-agent-article/articles/agent-subagent-context-specialization)、[Python 计算与交付](https://hpoenixf.com/eff-agent-article/articles/agent-python-compute-workbench-evolution) |
| **Agent 系统架构** | [Model / Runtime / MCP / Skill 职责](https://hpoenixf.com/eff-agent-article/articles/agent-model-runtime-mcp-skill-boundaries)、[授权边界](https://hpoenixf.com/eff-agent-article/articles/011-model-understands-code-authorizes)、[Run 终结权](https://hpoenixf.com/eff-agent-article/articles/agent-veto-authority-and-run-termination)、[A34 Tool Surface：工具可见性与真实演进](https://hpoenixf.com/blog/agent-model-capability-presentation-tool-surface)、[A35：Prompt Injection 与内容信任](https://hpoenixf.com/blog/agent-content-trust-prompt-injection)、[多生态 Hook](https://hpoenixf.com/blog/agent-multi-ecosystem-hook-execution)、[代码越来越便宜，为什么系统却越来越难升级？](https://hpoenixf.com/blog/code-cheaper-systems-harder-to-evolve)、[差异化演进契约](https://hpoenixf.com/blog/agent-differentiated-evolution-contracts) |
| **金融科技 × 投研 Agent** | [只读 Portfolio MCP](https://hpoenixf.com/blog/portfolio-mcp-readonly-investment-data)、[金融 MCP 多供应商建设与复盘](https://hpoenixf.com/blog/mcp-market-responsibility-retrospective)、[Python 执行与投研结论](https://hpoenixf.com/blog/financial-agent-python-result-consumption)、[金融数值的精度与口径](https://hpoenixf.com/blog/031-fintech-data-time-and-reproducible-numbers)、[A35：内容安全与信任](https://hpoenixf.com/blog/agent-content-trust-prompt-injection)、[金融可信工程：合规／安全／可靠／可审查](https://hpoenixf.com/eff-agent-article/fintech) |
| **用 AI 开发软件** | [Spec 与 Evidence](https://hpoenixf.com/eff-agent-article/articles/026-agent-spec-evidence-workflow)、[周报大 Spec 如何分三期交付](https://hpoenixf.com/blog/agent-weekly-review-staged-delivery)、[文档按需加载、长期记忆与旧知识退出](https://hpoenixf.com/eff-agent-article/articles/027-agent-context-document-history)、[一天的 Runtime 重构复盘](https://hpoenixf.com/blog/agent-runtime-refactor-one-day-blocked) |

以上是公开写作与系统设计案例的阅读路径；**本仓库是博客站点代码，不是 Agent Runtime 的开源实现**。未公开的系统源码、生产指标或内部测试无法仅由文章独立验证。

## 本仓库

博客基于 **Next.js 15、React、TypeScript、Contentlayer2/MDX 与 Tailwind CSS** 构建。文章见 [`data/blog/`](data/blog/)，作者信息见 [`data/authors/default.mdx`](data/authors/default.mdx)，线上发布由 [GitHub Pages workflow](.github/workflows/pages.yml) 执行。

```bash
pnpm install --frozen-lockfile
pnpm build
```

阅读站点与文章库独立维护：博客按时间线浏览，[Engineering Notes](https://github.com/hpoenixf/eff-agent-article) 按模块机制、系统架构和研发实践组织可连续阅读的专题。

文章合并后，旧稿保留短阅读指引，并在 frontmatter 用 `mergedInto` 指向主稿 slug、`canonicalUrl` 指向主稿地址。旧 URL 继续生成并标记 `noindex, follow`，同时退出首页、列表、搜索、标签计数、RSS、sitemap 和前后篇导航；`draft` 仍按原有规则处理未发布文章。

## ETF Agent 阅读站在自定义域名下的发布

`hpoenixf.com` 的 GitHub Pages 发布源是本博客仓库；独立的 [ETF Agent 阅读站](https://github.com/hpoenixf/eff-agent-article) 仍维护 VitePress 源码和独立 Pages 入口。阅读站在本博客的发布流程中额外构建，并复制进 `out/eff-agent-article/`，因此正文统一从 `https://hpoenixf.com/eff-agent-article/` 阅读。VitePress 的 `base` 保持 `/eff-agent-article/`。

所有公开正文只有一条发布链：`eff-agent-article` 的已审核提交 → 本仓库 `reader-source.json` → 本仓库 Pages → `https://hpoenixf.com/eff-agent-article/`。博客 push 和手动重跑都只消费锁定的完整 commit SHA；不再定时跟随浮动 `main`，也不创建跨仓库 token。文章仓库的 Pages 只保留兼容跳转，不再发布另一份正文。

发布者先提交并核对文章源，再在本仓库根目录执行：

```bash
node scripts/reader-release.mjs prepare /path/to/article-checkout articles/<slug>.md en/articles/<slug>.md
node --test scripts/reader-release.test.mjs
```

`prepare` 检查选定文件与该 checkout 的已提交字节相同，并写入 source commit、规范域名和逐语言正文 SHA-256；它只准备本地发布锁。将已审核的 `reader-source.json` 非强制提交到本仓库 `main` 后才触发正式发布。并行发布前重新读取两仓库分支，保留已有改动，不将 pin 降级到旧源。

构建先核对 source commit 和文件摘要，再进行目录、双语、静态构建与 canonical 检查，最后生成公开的 [`reader-release.json`](https://hpoenixf.com/eff-agent-article/reader-release.json)。该回执只包含公开源码版本、博客版本和选定中英页面的源文件/HTML 摘要，不含本地路径、令牌或内部日志。部署后 workflow 读取**新域名的实际 clean URL 正文**并逐页匹配 HTML SHA-256；返回 200、文章 repo CI 成功或回执单独存在，都不算正文同步成功。

手动验收：`node scripts/reader-release.mjs verify`。CDN 尚未更新时保持待验证，不能把旧版页面标成完成。需要回滚时走相同发布锁提交与正文验收，不改 DNS、Pages 管理设置或凭据。`robots.txt` 同时公布博客和阅读站的 sitemap。
