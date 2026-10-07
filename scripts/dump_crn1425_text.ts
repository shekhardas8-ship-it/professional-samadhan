import fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { robustPdfPageRenderer } from '../src/services/extractor.ts';

async function dump() {
  const p = 'D:/MyProject/CA tools/local_storage/uploads/1790618300097_gviu96_invoice_CRN142500728017.pdf';
  const buf = fs.readFileSync(p);
  const data = await pdfParse(buf, { pagerender: robustPdfPageRenderer });
  console.log('=== CRN142500728017 TEXT ===');
  console.log(data.text);
}
dump().catch(console.error).finally(() => process.exit(0));
