import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const isProduction = env.get('NODE_ENV') === 'production'
const hasTurso = !!env.get('TURSO_DATABASE_URL') && env.get('TURSO_DATABASE_URL') !== 'your-turso-database-url'

// Force Turso in production if credentials exist, otherwise fallback to DB_CONNECTION or sqlite
const defaultConnection = (isProduction && hasTurso) ? 'turso' : (env.get('DB_CONNECTION') || 'sqlite')

console.log(`📡 Database System: Detected Environment [${env.get('NODE_ENV')}]`)
console.log(`📡 Turso URL exists: ${!!env.get('TURSO_DATABASE_URL')} (Starts with: ${env.get('TURSO_DATABASE_URL')?.trim().substring(0, 15)}...)`)
const token = env.get('TURSO_AUTH_TOKEN')?.trim() || ''
console.log(`📡 Turso Token exists: ${!!token} (Length: ${token.length})`)
if (token) {
  console.log(`📡 Turso Token Hint: ${token.substring(0, 5)}...${token.substring(token.length - 5)}`)
}

const dbConfig = defineConfig({
  connection: defaultConnection,
  connections: {
    sqlite: {
      client: 'sqlite3',
      connection: {
        filename: env.get('DB_DATABASE') || './db.sqlite',
      },
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
    turso: {
      client: 'libsql',
      connection: {
        filename: env.get('TURSO_DATABASE_URL')?.trim(),
        url: env.get('TURSO_DATABASE_URL')?.trim(),
        authToken: env.get('TURSO_AUTH_TOKEN')?.trim(),
        token: env.get('TURSO_AUTH_TOKEN')?.trim(),
      } as any,
      useNullAsDefault: true,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
