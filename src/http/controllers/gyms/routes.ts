import { FastifyInstance } from 'fastify'

import { search } from './search'
import { nearby } from './nearby'
import { create } from './create'
import { auth } from '@/http/middlewares/auth'

export const gymsRoutes = async (app: FastifyInstance) => {
  app.register(auth)

  app.register(search)
  app.register(nearby)
  app.register(create)
}
