import { Box, Button, Container, Grid, Typography } from '@mui/material'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { UserDetails } from '@/components/admin/user/userdetails'
import { UserList } from '@/components/admin/user/userlist'
import {
  PermitedRoleListAdmin,
  PermitedRoleListMaintainer,
} from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'
import { trpc } from '@/utils/trpc'

const inter = Inter({ subsets: ['latin'] })

const AdminUser = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query

  const objectValue = trpc.userRouter.get.useQuery(
    {
      id: id ? id.toString() : '',
    },
    {
      refetchOnWindowFocus: false,
    },
  )

  const { data: objectList, refetch: updatetextlistRefetch } =
    trpc.userRouter.list.useQuery()

  const { data: roleList, isLoading: isRoleListLoading } =
    trpc.roleRouter.list.useQuery()

  return checkIsAuthorized(session, PermitedRoleListMaintainer) ? (
    <Container maxWidth={false} sx={{ py: 2 }}>
      <Box component={'div'} p={10}>
        <Grid container spacing={10}>
          <Grid item lg={6} xl={6}>
            <Typography variant="h5" gutterBottom>
              Users
            </Typography>
            <Button
              variant="text"
              onClick={() => {
                router.push(`/admin/user`)
              }}
            >
              OFF
            </Button>
            <UserList users={objectList || []} roleList={roleList || []} />
          </Grid>
          <Grid item lg={6} xl={6}>
            {checkIsAuthorized(session, PermitedRoleListAdmin) ? (
              <>
                <Typography variant="h5" gutterBottom>
                  {id && 'Details and Edit User'}
                </Typography>
                {id &&
                  objectValue.data &&
                  !objectValue.isLoading &&
                  !isRoleListLoading && (
                    <UserDetails
                      objectValue={objectValue.data}
                      roleList={roleList || []}
                    />
                  )}
              </>
            ) : (
              <>{'You caan Seeing Only'}</>
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  ) : (
    <div>You do not have permission</div>
  )
}

AdminUser.title = 'Edit Users'

export default AdminUser
