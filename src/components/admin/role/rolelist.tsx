import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import type { Role } from '@prisma/client'
import Link from 'next/link'

interface Props {
  roles: Role[]
}

/**
 * 機能：Roleのリストを表示するコンポーネント
 * @param roles
 * @returns
 */
export const RoleList = ({ roles }: Props) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>ID</TableCell>
          <TableCell>Name</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {roles.map((role, index) => {
          return (
            <TableRow key={role.id}>
              <TableCell>
                <Link href={`/admin/role/${role.id}`}>{index + 1}</Link>
              </TableCell>
              <TableCell>{role.id}</TableCell>
              <TableCell>{role.name}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
