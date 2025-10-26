import { z } from 'zod'

import { PermitedRoleListAdmin } from '@/global_constants'
import { refreshAccessToken } from '@/utils/auth'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const tokenRouter = router({
  updateToken: procedure.mutation(async (opt) => {
    //    console.log('Token update triggered')
    try {
      const { token: refreshToken } = (await opt.ctx.prisma.token.findFirst({
        where: { type: 'APS_REFRESH_TOKEN' },
      })) || { refreshToken: '' }
      const { token: client_id } = (await opt.ctx.prisma.token.findFirst({
        where: { type: 'APS_CLIENT_ID' },
      })) || { client_id: '' }
      const { token: client_secret } = (await opt.ctx.prisma.token.findFirst({
        where: { type: 'APS_CLIENT_SECRET' },
      })) || { client_secret: '' }
      const token = await refreshAccessToken(
        refreshToken || '',
        client_id || '',
        client_secret || '',
      )

      //      console.log('Upserting token:', token)

      await opt.ctx.prisma.token.upsert({
        where: { type: 'APS_ACCESS_TOKEN' },
        create: { type: 'APS_ACCESS_TOKEN', token: token.access_token },
        update: { token: token.access_token },
      })

      await opt.ctx.prisma.token.upsert({
        where: { type: 'APS_REFRESH_TOKEN' },
        create: { type: 'APS_REFRESH_TOKEN', token: token.refresh_token },
        update: { token: token.refresh_token },
      })
    } catch (e) {
      console.log(e)
    }
  }),

  create: procedure
    .input(
      z.object({
        type: z.string(),
        token: z.string().nullable(),
      }),
    )
    .mutation(async (opt) => {
      //console.log(opt.input)
      // セッション情報を取得し、許可されたロールの場合のみ追加を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const newItem = await opt.ctx.prisma.token.create({
          data: {
            type: opt.input.type,
            token: opt.input.token,
          },
        })

        return newItem //追加されたアイテムの内容を返す
      }
    }),

  update: procedure
    .input(
      z.object({
        id: z.string(),
        token: z.string().nullable(),
      }),
    )
    .mutation(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ更新を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const ans = await opt.ctx.prisma.token.update({
          where: {
            id: opt.input.id,
          },
          data: {
            token: opt.input.token,
          },
        })

        return ans //追加されたアイテムの内容を返す
      }
    }),

  delete: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ削除を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const deletedItem = await opt.ctx.prisma.token.delete({
          where: {
            id: opt.input.id,
          },
        })

        return deletedItem //削除したアイテムの内容を返す
      }
    }),

  list: procedure.query(async (opt) => {
    // セッション情報を取得し、許可されたロールの場合のみリストを取得する
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      const ans = await opt.ctx.prisma.token.findMany({
        select: { id: true, type: true, updatedAt: true },
      })

      return ans
    }
  }),

  /**
   * token詳細を取得する(実値は返さない)
   */
  get: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ詳細を取得する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const temp: {
          id: string
          type: string
          createdAt: Date
          updatedAt: Date
        } | null = await opt.ctx.prisma.token.findUnique({
          where: { id: opt.input.id },
          select: { id: true, type: true, createdAt: true, updatedAt: true },
        })

        if (temp) {
          const ans: {
            id: string
            type: string
            token: string
            createdAt: Date
            updatedAt: Date
          } | null = { token: '', ...temp } // tokenは返さない

          return ans
        }
      }
    }),
})
