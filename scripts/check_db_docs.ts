import { db } from '../src/db';
import { clients, monthlyRequests, extractedDocuments, documentFiles } from '../src/db/schema';
import { desc } from 'drizzle-orm';

async function checkDocs() {
  try {
    const allClients = await db.select().from(clients);
    console.log('=== CLIENTS ===');
    for (const c of allClients) {
      console.log({ id: c.id, name: c.businessName, gstin: c.gstin });
    }
    const files = await db.select().from(documentFiles);
    console.log('=== ALL BLINKIT DOCUMENT FILES ===');
    for (const f of files) {
      if (f.originalFilename.includes('ForwardInvoice') || f.originalFilename.includes('ORD')) {
        console.log({ id: f.id, name: f.originalFilename, status: f.status, notes: f.scanNotes, clientGstin: f.clientGstin });
      }
    }
    for (const d of docs) {
      if (d.supplierName?.toLowerCase().includes('blink') || d.supplierName?.toLowerCase().includes('porter') || d.docNumber?.startsWith('CRN') || d.docNumber?.startsWith('ORD') || d.docNumber?.startsWith('SST') || d.docNumber?.startsWith('INV')) {
        console.log({
          id: d.id,
          docNo: d.docNumber,
          type: d.docType,
          supplier: d.supplierName,
          taxable: d.taxableAmount,
          cgst: d.cgstAmount,
          sgst: d.sgstAmount,
          igst: d.igstAmount,
          total: d.totalAmount,
        });
      }
    }
  } catch (err) {
    console.error('Error fetching docs:', err);
  }
  process.exit(0);
}
checkDocs();
