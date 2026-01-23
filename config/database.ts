import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const defaultConnection = env.get('DB_CONNECTION') || (env.get('NODE_ENV') === 'production' ? 'turso' : 'sqlite')

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
        url: env.get('TURSO_DATABASE_URL'),
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
