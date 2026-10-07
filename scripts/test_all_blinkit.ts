import { extractDocumentContent } from '../src/services/extractor';
import * as fs from 'fs';
import * as path from 'path';

async function testAllBlinkit() {
  const uploadsDir = 'd:/MyProject/CA tools/local_storage/uploads';
  const files = [
    '1790618299723_6y5j91_ForwardInvoice_ORD40292639761.pdf',
    '1790618299731_shxqal_ForwardInvoice_ORD44068518784.pdf',
    '1790618299738_jniwwb_ForwardInvoice_ORD51668170602.pdf',
    '1790618299746_k06zou_ForwardInvoice_ORD54240869910.pdf',
    '1790618300069_pf966x_ForwardInvoice_ORD54981012466.pdf',
    '1790618300083_piqtv9_ForwardInvoice_ORD92642574560.pdf'
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
  }
}

testAllBlinkit().catch(console.error);
