'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

export default function ViewerPage() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const url = new URL(window.location.href)
        //    const projectId = url.searchParams.get('projectId')
        //    const itemId = url.searchParams.get('itemId')

        const projectId = 'urn:adsk.wipprod:dm.lineage:vuA5l28ORI2Fogms71y19w'
        const itemId = 'urn:adsk.wipprod:dm.lineage:vuA5l28ORI2Fogms71y19w'
        if (!projectId || !itemId) {
          setError('projectId & itemId are required')
          return
        }

        // 1) access_token
        const t = await fetch('/api/aps/viewer-token').then((r) => r.json())
        if (!t.access_token) throw new Error('token error')

        // 2) urn
        const u = await fetch(
          `/api/aps/viewer-urn?projectId=${encodeURIComponent(
            projectId,
          )}&itemId=${encodeURIComponent(itemId)}`,
        ).then((r) => r.json())
        if (!u.urn) throw new Error('urn error')

        // 3) init viewer
        const options = {
          env: 'AutodeskProduction',
          accessToken: t.access_token,
        } as any
        ;(window as any).Autodesk.Viewing.Initializer(options, () => {
          const viewerDiv = document.getElementById('viewer')
          const viewer = new (window as any).Autodesk.Viewing.GuiViewer3D(
            viewerDiv,
          )
          viewer.start()
          const documentId = `urn:${u.urn}`

          ;(window as any).Autodesk.Viewing.Document.load(
            documentId,
            (doc: any) => {
              const defaultModel = doc.getRoot().getDefaultGeometry()
              viewer.loadDocumentNode(doc, defaultModel)
            },
            (err: any) => setError(`load error: ${JSON.stringify(err)}`),
          )
        })
      } catch (e: any) {
        setError(e.message || 'viewer init error')
      }
    })()
  }, [])
  return (
    <>
      <Script
        src="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.js"
        strategy="beforeInteractive"
      />
      <link
        rel="stylesheet"
        href="https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.min.css"
      />
      {error && <div style={{ color: 'red', padding: 8 }}>{error}</div>}
      <div id="viewer" style={{ width: '100%', height: '100vh' }} />
    </>
  )
}
