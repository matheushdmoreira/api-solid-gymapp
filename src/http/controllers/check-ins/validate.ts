import { makeValidateCheckInUseCase } from '@/use-cases/factories/make-validate-check-in-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const validate: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/check-ins/:checkInId/validate',
    {
      schema: {
        summary: 'Validate check-ins',
        tags: ['check-ins'],
        operationId: 'checkInValidate',
        security: [{ bearerAuth: [] }],
        params: z.object({
          checkInId: z.uuid(),
        }),
        response: {
          204: z.null(),
        },
      },
    },
    async (request, reply) => {
      await request.verifyUserRole('ADMIN')

      const { checkInId } = request.params

      try {
        const validateCheckInUseCase = makeValidateCheckInUseCase()

        await validateCheckInUseCase.execute({
          checkInId,
        })

        return reply.status(204).send(null)
      } catch (err) {
        throw err
      }
    },
  )
}
