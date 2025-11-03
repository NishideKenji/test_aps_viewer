// ApsContentTree.tsx
// MUI v5の場合：
//import { TreeView, TreeItem } from '@mui/lab'
// MUI v6の場合：
import { TaskAlt } from '@mui/icons-material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import FolderIcon from '@mui/icons-material/Folder'
import { TreeItem, TreeView } from '@mui/lab'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnackbar } from 'notistack'
import React, { useMemo } from 'react'

import { trpc } from '@/utils/trpc'

type Content = {
  id: string
  projectId: string
  parentId: string
  name: string
  kind: string
  dataType: string | null
  translated: boolean | null
  urn: string | null
  updatedAt: Date
}

interface Props {
  contents: Content[]
}

// ツリーノード用型
type TreeNode = Content & { children: TreeNode[] }

/** フラット配列 -> ツリー構造に変換 */
function buildTree(list: Content[]): TreeNode[] {
  const map = new Map<string, TreeNode>()
  // すべて登録（children 空で初期化）
  list.forEach((item) => map.set(item.id, { ...item, children: [] }))

  const roots: TreeNode[] = []
  list.forEach((item) => {
    const node = map.get(item.id)!
    const parent = map.get(item.parentId)
    if (parent) {
      parent.children.push(node)
    } else {
      // 親が存在しない＝ルート扱い
      roots.push(node)
    }
  })

  // 表示順を安定化（名前昇順 → 更新降順など任意）
  const sortFn = (a: TreeNode, b: TreeNode) =>
    a.name.localeCompare(b.name, 'ja') ||
    dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf()

  const sortRecursively = (nodes: TreeNode[]) => {
    nodes.sort(sortFn)
    nodes.forEach((n) => sortRecursively(n.children))
  }
  sortRecursively(roots)

  return roots
}

/** TreeItemのラベル（名前＋メタ情報） */
function NodeLabel({ node, index }: { node: TreeNode; index?: number }) {
  const basePath = '/admin/apsitems'

  const { enqueueSnackbar } = useSnackbar()

  const onCheckIsViewableReadyById =
    trpc.apsRouter.syncContentInfoById.useMutation().mutateAsync

  const onEnsureSvf2ById =
    trpc.apsRouter.ensureSvf2ById.useMutation().mutateAsync

  const primary = node.urn ? (
    <Link href={`${basePath}/${node.projectId}/${node.id}`}>{node.name}</Link>
  ) : (
    <>{node.name}</>
  )

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
      <FolderIcon fontSize="small" />
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {primary}
      </Typography>

      {/* メタ情報（簡潔に右側へ） */}
      <Box
        component="span"
        sx={{
          ml: 1,
          display: 'inline-flex',
          gap: 0.5,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        {node.dataType && (
          <Chip
            size="small"
            label={node.dataType}
            variant="outlined"
            sx={{ height: 20 }}
          />
        )}
        {
          node.translated ? <TaskAlt color="success" /> : '' //<Cancel color="error" />も検討したが、非翻訳は情報として表示したいためアイコンは無し
        }
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {dayjs(node.updatedAt).format('YYYY/MM/DD HH:mm')}
        </Typography>
        {node.kind === 'item' && (
          <Button
            //disabled={isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            onClick={async () => {
              //setIsSubmitting(true)
              const ans = await onCheckIsViewableReadyById({
                id: node.id,
              })
              if (ans?.translated) {
                enqueueSnackbar('同期しました。Viewerで表示可能な状態です', {
                  variant: 'success',
                })
              } else {
                enqueueSnackbar(
                  '同期しました。Viewerで表示可能な状態ではありません',
                  {
                    variant: 'warning',
                  },
                )
              }
            }}
          >
            {'Sync'}
          </Button>
        )}
        {node.kind === 'item' && (
          <Button
            //disabled={isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            onClick={async () => {
              //setIsSubmitting(true)
              const ans = await onEnsureSvf2ById({
                id: node.id,
              })
              if (ans?.result === 'submitted') {
                enqueueSnackbar('翻訳を依頼しました', {
                  variant: 'success',
                })
              } else if (ans?.result === 'already-ready') {
                enqueueSnackbar('既に翻訳依頼済みです', {
                  variant: 'info',
                })
              } else {
                enqueueSnackbar('エラーが発生しました', {
                  variant: 'warning',
                })
              }
            }}
          >
            {'Translate'}
          </Button>
        )}
      </Box>
    </Stack>
  )
}

/** 再帰描画 */
function renderTree(node: TreeNode): React.ReactNode {
  return (
    <TreeItem
      key={node.id}
      nodeId={node.id}
      label={<NodeLabel node={node} />}
      // 必要であれば、TreeItemにprops追加（選択時ハイライトなど）
    >
      {node.children.map((child) => renderTree(child))}
    </TreeItem>
  )
}

// メイン：ツリー表示
export const ApsContentTreeAdmin: React.FC<Props> = ({ contents }) => {
  const roots = useMemo(() => buildTree(contents ?? []), [contents])

  // 展開制御が必要なら expanded/state を追加してください（ここではデフォルト挙動）
  return (
    <TreeView
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      sx={{
        width: '100%',
        maxWidth: 900,
        '& .MuiTreeItem-label': { py: 0.25 }, // 密度調整
      }}
    >
      {roots.map((r) => renderTree(r))}
    </TreeView>
  )
}
