import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import type { Role, User } from '@prisma/client'
import dayjs from 'dayjs'
import Link from 'next/link'

interface Props {
  users: User[]
  roleList: Role[]
}

//Roleの一覧を表示するためのコンポーネント(管理画面用)
export const UserList = ({ users, roleList }: Props) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Email Verified</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {users.map((user, index) => {
          return (
            <TableRow key={user.id}>
              <TableCell>
                <Link href={`/admin/user/${user.id}`}>{index + 1}</Link>
              </TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>
                {roleList.find((role) => role.id === user.roleId)?.name ||
                  '----'}
              </TableCell>
              <TableCell>
                {dayjs(user.emailVerified).format('YYYY/MM/DD')}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
