import { makeCheckInUseCase } from '@/use-cases/factories/make-check-in-use.case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const create: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/gyms/:gymId/check-ins',
    {
      schema: {
        summary: 'Create check-in',
        tags: ['check-ins'],
        operationId: 'createCheckIn',
        security: [{ bearerAuth: [] }],
        params: z.object({
          gymId: z.uuid(),
        }),
        body: z.object({
          latitude: z.number().refine((value) => {
            return Math.abs(value) <= 90
          }),
          longitude: z.number().refine((value) => {
            return Math.abs(value) <= 180
          }),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { gymId } = request.params
      const { latitude, longitude } = request.body

      try {
        const createCheckInUseCase = makeCheckInUseCase()

        await createCheckInUseCase.execute({
          gymId,
          userId,
          userLatitude: latitude,
          userLongitude: longitude,
        })

        return reply.status(201).send(null)
      } catch (err) {
        throw err
      }
    },
  )
}
