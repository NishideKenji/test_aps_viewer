import { z } from 'zod'

import { PermitedRoleListAdmin, PermitedRoleListAll } from '@/global_constants'
import type { ContentsIndexElement } from '@/utils/aps/apsContents'
import {
  getFirstChildContents,
  getProjectAllLevel,
  getTopLevelContents,
} from '@/utils/aps/apsContents'
import { getHubsList, getProjectsList } from '@/utils/aps/apssync'
import { ensureViewableWithFallback } from '@/utils/aps/ensureSvf2'
import { getApsAccessToken } from '@/utils/aps/getapsaccesstoken'
import { getViewerInfo } from '@/utils/aps/getViewerInfo'
import { isViewableReady } from '@/utils/aps/isViewableReady'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

/**
 * APS関連ルーター
 */
export const apsRouter = router({
  /**
   * APSハブ・プロジェクト情報を最新化する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  updateHubsAndProjects: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const access_token = (await getApsAccessToken()) || ''
        const hubsList = await getHubsList(access_token)

        await opt.ctx.prisma.hub.deleteMany({})

        for (const hub of hubsList) {
          await opt.ctx.prisma.hub.upsert({
            where: { id: hub.id },
            update: { name: hub.name },
            create: {
              id: hub.id,
              name: hub.name,
            },
          })
        }

        const hubs = await opt.ctx.prisma.hub.findMany()

        await opt.ctx.prisma.project.deleteMany({})

        for (const hub of hubs) {
          const projects = await getProjectsList(access_token || '', hub.id)

          for (const prj of projects) {
            const x = await opt.ctx.prisma.project.upsert({
              where: { id: prj.id },
              update: { name: prj.name, hubId: hub.id },
              create: {
                id: prj.id,
                name: prj.name,
                hubId: hub.id,
                hubName: hub.name,
              },
            })
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  }),

  /**
   * APSハブ・プロジェクト情報を削除する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  deleteHubsAndProjects: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        await opt.ctx.prisma.hub.deleteMany({})
        await opt.ctx.prisma.project.deleteMany({})
      } catch (e) {
        console.log(e)
      }
    }
  }),

  /**
   * APSコンテンツのURN、タイプ、翻訳状況をIDに基づいてAPSから取得し、閲覧システムのDBを更新する
   * @param opt
   * @return {Promise<void>}
   */
  syncContentInfoById: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''
        const content = await opt.ctx.prisma.apsContent.findUnique({
          where: { id: opt.input.id },
        })
        const itemInfo = await getViewerInfo(
          access_token,
          content?.projectId || '',
          opt.input.id,
        )

        await opt.ctx.prisma.apsContent.update({
          where: { id: opt.input.id },
          data: {
            versionId: itemInfo.versionId,
            urn: itemInfo.urn,
            dataType: itemInfo.dataType,
            translated: itemInfo.translated,
          },
        })

        return itemInfo
      }
    }),

  /**
   * APSコンテンツのSVF2翻訳ジョブをIDに基づいてAPSへ依頼する
   * @param opt
   * @return {Promise<void>}
   */
  ensureSvf2ById: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''

        const content = await opt.ctx.prisma.apsContent.findUnique({
          where: { id: opt.input.id },
        })
        const result = await ensureViewableWithFallback(
          access_token,
          content?.urn || '',
        )

        return result
      }
    }),

  /**
   * プロジェクトIDに基づいてAPSコンテンツ情報（全階層）を最新化する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  syncContentsStructureByProjectID: procedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''

        await opt.ctx.prisma.apsContent.deleteMany({
          where: { projectId: opt.input.projectId },
        })
        const project = await opt.ctx.prisma.project.findUnique({
          where: { id: opt.input.projectId },
        })
        if (!project) {
          throw new Error('Project not found')
        }
        const contents = await getProjectAllLevel(
          access_token,
          project.hubId,
          project.id,
        )
        for (const content of contents) {
          await opt.ctx.prisma.apsContent.create({
            data: {
              id: content.id,
              name: content.name,
              kind: content.kind,
              parentId: content.parentId,
              projectId: project.id,
            },
          })
        }
        //        console.log(contents)
      }
    }),

  /**
   * プロジェクトIDに基づいてAPSプロジェクトのトップレベル情報を取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  syncTopLevelContentsByProjectID: procedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''

        const project = await opt.ctx.prisma.project.findUnique({
          where: { id: opt.input.projectId },
        })
        if (!project) {
          throw new Error('Project not found')
        }
        const topLevelContents = await getTopLevelContents(
          access_token,
          project.hubId,
          project.id,
        )
        console.log('Top level contents:', topLevelContents)
        const ans: ContentsIndexElement[] = []
        for (const topLevelContent of topLevelContents) {
          const contents = await getFirstChildContents(
            access_token,
            project.id,
            topLevelContent.id,
          )
          console.log('First child contents:', contents)
          ans.push(...contents)
          // DBに保存
          for (const content of contents) {
            await opt.ctx.prisma.apsContent.create({
              data: {
                id: content.id,
                name: content.name,
                kind: content.kind,
                parentId: content.parentId,
                projectId: project.id,
              },
            })
          }
        }
        return ans
      }
    }),

  /**
   * コンテンツIDに基づいてそのコンテンツを親に持つAPSコンテンツ情報（第一階層）を同期する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  syncChildContentsByParentContentID: procedure
    .input(
      z.object({
        parentId: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''

        // 親コンテンツ情報を取得
        const parentContent = await opt.ctx.prisma.apsContent.findUnique({
          where: { id: opt.input.parentId },
        })
        if (!parentContent) {
          throw new Error('Parent content not found')
        }
        const contents = await getFirstChildContents(
          access_token,
          parentContent.projectId,
          parentContent.id,
        )
        console.log('1st level child contents:', contents)
        // DBに保存

        for (const content of contents) {
          await opt.ctx.prisma.apsContent.create({
            data: {
              id: content.id,
              name: content.name,
              kind: content.kind,
              parentId: content.parentId,
              projectId: parentContent.projectId,
            },
          })
        }

        return contents
      }
    }),

  /**
   * APSコンテンツ情報をすべて削除する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  deleteContents: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        await opt.ctx.prisma.apsContent.deleteMany({})
      } catch (e) {
        console.log(e)
      }
    }
  }),

  /**
   * APSプロジェクト情報を取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  projectlist: procedure.query(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      const projects = await opt.ctx.prisma.project.findMany({
        select: {
          id: true,
          name: true,
          hubId: true,
          hubName: true,
          updatedAt: true,
        },
        orderBy: [{ hubName: 'asc' }, { name: 'asc' }],
      })
      return projects
    }
  }),

  /**
   * APSコンテンツ情報をすべて取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  getContentList: procedure.query(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      const contents = await opt.ctx.prisma.apsContent.findMany({
        select: {
          id: true,
          projectId: true,
          parentId: true,
          name: true,
          kind: true,
          dataType: true,
          translated: true,
          urn: true,
          updatedAt: true,
        },
        orderBy: [{ projectId: 'asc' }, { name: 'asc' }],
      })
      return contents
    }
  }),

  /**
   * プロジェクトIDに基づいてAPSコンテンツ情報を取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  getContentListByProjectId: procedure
    .input(
      z.object({
        projectId: z.string(),
      }),
    )
    .query(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const contents = await opt.ctx.prisma.apsContent.findMany({
          where: { projectId: opt.input.projectId },
          select: {
            id: true,
            projectId: true,
            parentId: true,
            name: true,
            kind: true,
            dataType: true,
            translated: true,
            urn: true,
            updatedAt: true,
          },
          orderBy: [{ projectId: 'asc' }, { name: 'asc' }],
        })
        return contents
      }
    }),
  /**
   * プロジェクトIDに基づいてAPSコンテンツ情報を取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  getContentInfoByUrn: procedure
    .input(
      z.object({
        urn: z.string(),
      }),
    )
    .query(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        console.log('[Caller] getContentInfoByUrn:', opt.input.urn)
        const content = await opt.ctx.prisma.apsContent.findFirst({
          where: { urn: opt.input.urn },
          select: {
            id: true,
            projectId: true,
            parentId: true,
            name: true,
            kind: true,
            dataType: true,
            translated: true,
            urn: true,
            updatedAt: true,
          },
        })
        console.log('[Caller] getContentInfoByUrn: content:', content)
        const project = await opt.ctx.prisma.project.findUnique({
          where: { id: content?.projectId || '' },
          select: {
            id: true,
            name: true,
            hubId: true,
            hubName: true,
            updatedAt: true,
          },
        })
        return {
          projectName: project?.name,
          contentName: content?.name,
          kind: content?.kind,
          dataType: content?.dataType,
          translated: content?.translated,
        }
      }
    }),
  /**
   * コンテンツIDに基づいてAPSコンテンツ情報を取得する
   * @param opt
   * @return {Promise<void>}
   */
  getContentInfoById: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const content = await opt.ctx.prisma.apsContent.findFirst({
          where: { id: opt.input.id },
        })
        return content
      }
    }),

  /**
   * APSコンテンツのViewable準備状況をIDに基づいて取得する
   * @param opt
   * @return {Promise<void>}
   */
  checkIsViewableReadyById: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const access_token = (await getApsAccessToken()) || ''
        const content = await opt.ctx.prisma.apsContent.findFirst({
          where: { id: opt.input.id },
        })

        const ans = await isViewableReady(
          access_token || '',
          content?.urn || '',
        )
        return ans
      }
    }),

  /**
   * APSコンテンツ情報をIDに基づいて取得する
   * 管理者権限を持つユーザーのみアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  getContent: procedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const content = await opt.ctx.prisma.apsContent.findUnique({
          where: { id: opt.input.id },
        })
        return content
      }
    }),

  /**
   * APSへのアクセストークンを取得する
   * 読み取りユーザーまでアクセス可能
   * @param opt
   * @return {Promise<void>}
   */
  getAccessToken: procedure.query(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAll)) {
      const token = await getApsAccessToken()
      return token || null
    }
  }),
})
