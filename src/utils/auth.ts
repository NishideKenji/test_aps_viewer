// lib/apsAuth.ts

export type ApsTokenResponse = {
  token_type: 'Bearer'
  access_token: string
  expires_in: number // 秒単位
  refresh_token?: string // ローテーション発生時のみ返る
}

export async function refreshAccessToken(
  refreshToken: string,
  client_id: string,
  client_secret: string,
): Promise<ApsTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: client_id,
    client_secret: client_secret,
  })

  const r = await fetch(
    'https://developer.api.autodesk.com/authentication/v2/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    },
  )

  if (!r.ok) {
    throw new Error(`APS refresh failed: ${r.status} ${await r.text()}`)
  }

  return r.json() as Promise<ApsTokenResponse>
}
