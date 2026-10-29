# hpoenixf's Blog

**系统架构、设计原则与架构演进的实践笔记。**

[阅读个人博客](https://hpoenixf.com/) · [作者简介](https://hpoenixf.com/about) · [完整 Agent 工程阅读站](https://hpoenixf.com/eff-agent-article/)

## 从这些问题开始

- **系统怎样协作？** [一句问题走过六层系统](https://hpoenixf.com/blog/017-prompt-to-answer-six-layer-panorama)、[Model / Runtime / MCP / Skill 的职责](https://hpoenixf.com/blog/agent-model-runtime-mcp-skill-boundaries)。
- **系统怎样演进？** [代码越来越便宜，系统为什么越来越难升级](https://hpoenixf.com/blog/code-cheaper-systems-harder-to-evolve)、[稳定什么与改变什么](https://hpoenixf.com/blog/agent-differentiated-evolution-contracts)、[一次改动为什么拖住整天](https://hpoenixf.com/blog/agent-runtime-refactor-one-day-blocked)。
- **怎样判断真正完成？** [测试全绿是否就算成功](https://hpoenixf.com/blog/honest-agent-evaluation)、[局部拒绝与运行终结权](https://hpoenixf.com/blog/agent-veto-authority-and-run-termination)、[文件保存与实际交付](https://hpoenixf.com/blog/agent-html-evolution-challenges)。
- **怎样设计长期有效的机制？** [跨六国业务设计系统](https://hpoenixf.com/blog/design-quality-assurance)、[金融数据接入层的职责反思](https://hpoenixf.com/blog/mcp-market-responsibility-retrospective)。

## 博客精选与完整阅读站

个人博客的 Agent 新稿聚焦系统架构、原则、架构设计与全景。PDF、时间语义、普通回复、MCP、Hook、压缩等模块细节在[完整阅读站](https://hpoenixf.com/eff-agent-article/)持续维护，不再作为个人博客的独立新稿或目录条目。

已有模块的旧 `/blog/` 地址保留明确迁移页，并指向真实对应正文；它们退出个人博客首页、列表、搜索、标签计数、RSS、sitemap 和前后篇推荐。静态迁移页不是 HTTP 301。旧个人、前端与读书文章保留原文及原有访问方式。

[博客选集规则](docs/blog-editorial-policy.md)约束后续同步；[迁移清单](blog-reader-migrations.json)只控制个人博客，不控制完整阅读站。博客托管的 `/eff-agent-article/` 全文与独立发布锁保持完整，不随个人博客选集删减。

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
