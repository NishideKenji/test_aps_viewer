import { refreshAccessToken } from '@/utils/auth'

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
})
