// scripts/run_cloud_db_cleanup.cjs
const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/quinceca/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('[DB] Connecting to PostgreSQL...');
  
  // 1. Ensure columns exist on validation_exceptions
  await pool.query(`
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS resolved_by_name TEXT;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS resolved_by_role TEXT;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS senior_approved_by TEXT;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS senior_approved_by_name TEXT;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS senior_approved_at TIMESTAMP;
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'none';
    ALTER TABLE validation_exceptions ADD COLUMN IF NOT EXISTS correction_category TEXT DEFAULT 'arithmetic';
  `);
  console.log('[DB] validation_exceptions columns ensured.');

  // 2. Clean erroneous passwords from invoices
  const res = await pool.query(`
    UPDATE document_files
    SET document_password = NULL,
        scan_notes = REGEXP_REPLACE(scan_notes, '^Password:\\s*[^|]+(\\s*\\|\\s*)?', '')
    WHERE original_filename !~* '(bank|statement|passbook|hdfc|sbi|icici|axis|kotak|canara|pnb|acct)'
      AND status != 'password_protected'
      AND document_password IS NOT NULL;
  `);
  console.log('[DB] Cleaned document_files affected rows:', res.rowCount);

  // 3. Inspect columns
  const cols = await pool.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'validation_exceptions' 
    ORDER BY ordinal_position;
  `);
  console.log('[DB] validation_exceptions columns:', cols.rows.map(r => r.column_name).join(', '));

  await pool.end();
  console.log('[DB] Finished successfully.');
}

run().catch(err => {
  console.error('[DB Error]', err);
  process.exit(1);
});
