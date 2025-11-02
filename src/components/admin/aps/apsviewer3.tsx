'use client'
import { useEffect, useRef } from 'react'

type Props = {
  urn: string
  accessToken: string
}

export default function ApsViewerMinimal({ urn, accessToken }: Props) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 1. Autodesk Viewer ライブラリを読み込む
    const script = document.createElement('script')
    script.src =
      'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.113.0/viewer3D.min.js'
    document.body.appendChild(script)

    script.onload = () => {
      const Autodesk = (window as any).Autodesk // ← これを追加
      // 2. Viewer 初期化（SVF2 用設定）
      Autodesk.Viewing.Initializer(
        {
          env: 'AutodeskProduction2',
          api: 'streamingV2',
          getAccessToken: (cb: (token: string, expires: number) => void) => {
            cb(accessToken, 3000)
          },
        },
        () => {
          // 3. Viewer を DOM に描画
          const viewer = new Autodesk.Viewing.GuiViewer3D(divRef.current!)
          viewer.start()

          // 4. ドキュメントロード
          Autodesk.Viewing.Document.load(
            urn.startsWith('urn:') ? urn : `urn:${urn}`,
            (doc: any) => {
              const geom =
                doc.getRoot().getDefaultGeometry() ||
                doc.getRoot().search({ role: '3d' })?.[0]
              if (geom) viewer.loadDocumentNode(doc, geom)
            },
            (err: any) => console.error('Document.load error:', err),
          )
        },
      )
    }

    return () => {
      if (divRef.current) divRef.current.innerHTML = ''
    }
  }, [urn, accessToken])

  return <div ref={divRef} style={{ width: '100%', height: '100%' }} />
}
