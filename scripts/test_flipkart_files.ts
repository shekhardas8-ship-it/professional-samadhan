import fs from 'fs';
// @ts-ignore
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { robustPdfPageRenderer } from '../src/services/extractor.ts';

async function testFlipkart() {
  const uploadsDir = 'd:/MyProject/CA tools/local_storage/uploads';
  const files = [
    '1790618299618_loauxa_file_1.pdf',
    '1790618299657_bbk758_file_2.pdf',
    '1790618299686_ew9h38_file_3.pdf',
    '1790618299711_qzowh4_file_4.pdf',
  ];

  for (const f of files) {
    const buf = fs.readFileSync(`${uploadsDir}/${f}`);
    const data = await pdfParse(buf, { pagerender: robustPdfPageRenderer });
    console.log('====================================');
    console.log('File:', f);
    const m = data.text.match(/Total[\s\S]*?(?:Grand\s*Total|Flipkart)/i);
    console.log(m ? m[0] : 'No total block');
  }
}
testFlipkart().catch(console.error).finally(() => process.exit(0));
