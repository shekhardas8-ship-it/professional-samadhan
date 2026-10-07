import { db } from '../src/db/index.ts';
import { clients, monthlyRequests, extractedDocuments } from '../src/db/schema.ts';

async function summary() {
  console.log('=== CLIENTS ===');
  const allClients = await db.select().from(clients);
  for (const c of allClients) {
    console.log({ id: c.id, businessName: c.businessName, gstin: c.gstin });
  }

  console.log('\n=== REQUESTS ===');
  const allRequests = await db.select().from(monthlyRequests);
  for (const r of allRequests) {
    console.log({ id: r.id, clientId: r.clientId, month: r.reportingMonth, status: r.status, totalFiles: r.totalFilesReceived, totalInvoices: r.totalInvoicesExtracted });
  }

  console.log('\n=== EXTRACTED DOCUMENTS ===');
  const allDocs = await db.select().from(extractedDocuments);
  console.log(`Total extracted documents: ${allDocs.length}`);
  for (const d of allDocs) {
    console.log({
      id: d.id,
      reqId: d.monthlyRequestId,
      docNumber: d.docNumber,
      docType: d.docType,
      supplier: d.supplierName,
      taxable: d.taxableAmount,
      cgst: d.cgstAmount,
      sgst: d.sgstAmount,
      igst: d.igstAmount,
      total: d.totalAmount,
    });
  }
}

summary().catch(console.error).finally(() => process.exit(0));
