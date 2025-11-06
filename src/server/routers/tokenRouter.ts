import { z } from 'zod'

import { PermitedRoleListAdmin } from '@/global_constants'
import { updateAccessToken } from '@/utils/aps/getapsaccesstoken'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const tokenRouter = router({
  /**
   * APSアクセス用トークンを更新する
   * 管理者ロールのみ実行可能
   * 呼び出し元でのエラーハンドリングを推奨
   * 例: await trpc.tokenRouter.updateToken.mutateAsync()
   * 返り値なし
   * */
  updateToken: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      await updateAccessToken()
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
        select: {
          id: true,
          type: true,
          expiresIn: true,
          createdAt: true,
          updatedAt: true,
        },
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
          expiresIn: number | null
          createdAt: Date
          updatedAt: Date
        } | null = await opt.ctx.prisma.token.findUnique({
          where: { id: opt.input.id },
          select: {
            id: true,
            type: true,
            expiresIn: true,
            createdAt: true,
            updatedAt: true,
          },
        })

        if (temp) {
          const ans: {
            id: string
            type: string
            token: string
            expiresIn: number | null
            createdAt: Date
            updatedAt: Date
          } | null = { token: '', ...temp } // tokenは返さない

          return ans
        }
      }
    }),
})
