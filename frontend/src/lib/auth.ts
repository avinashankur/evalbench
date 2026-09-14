import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { env } from '@/env'

export const auth = betterAuth({
  database: new Pool({
    connectionString: env.DATABASE_URL,
  }),

  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.NEXT_PUBLIC_APP_URL,

  emailAndPassword: {
    enabled: true,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
})

