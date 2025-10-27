import { Box, Container, Grid, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'
import React from 'react'

import { ControlPanelForApsListSyncManually } from '@/components/admin/aps/apslistsync'
import { trpc } from '@/utils/trpc'

export default function Aps() {
  const { data: session } = useSession()

  const onGetHubs = trpc.apsRouter.updateHubs.useMutation().mutateAsync

  const onGetProjects = trpc.apsRouter.updateProjects.useMutation().mutateAsync

  return (
    session && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'} p={10}>
          <Grid container spacing={10}>
            <Grid item lg={6} xl={6}>
              <Typography variant="h5" gutterBottom>
                APS更新
              </Typography>
              <ControlPanelForApsListSyncManually
                onGetHubs={onGetHubs}
                onGetProjects={onGetProjects}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>
    )
  )
}
