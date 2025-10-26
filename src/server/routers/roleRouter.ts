import { z } from 'zod'

import {
  PermitedRoleListAdmin,
  PermitedRoleListAll,
  ROLE_TYPE_NAME_ADMIN,
  ROLE_TYPE_NAME_ARTICLEEDITOR,
  ROLE_TYPE_NAME_MAINTAINER,
} from '@/global_constants'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const roleRouter = router({
  create: procedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ追加を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const newItem = await opt.ctx.prisma.role.create({
          data: {
            name: opt.input.name,
          },
        })

        return newItem //追加されたアイテムの内容を返す
      }
    }),

  update: procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ更新を実行する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const ans = await opt.ctx.prisma.role.update({
          where: {
            id: opt.input.id,
          },
          data: {
            name: opt.input.name,
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
        const deletedItem = await opt.ctx.prisma.role.delete({
          where: {
            id: opt.input.id,
          },
        })

        return deletedItem //削除したアイテムの内容を返す
      }
    }),

  /**
   * ロール一覧を取得する
   */
  list: procedure.query(async (opt) => {
    // セッション情報を取得し、許可されたロールの場合のみ一覧を取得する
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAll)) {
      const ans = await opt.ctx.prisma.role.findMany()

      return ans
    }
  }),

  /**
   * ロール詳細を取得する
   */
  get: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opt) => {
      // セッション情報を取得し、許可されたロールの場合のみ詳細を取得する
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAll)) {
        const ans = await opt.ctx.prisma.role.findUnique({
          where: { id: opt.input.id },
        })

        return ans
      }
    }),

  /**
   * ログインしているユーザーのロールを取得する(セッション情報から取得)
   */
  getMyRole: procedure.query(async (opt) => {
    // セッション情報を取得し、許可されたロールの場合のみ詳細を取得する
    if (opt.ctx.session) {
      const user = await opt.ctx.prisma.user.findFirst({
        where: { email: opt.ctx.session.user?.email },
      })

      if (user?.roleId) {
        const ans = await opt.ctx.prisma.role.findFirst({
          where: { id: user.roleId },
        })
        return ans
      } else {
        return null
      }
    }
  }),

  /**
   * ロールの初期設定を実行する
   * 完全な初期のセットアップを想定。
   */
  initialize: procedure.mutation(async (opt) => {
    //console.log('initialize')
    // セッション情報を取得し、許可されたロールの場合のみ追加を実行する
    if (opt.ctx.session) {
      //console.log('initialize1')
      const newItem1 = await opt.ctx.prisma.role.upsert({
        where: {
          name: ROLE_TYPE_NAME_ADMIN,
        },
        update: {
          name: ROLE_TYPE_NAME_ADMIN,
        },
        create: {
          name: ROLE_TYPE_NAME_ADMIN,
        },
      })
      const newItem2 = await opt.ctx.prisma.role.upsert({
        where: {
          name: ROLE_TYPE_NAME_MAINTAINER,
        },
        update: {
          name: ROLE_TYPE_NAME_MAINTAINER,
        },
        create: {
          name: ROLE_TYPE_NAME_MAINTAINER,
        },
      })
      const newItem3 = await opt.ctx.prisma.role.upsert({
        where: {
          name: ROLE_TYPE_NAME_ARTICLEEDITOR,
        },
        update: {
          name: ROLE_TYPE_NAME_ARTICLEEDITOR,
        },
        create: {
          name: ROLE_TYPE_NAME_ARTICLEEDITOR,
        },
      })

      return newItem1 //追加されたアイテムの内容を返す
    }
  }),
})
