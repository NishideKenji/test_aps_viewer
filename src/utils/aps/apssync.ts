export async function getHubsData(token: string) {
  const r = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`APS ${r.status}: ${await r.text()}`)
  return r.json() // ← 素のデータだけ返す
}

export async function getHubsList(token: string) {
  const r = await fetch('https://developer.api.autodesk.com/project/v1/hubs', {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!r.ok) throw new Error(`APS ${r.status}: ${await r.text()}`)

  const json = await r.json()

  return json.data.map((hub: any) => ({
    id: hub.id,
    name: hub.attributes?.name ?? 'Unknown Hub',
  }))
}

export async function getProjectsList(token: string, hubId: string) {
  const r = await fetch(
    `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )

  if (!r.ok) throw new Error(`APS ${r.status}: ${await r.text()}`)

  const json = await r.json()

  return json.data.map((prj: any) => ({
    id: prj.id,
    name: prj.attributes?.name ?? 'Unknown Project',
  }))
}
