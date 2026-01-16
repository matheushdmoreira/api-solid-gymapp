import { makeGetUserMetricsUseCase } from '@/use-cases/factories/make-get-user-metrics-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const metrics: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/check-ins/metrics',
    {
      schema: {
        summary: 'Metrics check-ins',
        tags: ['check-ins'],
        operationId: 'checkInMetrics',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            checkInsCount: z.number(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()

      try {
        const getUserMetricsUseCase = makeGetUserMetricsUseCase()

        const { checkInsCount } = await getUserMetricsUseCase.execute({
          userId,
        })

        return reply.status(200).send({
          checkInsCount,
        })
      } catch (err) {
        throw err
      }
    },
  )
}
