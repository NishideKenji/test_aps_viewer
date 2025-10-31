import { Button, Grid, Paper, Typography } from '@mui/material'
import { useSnackbar } from 'notistack'
import { type FC, useState } from 'react'

import { trpc } from '@/utils/trpc'

import { ProjectListAdmin } from './projectlist'

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

  const onDeleteHubsAndProjects =
    trpc.apsRouter.deleteHubsAndProjects.useMutation().mutateAsync

  const onUpdateHubsAndProjects =
    trpc.apsRouter.updateHubsAndProjects.useMutation().mutateAsync

  const onDeleteContents =
    trpc.apsRouter.deleteContents.useMutation().mutateAsync

  const onGetContentsFirstLevel =
    trpc.apsRouter.getContentsFirstLevel.useMutation().mutateAsync

  const onGetContentsAll =
    trpc.apsRouter.getContentsAll.useMutation().mutateAsync

  return (
    <>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
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
              {isSubmitting ? 'Processing' : 'Update Hubs'}
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
                  await onGetContentsFirstLevel()
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
              {isSubmitting ? 'Processing' : 'UPDATE 1st Level'}
            </Button>

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
          {projectlist && <ProjectListAdmin projects={projectlist} />}
        </Grid>

        <Grid item xs={12} md={8}></Grid>
      </Grid>
    </>
  )
}
