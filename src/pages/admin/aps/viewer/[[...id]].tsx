import { Box, Container, Grid } from '@mui/material'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import React from 'react'

import ApsViewer from '@/components/admin/aps/apsviewer2'
import { trpc } from '@/utils/trpc'

export default function ApsViewerx() {
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  const { data: content } = trpc.apsRouter.getContent.useQuery({
    id: id ? id.toString() : '',
  })

  const accessToken = trpc.apsRouter.getToken.useQuery({
    type: 'APS_ACCESS_TOKEN',
  }).data

  return (
    session && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'} p={10}>
          <Grid container spacing={10}>
            <div style={{ width: '100%', height: '80vh' }}>
              {accessToken && content && (
                <>
                  <ApsViewer
                    urn={id ? id.toString() : ''}
                    accessToken={accessToken}
                  />
                </>
              )}
            </div>
          </Grid>
        </Box>
      </Container>
    )
  )
}
