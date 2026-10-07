import { db } from '../src/db/index.ts';
import { documentFiles } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

async function check() {
  const uploadsDir = 'd:/MyProject/CA tools/local_storage/uploads';
  const allFilesInDir = fs.readdirSync(uploadsDir);
  const dbFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, 'req_x6d98y_2026_09'));

  console.log(`Found ${dbFiles.length} records in documentFiles for req_x6d98y_2026_09.`);
  let foundCount = 0;
  for (const f of dbFiles) {
    let diskPath = f.storagePath;
    if (!fs.existsSync(diskPath)) {
      // Try to find by matching original filename in uploadsDir
      const match = allFilesInDir.find(name => name.endsWith(f.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_')) || name.includes(f.originalFilename));
      if (match) {
        diskPath = path.join(uploadsDir, match);
      }
    }
    const exists = fs.existsSync(diskPath);
    if (exists) foundCount++;
    console.log({ id: f.id, name: f.originalFilename, exists, diskPath: exists ? path.basename(diskPath) : 'MISSING' });
  }
  console.log(`\nFound on disk: ${foundCount} / ${dbFiles.length}`);
}

check().catch(console.error).finally(() => process.exit(0));
