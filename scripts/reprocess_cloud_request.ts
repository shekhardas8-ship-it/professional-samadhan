import { db } from '../src/db/index.ts';
import {
  monthlyRequests,
  clients,
  documentFiles,
  extractedDocuments,
  extractedLineItems,
  validationExceptions,
  bankTransactions,
} from '../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { extractDocumentContent } from '../src/services/extractor.ts';
import { runValidationChecks } from '../src/services/validator.ts';
import { evaluateMonthlyChecklist } from '../src/services/checklistService.ts';

async function reprocessRequest() {
  const requestId = 'req_x6d98y_2026_09';
  console.log(`[REPROCESS] Starting complete reprocessing for ${requestId}...`);

  const reqList = await db.select().from(monthlyRequests).where(eq(monthlyRequests.id, requestId)).limit(1);
  if (reqList.length === 0) {
    console.error(`Request ${requestId} not found`);
    process.exit(1);
  }
  const mr = reqList[0];

  // 1. Ensure client profile has genuine business name and GSTIN matching documents
  await db
    .update(clients)
    .set({
      businessName: 'THE STUDIO NUQAAT STORE',
      gstin: '07DWAPK0131H1Z1',
      updatedAt: new Date(),
    })
    .where(eq(clients.id, mr.clientId));

  const clientList = await db.select().from(clients).where(eq(clients.id, mr.clientId)).limit(1);
  const client = clientList[0];
  console.log(`[CLIENT UPDATED] ${client.businessName} (GSTIN: ${client.gstin})`);

  const files = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, requestId));
  console.log(`[FILES] Found ${files.length} documentFiles in DB.`);

  const uploadsDir = 'd:/MyProject/CA tools/local_storage/uploads';
  const allFilesInDir = fs.readdirSync(uploadsDir);

  const existingDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, requestId));
  const docByFileId = new Map(existingDocs.filter(d => Boolean(d.documentFileId)).map(d => [d.documentFileId as string, d]));

  let processedCount = 0;
  let skippedCount = 0;

  for (const f of files) {
    let diskPath = f.storagePath;
    if (!fs.existsSync(diskPath)) {
      // Find matching file in local_storage/uploads
      const cleanOrig = f.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const match = allFilesInDir.find(name => name.endsWith(cleanOrig) || name.includes(f.originalFilename));
      if (match) {
        diskPath = path.join(uploadsDir, match);
      }
    }

    if (!fs.existsSync(diskPath)) {
      console.warn(`[MISSING ON DISK] ${f.originalFilename}`);
      skippedCount++;
      continue;
    }

    // Update documentFiles with valid disk path and status
    await db
      .update(documentFiles)
      .set({
        storagePath: diskPath,
        status: 'processed',
        scanNotes: null,
      })
      .where(eq(documentFiles.id, f.id));

    const buffer = fs.readFileSync(diskPath);
    const extractedList = await extractDocumentContent(
      buffer,
      f.originalFilename,
      client.gstin,
      f.mimeType,
      undefined,
      client.businessName,
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
          reverseCharge: Boolean(item.reverseCharge),
          taxableAmount: String(item.taxableAmount || 0),
          cgstAmount: String(item.cgstAmount || 0),
          sgstAmount: String(item.sgstAmount || 0),
          igstAmount: String(item.igstAmount || 0),
          totalAmount: String(item.totalAmount || 0),
          extractionConfidence: String(item.extractionConfidence || 95.0),
          rawText: item.rawText,
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
            quantity: line.quantity ? String(line.quantity) : undefined,
            unit: line.unit,
            rate: line.rate ? String(line.rate) : undefined,
            taxableValue: String(line.taxableValue || 0),
            taxRatePercent: String(line.taxRatePercent || 18),
            cgstAmount: String(line.cgstAmount || 0),
            sgstAmount: String(line.sgstAmount || 0),
            igstAmount: String(line.igstAmount || 0),
            cessAmount: '0.00',
            totalAmount: String(line.totalAmount || 0),
          });
        }
      }

      // Bank transactions if bank statement
      if (item.docType === 'bank_statement' && item.bankTransactions && item.bankTransactions.length > 0) {
        await db.delete(bankTransactions).where(eq(bankTransactions.documentUnitId, existingDoc.id));
        for (const tx of item.bankTransactions) {
          await db.insert(bankTransactions).values({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            documentUnitId: existingDoc.id,
            monthlyRequestId: requestId,
            bankName: tx.bankName,
            accountNumber: tx.accountNumber,
            transactionDate: tx.transactionDate,
            narration: tx.narration,
            debitAmount: String(tx.debitAmount || 0),
            creditAmount: String(tx.creditAmount || 0),
            balance: tx.balance !== undefined ? String(tx.balance) : undefined,
            referenceNumber: tx.referenceNumber,
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
        reverseCharge: Boolean(item.reverseCharge),
        taxableAmount: String(item.taxableAmount || 0),
        cgstAmount: String(item.cgstAmount || 0),
        sgstAmount: String(item.sgstAmount || 0),
        igstAmount: String(item.igstAmount || 0),
        cessAmount: String(item.cessAmount || 0),
        totalAmount: String(item.totalAmount || 0),
        extractionConfidence: String(item.extractionConfidence || 95.0),
        reviewStatus: 'auto_extracted',
        rawText: item.rawText,
      });

      if (item.lineItems && item.lineItems.length > 0) {
        for (const line of item.lineItems) {
          await db.insert(extractedLineItems).values({
            id: `line_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            documentUnitId: extDocId,
            itemDescription: line.itemDescription,
            hsnSac: line.hsnSac || '9983',
            quantity: line.quantity ? String(line.quantity) : undefined,
            unit: line.unit,
            rate: line.rate ? String(line.rate) : undefined,
            taxableValue: String(line.taxableValue || 0),
            taxRatePercent: String(line.taxRatePercent || 18),
            cgstAmount: String(line.cgstAmount || 0),
            sgstAmount: String(line.sgstAmount || 0),
            igstAmount: String(line.igstAmount || 0),
            cessAmount: '0.00',
            totalAmount: String(line.totalAmount || 0),
          });
        }
      }

      if (item.docType === 'bank_statement' && item.bankTransactions && item.bankTransactions.length > 0) {
        for (const tx of item.bankTransactions) {
          await db.insert(bankTransactions).values({
            id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            documentUnitId: extDocId,
            monthlyRequestId: requestId,
            bankName: tx.bankName,
            accountNumber: tx.accountNumber,
            transactionDate: tx.transactionDate,
            narration: tx.narration,
            debitAmount: String(tx.debitAmount || 0),
            creditAmount: String(tx.creditAmount || 0),
            balance: tx.balance !== undefined ? String(tx.balance) : undefined,
            referenceNumber: tx.referenceNumber,
          });
        }
      }
    }

    processedCount++;
    console.log(`[PROCESSED ${processedCount}/${files.length}] ${f.originalFilename} -> ${item.docNumber} (${item.docType}) Taxable: ₹${item.taxableAmount} Total: ₹${item.totalAmount} CGST: ₹${item.cgstAmount} SGST: ₹${item.sgstAmount} IGST: ₹${item.igstAmount} RCM: ${item.reverseCharge}`);
  }

  // 2. Clear old exceptions and run updated validation checks
  await db.delete(validationExceptions).where(eq(validationExceptions.monthlyRequestId, requestId));

  const allDocs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, requestId));
  const allLines = await db.select().from(extractedLineItems);
  const lineByDocId = new Map<string, any[]>();
  for (const l of allLines) {
    if (!lineByDocId.has(l.documentUnitId)) lineByDocId.set(l.documentUnitId, []);
    lineByDocId.get(l.documentUnitId)!.push(l);
  }

  const allFiles = await db.select().from(documentFiles).where(eq(documentFiles.monthlyRequestId, requestId));
  const allBankTxns = await db.select().from(bankTransactions).where(eq(bankTransactions.monthlyRequestId, requestId));

  const docsWithLines = allDocs.map(d => ({
    ...d,
    lineItems: lineByDocId.get(d.id) || [],
  }));

  const validationResults = runValidationChecks({
    client: {
      id: client.id,
      businessName: client.businessName,
      gstin: client.gstin,
      requiredChecklist: (client.requiredChecklist as string[]) || [],
      expectedBankAccounts: (client.expectedBankAccounts as any) || [],
    },
    request: {
      id: mr.id,
      reportingMonth: mr.reportingMonth,
      noTransactionsDeclared: mr.noTransactionsDeclared,
    },
    files: allFiles.map(f => ({
      id: f.id,
      originalFilename: f.originalFilename,
      isDuplicate: f.isDuplicate,
      isPasswordProtected: f.isPasswordProtected,
      status: f.status,
    })),
    extractedDocs: docsWithLines,
    bankTransactions: allBankTxns.map(b => ({
      bankName: b.bankName,
      accountNumber: b.accountNumber,
      transactionDate: b.transactionDate,
      debitAmount: b.debitAmount,
      creditAmount: b.creditAmount,
      balance: b.balance,
    })),
  });

  console.log(`\n[VALIDATION] Produced ${validationResults.length} validation items:`);
  for (const item of validationResults) {
    console.log(` - [${item.severity.toUpperCase()}] ${item.checkType}: ${item.message}`);
    await db.insert(validationExceptions).values({
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      monthlyRequestId: requestId,
      documentFileId: item.documentFileId,
      documentUnitId: item.documentUnitId,
      severity: item.severity,
      checkType: item.checkType,
      message: item.message,
      details: item.details || {},
      resolved: false,
    });
  }

  // 3. Re-evaluate checklist
  const evalResult = evaluateMonthlyChecklist({
    client: {
      requiredChecklist: (client.requiredChecklist as string[]) || [],
      expectedBankAccounts: (client.expectedBankAccounts as any) || [],
    },
    request: {
      reportingMonth: mr.reportingMonth,
      noTransactionsDeclared: mr.noTransactionsDeclared,
      categoryDeclarations: (mr.categoryDeclarations as any) || {},
    },
    extractedDocs: allDocs,
    files: allFiles,
    bankTransactions: allBankTxns,
    manualExceptions: validationResults.map(r => ({
      id: 'ex',
      monthlyRequestId: requestId,
      severity: r.severity,
      checkType: r.checkType,
      message: r.message,
      resolved: false,
    })),
  });

  const criticalExceptionsCount = validationResults.filter(r => r.severity === 'critical').length;
  const newStatus = criticalExceptionsCount > 0
    ? 'Needs Review'
    : (evalResult.missingItems.length > 0 ? 'Missing Documents' : 'Needs Review');

  await db
    .update(monthlyRequests)
    .set({
      totalInvoicesExtracted: allDocs.length,
      unresolvedExceptionsCount: validationResults.length,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(monthlyRequests.id, requestId));

  console.log(`\n[COMPLETE] Successfully reprocessed ${processedCount} files into ${allDocs.length} extracted docs!`);
  console.log(`[STATUS] Monthly request status: "${newStatus}", Unresolved Exceptions: ${validationResults.length}`);
}

reprocessRequest().catch(console.error).finally(() => process.exit(0));
