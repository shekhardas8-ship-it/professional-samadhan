import { extractDocumentContent } from '../src/services/extractor';
import * as fs from 'fs';
import * as path from 'path';

async function testAllPorter() {
  const uploadsDir = 'd:/MyProject/CA tools/local_storage/uploads';
  const files = [
    '1790618300097_gviu96_invoice_CRN142500728017.pdf',
    '1791212278915_j3vpcg_invoice_CRN142500728017.pdf',
    '1791214581360_5sis2_invoice_CRN532253112668.pdf',
  ];

  for (const f of files) {
    const filePath = path.join(uploadsDir, f);
    if (!fs.existsSync(filePath)) continue;
    const buf = fs.readFileSync(filePath);
    const [res] = await extractDocumentContent(buf, f, '07DWAPK0131H1Z1', 'application/pdf', undefined, 'THE STUDIO NUQAAT STORE', 'purchase_invoices');
    console.log('==============================================');
    console.log('File:', f);
    console.log('DocType:', res.docType);
    console.log('DocNumber:', res.docNumber);
    console.log('Supplier:', res.supplierName, 'GSTIN:', res.supplierGstin);
    console.log('Buyer:', res.buyerName, 'GSTIN:', res.buyerGstin);
    console.log('Amounts:', {
      taxable: res.taxableAmount,
      cgst: res.cgstAmount,
      sgst: res.sgstAmount,
      igst: res.igstAmount,
      total: res.totalAmount,
    });
    console.log('ReverseCharge:', res.reverseCharge);
  }
}

testAllPorter().catch(console.error);
