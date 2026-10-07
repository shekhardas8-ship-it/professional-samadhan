import { db } from '../src/db/index.ts';
import { documentFiles } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function listFiles() {
  const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, 'req_x6d98y_2026_09'));
  console.log(`Found ${files.length} files in req_x6d98y_2026_09:`);
  for (const f of files) {
    console.log({
      id: f.id,
      name: f.originalFilename,
      path: f.storagePath,
      status: f.status,
      scanNotes: f.scanNotes,
    });
  }
}

listFiles().catch(console.error).finally(() => process.exit(0));
