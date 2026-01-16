import type { FastifyInstance } from 'fastify'
import { fastifyPlugin } from 'fastify-plugin'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request, reply) => {
    request.getCurrentUserId = async () => {
      try {
        await request.jwtVerify()
        const sub = request.user.sub

        return sub
      } catch {
        return reply.status(401).send({
          message: 'Unauthorized',
        })
      }
    }
    request.verifyUserRole = async (roleToVerify: 'ADMIN' | 'MEMBER') => {
      try {
        await request.getCurrentUserId()
        const { role } = request.user

        if (role !== roleToVerify) {
          return reply.status(401).send({
            message: 'Unauthorized',
          })
        }
      } catch {
        return reply.status(401).send({
          message: 'Unauthorized',
        })
      }
    }
  })
})
