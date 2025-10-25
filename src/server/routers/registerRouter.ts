import bcrypt from 'bcrypt'
import { z } from 'zod'

import { procedure, router } from '../trpc'

export const registerRouter = router({
  create: procedure
    .input(
      z.object({
        username: z.string(),
        email: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async (opt) => {
      const Input = {
        username: opt.input.username,
        email: opt.input.email,
        password: opt.input.password,
      }
      //console.log(Input)

      const saltRounds = 10
      const password = Input.password
      const hashedPassword = await bcrypt.hash(password, saltRounds)

      const newUser = await opt.ctx.prisma.user.create({
        data: {
          email: Input.email,
          name: Input.username,
          crypted_password: hashedPassword,
        },
      })

      //console.log(newUser)
      // 戻り値。
      const Answer = {
        username: opt.input.username,
        email: opt.input.email,
      }

      return Answer
    }),
})
