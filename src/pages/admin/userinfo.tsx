import { Box, Container, Typography } from '@mui/material'
import { useSession } from 'next-auth/react'

import { PermitedRoleListAll } from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'
import { trpc } from '@/utils/trpc'

//プレ管理画面
const AdminUserInfo = () => {
  const { data: session } = useSession()

  const role = trpc.roleRouter.getMyRole.useQuery().data

  return (
    checkIsAuthorized(session, PermitedRoleListAll) && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'}>
          <Typography variant="h5" gutterBottom>
            Admin
          </Typography>
          {session && (
            <ul>
              <li>User : {session.user?.name}</li>
              <li>{session.user?.email}</li>
              <li>{role?.name}</li>
            </ul>
          )}
        </Box>
      </Container>
    )
  )
}

AdminUserInfo.title = 'Admin'

export default AdminUserInfo
