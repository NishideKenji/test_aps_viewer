import { Box, Button, Container, Grid, Typography } from '@mui/material'
import type { Token } from '@prisma/client'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import React from 'react'

import { TokenDetails } from '@/components/admin/token/tokendetails'
import { TokenList } from '@/components/admin/token/tokenList'
import { ControlPanelForUpdateTokenManually } from '@/components/admin/token/tokenupd'
import { trpc } from '@/utils/trpc'

const defaulObjectValue = (): Token => {
  return {
    id: '',
    type: '',
    token: '',
    expiresIn: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

export default function TokenUpd() {
  const { data: session } = useSession()

  const router = useRouter()
  const { id } = router.query

  const { data: tokens } = trpc.tokenRouter.list.useQuery()

  const onUpdateToken = trpc.tokenRouter.updateToken.useMutation().mutateAsync

  const objectValue = trpc.tokenRouter.get.useQuery(
    {
      id: id ? id.toString() : '',
    },
    {
      refetchOnWindowFocus: false,
    },
  )

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
              <Button
                variant="text"
                onClick={() => {
                  router.push(`/admin/tokenupd`)
                }}
              >
                Create New Role
              </Button>
              <TokenList tokens={tokens || []} />
            </Grid>
            <Grid item lg={6} xl={6}>
              <Typography variant="h5" gutterBottom>
                {id ? 'Details and Edit Token' : 'Create New Token'}
              </Typography>
              {(!id ||
                (objectValue?.data?.id === id?.toString() &&
                  !objectValue.isLoading)) && (
                <TokenDetails
                  objectValue={
                    objectValue?.data ? objectValue.data : defaulObjectValue()
                  }
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    )
  )
}
