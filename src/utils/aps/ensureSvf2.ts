import { isViewableReady } from './isViewableReady'

/** viewable が無ければ SVF2 翻訳を投げる（US リージョン想定） */
export async function ensureSvf2(token: string, urn: string) {
  const clean = urn.replace(/^urn:/, '')
  const ready = await isViewableReady(token, clean)
  if (ready) return 'already-ready'

  const res = await fetch(
    'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { urn: clean },
        output: {
          destination: { region: 'us' },
          formats: [{ type: 'svf2', views: ['3d', '2d'] }],
        },
      }),
    },
  )
  if (!res.ok)
    throw new Error(`translate job failed: ${res.status} ${await res.text()}`)
  return 'submitted'
}

export async function ensureSvf2Minimal(
  token: string,
  urn: string,
  region?: 'us' | 'emea',
) {
  const clean = urn.replace(/^urn:/, '')
  if (await isViewableReady(token, clean)) return 'already-ready'

  const payload: any = {
    input: { urn: clean },
    output: {
      ...(region ? { destination: { region } } : {}),
      formats: [{ type: 'svf2', views: ['3d'] }], // ← まず3D単独で
    },
  }

  const res = await fetch(
    'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
  )
  const body = await res.text()
  if (!res.ok) throw new Error(`translate job failed: ${res.status} ${body}`)
  return 'submitted'
}

type Region = 'us' | 'emea'
type View = '3d' | '2d'
type Format = 'svf2' | 'otg' | 'svf'

/** Viewer用派生を未生成なら、対応フォーマットで翻訳を投げる（順次フォールバック） */
export async function ensureViewableWithFallback(
  token: string,
  urn: string,
  region?: Region,
): Promise<{
  result: 'already-ready' | 'submitted'
  used?: { format: Format; views: View[] }
}> {
  const clean = urn.replace(/^urn:/, '')

  // 既に viewable があれば終了
  if (await isViewableReady(token, clean)) {
    return { result: 'already-ready' }
  }

  // 試す順序（必要に応じて並び替えOK）
  const candidates: Array<{ format: Format; views: View[] }> = [
    { format: 'svf2', views: ['3d'] },
    { format: 'svf2', views: ['2d'] },
    { format: 'otg', views: ['3d'] },
    { format: 'otg', views: ['2d'] },
    { format: 'svf', views: ['3d'] },
    { format: 'svf', views: ['2d'] },
  ]

  let lastErrorBody = ''
  for (const cand of candidates) {
    const payload: any = {
      input: { urn: clean },
      output: {
        ...(region ? { destination: { region } } : {}),
        formats: [{ type: cand.format, views: cand.views }],
      },
    }

    const res = await fetch(
      'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      },
    )
    const body = await res.text()
    if (res.ok) {
      // accepted
      return { result: 'submitted', used: cand }
    }

    // 406 / 400などは次の候補へ（メモだけ残す）
    lastErrorBody = `${res.status} ${body}`
    // 403 は権限不足（data:write 必須）、404 はリージョン不一致や URN 問題が多いので即中断して良い
    if (res.status === 403 || res.status === 404) {
      throw new Error(`translate job failed early: ${lastErrorBody}`)
    }
  }

  throw new Error(`translate job failed for all formats: ${lastErrorBody}`)
}
