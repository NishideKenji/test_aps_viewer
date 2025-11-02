import { Button, Grid, Paper, Typography } from '@mui/material'
//import dayjs from 'dayjs'
import { useSnackbar } from 'notistack'
import { type FC, useState } from 'react'

//import theme from '@/theme'

export type ControlPanelForUpdateTokenManuallyProps = {
  onUpdateToken: () => Promise<void>
}

/**
 * 軌道パス計算機能をUIから手動で駆動するためのコントロールパネルを提供する
 * コンポーネント
 * @returns
 */
export const ControlPanelForUpdateTokenManually: FC<
  ControlPanelForUpdateTokenManuallyProps
> = ({ onUpdateToken }) => {
  const { enqueueSnackbar } = useSnackbar()

  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
        <Typography component="h4" variant="h6">
          APS アクセストークン更新
        </Typography>

        <Button
          disabled={isSubmitting}
          type="submit"
          variant="contained"
          color="primary"
          onClick={async () => {
            setIsSubmitting(true)
            try {
              await onUpdateToken()
              enqueueSnackbar('トークンを更新しました', {
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
          {isSubmitting ? 'Processing' : 'Run Batch'}
        </Button>
      </Paper>
    </>
  )
}
