type Manifest = {
  status?: string
  derivatives?: any[]
}

function hasViewableNode(d: any): boolean {
  if (!d) return false
  // 出力タイプが viewer 用か？
  const isViewableOutput = ['svf2', 'svf', 'otg'].includes(d.outputType)
  // 子に 3D/2D/graphics のロールがいて成功しているか？
  const children = d.children ?? []
  const childHasGeometry = children.some(
    (c: any) =>
      ['3d', '2d', 'graphics'].includes(c.role) &&
      (c.status === 'success' || c.progress === 'complete'),
  )
  if (isViewableOutput && childHasGeometry) return true
  // ネストしている場合に備えて再帰
  return children.some((c: any) => hasViewableNode(c))
}

/** manifest から「Viewer で表示可能な派生があるか」を判定 */
export async function isViewableReady(
  token: string,
  urn: string,
): Promise<boolean> {
  const clean = urn.replace(/^urn:/, '') // URL-safe Base64（'urn:' なし）
  const res = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${clean}/manifest`,
    { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
  )

  if (res.status === 404) return false // まだ何も派生が無い
  if (!res.ok) return false

  const j: Manifest = await res.json()
  if (j.status !== 'success') return false // 派生完了していない
  return (j.derivatives ?? []).some(hasViewableNode)
}
