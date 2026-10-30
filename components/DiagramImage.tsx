'use client'

import { useCallback, useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'

export default function DiagramImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [english, setEnglish] = useState(false)
  const t = (zh: string, en: string) => (english ? en : zh)
  const [mounted, setMounted] = useState(false)
  const [opened, setOpened] = useState(false)
  const [scale, setScale] = useState(1)
  const [width, setWidth] = useState(300)
  const dialog = useRef<HTMLDialogElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const picture = useRef<HTMLImageElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const previousOverflow = useRef('')
  const active = useRef(false)
  const title = props.alt || t('文章图表', 'Article diagram')

  const fit = useCallback(() => {
    const image = picture.current
    const viewport = stage.current
    if (!image || !viewport || !image.naturalHeight) return
    setWidth(
      Math.max(
        1,
        Math.min(
          viewport.clientWidth - 32,
          ((viewport.clientHeight - 32) * image.naturalWidth) / image.naturalHeight
        )
      )
    )
    setScale(1)
  }, [])

  function cleanup() {
    if (!active.current) return
    active.current = false
    document.documentElement.style.overflow = previousOverflow.current
    setOpened(false)
    trigger.current?.focus({ preventScroll: true })
  }

  function close() {
    dialog.current?.close()
    cleanup()
  }
  function open() {
    if (!dialog.current || active.current) return
    previousOverflow.current = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    active.current = true
    try {
      dialog.current.showModal()
      setOpened(true)
    } catch {
      cleanup()
    }
  }

  useEffect(() => {
    setMounted(true)
    setEnglish(
      (
        trigger.current?.closest('[lang]')?.getAttribute('lang') || document.documentElement.lang
      ).startsWith('en')
    )
    return () => {
      if (active.current) document.documentElement.style.overflow = previousOverflow.current
    }
  }, [])

  useEffect(() => {
    if (!opened || !stage.current) return
    fit()
    // Scrollbars change stage dimensions during zoom; only a viewport resize should reset fit.
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [opened, fit])

  return (
    <span className="article-diagram-image">
      <button
        ref={trigger}
        type="button"
        className="block w-full rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`${t('放大查看图表', 'Enlarge diagram')}: ${title}`}
        aria-haspopup="dialog"
        disabled={!mounted}
        onClick={open}
      >
        {/* Native images also support generated SVG blob URLs without an optimization proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...props}
          alt={props.alt || ''}
          className={`article-diagram-preview ${props.className || ''}`}
        />
        <span className="diagram-zoom-trigger" aria-hidden="true">
          {t('放大查看图表', 'Enlarge diagram')}
        </span>
      </button>
      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="diagram-zoom-dialog"
            aria-label={title}
            onCancel={(event) => {
              event.preventDefault()
              close()
            }}
            onClose={cleanup}
          >
            <header className="diagram-zoom-toolbar">
              <strong>{t('图表细节', 'Diagram detail')}</strong>
              <div className="diagram-zoom-controls">
                <button
                  type="button"
                  aria-label={t('缩小', 'Zoom out')}
                  disabled={scale <= 0.25}
                  onClick={() => setScale(Math.max(0.25, scale / 1.25))}
                >
                  −
                </button>
                <output aria-live="polite">{Math.round(scale * 100)}%</output>
                <button
                  type="button"
                  aria-label={t('放大', 'Zoom in')}
                  disabled={scale >= 8}
                  onClick={() => setScale(Math.min(8, scale * 1.25))}
                >
                  +
                </button>
                <button type="button" onClick={fit}>
                  {t('适应屏幕', 'Fit screen')}
                </button>
                <a href={props.src} target="_blank" rel="noopener noreferrer">
                  {t('打开原图', 'Open original')}
                </a>
                <button type="button" onClick={close}>
                  {t('关闭 ×', 'Close ×')}
                </button>
              </div>
            </header>
            <div
              ref={stage}
              className="diagram-zoom-stage"
              role="region"
              // Named overflow region must remain keyboard-scrollable.
              // https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow#accessibility
              // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
              tabIndex={0}
              aria-label={t('滚动查看放大的图表', 'Scroll enlarged diagram')}
            >
              {opened && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={picture}
                  src={props.src}
                  alt={title}
                  style={{ width: `${width * scale}px` }}
                  onLoad={fit}
                />
              )}
            </div>
            <p className="diagram-zoom-hint">
              {t(
                '放大后可横向、纵向滚动查看；Esc 关闭并返回原位置。',
                'Zoom, then scroll horizontally or vertically. Escape closes and returns focus.'
              )}
            </p>
          </dialog>,
          document.body
        )}
    </span>
  )
}
