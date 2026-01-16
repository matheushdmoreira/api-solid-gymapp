import { makeFetchNearbyGymsUseCase } from '@/use-cases/factories/make-fetch-nearby-gyms-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const nearby: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/gyms/nearby',
    {
      schema: {
        summary: 'Nearby gyms',
        tags: ['gyms'],
        operationId: 'nearbyGyms',
        security: [{ bearerAuth: [] }],
        querystring: z.object({
          latitude: z.coerce.number().refine((value) => {
            return Math.abs(value) <= 90
          }),
          longitude: z.coerce.number().refine((value) => {
            return Math.abs(value) <= 180
          }),
        }),
        response: {
          200: z.object({
            gyms: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().nullable(),
                phone: z.string().nullable(),
                latitude: z.coerce.string(),
                longitude: z.coerce.string(),
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
      const { latitude, longitude } = request.query

      try {
        const fetchNearbyGymsUseCase = makeFetchNearbyGymsUseCase()

        const { gyms } = await fetchNearbyGymsUseCase.execute({
          userLatitude: latitude,
          userLongitude: longitude,
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
