import { FastifyInstance } from 'fastify'

import { create } from './create'
import { validate } from './validate'
import { history } from './history'
import { metrics } from './metrics'
import { auth } from '@/http/middlewares/auth'

export async function checkInsRoutes(app: FastifyInstance) {
  app.register(auth)

  app.register(history)
  app.register(metrics)
  app.register(create)
  app.register(validate)
}
