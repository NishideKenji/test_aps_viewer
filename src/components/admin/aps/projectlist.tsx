import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSnackbar } from 'notistack'
import { useState } from 'react'

import type { ContentsIndexElement } from '@/utils/aps/apsContents'
import { trpc } from '@/utils/trpc'

interface Props {
  projects: {
    id: string
    name: string
    hubId: string
    hubName: string
    updatedAt: Date
  }[]
}

//Tokenの一覧を表示するためのコンポーネント(管理画面用)
export const ProjectListAdmin = ({ projects }: Props) => {
  const router = useRouter()

  // 現在のパスを取得
  const currentPath = router.asPath

  const { enqueueSnackbar } = useSnackbar()

  const [isSubmitting, setIsSubmitting] = useState(false)

  // APS Contents のトップレベルを同期するためのルーター
  const onSyncTopLevelContentsByProjectID =
    trpc.apsRouter.syncTopLevelContentsByProjectID.useMutation().mutateAsync

  // APS Contents の2階層目以降を同期するためのルーター
  const onSyncChildContentsByParentContentID =
    trpc.apsRouter.syncChildContentsByParentContentID.useMutation().mutateAsync

  // APS Contents の子コンテンツを取得するための内部ループ
  const onInternalSyncLoop = async (parentContent: ContentsIndexElement[]) => {
    for (const content of parentContent) {
      console.log('Syncing child contents for parent ID:', content.id)
      if (content.kind === 'folder') {
        const childContents = await onSyncChildContentsByParentContentID({
          parentId: content.id,
        })
        if (childContents) {
          console.log('Child contents:', childContents)
          await onInternalSyncLoop(childContents)
        }
        enqueueSnackbar('on loop', { variant: 'success' })
      }
    }
  }

  // APS Contents のインデックスを同期
  const handleUpdateClick = async (projectId: string) => {
    setIsSubmitting(true)

    const firstLevelContents = await onSyncTopLevelContentsByProjectID({
      projectId: projectId,
    })
    console.log('Synced 1st Level contents:', firstLevelContents)
    if (firstLevelContents) {
      await onInternalSyncLoop(firstLevelContents)
      console.log('1st level contents:', firstLevelContents)
    }
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Hub</TableCell>
          <TableCell>Project</TableCell>
          <TableCell>Updated</TableCell>
          <TableCell>APSと同期</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {projects.map((project, index) => {
          return (
            <TableRow key={index}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{project.hubName}</TableCell>
              <TableCell>
                <Link href={`${currentPath.replace(/\/$/, '')}/${project.id}`}>
                  {project.name}
                </Link>
              </TableCell>
              <TableCell>
                {dayjs(project.updatedAt).format('YYYY/MM/DD HH:mm')}
              </TableCell>
              <TableCell>
                <Button
                  disabled={isSubmitting}
                  type="submit"
                  variant="contained"
                  color="primary"
                  onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      //await onGetContentsStructureByProjectID({projectId: project.id,})
                      await handleUpdateClick(project.id)
                      enqueueSnackbar('Contentsのデータを取得しました', {
                        variant: 'success',
                      })
                    } catch (err) {
                      console.error(err)
                      enqueueSnackbar('システムエラーが発生しました', {
                        variant: 'error',
                      })
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                >
                  {isSubmitting ? 'Processing' : 'Sync'}
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
