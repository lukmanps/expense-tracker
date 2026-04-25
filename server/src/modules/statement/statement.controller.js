import { parsePdf, parseExcel, saveConfirmedTransactions } from './statement.service.js';
import { confirmTransactionSchema } from './statement.schema.js';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function processFile(request, reply) {
  const data = await request.file();

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // Collect buffer from stream
  const chunks = [];
  for await (const chunk of data.file) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  if (buffer.length > MAX_FILE_SIZE) {
    return reply.code(400).send({ error: 'File size exceeds 5MB limit' });
  }

  const mimetype = data.mimetype;
  const filename = data.filename || '';
  const ext = filename.split('.').pop()?.toLowerCase();

  // Get optional password from fields
  const fields = data.fields;
  const password = fields?.password?.value || null;

  let transactions;

  try {
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      transactions = await parsePdf(buffer, password);
    } else if (
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ext === 'xls' ||
      ext === 'xlsx' ||
      ext === 'csv'
    ) {
      transactions = parseExcel(buffer);
    } else {
      return reply.code(400).send({ error: 'Unsupported file type. Please upload a PDF, Excel (.xls, .xlsx), or CSV file.' });
    }
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return reply.code(statusCode).send({
      error: err.message || 'Failed to process file',
    });
  }

  if (!transactions || transactions.length === 0) {
    return reply.code(400).send({
      error: 'No debit transactions found in the file. Please check the file format.',
    });
  }

  return reply.send({ transactions });
}

export async function confirmTransactions(request, reply) {
  const { transactions } = confirmTransactionSchema.parse(request.body);

  try {
    const result = await saveConfirmedTransactions(request.user.id, transactions);
    return reply.code(201).send({
      message: `Successfully imported ${result.count} expense(s)`,
      count: result.count,
    });
  } catch (err) {
    return reply.code(500).send({
      error: err.message || 'Failed to save transactions',
    });
  }
}
