import { z } from 'zod'

import { procedure, router } from '../trpc'

export const helloRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      let userinfo = ''

      if (opts.ctx.session) {
        userinfo = opts.ctx.session.user?.name || ''
      } else {
        userinfo = 'Not signin'
      }
      return {
        greeting: `hello ${opts.input.text} !!!!! ${userinfo}`,
      }
    }),
  today: procedure.query(() => {
    return new Date()
  }),
})
