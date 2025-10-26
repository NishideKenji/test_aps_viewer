import type { Session } from 'next-auth'

import { trpc } from '../trpc'

/**
 * ユーザーが指定されたロールに対して認証状態にあるかどうかを確認する。
 * 認証状態の確認と、必要なロールを有しているかどうかを確認する
 * @param session //認証情報
 * @param roles //必要なロール
 * @returns 認証されている場合はtrue、それ以外はfalse
 */
export const checkIsAuthorized = (session: Session | null, roles: string[]) => {
  if (session && session.user) {
    /*
    ロールテーブルが完成したら、こちらを有効化する
    const role = trpc.roleRouter.getMyRole.useQuery().data
    return roles.some((requiredRole) => role?.name === requiredRole)
    */
    return true
  } else {
    return false
  }

  //return session?.user.emailVerified ? true : false
}
