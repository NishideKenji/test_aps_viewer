import { Box, Button, Container, Grid, Typography } from '@mui/material'
import type { Task } from '@prisma/client'
import { Inter } from 'next/font/google'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
import { useEffect } from 'react'

import TaskDetails from '@/components/task/taskdetails'
import TaskList from '@/components/task/tasklist'
import { trpc } from '@/utils/trpc'

const inter = Inter({ subsets: ['latin'] })

const defaultTask = (): Task => {
  return {
    id: '',
    title: '',
    is_finish: false,
    description: '',
    end_date_scheduled: null,
    end_date_actual: null,
  }
}

export default function Home() {
  const { data: session } = useSession()

  const tasks = trpc.taskRouter.list.useQuery()

  const getSelectedTask = (id: string | string[] | undefined) => {
    return (
      tasks.data?.tasks.find((task) => task.id === id?.toString()) ??
      defaultTask()
    )
  }

  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    tasks.refetch()
  }, [id])

  return (
    <Container maxWidth={false}>
      <Box p={10}>
        {session ? (
          tasks.data ? (
            <Grid container spacing={10}>
              <Grid item xs={6}>
                <Typography variant="h5" gutterBottom>
                  Task List
                </Typography>
                {<TaskList tasks={tasks.data.tasks} />}
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h5" gutterBottom>
                  {id ? 'Details and Edit Task' : 'Create New Task'}
                </Typography>
                <TaskDetails task={getSelectedTask(id)} />
              </Grid>
            </Grid>
          ) : (
            <div>Loading...</div>
          )
        ) : (
          <Button onClick={() => signIn()}>signIn</Button>
        )}
      </Box>
    </Container>
  )
}
