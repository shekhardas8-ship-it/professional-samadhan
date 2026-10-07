import { db } from '../db/index.ts';
import { extractedDocuments } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { extractDocDate, normalizeDate } from '../services/extractor.ts';

async function migrateDates() {
  console.log('[MIGRATION] Starting invoice date fix and DD-MM-YYYY formatting...');

  const allDocs = await db.select({
    id: extractedDocuments.id,
    docNumber: extractedDocuments.docNumber,
    docType: extractedDocuments.docType,
    docDate: extractedDocuments.docDate,
    rawText: extractedDocuments.rawText,
  }).from(extractedDocuments);

  console.log(`[MIGRATION] Found ${allDocs.length} total extracted documents.`);

  let updatedCount = 0;

  for (const doc of allDocs) {
    let targetDate = doc.docDate || '';

    // If sales invoice and currently has upload date or YYYY-MM-DD date, extract real invoice date from rawText
    if (doc.docType === 'sales_invoice' && doc.rawText) {
      const extracted = extractDocDate(doc.rawText);
      if (extracted) {
        targetDate = extracted;
      }
    } else if (targetDate) {
      targetDate = normalizeDate(targetDate);
    }

    if (targetDate && targetDate !== doc.docDate) {
      await db.update(extractedDocuments)
        .set({ docDate: targetDate })
        .where(eq(extractedDocuments.id, doc.id));
      
      console.log(`[UPDATED] (${doc.docType}) ${doc.docNumber || doc.id}: "${doc.docDate}" -> "${targetDate}"`);
      updatedCount++;
    }
  }

  console.log(`[MIGRATION COMPLETE] Successfully updated ${updatedCount} document dates to DD-MM-YYYY format.`);
}

migrateDates()
  .catch(console.error)
  .finally(() => process.exit(0));
