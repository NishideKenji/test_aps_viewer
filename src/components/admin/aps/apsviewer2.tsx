// components/ApsViewer.tsx
import { useEffect, useRef } from 'react'

type Props = {
  /** Model Derivative の URL-safe base64 URN（先頭に 'urn:' は付けずに渡す想定） */
  urn: string
  /** APSの access_token（viewables:read を含む。有効である前提） */
  accessToken: string
  /** （任意）トークンの残寿命秒数。未指定なら 3000 秒で渡します */
  tokenExpiresInSeconds?: number
  /** 見た目用 */
  className?: string
  style?: React.CSSProperties
  /** 状態通知（任意） */
  onStatusChange?: (s: 'loading' | 'shown' | 'error', info?: any) => void
}

/** ViewerのJS/CSSを1回だけ読み込む */
function loadViewerAssets(): Promise<void> {
  const JS_SRC =
    'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'
  const CSS_HREF =
    'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'

  return new Promise<void>((resolve, reject) => {
    // 既に読み込み済み？
    if ((window as any).Autodesk?.Viewing) return resolve()

    // CSS
    const hasCss = Array.from(
      document.querySelectorAll('link[rel="stylesheet"]'),
    ).some((l) => (l as HTMLLinkElement).href.includes('/viewers/7.'))
    if (!hasCss) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = CSS_HREF
      document.head.appendChild(link)
    }

    // JS
    const scriptExists = Array.from(document.scripts).some((s) =>
      (s as HTMLScriptElement).src.includes('/viewers/7.'),
    )
    if (scriptExists) {
      // 既に別所で読み込み開始している場合は onload を待たずに少し遅延 resolve
      const check = () =>
        (window as any).Autodesk?.Viewing ? resolve() : setTimeout(check, 50)
      return check()
    }

    const script = document.createElement('script')
    script.src = JS_SRC
    script.onload = () => resolve()
    script.onerror = (e) =>
      reject(new Error('Failed to load APS Viewer script'))
    document.body.appendChild(script)
  })
}

/**
 * ただ表示するだけのクリーンなViewerコンポーネント
 * - props: urn, accessToken（有効前提）
 * - SVF2 など「翻訳済み」であることが前提
 */
export default function ApsViewer({
  urn,
  accessToken,
  tokenExpiresInSeconds = 3000,
  className,
  style,
  onStatusChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null) // Autodesk.Viewing.GuiViewer3D

  useEffect(() => {
    let cancelled = false
    let viewer: any

    const start = async () => {
      try {
        onStatusChange?.('loading')
        await loadViewerAssets()
        if (cancelled) return

        const Autodesk = (window as any).Autodesk
        if (!Autodesk?.Viewing)
          throw new Error('Autodesk.Viewing not available')

        // すでに別のViewerが存在すればクリーンアップ
        if (viewerRef.current) {
          try {
            viewerRef.current.finish()
          } catch {}
          viewerRef.current = null
        }

        // 初期化
        Autodesk.Viewing.Initializer(
          {
            env: 'AutodeskProduction',
            getAccessToken: (cb: (token: string, expires: number) => void) => {
              // ※ props でもらったトークンをそのまま渡す（単純運用）
              cb(accessToken, tokenExpiresInSeconds)
            },
          },
          async () => {
            if (cancelled) return
            const container = containerRef.current
            if (!container) throw new Error('Container not ready')

            viewer = new Autodesk.Viewing.GuiViewer3D(container)
            viewerRef.current = viewer
            const started = viewer.start()
            if (started !== 0) throw new Error('Viewer start failed')

            const docUrn = 'urn:' + urn
            Autodesk.Viewing.Document.load(
              docUrn,
              (doc: any) => {
                // 代表的な拡張（Design/ Drawing / CompositeDesign / core:File）は
                // getDefaultGeometry() で大抵いける。2D/3D混在でもOK。
                const defaultModel = doc.getRoot().getDefaultGeometry()
                if (!defaultModel) throw new Error('No default viewable')
                viewer
                  .loadDocumentNode(doc, defaultModel)
                  .then(() => {
                    onStatusChange?.('shown')
                  })
                  .catch((err: any) => {
                    onStatusChange?.('error', err)
                  })
              },
              (err: any) => {
                onStatusChange?.('error', err)
              },
            )
          },
        )
      } catch (err) {
        onStatusChange?.('error', err)
      }
    }

    start()

    // アンマウント時クリーンアップ
    return () => {
      cancelled = true
      if (viewerRef.current) {
        try {
          viewerRef.current.finish()
        } catch {}
        viewerRef.current = null
      }
    }
    // urn / accessToken が変わったら再初期化（有効前提のため単純にやり直し）
  }, [urn, accessToken, tokenExpiresInSeconds])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
    />
  )
}
