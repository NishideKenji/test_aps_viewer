import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import dayjs from 'dayjs'
import Link from 'next/link'

import { trpc } from '@/utils/trpc'

//Tokenの一覧を表示するためのコンポーネント(管理画面用)
export const ApsContentList = () => {
  const { data: contents } = trpc.apsRouter.getContentList.useQuery()
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Hub</TableCell>
          <TableCell>Project</TableCell>
          <TableCell>Updated</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {contents &&
          contents.map((content, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  <Link href={`/admin/aps/viewer/${content.id}`}>
                    {index + 1}
                  </Link>
                </TableCell>
                <TableCell>{content.name}</TableCell>
                <TableCell>
                  {dayjs(content.updatedAt).format('YYYY/MM/DD HH:mm')}
                </TableCell>
              </TableRow>
            )
          })}
      </TableBody>
    </Table>
  )
}
