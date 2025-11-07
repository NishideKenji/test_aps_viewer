import { Button, Paper, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { type FC, useState } from 'react'

export type ApsSyncControlPanelProps = {
  onUpdateAllHubsAndProjects: () => Promise<void>
  onDeleteAllItems: () => Promise<void>
}

/**
 * APSデータを取得するためのコントロールパネル
 * コンポーネント
 * @returns
 */
export const ApsSyncControlPanel: FC<ApsSyncControlPanelProps> = ({
  onUpdateAllHubsAndProjects,
  onDeleteAllItems,
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
        <Typography component="h4" variant="h6">
          APS Hub / Project 同期
        </Typography>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onUpdateAllHubsAndProjects()
              enqueueSnackbar('Hub・Projectのデータを再取得しました', {
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
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
        <Typography component="h4" variant="h6">
          データ削除
        </Typography>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="warning"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onDeleteAllItems()
              enqueueSnackbar('すべてのデータを削除しました', {
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
          {isSubmitting ? 'Processing' : 'Delete All Items'}
        </Button>
      </Paper>
    </>
  )
}
