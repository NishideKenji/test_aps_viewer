// components/ApsViewerDebug.tsx
import { useEffect, useRef, useState } from 'react'

type Props = {
  urn: string // URL-safe base64（'urn:' なしでも可／両対応）
  accessToken: string // 有効（viewables:read）の前提
  tokenExpiresInSeconds?: number // 未指定なら 3000
  className?: string
  style?: React.CSSProperties
  onStatusChange?: (s: Status, info?: any) => void
  prefer?: 'auto' | '3d' | '2d' // 既定: auto（3D→2Dの順に探す）
  debug?: boolean // 既定: true（ログ出力ON）
}

type Status =
  | 'checking-assets'
  | 'checking-container'
  | 'checking-manifest'
  | 'init-viewer'
  | 'starting-viewer'
  | 'loading-document'
  | 'searching-viewable'
  | 'shown'
  | 'error'

export default function ApsViewerDebug({
  urn,
  accessToken,
  tokenExpiresInSeconds = 3000,
  className,
  style,
  onStatusChange,
  prefer = 'auto',
  debug = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<any>(null)
  const [overlayError, setOverlayError] = useState<string | null>(null)

  const log = (...args: any[]) => debug && console.debug('[APSViewer]', ...args)
  const mask = (t: string, head = 12, tail = 6) =>
    t.length <= head + tail
      ? `${t.slice(0, Math.max(1, head))}…`
      : `${t.slice(0, head)}…${t.slice(-tail)}`

  useEffect(() => {
    let cancelled = false

    const emit = (s: Status, info?: any) => {
      log('STATUS:', s, info ?? '')
      onStatusChange?.(s, info)
    }
    const setErr = (e: any) => {
      const msg = e instanceof Error ? e.message : String(e)
      setOverlayError(msg)
      emit('error', msg)
      console.error('[APSViewer] error:', e)
    }

    async function loadViewerAssets(): Promise<void> {
      emit('checking-assets')
      const JS =
        'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js'
      const CSS =
        'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css'

      // CSS
      const hasCss = Array.from(
        document.querySelectorAll('link[rel="stylesheet"]'),
      ).some((l) => (l as HTMLLinkElement).href.includes('/viewers/7.'))
      if (!hasCss) {
        log('inject CSS:', CSS)
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = CSS
        document.head.appendChild(link)
      } else {
        log('CSS already present')
      }

      // JS
      if ((window as any).Autodesk?.Viewing) {
        log('Viewer JS already loaded')
        return
      }
      const hasScript = Array.from(document.scripts).some((s) =>
        (s as HTMLScriptElement).src.includes('/viewers/7.'),
      )
      if (!hasScript) {
        log('inject JS:', JS)
        const script = document.createElement('script')
        script.src = JS
        script.async = true
        script.onerror = () => setErr(new Error('Failed to load viewer script'))
        document.body.appendChild(script)
      } else {
        log('Viewer JS tag already in DOM (waiting for global)')
      }

      let n = 0
      await new Promise<void>((resolve, reject) => {
        const tick = () => {
          if ((window as any).Autodesk?.Viewing) return resolve()
          if (n++ > 400)
            return reject(
              new Error(
                'Viewer global not available (timeout while loading JS)',
              ),
            )
          setTimeout(tick, 25)
        }
        tick()
      })
    }

    async function checkContainer() {
      emit('checking-container')
      const box = containerRef.current
      if (!box) throw new Error('Container not found')
      const rect = box.getBoundingClientRect()
      log('container size:', rect.width, rect.height)
      if (rect.height < 10) {
        log(
          '%cWARNING: container height is very small (likely 0px). Parent needs explicit height.',
          'color:orange',
        )
      }
    }

    async function checkManifest(urnInput: string) {
      emit('checking-manifest')
      const cleanUrn = urnInput.replace(/^urn:/, '')
      const url = `https://developer.api.autodesk.com/modelderivative/v2/designdata/${cleanUrn}/manifest`
      log('GET manifest:', url)
      log('token (masked):', mask(accessToken))
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
      })
      log('manifest status:', res.status)
      if (res.status !== 200) {
        const body = await res.text().catch(() => '')
        throw new Error(`Manifest ${res.status}: ${body.slice(0, 300)}`)
      }
      const j = await res.json()
      log('manifest body:', j)
      if (j?.status !== 'success') {
        throw new Error(`Manifest status not success: ${j?.status}`)
      }
    }

    async function start() {
      try {
        setOverlayError(null)

        // 基本チェック
        if (!urn) throw new Error('URN is empty')
        if (!accessToken) throw new Error('accessToken is empty')
        log('props:', {
          urn,
          tokenMasked: mask(accessToken),
          tokenExpiresInSeconds,
        })

        await checkContainer()
        await loadViewerAssets()
        if (cancelled) return

        await checkManifest(urn)

        // 既存viewerクリーンアップ
        if (viewerRef.current) {
          try {
            viewerRef.current.finish()
          } catch {}
          viewerRef.current = null
        }

        // 初期化
        emit('init-viewer')
        const Autodesk = (window as any).Autodesk
        await new Promise<void>((resolve) => {
          Autodesk.Viewing.Initializer(
            {
              env: 'AutodeskProduction',
              getAccessToken: (cb: (t: string, e: number) => void) => {
                cb(accessToken, tokenExpiresInSeconds)
              },
            },
            () => resolve(),
          )
        })

        if (cancelled) return

        // start
        emit('starting-viewer')
        const v = new Autodesk.Viewing.GuiViewer3D(containerRef.current!)
        viewerRef.current = v
        const started = v.start()
        log('viewer.start() return:', started)
        if (started !== 0)
          throw new Error('Viewer start failed (non-zero return)')

        // Document.load
        emit('loading-document', urn)
        const docUrn = urn.startsWith('urn:') ? urn : `urn:${urn}`
        Autodesk.Viewing.Document.load(
          docUrn,
          (doc: any) => {
            try {
              emit('searching-viewable')
              const root = doc.getRoot()

              let node: any | null = root.getDefaultGeometry()
              log('defaultGeometry exists:', !!node)

              // 明示選択
              if (!node && prefer !== 'auto') {
                const role = prefer === '3d' ? '3d' : '2d'
                const picked = root.search({ role })?.[0]
                log(`search role=${role} found:`, !!picked)
                node = picked ?? null
              }

              // 最後の保険：3d→2d
              if (!node) {
                const threed = root.search({ role: '3d' })?.[0]
                const twod = root.search({ role: '2d' })?.[0]
                node = threed || twod || null
                log('fallback search 3d/2d -> found?:', !!node)
              }

              if (!node)
                throw new Error('No viewable geometry found in document')

              v.loadDocumentNode(doc, node)
                .then(() => {
                  emit('shown')
                })
                .catch((err: any) => setErr(err))
            } catch (e) {
              setErr(e)
            }
          },
          (err: any) => setErr(err),
        )
      } catch (e) {
        setErr(e)
      }
    }

    start()

    return () => {
      cancelled = true
      if (viewerRef.current) {
        try {
          viewerRef.current.finish()
        } catch {}
        viewerRef.current = null
      }
    }
  }, [urn, accessToken, tokenExpiresInSeconds, prefer, debug])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      {overlayError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'rgba(255,0,0,0.06)',
            border: '1px dashed #f00',
            color: '#b00020',
            padding: '8px',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
          }}
        >
          <strong>Viewer error:</strong> {overlayError}
        </div>
      )}
    </div>
  )
}
