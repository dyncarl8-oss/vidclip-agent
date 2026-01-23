import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const isProduction = env.get('NODE_ENV') === 'production'
const hasTurso = !!env.get('TURSO_DATABASE_URL') && env.get('TURSO_DATABASE_URL') !== 'your-turso-database-url'

// Force Turso in production if credentials exist, otherwise fallback to DB_CONNECTION or sqlite
const defaultConnection = (isProduction && hasTurso) ? 'turso' : (env.get('DB_CONNECTION') || 'sqlite')

console.log(`📡 Database System: Detected Environment [${env.get('NODE_ENV')}]`)
console.log(`📡 Database System: Selecting Connection [${defaultConnection}]`)

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
        filename: env.get('TURSO_DATABASE_URL'),
        authToken: env.get('TURSO_AUTH_TOKEN'),
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
