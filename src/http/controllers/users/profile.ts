import { auth } from '@/http/middlewares/auth'
import { makeGetUserProfileUseCase } from '@/use-cases/factories/make-get-user-profile-use.case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export const profile: FastifyPluginAsyncZod = async (app) => {
  app.register(auth).get(
    '/me',
    {
      schema: {
        summary: 'Get user profile',
        tags: ['users'],
        operationId: 'getUserProfile',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string(),
              role: z.string(),
              created_at: z.date(),
            }),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()

      try {
        const getUserProfile = makeGetUserProfileUseCase()

        const { user } = await getUserProfile.execute({
          userId,
        })

        return reply.status(200).send({ user })
      } catch (err) {
        throw err
      }
    },
  )
}
