import bcrypt from 'bcrypt'
import type { NextAuthOptions } from 'next-auth'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import prisma from '@/server/prisma'

export const nextAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // サインインフォームに表示する名前 (例: "Sign in with...")
      name: 'Credentials POC',
      // 認証情報は、サインインページに適切なフォームを生成するために使用されます。
      // 送信されることを期待するフィールドを何でも指定することができます。
      // 例: ドメイン、ユーザー名、パスワード、2FAトークンなど。
      // オブジェクトを通して、任意の HTML 属性を <input> タグに渡すことができます。
      credentials: {
        username: {
          label: 'ユーザー名',
          type: 'text',
          placeholder: 'ユーザー名',
        },
        password: { label: 'パスワード', type: 'password' },
      },
      //@ts-ignore
      async authorize(credentials, req) {
        //@ts-ignore
        const { username, password } = credentials

        // ここにロジックを追加して、提供されたクレデンシャルからユーザーを検索します。
        let user: any = null

        const ans = await prisma.user.findFirst({
          where: {
            AND: {
              email: {
                contains: username,
              },
            },
          },
        })

        if (ans) {
          const comparePassword = await bcrypt.compare(
            password,
            ans.crypted_password!,
          )
          //console.log(comparePassword);
          if (comparePassword) {
            user = { id: ans.id, name: ans.name, email: ans.email }
          }
        }

        if (user) {
          // 返されたオブジェクトはすべて、JWTの `user` プロパティに保存されます。
          return user
        } else {
          // もし、NULLを返した場合は、ユーザーに詳細を確認するよう促すエラーが表示されます。
          return null

          // また、このコールバックをエラーで拒否することもできます。この場合、ユーザーはエラーメッセージをクエリパラメータとして持つエラーページに送られます。
        }
      },
    }),
  ],
}

export default NextAuth(nextAuthOptions)
