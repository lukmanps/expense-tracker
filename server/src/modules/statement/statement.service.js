import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFJS = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');
import XLSX from 'xlsx';

// Disable workers to avoid cross-origin issues inside Node
PDFJS.disableWorker = true;

// ─── PDF Parsing ───────────────────────────────────────────────

export async function parsePdf(buffer, password) {
  try {
    const docOptions = { data: buffer };
    if (password) docOptions.password = password;

    const doc = await PDFJS.getDocument(docOptions);
    let fullText = "";

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      
      let lastY;
      for (const item of textContent.items) {
        if (lastY == item.transform[5] || !lastY) {
          fullText += item.str;
        } else {
          fullText += '\n' + item.str;
        }
        lastY = item.transform[5];
      }
      fullText += '\n\n';
    }

    doc.destroy();
    return extractTransactionsFromText(fullText);
  } catch (err) {
    if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password')) {
      const error = new Error('Incorrect password or encrypted PDF');
      error.statusCode = 400;
      throw error;
    }
    throw err;
  }
}

// ─── Excel Parsing ─────────────────────────────────────────────
export function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows.length) {
    const error = new Error('No data found in the spreadsheet');
    error.statusCode = 400;
    throw error;
  }

  return extractTransactionsFromRows(rows);
}

// ─── Text-based extraction (for PDF) ──────────────────────────
function extractTransactionsFromText(text) {
  const transactions = [];

  // Common date patterns: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD/MM/YY
  const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
  
  // Split text by date. Using a capture group preserves the date in the array.
  // We use \b boundary or just rely on the split directly since \b might fail on some characters.
  // Actually, splitting by dateRegex directly is safest:
  const parts = text.split(dateRegex);

  // Amount pattern: numbers with optional commas and decimals
  const amountRegex = /[\d,]+\.\d{2}/g;

  const rawTxns = [];
  let tempId = 1;

  // Pass 1: Collect all raw transaction data
  for (let i = 1; i < parts.length; i += 2) {
    const rawDate = parts[i];
    const rawContent = parts[i + 1] || '';
    
    const parsedDate = normalizeDate(rawDate);
    if (!parsedDate) continue;

    const amounts = rawContent.match(amountRegex);
    if (!amounts || amounts.length === 0) continue;

    const firstAmountStart = rawContent.indexOf(amounts[0]);
    let description = rawContent.substring(0, firstAmountStart).trim();

    description = description.replace(/\s+/g, ' ').replace(/^[\s\-:]+/, '').replace(/[\s\-:]+$/, '').trim();
    if (!description || description.length < 2) {
      description = 'Bank Transaction';
    }

    const parsedAmounts = amounts.map((a) => parseFloat(a.replace(/,/g, '')));
    rawTxns.push({ parsedDate, description, rawContent, parsedAmounts });
  }

  // Pass 2: Identify Debits vs Credits
  for (let i = 0; i < rawTxns.length; i++) {
    const txn = rawTxns[i];
    const prevTxn = i > 0 ? rawTxns[i - 1] : null;
    const nextTxn = i < rawTxns.length - 1 ? rawTxns[i + 1] : null;

    let debitAmount = null;
    let balance = null;

    if (txn.parsedAmounts.length >= 3) {
      if (txn.parsedAmounts[0] > 0) debitAmount = txn.parsedAmounts[0];
      balance = txn.parsedAmounts[txn.parsedAmounts.length - 1];
    } else if (txn.parsedAmounts.length === 2) {
      const amount = txn.parsedAmounts[0];
      balance = txn.parsedAmounts[1];

      const upperLine = txn.rawContent.toUpperCase();
      if (upperLine.includes('DR') || upperLine.includes('DEBIT')) {
        debitAmount = amount;
      } else if (upperLine.includes('CR') || upperLine.includes('CREDIT')) {
        // skip
      } else {
        // Balance Math Heuristic
        let isDebit = null;
        if (prevTxn && prevTxn.parsedAmounts.length >= 2) {
          const prevBalance = prevTxn.parsedAmounts[prevTxn.parsedAmounts.length - 1];
          if (Math.abs(prevBalance - amount - balance) < 0.01) isDebit = true;
          else if (Math.abs(prevBalance + amount - balance) < 0.01) isDebit = false;
          else if (Math.abs(balance - amount - prevBalance) < 0.01) isDebit = true;
          else if (Math.abs(balance + amount - prevBalance) < 0.01) isDebit = false;
        }
        
        if (isDebit === true) {
          debitAmount = amount;
        } else if (isDebit === false) {
          // It's a deposit
        } else {
          // If math fails (e.g. first row), assume debit to be safe (withdrawal)
          debitAmount = amount;
        }
      }
    } else if (txn.parsedAmounts.length === 1) {
      const amount = txn.parsedAmounts[0];
      const upperLine = txn.rawContent.toUpperCase();
      if (upperLine.includes('CR') || upperLine.includes('CREDIT')) {
        // skip
      } else {
        debitAmount = amount;
      }
    }

    if (debitAmount && debitAmount > 0) {
      transactions.push({
        tempId: `temp-${tempId++}`,
        date: txn.parsedDate,
        description: truncate(txn.description, 200),
        amount: debitAmount,
        balance: balance,
        type: 'debit',
      });
    }
  }

  return transactions;
}

// ─── Row-based extraction (for Excel) ─────────────────────────
function extractTransactionsFromRows(rows) {
  const transactions = [];
  let tempId = 1;

  // Auto-detect column mapping by checking headers
  const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());
  const columnMap = detectColumns(headers, Object.keys(rows[0]));

  for (const row of rows) {
    const dateVal = row[columnMap.date];
    const descVal = row[columnMap.description] || '';
    const debitVal = columnMap.debit ? row[columnMap.debit] : null;
    const creditVal = columnMap.credit ? row[columnMap.credit] : null;
    const amountVal = columnMap.amount ? row[columnMap.amount] : null;
    const balanceVal = columnMap.balance ? row[columnMap.balance] : null;

    if (!dateVal) continue;

    // Determine if this is a debit
    let amount = null;

    if (debitVal !== null && debitVal !== '' && debitVal !== undefined) {
      amount = parseFloat(String(debitVal).replace(/,/g, ''));
    } else if (creditVal !== null && creditVal !== '' && creditVal !== undefined) {
      // This is a credit entry — skip
      continue;
    } else if (amountVal !== null && amountVal !== '' && amountVal !== undefined) {
      const parsed = parseFloat(String(amountVal).replace(/,/g, ''));
      if (parsed < 0) {
        amount = Math.abs(parsed); // Negative = debit
      } else {
        continue; // Positive = credit, skip
      }
    }

    if (!amount || amount <= 0 || isNaN(amount)) continue;

    // Parse date
    let parsedDate;
    if (dateVal instanceof Date) {
      parsedDate = dateVal.toISOString().split('T')[0];
    } else if (typeof dateVal === 'number') {
      // Excel serial date
      const excelDate = XLSX.SSF.parse_date_code(dateVal);
      if (excelDate) {
        parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
      }
    } else {
      parsedDate = normalizeDate(String(dateVal).trim());
    }

    if (!parsedDate) continue;

    const description = String(descVal).trim() || 'Bank Transaction';
    const balance = balanceVal ? parseFloat(String(balanceVal).replace(/,/g, '')) : null;

    transactions.push({
      tempId: `temp-${tempId++}`,
      date: parsedDate,
      description: truncate(description, 200),
      amount,
      balance: isNaN(balance) ? null : balance,
      type: 'debit',
    });
  }

  return transactions;
}

// ─── Column detection for Excel ───────────────────────────────
function detectColumns(lowerHeaders, originalHeaders) {
  const map = {
    date: null,
    description: null,
    debit: null,
    credit: null,
    amount: null,
    balance: null,
  };

  const patterns = {
    date: ['date', 'txn date', 'transaction date', 'trans date', 'value date', 'posting date'],
    description: ['description', 'narration', 'particulars', 'details', 'remarks', 'transaction details', 'transaction description'],
    debit: ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'dr', 'debit(rs)', 'debit (rs)', 'withdrawal amt'],
    credit: ['credit', 'deposit', 'deposits', 'credit amount', 'cr', 'credit(rs)', 'credit (rs)', 'deposit amt'],
    amount: ['amount', 'transaction amount', 'txn amount'],
    balance: ['balance', 'closing balance', 'running balance', 'available balance', 'bal'],
  };

  for (const [field, keywords] of Object.entries(patterns)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      if (keywords.some((k) => header.includes(k))) {
        map[field] = originalHeaders[i];
        break;
      }
    }
  }

  // Fallback: if no specific columns detected, use positional mapping
  if (!map.date && originalHeaders.length >= 3) {
    map.date = originalHeaders[0];
    map.description = originalHeaders[1];
    map.amount = originalHeaders[2];
    if (originalHeaders.length >= 4) map.balance = originalHeaders[3];
  }

  if (!map.description) {
    // Try second column as description
    map.description = originalHeaders[1] || originalHeaders[0];
  }

  return map;
}

// ─── Helpers ──────────────────────────────────────────────────
function normalizeDate(raw) {
  if (!raw) return null;

  // Try YYYY-MM-DD
  let match = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
  }

  // Try DD/MM/YYYY or DD-MM-YYYY
  match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }

  // Try DD/MM/YY
  match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (match) {
    const year = parseInt(match[3]) > 50 ? `19${match[3]}` : `20${match[3]}`;
    return `${year}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }

  // Try MM/DD/YYYY (US format)
  match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match && parseInt(match[1]) <= 12) {
    return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  }

  return null;
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

// ─── Bulk save confirmed transactions ─────────────────────────
import prisma from '../../db/prisma.js';

export async function saveConfirmedTransactions(userId, transactions) {
  const expenses = transactions.map((t) => ({
    amount: t.amount,
    categoryId: t.categoryId,
    date: new Date(t.date),
    notes: t.notes || t.description || null,
    userId,
  }));

  const created = await prisma.expense.createMany({
    data: expenses,
  });

  return created;
}
