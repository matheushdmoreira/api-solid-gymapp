import { makeFetchUserCheckInsHistoryUseCase } from '@/use-cases/factories/make-fetch-user-check-ins-history-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const history: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/check-ins/history',
    {
      schema: {
        summary: 'History check-ins',
        tags: ['check-ins'],
        operationId: 'checkInHistory',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
        }),
        response: {
          200: z.object({
            checkIns: z.array(
              z.object({
                id: z.string(),
                user_id: z.string(),
                gym_id: z.string(),
                created_at: z.date(),
                validated_at: z.date().nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = await request.getCurrentUserId()
      const { page } = request.query

      try {
        const fetchUserCheckInsHistoryUseCase =
          makeFetchUserCheckInsHistoryUseCase()

        const { checkIns } = await fetchUserCheckInsHistoryUseCase.execute({
          userId,
          page,
        })

        return reply.status(200).send({
          checkIns,
        })
      } catch (err) {
        throw err
      }
    },
  )
}
