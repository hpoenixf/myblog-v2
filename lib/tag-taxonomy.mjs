import taxonomy from '../blog-tag-taxonomy.json' with { type: 'json' }
export { taxonomy }
export const resolveTag = (tag) => taxonomy.aliases[tag] ?? tag
export const tagLabel = (tag) => taxonomy.labels[resolveTag(tag)] ?? resolveTag(tag)
export const tagRoutes = (counts) =>
  [
    ...new Set([
      ...Object.keys(counts),
      ...Object.keys(taxonomy.historicalCounts),
      ...Object.keys(taxonomy.aliases),
      ...Object.values(taxonomy.aliases),
    ]),
  ].sort()
export const tagPageCount = (tag, counts, size = 10) =>
  Math.max(
    1,
    Math.ceil((counts[resolveTag(tag)] ?? 0) / size),
    Math.ceil((taxonomy.historicalCounts[tag] ?? 0) / size)
  )
export const canonicalTagUrl = (tag) =>
  `https://hpoenixf.com/tags/${encodeURIComponent(resolveTag(tag))}`
