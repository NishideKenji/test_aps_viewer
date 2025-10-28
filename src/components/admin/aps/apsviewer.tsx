// components/AutodeskFusionViewer.tsx
import { useEffect, useRef, useState } from 'react'

type Props = {
  accessToken: string
  projectId: string
  itemId: string
  style?: React.CSSProperties
  onStatusChange?: (
    status: 'checking' | 'hidden' | 'loading' | 'shown' | 'error',
    info?: any,
  ) => void
}

/** Viewerで直接表示許可する拡張タイプ（items/versions 両方を許容） */
const VIEWABLE_TYPES = new Set<string>([
  'items:autodesk.fusion:Design',
  'items:autodesk.fusion:Drawing',
  // 追加（←スクショのケース）
  'items:autodesk.fusion360:Design',
  'items:autodesk.fusion360:Drawing',

  'versions:autodesk.fusion360:Design',
  'versions:autodesk.fusion360:Drawing',
])

async function waitForViewerGlobal(timeoutMs = 10000, intervalMs = 50) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const A = (window as any).Autodesk
    if (A?.Viewing) return A
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Viewer runtime not available (window.Autodesk.Viewing)')
}

/** 人向けに整形した「種別名」を返す */
function describeItemKind(extType?: string): string {
  if (!extType) return 'Unknown'
  if (extType.endsWith(':Design')) return 'Fusion Design（設計モデル）'
  if (extType.endsWith(':Drawing')) return 'Fusion Drawing（図面）'
  // 代表的なその他（用途に応じて追加してください）
  if (/fusionarchive/i.test(extType)) return 'Fusion Archive（アーカイブ）'
  if (/File/i.test(extType)) return 'ファイル（汎用）'
  return extType
}

export default function AutodeskFusionViewer({
  accessToken,
  projectId,
  itemId,
  style,
  onStatusChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<any>(null)

  const [canView, setCanView] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 情報パネル用の詳細
  const [extType, setExtType] = useState<string | undefined>(undefined)
  const [itemKind, setItemKind] = useState<string>('Unknown')
  const [reason, setReason] = useState<string | null>(null)
  const [derivativesUrn, setDerivativesUrn] = useState<string | null>(null)

  // 不足時の初期化
  useEffect(() => {
    if (!accessToken || !projectId || !itemId) {
      setCanView(false)
      setError(null)
      setExtType(undefined)
      setItemKind('Unknown')
      setReason('必須パラメータ不足（accessToken / projectId / itemId）')
      setDerivativesUrn(null)
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
        setError(null)
        setReason(null)
        setExtType(undefined)
        setItemKind('Unknown')
        setDerivativesUrn(null)
        setCanView(false)

        // 0) itemId が dm.lineage でなければ対象外
        const isLineage =
          typeof itemId === 'string' &&
          /^urn:adsk\.wipprod:dm\.lineage:/.test(itemId)
        if (!isLineage) {
          const r = 'itemId が dm.lineage 形式ではありません'
          setReason(r)
          onStatusChange?.('hidden', r)
          return
        }

        // 1) items で種別チェック（Design / Drawing のみ許可）
        let ok = false
        let itemType: string | undefined

        try {
          const itemRes = await fetch(
            `https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(
              projectId,
            )}/items/${encodeURIComponent(itemId)}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
              cache: 'no-store',
            },
          )
          if (itemRes.ok) {
            const itemJson = await itemRes.json()
            itemType = itemJson?.data?.attributes?.extension?.type
            if (itemType) {
              setExtType(itemType)
              setItemKind(describeItemKind(itemType))
              ok = VIEWABLE_TYPES.has(itemType)
            }
          }
        } catch {
          // noop（後段で versions による判定フォールバックあり）
        }

        // 2) 最新バージョン取得（URN 取得 & 予備の型チェック）
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
          const r = 'このアイテムにはバージョンがありません'
          setReason(r)
          onStatusChange?.('hidden', r)
          return
        }

        // items で判定できなかった場合、versions の型名でも許可
        if (!ok) {
          const extTypeV = latest?.attributes?.extension?.type as
            | string
            | undefined
          if (extTypeV) {
            setExtType((prev) => prev ?? extTypeV)
            setItemKind(describeItemKind(extTypeV))
            ok = VIEWABLE_TYPES.has(extTypeV)
          }
        }

        const derivativesId = latest?.relationships?.derivatives?.data?.id as
          | string
          | undefined
        if (!derivativesId) {
          const r = '派生データ（derivatives URN）がありません'
          setReason(r)
          onStatusChange?.('hidden', r)
          return
        }
        setDerivativesUrn(derivativesId)

        if (!ok) {
          const r = 'この種別はビューア未対応です'
          setReason(r)
          onStatusChange?.('hidden', {
            extType: itemType ?? latest?.attributes?.extension?.type,
            reason: r,
          })
          return
        }

        // 3) Viewer資産ロード（重複回避）
        await ensureViewerAssets()
        if (disposed) return

        // （ここを追加）
        const AutodeskNS = await waitForViewerGlobal().catch((e) => {
          throw e
        })

        // 4) Viewer初期化
        onStatusChange?.('loading')
        const options = { env: 'AutodeskProduction', accessToken } as any
        AutodeskNS.Viewing.Initializer(options, () => {
          if (disposed) return
          const div = containerRef.current
          if (!div) return

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
              setCanView(true)
              onStatusChange?.('shown', {
                extType: itemType ?? latest?.attributes?.extension?.type,
              })
            },
            (e: any) => {
              const msg = `Document.load error: ${JSON.stringify(e)}`
              setError(msg)
              setCanView(false)
              setReason('ドキュメントのロードに失敗しました')
              onStatusChange?.('error', e)
            },
          )
        })
      } catch (e: any) {
        if (disposed) return
        const msg = e?.message || String(e)
        setError(msg)
        setCanView(false)
        setReason('処理中にエラーが発生しました')
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

  // レイアウト：上部にViewer（可視化できる場合）、下部に情報パネル（常時）
  // 必須propsが欠けるときもパネルで理由は出す
  const wrapperStyle: React.CSSProperties = {
    width: '100%',
    ...style,
  }

  const panelStyle: React.CSSProperties = {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #e0e0e0',
    background: '#fafafa',
    fontSize: 14,
    lineHeight: 1.6,
    wordBreak: 'break-all',
  }

  const label: React.CSSProperties = {
    display: 'inline-block',
    minWidth: 140,
    color: '#555',
    fontWeight: 600,
  }

  return (
    <div style={wrapperStyle}>
      {/* Viewer領域（可視化可能時のみ表示） */}
      {canView ? (
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '60vh',
            minHeight: 360,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid #e0e0e0',
          }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: 180,
            minHeight: 180,
            borderRadius: 8,
            border: '1px dashed #c7c7c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#777',
            background: '#fcfcfc',
          }}
        >
          ビューアは表示されていません（下の情報をご確認ください）
        </div>
      )}

      {/* 情報パネル（常時） */}
      <div style={panelStyle}>
        <div>
          <span style={label}>itemId</span>
          {itemId || '(未指定)'}
        </div>
        <div>
          <span style={label}>拡張タイプ</span>
          {extType ?? '(取得中/不明)'}
        </div>
        <div>
          <span style={label}>種別（人向け）</span>
          {itemKind}
        </div>
        <div>
          <span style={label}>表示可否</span>
          {canView ? '表示可能（Viewerにロード済み）' : '表示不可'}
        </div>
        <div>
          <span style={label}>理由</span>
          {reason ?? '（特になし）'}
        </div>
        <div>
          <span style={label}>Derivatives URN</span>
          {derivativesUrn ?? '(未取得)'}
        </div>
        {error ? (
          <div style={{ marginTop: 8, color: '#b71c1c' }}>
            <strong>エラー:</strong> {error}
          </div>
        ) : null}
      </div>
    </div>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
