import { makeSearchGymsUseCase } from '@/use-cases/factories/make-search-gyms-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const search: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/gyms/search',
    {
      schema: {
        summary: 'Search gyms',
        tags: ['gyms'],
        operationId: 'searchGyms',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          q: z.string(),
          page: z.coerce.number().min(1).default(1),
        }),
        response: {
          200: z.object({
            gyms: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().nullable(),
                phone: z.string().nullable(),
                latitude: z.coerce.number(),
                longitude: z.coerce.number(),
              }),
            ),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { q, page } = request.query

      try {
        const searchGymsUseCase = makeSearchGymsUseCase()

        const { gyms } = await searchGymsUseCase.execute({
          query: q,
          page,
        })

        return reply.status(200).send({
          gyms,
        })
      } catch (err) {
        throw err
      }
    },
  )
}
