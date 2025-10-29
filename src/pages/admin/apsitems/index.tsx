import { Box, Container, Grid, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import React from 'react'

import { ApsContentList } from '@/components/admin/aps/apsContentList'

export default function ApsItems() {
  const { data: session } = useSession()

  return (
    session && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'} p={10}>
          <Grid container spacing={10}>
            <Grid item lg={6} xl={6}>
              <Typography variant="h5" gutterBottom>
                APS Item 一覧
              </Typography>
              <ApsContentList />
            </Grid>
          </Grid>
        </Box>
      </Container>
    )
  )
}
