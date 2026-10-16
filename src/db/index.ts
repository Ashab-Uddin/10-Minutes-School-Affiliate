import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

const isConfigured = Boolean(process.env.SQL_HOST && (process.env.SQL_USER || process.env.SQL_ADMIN_USER));

export const createPool = () => {
  if (!isConfigured) return null;
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER || process.env.SQL_ADMIN_USER,
      password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD,
      database: process.env.SQL_DB_NAME || 'postgres',
      port: Number(process.env.SQL_PORT || 5432),
      max: 10,
      connectionTimeoutMillis: 5000,
    });
  }
  return global._postgresPool;
};

const pool = createPool();
export const db = pool ? drizzle(pool, { schema }) : null;

export function assertDb() {
  if (!db) {
    throw new Error(
      'Database is not configured. Set SQL_HOST and SQL_USER/SQL_ADMIN_USER before using database queries.'
    );
  }

  return db;
}