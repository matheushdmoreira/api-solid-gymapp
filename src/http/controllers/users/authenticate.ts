import { InvalidCredentialsError } from '@/use-cases/errors/invalid-credentials-error'
import { makeAuthenticateUseCase } from '@/use-cases/factories/make-authenticate-use-case'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const authenticate: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/sessions',
    {
      schema: {
        summary: 'Authenticate user',
        tags: ['users'],
        operationId: 'authenticateUser',
        body: z.object({
          email: z.string(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      try {
        const authenticateUseCase = makeAuthenticateUseCase()

        const { user } = await authenticateUseCase.execute({
          email,
          password,
        })

        const token = await reply.jwtSign(
          {
            role: user.role,
          },
          {
            sign: {
              sub: user.id,
            },
          },
        )

        const refreshToken = await reply.jwtSign(
          {
            role: user.role,
          },
          {
            sign: {
              sub: user.id,
              expiresIn: '7d',
            },
          },
        )

        return reply
          .setCookie('refreshToken', refreshToken, {
            path: '/',
            secure: true,
            sameSite: true,
            httpOnly: true,
          })
          .status(200)
          .send({
            token,
          })
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          return reply.status(400).send({
            message: err.message,
          })
        }

        throw err
      }
    },
  )
}
