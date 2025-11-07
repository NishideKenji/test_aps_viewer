import { Box, Container, Grid, Link, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { ApsContentTreeAdmin } from '@/components/admin/aps/apsContentTree'
import { ApsSyncControlPanel } from '@/components/admin/aps/apsSyncControlPanel'
import { ProjectListAdmin } from '@/components/admin/aps/projectlist'
import { PermitedRoleListAll } from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'
import { trpc } from '@/utils/trpc'

const ApsViewer = dynamic(() => import('@/components/admin/aps/apsviewer2'), {
  ssr: false,
})

export default function ApsViewerPage() {
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  // クエリ除去 + 最後の階層を削除
  const basePath = '/admin/apsitems'

  //ルーターのパスからベースパスを取得する方法（上記の固定値の代わりに使える）があるが、安定しない場合があるため一旦採用見送り
  //  const basePath = router.asPath.split('?')[0].replace(/\/[^/]+$/, '')

  // id は string[] | undefined 型
  const projectid = Array.isArray(id) ? id[0] : undefined
  const contentsid = Array.isArray(id) ? id[1] : undefined

  const { data: projects, refetch: refetchProjects } =
    trpc.apsRouter.projectlist.useQuery()

  const { data: contents } = trpc.apsRouter.getContentListByProjectId.useQuery(
    { projectId: projectid || '' },
    { enabled: !!id },
  )

  const { data: content } = trpc.apsRouter.getContentInfoById.useQuery(
    {
      id: contentsid || '',
    },
    { enabled: !!contentsid },
  )

  const { data: accessToken } = trpc.apsRouter.getAccessToken.useQuery()

  const onUpdateHubsAndProjects =
    trpc.apsRouter.updateHubsAndProjects.useMutation().mutateAsync

  const onDeleteHubsAndProjects =
    trpc.apsRouter.deleteHubsAndProjects.useMutation().mutateAsync

  const onDeleteContents =
    trpc.apsRouter.deleteContents.useMutation().mutateAsync

  const onUpdateAllHubsAndProjects = async () => {
    await onUpdateHubsAndProjects()
    await refetchProjects()
  }

  const onDeleteAllItems = async () => {
    await onDeleteHubsAndProjects()
    await onDeleteContents()
    await refetchProjects()
  }

  if (!checkIsAuthorized(session, PermitedRoleListAll)) {
    return <div style={{ padding: 8 }}>No session or not authorized</div>
  }

  return (
    <Container maxWidth={false}>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          {projectid ? (
            <>
              <Typography component="h4" variant="h6">
                コンテンツ一覧<Link href={`${basePath}/`}>[Return]</Link>
              </Typography>

              {contents && <ApsContentTreeAdmin contents={contents} />}
            </>
          ) : (
            <>
              <ApsSyncControlPanel
                onUpdateAllHubsAndProjects={onUpdateAllHubsAndProjects}
                onDeleteAllItems={onDeleteAllItems}
              />
              <Typography component="h4" variant="h6">
                プロジェクト一覧
              </Typography>
              {projects && <ProjectListAdmin projects={projects} />}
            </>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Box
            style={{ width: '100%', height: '80vh', border: '1px dashed #E0A' }}
          >
            {content && content.urn && accessToken && (
              <ApsViewer
                urn={content.urn} // ← ここが常に値ありになる
                accessToken={accessToken} // viewables:read 必須
                prefer="auto"
                debug={true}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </Container>
  )
}
