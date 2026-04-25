import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');
import fs from 'fs';

async function run() {
  const parser = new PDFParse();
  console.log(typeof parser.load);
  console.log(typeof parser.getText);
}
run();
