import { Box, Button, Container, Typography } from '@mui/material'
import { Inter } from 'next/font/google'
import { signIn, signOut, useSession } from 'next-auth/react'

import { PermitedRoleListAll } from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

const inter = Inter({ subsets: ['latin'] })

//プレ管理画面
const Admin = () => {
  const { data: session } = useSession()

  return session ? (
    checkIsAuthorized(session, PermitedRoleListAll) ? (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'}>
          <Button variant="contained" color="inherit" onClick={() => signOut()}>
            signOut
          </Button>
        </Box>
        <Typography variant="h5" gutterBottom>
          Admin
        </Typography>
        <Box component={'div'}>
          <ul>
            <li>
              <Button variant="text" href="/admin/tokenupd">
                トークン管理
              </Button>
            </li>
            <li>
              <Button variant="text" href="/admin/user">
                ユーザー設定
              </Button>
            </li>
            <li>
              <Button variant="text" href="/admin/role">
                ロール設定
              </Button>
            </li>
            <li>
              <Button variant="text" href="/admin/userinfo">
                アカウント情報
              </Button>
            </li>
          </ul>
        </Box>
      </Container>
    ) : (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <div>your account is not activated yet</div>
        <Button variant="contained" color="inherit" onClick={() => signOut()}>
          signOut
        </Button>
      </Container>
    )
  ) : (
    <Container maxWidth={false} sx={{ py: 2 }}>
      <Button variant="contained" color="inherit" onClick={() => signIn()}>
        signIn
      </Button>
    </Container>
  )
}

Admin.title = 'Admin'

export default Admin
