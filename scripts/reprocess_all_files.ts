import { db } from '../src/db/index.ts';
import { monthlyRequests, clients, documentFiles, extractedDocuments, extractedLineItems, validationExceptions, bankTransactions } from '../src/db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import { extractDocumentContent } from '../src/services/extractor.ts';
import { evaluateMonthlyChecklist } from '../src/services/checklistService.ts';

async function main() {
  const requestId = 'req_4lv68i_2026_08';
  console.log(`Starting complete reprocessing for ${requestId}...`);

  const reqList = await db.select().from(monthlyRequests).where(eq(monthlyRequests.id, requestId)).limit(1);
  if (reqList.length === 0) {
    console.error('Request not found');
    process.exit(1);
  }
  const mr = reqList[0];
  const clientList = await db.select().from(clients).where(eq(clients.id, mr.clientId)).limit(1);
  const client = clientList[0];

  const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, requestId));
  console.log(`Found ${files.length} document files.`);

  // Get existing docs map by documentFileId
  const existingDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, requestId));
  const docByFileId = new Map(existingDocs.filter(d => Boolean(d.documentFileId)).map(d => [d.documentFileId as string, d]));

  for (const f of files) {
    if (!fs.existsSync(f.storagePath)) {
      console.warn(`File missing on disk: ${f.storagePath}`);
      continue;
    }

    const buffer = fs.readFileSync(f.storagePath);
    const extractedList = await extractDocumentContent(
      buffer,
      f.originalFilename,
      client.gstin,
      f.mimeType,
      undefined,
      client.businessName || client.contactPerson,
      'auto'
    );

    const item = extractedList[0];
    if (!item) continue;

    const existingDoc = docByFileId.get(f.id);

    if (existingDoc) {
      await db
        .update(extractedDocuments)
        .set({
          docType: item.docType,
          docNumber: item.docNumber || existingDoc.docNumber,
          docDate: item.docDate || existingDoc.docDate,
          supplierName: item.supplierName || existingDoc.supplierName,
          supplierGstin: item.supplierGstin || existingDoc.supplierGstin,
          buyerName: item.buyerName || existingDoc.buyerName,
          buyerGstin: item.buyerGstin || existingDoc.buyerGstin,
          placeOfSupply: item.placeOfSupply || existingDoc.placeOfSupply,
          taxableAmount: String(item.taxableAmount || 0),
          cgstAmount: String(item.cgstAmount || 0),
          sgstAmount: String(item.sgstAmount || 0),
          igstAmount: String(item.igstAmount || 0),
          totalAmount: String(item.totalAmount || 0),
          extractionConfidence: String(item.extractionConfidence || 92.0),
        })
        .where(eq(extractedDocuments.id, existingDoc.id));

      // Refresh line items
      await db.delete(extractedLineItems).where(eq(extractedLineItems.documentUnitId, existingDoc.id));
      if (item.lineItems && item.lineItems.length > 0) {
        for (const line of item.lineItems) {
          await db.insert(extractedLineItems).values({
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            documentUnitId: existingDoc.id,
            itemDescription: line.itemDescription,
            hsnSac: line.hsnSac || '9983',
            taxableValue: String(line.taxableValue || 0),
            taxRatePercent: line.taxRatePercent || 18,
            cgstAmount: String(line.cgstAmount || 0),
            sgstAmount: String(line.sgstAmount || 0),
            igstAmount: String(line.igstAmount || 0),
            cessAmount: '0',
            totalAmount: String(line.totalAmount || 0),
          });
        }
      }
    } else {
      const extDocId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.insert(extractedDocuments).values({
        id: extDocId,
        documentFileId: f.id,
        monthlyRequestId: requestId,
        clientId: client.id,
        gstin: client.gstin,
        docType: item.docType,
        docNumber: item.docNumber || 'DOC-EXTRACTED',
        docDate: item.docDate || new Date().toISOString().slice(0, 10),
        supplierName: item.supplierName || client.businessName,
        supplierGstin: item.supplierGstin || client.gstin,
        buyerName: item.buyerName || 'Customer',
        buyerGstin: item.buyerGstin || client.gstin,
        placeOfSupply: item.placeOfSupply || '07-Delhi',
        taxableAmount: String(item.taxableAmount || 0),
        cgstAmount: String(item.cgstAmount || 0),
        sgstAmount: String(item.sgstAmount || 0),
        igstAmount: String(item.igstAmount || 0),
        cessAmount: String(item.cessAmount || 0),
        totalAmount: String(item.totalAmount || 0),
        extractionConfidence: String(item.extractionConfidence || 90.0),
        reviewStatus: 'pending',
      });
    }
  }

  // Re-evaluate checklist
  const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, requestId));
  const allFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, requestId));
  const allBankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, requestId));
  const allExceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, requestId));

  const evalResult = evaluateMonthlyChecklist({
    client: {
      requiredChecklist: client.requiredChecklist || [],
      expectedBankAccounts: client.expectedBankAccounts || [],
    },
    request: {
      reportingMonth: mr.reportingMonth,
      noTransactionsDeclared: mr.noTransactionsDeclared,
      categoryDeclarations: (mr.categoryDeclarations as any) || {},
    },
    extractedDocs: allDocs,
    files: allFiles,
    bankTransactions: allBankTxns,
    manualExceptions: allExceptions,
  });

  const newStatus = evalResult.missingItems.length > 0 ? 'Missing Documents' : 'Needs Review';
  await db
    .update(monthlyRequests)
    .set({
      totalInvoicesExtracted: allDocs.length,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(monthlyRequests.id, requestId));

  console.log(`\n Reprocessed ${files.length} files successfully!`);
  console.log(`Total Extracted Docs: ${allDocs.length}`);
  const counts: Record<string, number> = {};
  for (const d of allDocs) {
    counts[d.docType] = (counts[d.docType] || 0) + 1;
  }
  console.log('Counts by docType:', JSON.stringify(counts, null, 2));
  console.log('Checklist evaluation status:', newStatus);
  console.log('Missing items:', evalResult.missingItems);
  process.exit(0);
}
main();
