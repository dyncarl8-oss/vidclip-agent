import env from '#start/env'
import db from '@adonisjs/lucid/services/db'
import tursoService from '#services/turso_service'

/**
 * Database Service - Abstraction layer for dev/prod environments
 * 
 * Development: Uses Lucid ORM with SQLite
 * Production: Uses Turso service with LibSQL
 */
class DatabaseService {
  private isProduction = env.get('NODE_ENV') === 'production'

  /**
   * Execute raw SQL query
   */
  async execute(sql: string, params: any[] = []): Promise<{
    rows: any[];
    rowsAffected?: number;
    lastInsertRowid?: any;
  }> {
    if (this.isProduction) {
      // Production: Use Turso
      const result = await tursoService.execute(sql, params)
      return {
        rows: result.rows,
        rowsAffected: result.rowsAffected,
        lastInsertRowid: result.lastInsertRowid
      }
    } else {
      // Development: Use Lucid ORM with SQLite
      const result = await db.rawQuery(sql, params)
      // SQLite/Better-sqlite3 through Lucid might return result differently
      return {
        rows: result.rows || result,
        rowsAffected: result.rowsAffected || (result as any).changes,
        lastInsertRowid: result.lastInsertRowid || (result as any).insertId
      }
    }
  }

  /**
   * Execute batch statements
   */
  async batch(statements: Array<{ sql: string; args?: any[] }>): Promise<any> {
    if (this.isProduction) {
      // Production: Use Turso batch
      return await tursoService.batch(statements)
    } else {
      // Development: Execute sequentially with Lucid
      const results = []
      for (const stmt of statements) {
        const result = await this.execute(stmt.sql, stmt.args || [])
        results.push(result)
      }
      return results
    }
  }

  /**
   * Get database connection info
   */
  getConnectionInfo(): { type: string; environment: string } {
    return {
      type: this.isProduction ? 'turso' : 'sqlite',
      environment: env.get('NODE_ENV', 'development')
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ success: boolean; message: string }> {
    try {
      await this.execute('SELECT 1 as test')
      return {
        success: true,
        message: `Database connection healthy (${this.getConnectionInfo().type})`
      }
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${error.message}`
      }
    }
  }
}

export default new DatabaseService()
