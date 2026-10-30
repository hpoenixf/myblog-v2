'use client'

import { useEffect, useId, useRef, useState } from 'react'
import DiagramImage from './DiagramImage'
import {
  readableRelations,
  diagramDimensions,
  needsReadableRelations,
  renderRelations,
} from '../lib/diagram-reading.mjs'

export default function MermaidDiagram({ chart }: { chart: string }) {
  const reactId = useId()
  const container = useRef<HTMLDivElement>(null)
  const [english, setEnglish] = useState(false)
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    setDiagramUrl(null)
    setSize(null)
    setFailed(false)
    setEnglish(
      (
        container.current?.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang
      ).startsWith('en')
    )
    let cancelled = false
    let objectUrl: string | undefined
    const id = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`

    async function renderDiagram() {
      try {
        const { default: mermaid } = await import('mermaid')
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })
        await document.fonts.ready
        const result = await mermaid.render(id, chart)
        if (!cancelled) {
          objectUrl = URL.createObjectURL(new Blob([result.svg], { type: 'image/svg+xml' }))
          setDiagramUrl(objectUrl)
          setSize(diagramDimensions(result.svg))
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setDiagramUrl(null)
          setFailed(true)
        }
      }
    }

    void renderDiagram()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [chart, reactId])

  if (!diagramUrl) {
    return (
      <div ref={container}>
        <figure className="my-6 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          {failed && (
            <figcaption className="mb-2 text-sm text-red-600">
              {english
                ? 'Diagram rendering failed; Mermaid source is shown.'
                : '图表渲染失败，显示 Mermaid 源码。'}
            </figcaption>
          )}
          <pre className="m-0 whitespace-pre-wrap bg-transparent p-0 text-sm text-gray-800 dark:text-gray-200">
            <code>{chart}</code>
          </pre>
        </figure>
      </div>
    )
  }

  const diagram = (
    <figure
      className="my-6 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-white"
      aria-label={english ? 'Mermaid diagram' : 'Mermaid 图表'}
    >
      <DiagramImage src={diagramUrl} alt={english ? 'Mermaid diagram' : 'Mermaid 图表'} />
    </figure>
  )
  const projection = readableRelations(chart)
  if (!needsReadableRelations(size) || !projection.supported)
    return <div ref={container}>{diagram}</div>
  return (
    <div ref={container}>
      <div dangerouslySetInnerHTML={{ __html: renderRelations(projection, english) }} />
      <details className="diagram-full-details">
        <summary>
          {english ? 'Complete diagram · enlarge for detail' : '完整关系图 · 可放大查看细节'}
        </summary>
        {diagram}
      </details>
    </div>
  )
}
