// sync-to-neon.js
import 'dotenv/config';
import { Pool } from 'pg';

async function migrateData() {
  console.log('Connecting to Local Docker Postgres...');
  const localPool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres',
  });

  console.log('Connecting to Remote Neon Cloud Postgres...');
  const neonPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const tables = [
    'users',
    'clients',
    'monthly_requests',
    'document_files',
    'extracted_documents',
    'extracted_line_items',
    'bank_transactions',
    'validation_exceptions',
    'generated_workbooks',
    'audit_notifications',
  ];

  for (const table of tables) {
    try {
      const { rows } = await localPool.query(`SELECT * FROM ${table}`);
      console.log(`Fetched ${rows.length} rows from local ${table}`);

      if (rows.length > 0) {
        for (const row of rows) {
          const keys = Object.keys(row);
          const values = Object.values(row).map(val => {
            if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
              return JSON.stringify(val);
            }
            return val;
          });
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const columns = keys.map(k => `"${k}"`).join(', ');

          const query = `
            INSERT INTO ${table} (${columns})
            VALUES (${placeholders})
            ON CONFLICT (id) DO NOTHING
          `;
          await neonPool.query(query, values);
        }
        console.log(`✓ Synced ${rows.length} rows to Neon ${table}`);
      }
    } catch (err) {
      console.error(`Error syncing table ${table}:`, err.message);
    }
  }

  await localPool.end();
  await neonPool.end();
  console.log('\n🎉 ALL DATA MIGRATED TO NEON CLOUD DATABASE SUCCESSFULLY!');
}

migrateData();
