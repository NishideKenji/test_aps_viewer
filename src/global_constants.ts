/**
 * グローバル変数系の定義を格納するファイル
 * 本ファイルでは、定数値の定義などを行う。
 * (※フィーチャーフラグ系の定義は、feature_flags.ts に記載する。)
 */

///////////////////////////////////////////////////////////////////////////////////////////
//ユーザーロール関連の定義
///////////////////////////////////////////////////////////////////////////////////////////
/**
 * Role type names of admin
 */
export const ROLE_TYPE_NAME_ADMIN = 'admin'

/**
 * Role type names of maintainer
 */
export const ROLE_TYPE_NAME_MAINTAINER = 'maintainer'

/**
 * Role type names of articleeditor
 */
export const ROLE_TYPE_NAME_ARTICLEEDITOR = 'articleeditor'

/**
 * ユーザーロール一式を返す配列
 */
export const PermitedRoleListAll: string[] = [
  ROLE_TYPE_NAME_ADMIN,
  ROLE_TYPE_NAME_MAINTAINER,
  ROLE_TYPE_NAME_ARTICLEEDITOR,
]

/**
 * メンテナンス権限を持つユーザーロール一式を返す配列
 */
export const PermitedRoleListMaintainer: string[] = [
  ROLE_TYPE_NAME_ADMIN,
  ROLE_TYPE_NAME_MAINTAINER,

  ///////////////////////////////////////////////////////////////////////////////////////////
  //ログ関連の定義
  ///////////////////////////////////////////////////////////////////////////////////////////
]

/**
 * 管理者権限を持つユーザーロール一式を返す配列
 */
export const PermitedRoleListAdmin: string[] = [ROLE_TYPE_NAME_ADMIN]

///////////////////////////////////////////////////////////////////////////////////////////
//画面サイズ関連の定義
///////////////////////////////////////////////////////////////////////////////////////////

/**
 * 画面サイズ変更の閾値(これ以下だとモバイルモード)
 */
export const sizeModeMobile = 960

/**
 * 画面サイズ変更の閾値(これ以下だとスマホモード)
 */
export const sizeModePhone = 520

///////////////////////////////////////////////////////////////////////////////////////////
//トークン・シークレット関連の名称定義
///////////////////////////////////////////////////////////////////////////////////////////
/**
 * APS Access Token のデータベース保存時のキー名称
 */
export const KEYNAME_APS_ACCESS_TOKEN = 'APS_ACCESS_TOKEN'
/**
 * APS Refresh Token のデータベース保存時のキー名称
 */
export const KEYNAME_APS_REFRESH_TOKEN = 'APS_REFRESH_TOKEN'

/**
 * APS Client ID のデータベース保存時のキー名称
 */
export const KEYNAME_APS_CLIENT_ID = 'APS_CLIENT_ID'

/**
 * APS Client Secret のデータベース保存時のキー名称
 */
export const KEYNAME_APS_CLIENT_SECRET = 'APS_CLIENT_SECRET'
