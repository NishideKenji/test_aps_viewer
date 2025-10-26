import { z } from 'zod'

import {
  PermitedRoleListAdmin,
  PermitedRoleListMaintainer,
} from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const userRouter = router({
  updateRoleId: procedure
    .input(
      z.object({
        id: z.string(),
        roleId: z.string().nullable(),
      }),
    )
    .mutation(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ更新を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const ans = await opt.ctx.prisma.user.update({
          where: {
            id: opt.input.id,
          },
          data: {
            roleId: opt.input.roleId,
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
        const deletedItem = await opt.ctx.prisma.user.delete({
          where: {
            id: opt.input.id,
          },
        })

        return deletedItem //削除したアイテムの内容を返す
      }
    }),

  list: procedure.query(async (opt) => {
    // セッション情報を取得し、許可されたロールの場合のみリストを取得する
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListMaintainer)) {
      const ans = await opt.ctx.prisma.user.findMany()

      return ans
    }
  }),

  get: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ詳細を取得する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListMaintainer)) {
        const ans = await opt.ctx.prisma.user.findUnique({
          where: { id: opt.input.id },
        })

        return ans
      }
    }),
})
