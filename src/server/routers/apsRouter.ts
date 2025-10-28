import { z } from 'zod'

import { PermitedRoleListAdmin } from '@/global_constants'
import { getProjectFirstLevel } from '@/utils/aps/apsfiles'
import { getHubsList, getProjectsList } from '@/utils/aps/apssync'
import { checkIsAuthorized } from '@/utils/common/checkIsAuthorized'

import { procedure, router } from '../trpc'

export const apsRouter = router({
  updateHubs: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: 'APS_ACCESS_TOKEN' },
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

  updateProjects: procedure.mutation(async (opt) => {
    console.log('updateProjects called')
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: 'APS_ACCESS_TOKEN' },
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

  updateFiles: procedure.mutation(async (opt) => {
    if (checkIsAuthorized(opt.ctx.session, PermitedRoleListAdmin)) {
      try {
        const { token: access_token } = (await opt.ctx.prisma.token.findFirst({
          where: { type: 'APS_ACCESS_TOKEN' },
        })) || { token: '' }

        const projects = await opt.ctx.prisma.project.findMany()

        for (const project of projects) {
          const firstLevelEntries = await getProjectFirstLevel(
            access_token || '',
            project.hubId,
            project.id,
          )

          console.log(firstLevelEntries)
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
