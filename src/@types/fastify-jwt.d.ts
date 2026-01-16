import 'fastify'
import '@fastify/jwt'

declare module 'fastify' {
  export interface FastifyRequest {
    getCurrentUserId(): Promise<string>
    verifyUserRole(requiredRole: 'ADMIN' | 'MEMBER'): Promise<void>
  }
}

declare module '@fastify/jwt' {
  export interface FastifyJWT {
    user: {
      role: 'ADMIN' | 'MEMBER'
      sub: string
    }
  }
}