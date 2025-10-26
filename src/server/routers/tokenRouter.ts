import { PermitedRoleListMaintainer } from '@/global_constants'
import { refreshAccessToken } from '@/utils/auth'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const tokenRouter = router({
  updateToken: procedure.mutation(async (opt) => {
    console.log('Token update triggered')
    try {
      const { token: refreshToken } = (await opt.ctx.prisma.token.findFirst({
        where: { type: 'APS_REFRESH_TOKEN' },
      })) || { refreshToken: '' }
      const token = await refreshAccessToken(refreshToken || '')

      console.log('Upserting token:', token)

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

  list: procedure.query(async (opt) => {
    // セッション情報を取得し、許可されたロールの場合のみリストを取得する
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListMaintainer)) {
      const ans = await opt.ctx.prisma.token.findMany({
        select: { id: true, type: true, updatedAt: true },
      })

      return ans
    }
  }),
})
