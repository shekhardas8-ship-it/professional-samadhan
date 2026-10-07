import { db } from '../src/db/index.ts';
import { clients, monthlyRequests, documentFiles, extractedDocuments, validationExceptions } from '../src/db/schema.ts';

async function inspectCloudDb() {
  console.log('=== CLIENTS ===');
  const allClients = await db.select().from(clients);
  for (const c of allClients) {
    console.log({ id: c.id, businessName: c.businessName, gstin: c.gstin });
  }

  console.log('\n=== MONTHLY REQUESTS ===');
  const allRequests = await db.select().from(monthlyRequests);
  for (const r of allRequests) {
    console.log({ id: r.id, clientId: r.clientId, reportingMonth: r.reportingMonth, status: r.status, totalFiles: r.totalFilesReceived, totalInvoices: r.totalInvoicesExtracted });
  }

  console.log('\n=== DOCUMENT FILES ===');
  const allFiles = await db.select().from(documentFiles);
  for (const f of allFiles) {
    console.log({ id: f.id, requestId: f.monthlyRequestId, filename: f.originalFilename, storagePath: f.storagePath, status: f.status });
  }

  console.log('\n=== EXTRACTED DOCUMENTS ===');
  const allDocs = await db.select().from(extractedDocuments);
  for (const d of allDocs) {
    console.log({
      id: d.id,
      fileId: d.documentFileId,
      docNumber: d.docNumber,
      docType: d.docType,
      supplier: d.supplierName,
      supplierGstin: d.supplierGstin,
      buyer: d.buyerName,
      buyerGstin: d.buyerGstin,
      taxable: d.taxableAmount,
      cgst: d.cgstAmount,
      sgst: d.sgstAmount,
      igst: d.igstAmount,
      total: d.totalAmount,
      reverseCharge: d.reverseCharge,
    });
  }

  console.log('\n=== VALIDATION EXCEPTIONS ===');
  const allExceptions = await db.select().from(validationExceptions);
  for (const ex of allExceptions) {
    console.log({
      id: ex.id,
      requestId: ex.monthlyRequestId,
      checkType: ex.checkType,
      severity: ex.severity,
      message: ex.message,
    });
  }
}

inspectCloudDb().catch(console.error).finally(() => process.exit(0));
