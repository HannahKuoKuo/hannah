import knex, { Knex } from 'knex';
import { logger } from './logger';

let db: Knex | null = null;

export async function initializeDatabase(): Promise<Knex> {
  if (db) return db;

  try {
    db = knex({
      client: 'pg',
      connection: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'acesign_analytics',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      },
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        idleTimeoutMillis: 30000
      },
      migrations: {
        directory: '../migrations'
      }
    });

    // 测试连接
    await db.raw('SELECT 1');
    logger.info('Database connection successful');

    // 运行待处理的迁移
    const migrations = await db.migrate.list();
    if (migrations[1].length > 0) {
      logger.info(`Running ${migrations[1].length} pending migrations...`);
      await db.migrate.latest();
      logger.info('Migrations completed successfully');
    }

    return db;
  } catch (error) {
    logger.error('Database initialization failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
