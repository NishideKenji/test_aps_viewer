import { router } from '../trpc'
import { apsRouter } from './apsRouter'
import { helloRouter } from './helloRouter'
import { registerRouter } from './registerRouter'
import { roleRouter } from './roleRouter'
import { tokenRouter } from './tokenRouter'
import { userRouter } from './userRouter'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = router({
  helloRouter,
  registerRouter,
  tokenRouter,
  roleRouter,
  userRouter,
  apsRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter
