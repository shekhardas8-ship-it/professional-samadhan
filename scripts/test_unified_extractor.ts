import { extractDocumentContent } from '../src/services/extractor';
import * as fs from 'fs';
import * as path from 'path';

async function testAllWithExtractor() {
  const dir = 'local_storage/uploads';
  const testFiles = [
    { file: '1790618299530_zr8m2p_INV-2026027_Simpy_Maity.pdf', type: 'sales_invoices' },
    { file: '1790618299537_yalw9k_INV-2026028_Ishavdeep_Singh_Aneja.pdf', type: 'sales_invoices' },
    { file: '1790618299544_gozz6z_INV-2026029_Apoorva_Dixit.pdf', type: 'sales_invoices' },
    { file: '1790618299552_u744qc_INV-2026030_Apoorva_Dixit.pdf', type: 'sales_invoices' },
    { file: '1791214528632_ag5yql_SST_Sales-SST-50-2026-27.pdf', type: 'sales_invoices' },
    { file: '1790618300097_gviu96_invoice_CRN142500728017.pdf', type: 'purchase_invoices' },
    { file: '1790841524168_p4wkga_ForwardInvoice_ORD40292639761.pdf', type: 'purchase_invoices' },
    { file: '1790841524193_5299cz_ForwardInvoice_ORD44068518784.pdf', type: 'purchase_invoices' },
    { file: '1790841524252_oau05p_ForwardInvoice_ORD54981012466.pdf', type: 'purchase_invoices' },
  ];

  for (const item of testFiles) {
    const fullPath = path.join(dir, item.file);
    if (!fs.existsSync(fullPath)) {
      console.log('Skipping missing:', item.file);
      continue;
    }
    const buf = fs.readFileSync(fullPath);
    const [res] = await extractDocumentContent(
      buf,
      item.file,
      '07DWAPK0131H1Z1',
      'application/pdf',
      undefined,
      'THE STUDIO NUQAAT STORE',
      item.type
    );

    console.log('====================================================');
    console.log('File:', item.file);
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
    console.log('Line Items:', res.lineItems.map(li => ({
      desc: li.itemDescription,
      hsn: li.hsnSac,
      taxable: li.taxableValue,
      total: li.totalAmount,
    })));
  }
}

testAllWithExtractor().catch(console.error);
