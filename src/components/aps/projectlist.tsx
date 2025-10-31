import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import dayjs from 'dayjs'
import Link from 'next/link'

interface Props {
  projects: {
    id: string
    name: string
    hubId: string
    hubName: string
    updatedAt: Date
  }[]
}

//Tokenの一覧を表示するためのコンポーネント(管理画面用)
export const ProjectList = ({ projects }: Props) => {
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
        {projects.map((project, index) => {
          return (
            <TableRow key={index}>
              <TableCell>
                <Link href={`/${project.id}`}>{index + 1}</Link>
              </TableCell>
              <TableCell>{project.hubName}</TableCell>
              <TableCell>{project.name}</TableCell>
              <TableCell>
                {dayjs(project.updatedAt).format('YYYY/MM/DD HH:mm')}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
