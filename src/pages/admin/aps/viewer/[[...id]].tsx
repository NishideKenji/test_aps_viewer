import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import React, { useMemo } from 'react'

import { KEYNAME_APS_ACCESS_TOKEN } from '@/global_constants'
import { trpc } from '@/utils/trpc'

const ApsViewerDebug = dynamic(
  () => import('@/components/admin/aps/apsviewer2'),
  {
    ssr: false,
  },
)

export default function ApsViewerPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // ★ isReadyを待ってからquery.idを読む
  const urnParam = useMemo(() => {
    if (!router.isReady) return ''
    const q = router.query.id
    return Array.isArray(q) ? q[0] : q ?? ''
  }, [router.isReady, router.query.id])

  //サーバーサイド変数なので機能しないので、今後必要なら修正
  const { data: accessToken, isLoading: isLoadingToken } =
    trpc.apsRouter.getToken.useQuery({ type: 'APS_ACCESS_TOKEN' })

  const ContentsInfo = trpc.apsRouter.getContentInfoByUrn.useQuery({
    urn: urnParam,
  })
  console.log('[Caller] ContentsInfo:', ContentsInfo.data)

  const effectiveUrn = urnParam // || fallbackUrn

  if (typeof window !== 'undefined') {
    console.debug('[Caller] router.isReady:', router.isReady)
    console.debug('[Caller] urnParam:', urnParam || '(empty)')
    console.debug(
      '[Caller] effectiveUrn (masked):',
      effectiveUrn.slice(0, 12) + '…' + effectiveUrn.slice(-6),
    )
    console.debug(
      '[Caller] token masked:',
      accessToken
        ? accessToken.slice(0, 12) + '…' + accessToken.slice(-6)
        : '(none)',
    )
  }

  return (
    <div style={{ width: '100%', height: '80vh', border: '1px dashed #E0A' }}>
      {!session ? (
        <div style={{ padding: 8 }}>No session</div>
      ) : !router.isReady ? (
        <div style={{ padding: 8 }}>Waiting router…</div>
      ) : !accessToken ? (
        <div style={{ padding: 8 }}>
          Token: {isLoadingToken ? 'loading…' : 'missing'}
        </div>
      ) : (
        <ApsViewerDebug
          urn={effectiveUrn} // ← ここが常に値ありになる
          accessToken={accessToken} // viewables:read 必須
          prefer="auto"
          debug={true}
        />
      )}
    </div>
  )
}
