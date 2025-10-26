import { Box, Container, Grid, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import React from 'react'

import { TokenList } from '@/components/admin/token/tokenList'
import { ControlPanelForUpdateTokenManually } from '@/components/admin/token/tokenupd'
import { trpc } from '@/utils/trpc'

export default function TokenUpd() {
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  const { data: tokens } = trpc.tokenRouter.list.useQuery()

  const onUpdateToken = trpc.tokenRouter.updateToken.useMutation().mutateAsync

  return (
    session && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'} p={10}>
          <Grid container spacing={10}>
            <Grid item lg={6} xl={6}>
              <ControlPanelForUpdateTokenManually
                onUpdateToken={onUpdateToken}
              />
              <Typography variant="h5" gutterBottom>
                Tokens
              </Typography>
              <TokenList tokens={tokens || []} />
            </Grid>
            <Grid item lg={6} xl={6}></Grid>
          </Grid>
        </Box>
      </Container>
    )
  )
}
