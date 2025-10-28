// components/AutodeskFusionViewer.tsx
import { useEffect, useRef, useState } from 'react'

type Props = {
  /** DBから取得したAPS Access Token（60分想定） */
  accessToken: string
  /** APS projectId（a.Yn...） */
  projectId: string
  /** APS itemId（urn:adsk.wipprod:dm.lineage:...） */
  itemId: string
  style?: React.CSSProperties
  onStatusChange?: (
    status: 'checking' | 'hidden' | 'loading' | 'shown' | 'error',
    info?: any,
  ) => void
}

/**
 * Fusion 3D/2D（Design/Drawing）のみViewer表示。
 * 必須propsが欠ける/対象外のときは何も描画しない（null）。
 */
export default function AutodeskFusionViewer({
  accessToken,
  projectId,
  itemId,
  style,
  onStatusChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<any>(null)
  const [shouldShow, setShouldShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 不足時は非表示
  useEffect(() => {
    if (!accessToken || !projectId || !itemId) {
      setShouldShow(false)
      setError(null)
      onStatusChange?.('hidden', 'missing props')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectId, itemId])

  useEffect(() => {
    if (!accessToken || !projectId || !itemId) return

    let disposed = false

    async function run() {
      try {
        onStatusChange?.('checking')

        // 1) 最新バージョン取得 → Fusion 3D/2D 判定
        const verRes = await fetch(
          `https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(
            projectId,
          )}/items/${encodeURIComponent(itemId)}/versions`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
          },
        )
        if (!verRes.ok) {
          const t = await verRes.text()
          throw new Error(`versions ${verRes.status}: ${t}`)
        }
        const verJson = await verRes.json()
        const latest = verJson?.data?.[0]
        if (!latest) {
          setShouldShow(false)
          onStatusChange?.('hidden', 'no versions')
          return
        }

        const extType = latest?.attributes?.extension?.type as
          | string
          | undefined
        const derivativesId = latest?.relationships?.derivatives?.data?.id as
          | string
          | undefined

        const isFusion3D = extType === 'items:autodesk.fusion:Design'
        const isFusion2D = extType === 'items:autodesk.fusion:Drawing'

        if (!isFusion3D && !isFusion2D) {
          setShouldShow(false)
          onStatusChange?.('hidden', { extType })
          return
        }
        if (!derivativesId) {
          setShouldShow(false)
          onStatusChange?.('hidden', 'no derivatives urn')
          return
        }

        // 2) Viewer資産ロード（重複回避）
        await ensureViewerAssets()
        if (disposed) return

        // 3) Viewer初期化
        onStatusChange?.('loading')
        const AutodeskNS = (window as any).Autodesk
        const options = { env: 'AutodeskProduction', accessToken } as any

        AutodeskNS.Viewing.Initializer(options, () => {
          if (disposed) return

          const div = containerRef.current
          if (!div) return

          // 既存のviewerを破棄（再マウント対策）
          if (viewerRef.current) {
            try {
              viewerRef.current.finish()
            } catch {}
            viewerRef.current = null
          }

          const viewer = new AutodeskNS.Viewing.GuiViewer3D(div)
          viewerRef.current = viewer
          viewer.start()

          const urn = derivativesId.replace(/^urn:/, '')
          const docId = `urn:${urn}`

          AutodeskNS.Viewing.Document.load(
            docId,
            (doc: any) => {
              if (disposed) return
              const defaultModel = doc.getRoot().getDefaultGeometry()
              viewer.loadDocumentNode(doc, defaultModel)
              setShouldShow(true)
              onStatusChange?.('shown', { extType })
            },
            (e: any) => {
              setError(`Document.load error: ${JSON.stringify(e)}`)
              setShouldShow(false)
              onStatusChange?.('error', e)
            },
          )
        })
      } catch (e: any) {
        if (disposed) return
        setError(e.message || String(e))
        setShouldShow(false)
        onStatusChange?.('error', e)
      }
    }

    run()

    return () => {
      disposed = true
      try {
        viewerRef.current?.finish?.()
      } catch {}
      viewerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, projectId, itemId])

  if (!accessToken || !projectId || !itemId) return null
  if (!shouldShow) return null

  return (
    <>
      {/* viewer3D.js / style は ensureViewerAssets() が動的に読む */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: '60vh', ...style }}
      />
      {error ? <span style={{ color: 'red' }}>{error}</span> : null}
    </>
  )
}

async function ensureViewerAssets() {
  const w = window as any
  if (w.Autodesk?.Viewing) return

  await Promise.all([
    loadScript(
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js',
    ),
    loadStyle(
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css',
    ),
  ])
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const exists = Array.from(document.scripts).some((s) => s.src === src)
    if (exists) return resolve()
    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.onload = () => resolve()
    el.onerror = (e) => reject(e)
    document.head.appendChild(el)
  })
}

function loadStyle(href: string) {
  return new Promise<void>((resolve, reject) => {
    const exists = Array.from(document.styleSheets).some(
      (s: any) => s?.href === href,
    )
    if (exists) return resolve()
    const el = document.createElement('link')
    el.rel = 'stylesheet'
    el.href = href
    el.onload = () => resolve()
    el.onerror = (e) => reject(e)
    document.head.appendChild(el)
  })
}
