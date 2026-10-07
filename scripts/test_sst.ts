import { extractDocumentContent } from '../src/services/extractor.ts';
import fs from 'fs';

async function test() {
  const p = 'D:/MyProject/CA tools/local_storage/uploads/1791214528632_ag5yql_SST_Sales-SST-50-2026-27.pdf';
  const buf = fs.readFileSync(p);
  const [res] = await extractDocumentContent(buf, 'SST_Sales-SST-50-2026-27.pdf', '33AAACI1607G2Z5', 'application/pdf');
  console.log({
    docNumber: res.docNumber,
    docType: res.docType,
    supplier: res.supplierName,
    supplierGstin: res.supplierGstin,
    buyer: res.buyerName,
    buyerGstin: res.buyerGstin,
    taxable: res.taxableAmount,
    cgst: res.cgstAmount,
    sgst: res.sgstAmount,
    igst: res.igstAmount,
    total: res.totalAmount,
    reverseCharge: res.reverseCharge,
  });
}
test().catch(console.error).finally(() => process.exit(0));
