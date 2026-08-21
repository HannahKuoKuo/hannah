import knex from 'knex';

let db: any = null;

export async function initializeDatabase() {
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
