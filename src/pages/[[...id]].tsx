import { Box, Container, Grid, Link, Typography } from '@mui/material'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { ApsContentTree } from '@/components/aps/apsContentTree'
import { ProjectList } from '@/components/aps/projectlist'
import { PermitedRoleListAll } from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'
import { trpc } from '@/utils/trpc'

const ApsViewer = dynamic(() => import('@/components/admin/aps/apsviewer2'), {
  ssr: false,
})

export default function ApsViewerPage() {
  const basePath = ''
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  // id は string[] | undefined 型
  const projectid = Array.isArray(id) ? id[0] : undefined
  const contentsid = Array.isArray(id) ? id[1] : undefined

  const { data: projects } = trpc.apsRouter.projectlist.useQuery()

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

  const { data: accessToken, isLoading: isLoadingToken } =
    trpc.apsRouter.getAccessToken.useQuery()

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
              {contents && <ApsContentTree contents={contents} />}
            </>
          ) : (
            <>
              <Typography component="h4" variant="h6">
                コンテンツ一覧
              </Typography>
              {projects && <ProjectList projects={projects} />}
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
