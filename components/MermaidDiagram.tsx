'use client'

import { useEffect, useId, useState } from 'react'

export default function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId()
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import('mermaid')
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })
        const result = await mermaid.render(id, chart)
        if (!cancelled) {
          setSvg(result.svg)
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setSvg(null)
          setFailed(true)
        }
      }
    }

    void renderDiagram()
    return () => {
      cancelled = true
    }
  }, [chart, reactId])

  if (!svg) {
    return (
      <figure className="my-6 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        {failed && (
          <figcaption className="mb-2 text-sm text-red-600">
            图表渲染失败，显示 Mermaid 源码。
          </figcaption>
        )}
        <pre className="m-0 whitespace-pre-wrap bg-transparent p-0 text-sm text-gray-800 dark:text-gray-200">
          <code>{chart}</code>
        </pre>
      </figure>
    )
  }

  return (
    <figure
      className="my-6 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white"
      role="img"
      aria-label="Mermaid 图表"
    >
      <div className="mermaid-diagram" dangerouslySetInnerHTML={{ __html: svg }} />
    </figure>
  )
}
