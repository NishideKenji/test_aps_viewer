import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import dayjs from 'dayjs'
import Link from 'next/link'

interface Props {
  tokens: {
    id: string
    type: string
    updatedAt: Date
  }[]
}

//Tokenの一覧を表示するためのコンポーネント(管理画面用)
export const TokenList = ({ tokens }: Props) => {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>No</TableCell>
          <TableCell>Type</TableCell>
          <TableCell>Updated</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {tokens.map((token, index) => {
          return (
            <TableRow key={index}>
              <TableCell>
                <Link href={`/admin/tokenupd/${token.id}`}>{index + 1}</Link>
              </TableCell>
              <TableCell>{token.type}</TableCell>
              <TableCell>
                {dayjs(token.updatedAt).format('YYYY/MM/DD HH:mm')}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
