import { z } from 'zod'

import {
  KEYNAME_APS_ACCESS_TOKEN,
  PermitedRoleListAdmin,
} from '@/global_constants'
import {
  getProjectAllLevel,
  getProjectFirstLevel,
} from '@/utils/aps/apsContents'
import { getHubsList, getProjectsList } from '@/utils/aps/apssync'
import { getViewerInfo } from '@/utils/aps/getViewerInfo'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const apsRouter = router({
  updateHubs: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: KEYNAME_APS_ACCESS_TOKEN },
        })) || { token: '' }
        const hubsList = await getHubsList(access_token || '')
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
        //console.log(hubsList)
      } catch (e) {
        console.log(e)
      }
    }
  }),

  deleteHubs: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        await opt.ctx.prisma.hub.deleteMany({})
      } catch (e) {
        console.log(e)
      }
    }
  }),

  updateProjects: procedure.mutation(async (opt) => {
    console.log('updateProjects called')
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: KEYNAME_APS_ACCESS_TOKEN },
        })) || { token: '' }

        /*
        const hubid = await opt.ctx.prisma.hub.findFirst({})

        const projects = await getProjectsList(
          access_token || '',
          hubid?.id || '',
        ) // hubIdは適宜変更してください
*/

        const hubs = await opt.ctx.prisma.hub.findMany()

        for (const hub of hubs) {
          const projects = await getProjectsList(access_token || '', hub.id)
          //          console.log(projects)
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

        /*
        for (const hub of hubsList) {
          await opt.ctx.prisma.hub.upsert({
            where: { id: hub.id },
            update: { name: hub.name },
            create: {
              id: hub.id,
              name: hub.name,
            },
          })
        }*/
      } catch (e) {
        console.log(e)
      }
    }
  }),

  updateHubsAndProjects: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: KEYNAME_APS_ACCESS_TOKEN },
        })) || { token: '' }
        const hubsList = await getHubsList(access_token || '')

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

  getContentsFirstLevel: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: KEYNAME_APS_ACCESS_TOKEN },
        })) || { token: '' }

        const projects = await opt.ctx.prisma.project.findMany()

        for (const project of projects) {
          const firstLevelEntries = await getProjectFirstLevel(
            access_token || '',
            project.hubId,
            project.id,
          )
          for (const entry of firstLevelEntries) {
            if (access_token && entry.kind === 'item') {
              const itemInfo = await getViewerInfo(
                access_token,
                project.id,
                entry.id,
              )
              console.log(itemInfo)
              await opt.ctx.prisma.apsContent.upsert({
                where: { id: entry.id },
                update: {
                  projectId: project.id,
                  parentId: entry.parentId,
                  name: entry.name,
                  kind: entry.kind,
                  versionId: itemInfo.versionId,
                  urn: itemInfo.urn,
                  dataType: itemInfo.dataType,
                  translated: itemInfo.translated,
                },
                create: {
                  id: entry.id,
                  name: entry.name,
                  kind: entry.kind,
                  parentId: entry.parentId,
                  projectId: project.id,
                  versionId: itemInfo.versionId,
                  urn: itemInfo.urn,
                  dataType: itemInfo.dataType,
                  translated: itemInfo.translated,
                },
              })
            } else {
              await opt.ctx.prisma.apsContent.upsert({
                where: { id: entry.id },
                update: {
                  projectId: project.id,
                  parentId: entry.parentId,
                  name: entry.name,
                  kind: entry.kind,
                },
                create: {
                  id: entry.id,
                  name: entry.name,
                  kind: entry.kind,
                  parentId: entry.parentId,
                  projectId: project.id,
                },
              })
            }
          }

          //console.log(firstLevelEntries)
        }
        /*
        const hubsList = await getHubsList(access_token || '')
        for (const hub of hubsList) {
          await opt.ctx.prisma.hub.upsert({
            where: { id: hub.id },
            update: { name: hub.name },
            create: {
              id: hub.id,
              name: hub.name,
            },
          })
        }*/
        //console.log(hubsList)
      } catch (e) {
        console.log(e)
      }
    }
  }),

  getContentsAll: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: KEYNAME_APS_ACCESS_TOKEN },
        })) || { token: '' }

        const projects = await opt.ctx.prisma.project.findMany()

        for (const project of projects) {
          const firstLevelEntries = await getProjectAllLevel(
            access_token || '',
            project.hubId,
            project.id,
          )
          for (const entry of firstLevelEntries) {
            if (access_token && entry.kind === 'item') {
              const itemInfo = await getViewerInfo(
                access_token,
                project.id,
                entry.id,
              )
              console.log(itemInfo)
              await opt.ctx.prisma.apsContent.upsert({
                where: { id: entry.id },
                update: {
                  projectId: project.id,
                  parentId: entry.parentId,
                  name: entry.name,
                  kind: entry.kind,
                  versionId: itemInfo.versionId,
                  urn: itemInfo.urn,
                  dataType: itemInfo.dataType,
                  translated: itemInfo.translated,
                },
                create: {
                  id: entry.id,
                  name: entry.name,
                  kind: entry.kind,
                  parentId: entry.parentId,
                  projectId: project.id,
                  versionId: itemInfo.versionId,
                  urn: itemInfo.urn,
                  dataType: itemInfo.dataType,
                  translated: itemInfo.translated,
                },
              })
            } else {
              await opt.ctx.prisma.apsContent.upsert({
                where: { id: entry.id },
                update: {
                  projectId: project.id,
                  parentId: entry.parentId,
                  name: entry.name,
                  kind: entry.kind,
                },
                create: {
                  id: entry.id,
                  name: entry.name,
                  kind: entry.kind,
                  parentId: entry.parentId,
                  projectId: project.id,
                },
              })
            }
          }
        }
      } catch (e) {
        console.log(e)
      }
    }
  }),

  deleteContents: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        await opt.ctx.prisma.apsContent.deleteMany({})
      } catch (e) {
        console.log(e)
      }
    }
  }),

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

  getToken: procedure
    .input(
      z.object({
        type: z.string(),
      }),
    )
    .query(async (opt) => {
      if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
        const tokenEntry = await opt.ctx.prisma.token.findFirst({
          where: { type: opt.input.type },
        })
        return tokenEntry?.token || null
      }
    }),
})
