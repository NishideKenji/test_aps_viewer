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
          <TableCell>Type</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Data Type</TableCell>
          <TableCell>Translated</TableCell>
          <TableCell>Updated</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {contents &&
          contents.map((content, index) => {
            return (
              <TableRow key={index}>
                <TableCell>
                  {content.urn ? (
                    <Link href={`/admin/aps/viewer/${content.urn}`}>
                      {index + 1}
                    </Link>
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell>{content.kind}</TableCell>
                <TableCell>{content.name}</TableCell>
                <TableCell>{content.dataType}</TableCell>
                <TableCell>{content.translated ? 'Yes' : 'No'}</TableCell>
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
