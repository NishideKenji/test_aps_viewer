// utils/aps/firstLevel.ts
export type FirstLevelEntry = {
  id: string
  name: string
  kind: 'folder' | 'item'
  parentId: string
}

/**
 * Project の「トップフォルダ」を取得
 */
export async function getTopFolders(
  token: string,
  hubId: string,
  projectId: string,
) {
  const r = await fetch(
    `https://developer.api.autodesk.com/project/v1/hubs/${hubId}/projects/${projectId}/topFolders`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  if (!r.ok) throw new Error(`APS ${r.status}: ${await r.text()}`)
  const json = await r.json()
  // 通常1件（designs）が返りますが、配列で扱います
  return (json.data ?? []).map((f: any) => ({
    id: f.id, // 例: urn:adsk.wipprod:fs.folder:co.xxxxx
    name: f.attributes?.name ?? 'Top',
  }))
}

/**
 * 指定フォルダ直下（1階層）だけの中身を取得（folders + items）
 * ※ ページングが必要な場合は links.next を辿る処理を追加してください
 */
export async function getFolderContentsOnce(
  token: string,
  projectId: string,
  folderId: string,
): Promise<FirstLevelEntry[]> {
  const r = await fetch(
    `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${encodeURIComponent(
      folderId,
    )}/contents`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    },
  )
  if (!r.ok) throw new Error(`APS ${r.status}: ${await r.text()}`)
  const json = await r.json()

  return (json.data ?? []).map((e: any) => {
    if (e.type === 'folders') {
      return {
        id: e.id,
        name: e.attributes?.name ?? 'Folder',
        kind: 'folder' as const,
        parentId: folderId,
      }
    }
    // items（ファイル）
    return {
      id: e.id,
      name: e.attributes?.displayName ?? 'Item',
      kind: 'item' as const,
      parentId: folderId,
    }
  })
}

export async function getAllFolderContents(
  token: string,
  projectId: string,
  folderId: string,
  parentId: string | null = null,
): Promise<FirstLevelEntry[]> {
  // まず現在フォルダの直下を取得
  const entries = await getFolderContentsOnce(token, projectId, folderId)

  const results: FirstLevelEntry[] = []

  for (const e of entries) {
    results.push(e) // 今の階層を追加

    // 📁 フォルダならさらに中を掘る
    if (e.kind === 'folder') {
      console.log('called')
      const children = await getAllFolderContents(
        token,
        projectId,
        e.id,
        e.parentId,
      )
      results.push(...children)
    }
  }

  return results
}

/**
 * 🔹「Projectの第一階層」= すべてのトップフォルダ直下の entries（folders/items）をフラットで取得
 */
export async function getProjectAllLevel(
  token: string,
  hubId: string,
  projectId: string,
): Promise<FirstLevelEntry[]> {
  const tops = await getTopFolders(token, hubId, projectId)

  const results: FirstLevelEntry[] = []
  for (const t of tops) {
    const entries = await getAllFolderContents(token, projectId, t.id)
    results.push(...entries)
  }
  return results
}
