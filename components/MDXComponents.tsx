import TOCInline from 'pliny/ui/TOCInline'
import Pre from 'pliny/ui/Pre'
import BlogNewsletterForm from 'pliny/ui/BlogNewsletterForm'
import type { MDXComponents } from 'mdx/types'
import Image from './Image'
import CustomLink from './Link'
import TableWrapper from './TableWrapper'
import MermaidDiagram from './MermaidDiagram'
import DiagramImage from './DiagramImage'
import { Children, isValidElement, type ReactNode, type ImgHTMLAttributes } from 'react'

type CodeProps = { className?: string; children?: ReactNode }

function textContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') return String(child)
      if (isValidElement<{ children?: ReactNode }>(child)) return textContent(child.props.children)
      return ''
    })
    .join('')
}

function MDXPre({ children }: { children?: ReactNode }) {
  if (
    isValidElement<CodeProps>(children) &&
    children.props.className?.split(/\s+/).includes('language-mermaid')
  ) {
    return <MermaidDiagram chart={textContent(children.props.children)} />
  }

  return <Pre>{children}</Pre>
}

function MDXImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof props.src === 'string' && /\.svg(?:[?#]|$)/i.test(props.src)) {
    return <DiagramImage {...props} />
  }
  // Retain historical photographs and non-diagram images unchanged.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} />
}

export const components: MDXComponents = {
  Image,
  img: MDXImage,
  TOCInline,
  a: CustomLink,
  pre: MDXPre,
  table: TableWrapper,
  BlogNewsletterForm,
}
