import knex from 'knex';
import path from 'path';

let db: any = null;

export async function initializeDatabase() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && process.env.DATABASE_URL?.includes('postgresql')) {
    // Use PostgreSQL in production
    db = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL,
      migrations: {
        directory: '../../database/migrations'
      },
      seeds: {
        directory: '../../database/seeds'
      }
    });
  } else {
    // Use SQLite in development
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), '../../ace_sign.db');
    db = knex({
      client: 'better-sqlite3',
      connection: {
        filename: dbPath
      },
      useNullAsDefault: true,
      migrations: {
        directory: '../../database/migrations'
      },
      seeds: {
        directory: '../../database/seeds'
      }
    });
  }

  // Run migrations
  await db.migrate.latest();

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
