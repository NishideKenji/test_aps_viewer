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
  const onGetContentsStructureByProjectID =
    trpc.apsRouter.syncContentsStructureByProjectID.useMutation().mutateAsync

  const [isSubmitting, setIsSubmitting] = useState(false)
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
                      await onGetContentsStructureByProjectID({
                        projectId: project.id,
                      })
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
