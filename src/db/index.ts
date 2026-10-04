// src/db/index.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    const rawUrl = (process.env.DATABASE_URL || '').trim();
    let connStr = rawUrl;

    // Fallback if DATABASE_URL was cut off or missing in Render environment
    if (!connStr || !connStr.includes('@')) {
      console.warn('[PostgreSQL] Incomplete or missing DATABASE_URL. Applying default Neon Cloud connection string.');
      connStr = 'postgresql://neondb_owner:npg_Y3LESyxthM4J@ep-super-cloud-b33brsmd-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    } else if (!connStr.startsWith('postgresql://') && !connStr.startsWith('postgres://')) {
      connStr = `postgresql://${connStr}`;
    }

    const hostDisplay = connStr.split('@')[1]?.split('/')[0] || 'remote-db';
    console.log(`[PostgreSQL] Initializing connection to cloud database (${hostDisplay})...`);

    global._postgresPool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 20000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      statement_timeout: 30000,
    });

    global._postgresPool.on('error', (err) => {
      // Catch and log idle pool client errors gracefully without killing the server process
      console.warn('[PostgreSQL Pool Warning] Reconnecting dropped client:', err?.message || err);
    });
  }
  return global._postgresPool;
};

export const ensureSchemaColumns = async (p: Pool) => {
  try {
    await p.query(`
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_drive_folder_id text;
      ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_drive_url text;
      ALTER TABLE document_files ADD COLUMN IF NOT EXISTS file_data text;
      ALTER TABLE document_files ADD COLUMN IF NOT EXISTS drive_file_id text;
      ALTER TABLE document_files ADD COLUMN IF NOT EXISTS drive_web_view_link text;
    `);
  } catch (err: any) {
    console.warn('[PostgreSQL Schema Sync Warning]:', err?.message || err);
  }
};

const pool = createPool();
ensureSchemaColumns(pool).catch(() => {});
export const db = drizzle(pool, { schema });
