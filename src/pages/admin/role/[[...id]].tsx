import { Box, Button, Container, Grid, Typography } from '@mui/material'
import type { Role } from '@prisma/client'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'

import { RoleDetails } from '@/components/admin/role/roledetails'
import { RoleList } from '@/components/admin/role/rolelist'
import { trpc } from '@/utils/trpc'

const inter = Inter({ subsets: ['latin'] })

const defaulObjectValue = (): Role => {
  return {
    id: '',
    name: '',
  }
}

const AdminRole = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const { id } = router.query

  const objectValue = trpc.roleRouter.get.useQuery(
    {
      id: id ? id.toString() : '',
    },
    {
      refetchOnWindowFocus: false,
    },
  )

  const { data: objectList, refetch: updatetextlistRefetch } =
    trpc.roleRouter.list.useQuery()

  return (
    session && (
      <Container maxWidth={false} sx={{ py: 2 }}>
        <Box component={'div'} p={10}>
          <Grid container spacing={10}>
            <Grid item lg={6} xl={6}>
              <Typography variant="h5" gutterBottom>
                Roles
              </Typography>
              <Button
                variant="text"
                onClick={() => {
                  router.push(`/admin/role`)
                }}
              >
                Create New Role
              </Button>
              <RoleList roles={objectList || []} />
            </Grid>
            <Grid item lg={6} xl={6}>
              <Typography variant="h5" gutterBottom>
                {id ? 'Details and Edit Role' : 'Create New Role'}
              </Typography>
              {(!id ||
                (objectValue?.data?.id === id?.toString() &&
                  !objectValue.isLoading)) && (
                <RoleDetails
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

AdminRole.title = 'Edit Roles'

export default AdminRole
