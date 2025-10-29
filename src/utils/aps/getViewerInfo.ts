// utils/aps/getViewerInfo.ts

export type ViewerInfo = {
  versionId: string
  urn: string // URL-safe base64
  dataType: string // e.g. "versions:autodesk.fusion360:Design"
  translated: boolean // Model Derivative manifest success ?
}

/** URL-safe base64 へ変換 */
function toUrlSafeBase64(s: string): string {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

/** manifest から翻訳済み判定 */
async function isTranslated(token: string, urn: string): Promise<boolean> {
  const res = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  )
  if (res.status === 200) {
    const j = await res.json()
    return j?.status === 'success'
  }
  // 404 = 派生データ未生成
  return false
}

/**
 * access_token + projectId + itemId → versionId + urn + dataType + translated
 */
export async function getViewerInfo(
  accessToken: string,
  projectId: string,
  itemId: string,
): Promise<ViewerInfo> {
  // 1) item → versions を取得
  const vRes = await fetch(
    `https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(
      projectId,
    )}/items/${encodeURIComponent(itemId)}/versions`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    },
  )
  if (!vRes.ok) {
    throw new Error(`APS versions ${vRes.status}: ${await vRes.text()}`)
  }
  const vJson = await vRes.json()
  const versions = (vJson.data ?? []) as any[]
  if (!versions.length) throw new Error('No versions for this item')

  const latest = versions[versions.length - 1]
  const versionId: string = latest.id
  const dataType: string =
    latest?.attributes?.extension?.type ?? 'versions:unknown'

  // 2) URN決定（derivatives優先 → なければ storage から生成）
  let urn: string | undefined = latest?.relationships?.derivatives?.data?.id as
    | string
    | undefined

  if (!urn) {
    const storageId: string | undefined =
      latest?.relationships?.storage?.data?.id
    if (!storageId) throw new Error('No storage.id for this version')
    urn = toUrlSafeBase64(storageId)
  }

  // 3) 翻訳済み？（manifest status=success で true）
  const translated = await isTranslated(accessToken, urn)

  return { versionId, urn, dataType, translated }
}
