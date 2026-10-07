// scripts/backup_cloud_database.js
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';

async function backupCloudDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups', `cloud_backup_${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`=======================================================`);
  console.log(`🚀 Starting Full Cloud Database Backup from Neon Postgres`);
  console.log(`Destination Directory: ${backupDir}`);
  console.log(`=======================================================\n`);

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  const backupManifest = {
    timestamp: new Date().toISOString(),
    sourceUrl: connectionString.replace(/:[^:@]+@/, ':***@'),
    tables: {},
    totalRows: 0,
    filesBackupCount: 0,
  };

  try {
    const client = await pool.connect();
    console.log('✓ Successfully connected to Neon Cloud PostgreSQL');

    // 1. Get all public tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tableNames = tablesRes.rows.map(r => r.table_name);
    console.log(`Discovered ${tableNames.length} tables in Neon database: ${tableNames.join(', ')}\n`);

    for (const tableName of tableNames) {
      process.stdout.write(`Backing up [${tableName}]... `);
      try {
        // Get column details for schema definition
        const colsRes = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        // Get table data
        const rowsRes = await client.query(`SELECT * FROM "${tableName}"`);
        const rowCount = rowsRes.rows.length;
        backupManifest.totalRows += rowCount;
        backupManifest.tables[tableName] = {
          columns: colsRes.rows,
          rowCount: rowCount,
          fileName: `${tableName}.json`
        };

        const tableFilePath = path.join(backupDir, `${tableName}.json`);
        fs.writeFileSync(tableFilePath, JSON.stringify(rowsRes.rows, null, 2), 'utf-8');
        console.log(`✓ ${rowCount} rows saved (${(fs.statSync(tableFilePath).size / 1024).toFixed(1)} KB)`);
      } catch (tableErr) {
        console.error(`❌ Error backing up table ${tableName}:`, tableErr.message);
        backupManifest.tables[tableName] = {
          error: tableErr.message,
          rowCount: 0
        };
      }
    }

    // 2. Also back up local storage files if any exist
    const localUploadsDir = path.resolve(process.cwd(), 'local_storage');
    const localBackupTarget = path.join(backupDir, 'local_storage_snapshot');
    if (fs.existsSync(localUploadsDir)) {
      console.log('\nBacking up local storage directory...');
      copyRecursiveSync(localUploadsDir, localBackupTarget);
      console.log('✓ Local storage files snapshot created');
    }

    // 3. Save Manifest file
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(backupManifest, null, 2),
      'utf-8'
    );

    // 4. Create an automated restore script
    const restoreScriptContent = `// Auto-generated restore script
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
    console.log(\`Restoring \${rows.length} rows to \${table}...\`);
    for (const row of rows) {
      const keys = Object.keys(row);
      if (keys.length === 0) continue;
      const values = Object.values(row).map(v => typeof v === 'object' && v !== null && !(v instanceof Date) ? JSON.stringify(v) : v);
      const cols = keys.map(k => \`"\${k}"\`).join(', ');
      const placeholders = keys.map((_, i) => \`$\${i+1}\`).join(', ');
      try {
        await pool.query(\`INSERT INTO "\${table}" (\${cols}) VALUES (\${placeholders}) ON CONFLICT DO NOTHING\`, values);
      } catch (e) {
        console.warn(\`Warning on \${table}: \`, e.message);
      }
    }
  }
  await pool.end();
  console.log('Restore completed successfully.');
}
restore();
`;
    fs.writeFileSync(path.join(backupDir, 'restore.js'), restoreScriptContent, 'utf-8');

    console.log(`\n=======================================================`);
    console.log(`✅ FULL CLOUD BACKUP COMPLETED SUCCESSFULLY!`);
    console.log(`Total Tables: ${Object.keys(backupManifest.tables).length}`);
    console.log(`Total Records: ${backupManifest.totalRows}`);
    console.log(`Backup Location: ${backupDir}`);
    console.log(`Manifest & Restore Script saved.`);
    console.log(`=======================================================\n`);

    client.release();
  } catch (err) {
    console.error('Fatal backup error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

backupCloudDatabase();
