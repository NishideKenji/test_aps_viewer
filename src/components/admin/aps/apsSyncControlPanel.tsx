import { Button, Paper, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { type FC, useState } from 'react'

import { trpc } from '@/utils/trpc'

export type ApsSyncControlPanelProps = {
  onUpdateHubsAndProjects: () => Promise<void>
  onDeleteHubsAndProjects: () => Promise<void>
}

/**
 * APSデータを取得するためのコントロールパネル
 * コンポーネント
 * @returns
 */
export const ApsSyncControlPanel: FC<ApsSyncControlPanelProps> = ({
  onUpdateHubsAndProjects,
  onDeleteHubsAndProjects,
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const onDeleteContents =
    trpc.apsRouter.deleteContents.useMutation().mutateAsync

  const onGetContentsAll =
    trpc.apsRouter.getContentsAll.useMutation().mutateAsync

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
        <Typography component="h4" variant="h6">
          APS Hub / Project 更新
        </Typography>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onUpdateHubsAndProjects()
              enqueueSnackbar('Hub・Projectのデータを取得しました', {
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
          {isSubmitting ? 'Processing' : 'Update'}
        </Button>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="warning"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onDeleteHubsAndProjects()
              enqueueSnackbar('HubとProjectのデータを削除しました', {
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
          {isSubmitting ? 'Processing' : 'Delete Hubs'}
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
        <Typography component="h4" variant="h6">
          コンテンツ取得
        </Typography>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onGetContentsAll()
              enqueueSnackbar('全てのコンテンツを取得しました', {
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
          {isSubmitting ? 'Processing' : 'UPDATE All Level'}
        </Button>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="warning"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onDeleteContents()
              enqueueSnackbar('コンテンツのデータを削除しました', {
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
          {isSubmitting ? 'Processing' : 'Delete'}
        </Button>
      </Paper>
    </>
  )
}
