import {
  KEYNAME_APS_ACCESS_TOKEN,
  KEYNAME_APS_CLIENT_ID,
  KEYNAME_APS_CLIENT_SECRET,
  KEYNAME_APS_REFRESH_TOKEN,
  LIMIT_SECONDS_APS_ACCESS_TOKEN_EXPIRES_IN,
} from '@/global_constants'
import prisma from '@/server/prisma'

import { refreshAccessToken } from './auth'

/**
 * 機能：APSアクセス用トークンを取得する
 * トークンが期限切れ間近の場合は再取得を行う
 * 返り値：APSアクセス用トークン文字列、もしくはnull
 */
export async function getApsAccessToken() {
  const token = await prisma.token.findUnique({
    where: { type: KEYNAME_APS_ACCESS_TOKEN },
  })

  if (token && token.expiresIn && token.updatedAt) {
    const diffSeconds = (Date.now() - token.updatedAt.getTime()) / 1000

    // トークン失効閾値期限前に再取得
    if (
      diffSeconds >
      token.expiresIn - LIMIT_SECONDS_APS_ACCESS_TOKEN_EXPIRES_IN
    ) {
      await updateAccessToken()

      const updatedToken = await prisma.token.findUnique({
        where: { type: KEYNAME_APS_ACCESS_TOKEN },
      })

      return updatedToken?.token || null
    } else {
      return token.token
    }
  }
}

/**
 * 機能：APSアクセス用トークンを更新する
 * 返り値：なし
 * */
export async function updateAccessToken() {
  //try {
  const { token: refreshToken } = (await prisma.token.findFirst({
    where: { type: KEYNAME_APS_REFRESH_TOKEN },
  })) || { refreshToken: '' }
  const { token: client_id } = (await prisma.token.findFirst({
    where: { type: KEYNAME_APS_CLIENT_ID },
  })) || { client_id: '' }
  const { token: client_secret } = (await prisma.token.findFirst({
    where: { type: KEYNAME_APS_CLIENT_SECRET },
  })) || { client_secret: '' }
  const token = await refreshAccessToken(
    refreshToken || '',
    client_id || '',
    client_secret || '',
  )

  await prisma.token.upsert({
    where: { type: KEYNAME_APS_ACCESS_TOKEN },
    create: {
      type: KEYNAME_APS_ACCESS_TOKEN,
      token: token.access_token,
      expiresIn: token.expires_in,
    },
    update: {
      token: token.access_token,
      expiresIn: token.expires_in,
    },
  })

  await prisma.token.upsert({
    where: { type: KEYNAME_APS_REFRESH_TOKEN },
    create: { type: KEYNAME_APS_REFRESH_TOKEN, token: token.refresh_token },
    update: { token: token.refresh_token },
  })
  //} catch (e) {
  //  console.log(e)
  //}
}
