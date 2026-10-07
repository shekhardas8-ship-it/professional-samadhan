import fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { robustPdfPageRenderer } from '../src/services/extractor.ts';

async function dump() {
  const p = 'D:/MyProject/CA tools/local_storage/uploads/1790618299711_qzowh4_file_4.pdf';
  const buf = fs.readFileSync(p);
  const data = await pdfParse(buf, { pagerender: robustPdfPageRenderer });
  console.log('=== FILE 4 TEXT ===');
  console.log(data.text);
}
dump().catch(console.error).finally(() => process.exit(0));
