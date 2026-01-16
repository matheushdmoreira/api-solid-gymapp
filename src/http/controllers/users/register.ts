import { UserAlreadyExistsError } from '@/use-cases/errors/user-already-exists-error'
import { makeRegisterUseCase } from '@/use-cases/factories/make-register-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const register: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/users',
    {
      schema: {
        summary: 'Register user',
        tags: ['users'],
        operationId: 'registerUser',
        body: z.object({
          name: z.string(),
          email: z.string(),
          password: z.string().min(6),
        }),
        response: {
          201: z.null(),
          401: z.object({
            message: z.string(),
          }),
          409: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body

      try {
        const registerUseCase = makeRegisterUseCase()

        await registerUseCase.execute({
          name,
          email,
          password,
        })

        return reply.status(201).send()
      } catch (err) {
        if (err instanceof UserAlreadyExistsError) {
          return reply.status(409).send({
            message: err.message,
          })
        }

        throw err
      }
    },
  )
}
