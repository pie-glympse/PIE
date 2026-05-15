import { config } from 'dotenv'
import { defineConfig } from 'prisma/config'

// Next.js utilise .env.local ; Prisma ne le charge pas par défaut.
config({ path: '.env.local' })
config()

// DIRECT_URL : connexion directe (ex. Supabase sans pooler) pour migrations.
// Si absent, on retombe sur DATABASE_URL pour que `prisma generate` marche sans .env séparé.
const datasourceUrl =
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL ??
  'postgresql://127.0.0.1:5432/postgres'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
})

