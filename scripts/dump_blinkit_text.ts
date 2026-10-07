import * as fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { robustPdfPageRenderer } from '../src/services/extractor';

async function dumpBlinkitText() {
  const filePath = 'd:/MyProject/CA tools/local_storage/uploads/1790618299723_6y5j91_ForwardInvoice_ORD40292639761.pdf';
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf, { pagerender: robustPdfPageRenderer });
  console.log('=== RAW TEXT FIRST 800 CHARS ===');
  console.log(data.text.slice(0, 800));
}
dumpBlinkitText();
