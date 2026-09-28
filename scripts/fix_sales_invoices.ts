// scripts/fix_sales_invoices.ts
import { db } from '../src/db/index.ts';
import { extractedDocuments, documentFiles, bankTransactions, monthlyRequests } from '../src/db/schema.ts';
import { eq, inArray } from 'drizzle-orm';
import { evaluateMonthlyChecklist } from '../src/services/checklistService.ts';

async function fixClassifications() {
  console.log('Inspecting extracted documents...');
  const docs = await db
    .select({
      id: extractedDocuments.id,
      docType: extractedDocuments.docType,
      monthlyRequestId: extractedDocuments.monthlyRequestId,
      filename: documentFiles.originalFilename,
    })
    .from(extractedDocuments)
    .innerJoin(documentFiles, eq(extractedDocuments.documentFileId, documentFiles.id));

  console.log('Total documents:', docs.length);
  const salesDocIds: string[] = [];

  for (const d of docs) {
    const fn = (d.filename || '').toLowerCase();
    const isSales =
      fn.startsWith('inv') ||
      fn.includes('forwardinvoice') ||
      fn.includes('sst_sales') ||
      fn.includes('invoice') ||
      fn.includes('sales');

    const isPurchase = fn.includes('purchase') || fn.includes('vendor') || fn.includes('amazon purchase');

    if (isSales && !isPurchase && d.docType !== 'sales_invoice') {
      salesDocIds.push(d.id);
      console.log(`Reclassifying to sales_invoice: "${d.filename}" (was ${d.docType})`);
    }
  }

  if (salesDocIds.length > 0) {
    await db.update(extractedDocuments).set({ docType: 'sales_invoice' }).where(inArray(extractedDocuments.id, salesDocIds));
    await db.delete(bankTransactions).where(inArray(bankTransactions.documentUnitId, salesDocIds));
    console.log(`Successfully reclassified ${salesDocIds.length} documents to sales_invoice!`);
  } else {
    console.log('No documents needed reclassification.');
  }

  // Update monthly request status for affected requests
  const distinctRequestIds = [...new Set(docs.map(d => d.monthlyRequestId))];
  for (const reqId of distinctRequestIds) {
    const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, reqId));
    const allFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, reqId));
    const allTx = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, reqId));
    const mr = await db.select().from(monthlyRequests).where(eq(monthlyRequests.id, reqId)).limit(1);

    if (mr.length > 0) {
      const evaluation = evaluateMonthlyChecklist({
        client: { requiredChecklist: ['sales_invoices', 'purchase_invoices', 'bank_statements'] },
        request: {
          reportingMonth: mr[0].reportingMonth,
          noTransactionsDeclared: mr[0].noTransactionsDeclared,
          categoryDeclarations: (mr[0].categoryDeclarations as any) || {},
        },
        extractedDocs: allDocs,
        files: allFiles,
        bankTransactions: allTx,
      });

      const newStatus = evaluation.missingItems.length === 0 ? 'Needs Review' : 'Missing Documents';
      await db.update(monthlyRequests).set({ status: newStatus }).where(eq(monthlyRequests.id, reqId));
      console.log(`Updated request ${reqId} status to: ${newStatus}`);
    }
  }

  console.log('Done!');
  process.exit(0);
}

fixClassifications().catch(err => {
  console.error(err);
  process.exit(1);
});
