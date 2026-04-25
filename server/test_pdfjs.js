import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

async function test() {
  console.log('PDFJS version:', PDFJS.version);
  console.log('getDocument exists:', typeof PDFJS.getDocument);
}
test();
