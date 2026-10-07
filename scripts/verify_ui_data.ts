import { db } from '../src/db/index.ts';
import {
  monthlyRequests,
  clients,
  extractedDocuments,
  validationExceptions,
  extractedLineItems,
} from '../src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function verifyUiData() {
  const requestId = 'req_x6d98y_2026_09';
  console.log('========================================================================');
  console.log(`VERIFYING INVOICES DASHBOARD DATA FOR: ${requestId}`);
  console.log('========================================================================');

  const [mr] = await db.select().from(monthlyRequests).where(eq(monthlyRequests.id, requestId));
  const [client] = await db.select().from(clients).where(eq(clients.id, mr.clientId));
  const docs = await db.select().from(extractedDocuments).where(eq(extractedDocuments.monthlyRequestId, requestId));
  const exceptions = await db.select().from(validationExceptions).where(eq(validationExceptions.monthlyRequestId, requestId));

  console.log(`\nClient: ${client.businessName} (GSTIN: ${client.gstin})`);
  console.log(`Monthly Request: ${mr.reportingMonth} | Status: ${mr.status} | Total Extracted: ${docs.length}`);
  console.log(`Validation Exceptions Count: ${exceptions.length}`);

  console.log('\n--- 1. SALES INVOICES (Client as Supplier) ---');
  const sales = docs.filter(d => d.docType === 'sales_invoice');
  for (const s of sales) {
    const docEx = exceptions.filter(e => e.documentUnitId === s.id);
    const statusTag = docEx.length === 0 ? '🟢 OK' : `⚠️ ${docEx.map(e => e.checkType).join(', ')}`;
    console.log(`• ${s.docNumber?.padEnd(15)} | Date: ${s.docDate} | Buyer: ${s.buyerName?.padEnd(22)} | Taxable: ₹${Number(s.taxableAmount).toFixed(2).padStart(9)} | CGST: ₹${Number(s.cgstAmount).toFixed(2).padStart(8)} | SGST: ₹${Number(s.sgstAmount).toFixed(2).padStart(8)} | Total: ₹${Number(s.totalAmount).toFixed(2).padStart(9)} | Status: ${statusTag}`);
  }

  console.log('\n--- 2. BLINKIT PURCHASE INVOICES ---');
  const blinkit = docs.filter(d => d.supplierName?.toLowerCase().includes('blink'));
  for (const b of blinkit) {
    const docEx = exceptions.filter(e => e.documentUnitId === b.id);
    const statusTag = docEx.length === 0 ? '🟢 OK' : `⚠️ ${docEx.map(e => e.checkType).join(', ')}`;
    console.log(`• ${b.docNumber?.padEnd(18)} | Supplier: ${b.supplierName?.padEnd(30)} | Taxable: ₹${Number(b.taxableAmount).toFixed(2).padStart(8)} | CGST: ₹${Number(b.cgstAmount).toFixed(2).padStart(7)} | SGST: ₹${Number(b.sgstAmount).toFixed(2).padStart(7)} | Total: ₹${Number(b.totalAmount).toFixed(2).padStart(8)} | Status: ${statusTag}`);
  }

  console.log('\n--- 3. PORTER GTA INVOICES (RCM) ---');
  const porter = docs.filter(d => d.supplierName?.toLowerCase().includes('porter') || d.docNumber?.startsWith('CRN'));
  for (const p of porter) {
    const docEx = exceptions.filter(e => e.documentUnitId === p.id);
    const statusTag = docEx.length === 0 ? '🟢 OK' : `⚠️ ${docEx.map(e => e.checkType).join(', ')}`;
    console.log(`• ${p.docNumber?.padEnd(16)} | Supplier: ${p.supplierName?.padEnd(25)} | RCM: ${String(p.reverseCharge).padEnd(5)} | Taxable: ₹${Number(p.taxableAmount).toFixed(2).padStart(7)} | CGST: ₹${Number(p.cgstAmount).toFixed(2).padStart(5)} | SGST: ₹${Number(p.sgstAmount).toFixed(2).padStart(5)} | Total: ₹${Number(p.totalAmount).toFixed(2).padStart(7)} | Status: ${statusTag}`);
  }

  console.log('\n--- 4. OTHER VENDOR INVOICES (Shib Sankar Textiles, Flipkart, Amazon) ---');
  const others = docs.filter(d => !sales.includes(d) && !blinkit.includes(d) && !porter.includes(d) && d.docType !== 'bank_statement');
  for (const o of others) {
    const docEx = exceptions.filter(e => e.documentUnitId === o.id);
    const statusTag = docEx.length === 0 ? '🟢 OK' : `⚠️ ${docEx.map(e => e.checkType).join(', ')}`;
    console.log(`• ${o.docNumber?.padEnd(20)} | Supplier: ${o.supplierName?.slice(0, 25).padEnd(25)} | Taxable: ₹${Number(o.taxableAmount).toFixed(2).padStart(9)} | IGST: ₹${Number(o.igstAmount).toFixed(2).padStart(8)} | Total: ₹${Number(o.totalAmount).toFixed(2).padStart(9)} | Status: ${statusTag}`);
  }

  console.log('\n--- 5. ACTIVE VALIDATION EXCEPTIONS ---');
  if (exceptions.length === 0) {
    console.log('🎉 No exceptions found! All documents 100% verified.');
  } else {
    for (const ex of exceptions) {
      console.log(`• [${ex.severity.toUpperCase()}] ${ex.checkType}: ${ex.message}`);
    }
  }

  console.log('========================================================================');
}

verifyUiData().catch(console.error).finally(() => process.exit(0));
