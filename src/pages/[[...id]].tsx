import { Container, Grid, Typography } from '@mui/material'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { ApsContentList } from '@/components/admin/aps/apsContentList'
import { ApsContentTree } from '@/components/admin/aps/apsContentTree'
import { ProjectList } from '@/components/aps/projectlist'
import { trpc } from '@/utils/trpc'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  const { data: contents } = trpc.apsRouter.getContentListByProjectId.useQuery(
    {
      projectId: id ? (Array.isArray(id) ? id[0] : id) : '',
    },
    {
      enabled: !!id,
    },
  )

  const { data: projects } = trpc.apsRouter.projectlist.useQuery(undefined)

  return (
    <Container maxWidth={false}>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          {contents ? (
            <>
              <Typography component="h4" variant="h6">
                コンテンツ一覧
              </Typography>
              <ApsContentTree contents={contents} />
            </>
          ) : (
            <>
              <Typography component="h4" variant="h6">
                プロジェクト一覧
              </Typography>
              {projects && <ProjectList projects={projects} />}
            </>
          )}
        </Grid>

        <Grid item xs={12} md={8}></Grid>
      </Grid>
    </Container>
  )
}
