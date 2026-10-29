# Personal blog selection

The personal `/blog/` collection and the complete `/eff-agent-article/` reader have different editorial scopes.

- New Agent posts in the personal blog cover system architecture, design principles, architectural decisions and panoramas. Module-level implementation, protocol and detailed mechanism essays belong in the complete reader.
- Existing personal, frontend and book-history posts retain their bodies and visibility. Tag normalization is a separate metadata change, not permission to delete or hide them.
- `blog-reader-migrations.json` is the single authoritative mapping of reviewed module migrations. `node scripts/blog-curation.mjs . --write` generates the existing frontmatter and short-body projection while retaining the original title/date and other metadata; the build checks that projection exactly. Preserve the original blog URL as a clear migration page with `mergedInto` and the exact reader `canonicalUrl`; do not restore its old full body during later bulk synchronization. These static pages are not HTTP 301 redirects.
- Keep migrated posts outside personal home/list/search/tag/feed/sitemap/previous-next discovery, using the existing merged-post rules. Preserve Git history and actual reader destinations.
- Do not filter, truncate or repurpose `reader-source.json` using this selection. The complete reader retains its separately reviewed source pin and every existing edition receipt; its canonical deployment verification remains independent.
- New cross-posts require an editorial scope decision, not automatic copying of every reader essay. A genuine reclassification must update this reviewed migration contract explicitly.
