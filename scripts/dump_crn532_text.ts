import fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { robustPdfPageRenderer } from '../src/services/extractor.ts';

async function dump() {
  const p = 'D:/MyProject/CA tools/local_storage/uploads/1791214528541_bloofy_invoice_CRN532253112668.pdf';
  const buf = fs.readFileSync(p);
  const data = await pdfParse(buf, { pagerender: robustPdfPageRenderer });
  console.log('=== CRN532253112668 TEXT ===');
  console.log(data.text);
}
dump().catch(console.error).finally(() => process.exit(0));
