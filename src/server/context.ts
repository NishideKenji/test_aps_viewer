import type * as trpc from '@trpc/server'
import type * as trpcNext from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'

import { nextAuthOptions } from '@/pages/api/auth/[...nextauth]'

import prisma from './prisma'

export const createContext = async (ctx: trpcNext.CreateNextContextOptions) => {
  const { req, res } = ctx
  const session = await getServerSession(req, res, nextAuthOptions)

  return {
    req,
    res,
    session,
    prisma,
  }
}

export type IContext = trpc.inferAsyncReturnType<typeof createContext>
