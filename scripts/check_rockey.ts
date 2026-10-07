import { db } from '../src/db/index.ts';
import { clients } from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function checkClient() {
  const c = await db.select().from(clients).where(eq(clients.id, 'cli_ox6d98y'));
  console.log(JSON.stringify(c, null, 2));
}
checkClient().catch(console.error).finally(() => process.exit(0));
