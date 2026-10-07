// Auto-generated restore script
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function restore() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf-8'));
  console.log('Restoring backup from ' + manifest.timestamp);

  for (const [table, info] of Object.entries(manifest.tables)) {
    if (!info.fileName) continue;
    const filePath = path.join(__dirname, info.fileName);
    if (!fs.existsSync(filePath)) continue;
    const rows = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Restoring ${rows.length} rows to ${table}...`);
    for (const row of rows) {
      const keys = Object.keys(row);
      if (keys.length === 0) continue;
      const values = Object.values(row).map(v => typeof v === 'object' && v !== null && !(v instanceof Date) ? JSON.stringify(v) : v);
      const cols = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
      try {
        await pool.query(`INSERT INTO "${table}" (${cols}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
      } catch (e) {
        console.warn(`Warning on ${table}: `, e.message);
      }
    }
  }
  await pool.end();
  console.log('Restore completed successfully.');
}
restore();
