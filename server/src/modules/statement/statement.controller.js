import { parsePdf, isPdfEncrypted, parseExcel, saveConfirmedTransactions } from './statement.service.js';
import { confirmTransactionSchema } from './statement.schema.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const PAGE_SIZE = 10; // transactions per page

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

  // Get optional password + page from multipart fields
  const fields = data.fields;
  const password = fields?.password?.value || null;
  const page = Math.max(1, parseInt(fields?.page?.value || '1', 10));

  let allTransactions;

  try {
    if (mimetype === 'application/pdf' || ext === 'pdf') {
      allTransactions = await parsePdf(buffer, password);
    } else if (
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ext === 'xls' ||
      ext === 'xlsx' ||
      ext === 'csv'
    ) {
      allTransactions = parseExcel(buffer);
    } else {
      return reply.code(400).send({
        error: 'Unsupported file type. Please upload a PDF, Excel (.xls, .xlsx), or CSV file.',
      });
    }
  } catch (err) {
    if (err.code === 'REQUIRES_PASSWORD') {
      return reply.code(422).send({ error: err.message, requiresPassword: true });
    }
    if (err.code === 'WRONG_PASSWORD') {
      return reply.code(400).send({ error: err.message, requiresPassword: true });
    }
    const statusCode = err.statusCode || 500;
    return reply.code(statusCode).send({ error: err.message || 'Failed to process file' });
  }

  if (!allTransactions || allTransactions.length === 0) {
    return reply.code(400).send({
      error: 'No debit transactions found in the file. Please check the file format.',
    });
  }

  const total = allTransactions.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const transactions = allTransactions.slice(start, start + PAGE_SIZE);

  return reply.send({
    transactions,         // current page
    pagination: {
      page: safePage,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
    },
    // Send all tempIds so frontend can merge edits across pages on confirm
    allTransactions,
  });
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
