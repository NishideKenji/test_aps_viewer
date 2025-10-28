import { Button, Grid, Paper, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { type FC, useState } from 'react'

import { trpc } from '@/utils/trpc'

import { ApsContentList } from './apsContentList'
import AutodeskFusionViewer from './apsviewer'
import { ProjectList } from './projectlist'

export type ControlPanelForApsListSyncManuallyProps = {
  onGetHubs: () => Promise<void>
  onGetProjects: () => Promise<void>
}

/**
 * APSデータを取得するためのコントロールパネル
 * コンポーネント
 * @returns
 */
export const ControlPanelForApsListSyncManually: FC<
  ControlPanelForApsListSyncManuallyProps
> = ({ onGetHubs, onGetProjects }) => {
  const { enqueueSnackbar } = useSnackbar()

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: projectlist, isLoading: isLoadingProjects } =
    trpc.apsRouter.projectlist.useQuery(undefined)

  const onGetFirstLevel = trpc.apsRouter.updateFiles.useMutation().mutateAsync

  const accessToken = trpc.apsRouter.getToken.useQuery({
    type: 'APS_ACCESS_TOKEN',
  }).data

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
          <Typography component="h4" variant="h6">
            APS Hub更新
          </Typography>

          <Button
            disabled={isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            onClick={async () => {
              setIsSubmitting(true)
              try {
                await onGetHubs()
                enqueueSnackbar('Hubsのデータ取得しました', {
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

        <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
          <Typography component="h4" variant="h6">
            APS Project更新
          </Typography>

          <Button
            disabled={isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            onClick={async () => {
              setIsSubmitting(true)
              try {
                await onGetProjects()
                enqueueSnackbar('Projectsのデータ取得しました', {
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

        <Paper variant="outlined" sx={{ p: 2, background: 'light' }}>
          <Typography component="h4" variant="h6">
            第一階層取得
          </Typography>

          <Button
            disabled={isSubmitting}
            type="submit"
            variant="contained"
            color="primary"
            onClick={async () => {
              setIsSubmitting(true)
              try {
                await onGetFirstLevel()
                enqueueSnackbar('第一階層のデータ取得しました', {
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
        {projectlist && <ProjectList projects={projectlist} />}
        <ApsContentList />
        {accessToken && projectlist && projectlist.length > 0 && (
          <AutodeskFusionViewer
            accessToken={accessToken}
            projectId={projectlist[0].id}
            itemId={'itemId'}
          />
        )}
      </Grid>
    </>
  )
}
