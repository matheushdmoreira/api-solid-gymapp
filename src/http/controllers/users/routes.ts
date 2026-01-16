import { FastifyInstance } from 'fastify'

import { register } from './register'
import { authenticate } from './authenticate'
import { profile } from './profile'
import { refresh } from './refresh'

export const usersRoutes = async (app: FastifyInstance) => {
  app.register(register)
  app.register(authenticate)
  app.register(refresh)
  app.register(profile)
}
