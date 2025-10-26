import { Box, Container } from '@mui/material'
import React from 'react'

import { ControlPanelForUpdateTokenManually } from '@/components/admin/token/tokenupd'
import { trpc } from '@/utils/trpc'

export default function TokenUpd() {
  const onUpdateToken = trpc.tokenRouter.updateToken.useMutation().mutateAsync

  return (
    <Container maxWidth="xs">
      <Box>
        <ControlPanelForUpdateTokenManually onUpdateToken={onUpdateToken} />
      </Box>
    </Container>
  )
}
