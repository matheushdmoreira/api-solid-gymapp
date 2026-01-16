import { makeCreateGymUseCase } from '@/use-cases/factories/make-create-gym-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const create: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/gyms',
    {
      schema: {
        summary: 'Create gyms',
        tags: ['gyms'],
        operationId: 'createGyms',
        security: [{ bearerAuth: [] }],
        body: z.object({
          title: z.string(),
          description: z.string().nullable(),
          phone: z.string().nullable(),
          latitude: z.number().refine((value) => {
            return Math.abs(value) <= 90
          }),
          longitude: z.number().refine((value) => {
            return Math.abs(value) <= 180
          }),
        }),
        response: {
          201: z.null(),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      await request.verifyUserRole('ADMIN')

      const { title, description, phone, latitude, longitude } = request.body

      try {
        const createGymUseCase = makeCreateGymUseCase()

        await createGymUseCase.execute({
          title,
          description,
          phone,
          latitude,
          longitude,
        })

        return reply.status(201).send()
      } catch (err) {
        throw err
      }
    },
  )
}
