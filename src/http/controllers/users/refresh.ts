import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const refresh: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/token/refresh',
    {
      onRequest: [(request) => request.jwtVerify({ onlyCookie: true })],
      schema: {
        summary: 'Refresh token',
        tags: ['users'],
        operationId: 'refreshTokenUser',
        security: [{ bearerAuth: [] }],
        response: {
          200: z.object({
            token: z.string(),
          }),
          401: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { sub, role } = request.user

      const token = await reply.jwtSign(
        {
          role,
        },
        {
          sign: {
            sub,
          },
        },
      )

      const refreshToken = await reply.jwtSign(
        {
          role,
        },
        {
          sign: {
            sub,
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
    },
  )
}
