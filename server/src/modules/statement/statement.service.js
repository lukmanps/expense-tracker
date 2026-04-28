import { createRequire } from 'module';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';
import XLSX from 'xlsx';
import prisma from '../../db/prisma.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const execFileAsync = promisify(execFile);

// ─── Encryption Check ──────────────────────────────────────────
export async function isPdfEncrypted(buffer) {
  const tmpIn = join(tmpdir(), `xpense-check-${randomBytes(6).toString('hex')}.pdf`);
  try {
    await writeFile(tmpIn, buffer);
    await execFileAsync('qpdf', ['--is-encrypted', tmpIn]);
    return true; // exit 0 = encrypted
  } catch (err) {
    if (err.code === 2) return false;       // exit 2 = not encrypted
    if (err.code === 'ENOENT') { console.warn('[statement] qpdf not found'); return false; }
    return false;
  } finally {
    await unlink(tmpIn).catch(() => {});
  }
}

// ─── PDF Decryption via qpdf ───────────────────────────────────
async function decryptPdf(buffer, password) {
  const id = randomBytes(6).toString('hex');
  const tmpIn  = join(tmpdir(), `xpense-in-${id}.pdf`);
  const tmpOut = join(tmpdir(), `xpense-out-${id}.pdf`);
  try {
    await writeFile(tmpIn, buffer);
    try {
      await execFileAsync('qpdf', ['--decrypt', `--password=${password}`, tmpIn, tmpOut]);
    } catch (qpdfErr) {
      // qpdf exit code 3 means "operation succeeded with warnings"
      if (qpdfErr.code === 3) {
        console.warn(`[statement] qpdf emitted warnings but succeeded: ${qpdfErr.stderr}`);
      } else {
        throw qpdfErr;
      }
    }
    return await readFile(tmpOut);
  } catch (err) {
    if (err.code === 2 || (err.stderr && err.stderr.toLowerCase().includes('password'))) {
      const error = new Error('Incorrect PDF password. Please try again.');
      error.statusCode = 400;
      error.code = 'WRONG_PASSWORD';
      throw error;
    }
    throw new Error(`Failed to decrypt PDF: ${err.message}`);
  } finally {
    await unlink(tmpIn).catch(() => {});
    await unlink(tmpOut).catch(() => {});
  }
}

// ─── PDF Parsing (main entry) ──────────────────────────────────
export async function parsePdf(buffer, password) {
  let pdfBuffer = buffer;

  const encrypted = await isPdfEncrypted(buffer);
  if (encrypted) {
    if (!password) {
      const error = new Error('This PDF is password-protected. Please provide the password.');
      error.statusCode = 422;
      error.code = 'REQUIRES_PASSWORD';
      throw error;
    }
    pdfBuffer = await decryptPdf(buffer, password);
  }

  let data;
  try {
    data = await pdfParse(pdfBuffer);
  } catch (err) {
    if (err.message?.toLowerCase().includes('password') || err.name === 'PasswordException') {
      const error = new Error('Incorrect PDF password. Please try again.');
      error.statusCode = 400;
      error.code = 'WRONG_PASSWORD';
      throw error;
    }
    throw new Error(`Failed to read PDF: ${err.message}`);
  }

  const text = data.text || '';
  if (!text.trim()) {
    const error = new Error('Could not extract text from this PDF. It may be image-based or corrupted.');
    error.statusCode = 400;
    throw error;
  }

  return extractTransactionsFromText(text);
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

// ─── PDF text extraction router ────────────────────────────────
//
// Detects whether the statement is Federal Bank format (DD-MMM-YYYY dates,
// compact amount line) or a standard tabular format (DD/MM/YYYY, clear columns).
//
function extractTransactionsFromText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // Federal Bank lines start with DD-MMM-YYYY (e.g. "26-MAR-2026")
  const isFederal = lines.some((l) => /^\d{2}-[A-Z]{3}-\d{4}/.test(l));
  return isFederal ? parseFederalBank(lines) : parseStandard(lines);
}

// ─── Federal Bank Parser ───────────────────────────────────────
//
// Statement layout (3 lines per transaction):
//   L1: "DD-MMM-YYYYDD-MMM-YYYY<PARTICULARS>"   date + valueDate merged + narration
//   L2: "<narration continuation / UPI handle>"
//   L3: "TFRS<tranID><amount><balance>Cr"         all digits merged — no spaces
//
// Key: amount = |prevBalance - currentBalance|   (balance-chain, 100% accurate)
// Key: debit vs credit determined by PARTICULARS text (UPIOUT vs UPI IN etc.)
//      then confirmed by balance direction (balance went DOWN = debit).
//
function parseFederalBank(lines) {
  const transactions = [];
  let tempId = 1;

  // Lines to ignore (headers, footers, boilerplate)
  const SKIP_RE = /^(The Federal|Ph:|Page \d|Name:|Communication|Branch sol|Address|Regd\.|Email|Type of|Scheme:|IFSC:|MICR|SWIFT|Effective|Statement of|DateValue|Tran$|Cheque|WithdrawalsDeposits|DR$|\/CR$|Abbreviations|CASH:|FT:|SBINT:|DISCLAIMER|This is a computer|\*\*\*|GRAND TOTAL|Opening Balance\d)/i;

  // Amount line: starts with known tran-type prefix AND ends with digits.2digitsCr
  const AMOUNT_LINE_RE = /^(TFR[SC]|SBINTS?|FTS?|CASH|CLG|MB|NFT|IFN)/i;
  // Two-group pattern: last two consecutive NN.NN before Cr
  // Correctly separates amount from balance even when digits are adjacent
  // e.g. "...145.962919.45Cr" → balance = "2919.45"
  const BALANCE_AT_END_RE = /(\d+\.\d{2})(\d+\.\d{2})Cr$/;

  // Opening balance
  let prevBalance = null;
  for (const line of lines) {
    const m = line.match(/Opening Balance([\d.]+)Cr/i);
    if (m) { prevBalance = parseFloat(m[1]); break; }
  }

  // Outward (debit) transaction keywords in particulars
  const OUTWARD_RE = /UPIOUT|IFN\/|NFT\/|CASH\s?WDL|ATM\/WDL|CLG\s?DR|IMPS\s?OUT|NEFT\s?DR|TELE\s?TFR/i;
  // Inward (credit) — skip
  const INWARD_RE  = /UPI[\s\-]?IN\b|FT\s?IMPS\/IFI\/|SBINTS?|INTEREST|SALARY\s?CREDIT|REFUND|REVERSAL/i;

  // ── Collect blocks ───────────────────────────────────────
  let pending = null;

  const process = (block) => {
    if (!block || !block.balanceLine) return;

    const balMatch = block.balanceLine.match(BALANCE_AT_END_RE);
    if (!balMatch) return;

    const currentBalance = parseFloat(balMatch[2]);
    if (prevBalance === null) { prevBalance = currentBalance; return; }

    const balanceDecreased = currentBalance < prevBalance - 0.001;
    const amount = parseFloat(Math.abs(prevBalance - currentBalance).toFixed(2));
    prevBalance = currentBalance;

    if (!balanceDecreased || amount <= 0) return; // credit or no change — skip

    // Build description from particulars
    let desc = block.particulars
      .replace(/\d{2}-[A-Z]{3}-\d{4}/g, '')   // strip embedded value-date
      .replace(/\s+/g, ' ')
      .trim();

    // Simplify UPI strings into readable payee names
    // "UPIOUT/646067900669/q286152130@ybl/Paid via/5812" → "q286152130 / Paid via"
    const upiOutMatch = desc.match(/UPIOUT\/\d+\/([^\/\s]+)\/([^\/\s]+)/i);
    if (upiOutMatch) {
      const payee = upiOutMatch[1].replace(/@[^@]+$/, ''); // strip @bank suffix
      const label = upiOutMatch[2].replace(/\d+/g, '').trim();
      desc = label ? `${payee} / ${label}` : payee;
    }

    // "IFN/NEOINTFTSun20260405072929LEvcD LUKMAN P S 2005" → keep as-is, just clean
    // "FT IMPS/IFI/..." → already filtered as credit

    desc = desc.replace(/\s{2,}/g, ' ').trim();
    if (!desc || desc.length < 2) desc = 'Bank Transaction';

    transactions.push({
      tempId: `temp-${tempId++}`,
      date: block.date,
      description: truncate(desc, 200),
      amount,
      balance: currentBalance,
      type: 'debit',
    });
  };

  for (const line of lines) {
    if (SKIP_RE.test(line)) continue;
    if (/^Opening Balance/i.test(line)) continue;

    // Amount/balance line: starts with tran-type prefix AND ends with NNN.NNCr
    if (AMOUNT_LINE_RE.test(line) && line.endsWith('Cr')) {
      if (pending) { pending.balanceLine = line; process(pending); pending = null; }
      continue;
    }

    // Date line: starts with DD-MMM-YYYY
    const dateMatch = line.match(/^(\d{2}-[A-Z]{3}-\d{4})/);
    if (dateMatch) {
      if (pending) process(pending); // flush previous (missing balance line edge case)
      const parsedDate = normalizeFederalDate(dateMatch[1]);
      if (!parsedDate) continue;
      // Strip both occurrences of date (date col + value date col) from particulars
      const particulars = line.replace(/\d{2}-[A-Z]{3}-\d{4}/g, '').trim();
      pending = { date: parsedDate, particulars, balanceLine: null };
      continue;
    }

    // Continuation line — append to particulars
    if (pending) pending.particulars += ' ' + line;
  }
  if (pending) process(pending);

  return transactions;
}

// ─── Standard Tabular Statement Parser ────────────────────────
//
// Handles SBI, HDFC, ICICI, Axis, Kotak and similar formats.
// Columns: Date | Narration/Particulars | Ref | ValueDate | Withdrawal | Deposit | Balance
//
function parseStandard(lines) {
  const DATE_LINE_RE    = /^(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
  const CREDIT_KEYWORDS = /\b(cr\b|credit|deposit|salary|interest credited|refund|reversal|cashback|inward|received)\b/i;
  const DEBIT_KEYWORDS  = /\b(dr\b|debit|withdrawal|payment|paid|purchase|transfer|neft|imps|upi|atm|emi|charge|fee|tax)\b/i;

  let hasWithdrawalColumn = false;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('withdrawal') || lower.includes('debit amt') || lower.includes('debit amount')) {
      hasWithdrawalColumn = true;
      break;
    }
  }

  // Collect raw transaction blocks
  const rawTxns = [];
  let pending = null;
  for (const line of lines) {
    const dateMatch = line.match(DATE_LINE_RE);
    if (dateMatch) {
      if (pending) rawTxns.push(pending);
      const parsedDate = normalizeDate(dateMatch[1]);
      if (!parsedDate) continue;
      pending = { parsedDate, rawLine: line.slice(dateMatch[1].length).trim(), extraLines: [] };
    } else if (pending) {
      pending.extraLines.push(line);
    }
  }
  if (pending) rawTxns.push(pending);

  const parseAmounts = (str) =>
    [...str.matchAll(/[\d,]+\.\d{2}/g)].map((m) => ({
      value: parseFloat(m[0].replace(/,/g, '')),
      index: m.index,
    }));

  const transactions = [];
  let tempId = 1;

  for (let i = 0; i < rawTxns.length; i++) {
    const { parsedDate, rawLine, extraLines } = rawTxns[i];
    const fullContent = [rawLine, ...extraLines].join(' ');
    const amounts = parseAmounts(fullContent);
    if (amounts.length === 0) continue;

    const upperFull = fullContent.toUpperCase();
    // Skip pure credits
    if (CREDIT_KEYWORDS.test(upperFull) && !DEBIT_KEYWORDS.test(upperFull)) continue;

    // Narration = text before first amount, cleaned up
    let narration = fullContent.slice(0, amounts[0].index).trim();
    narration = narration
      .replace(/\b\d{6,}\b/g, '')
      .replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '')
      .replace(/[\/\-]{2,}/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!narration || narration.length < 2) narration = 'Bank Transaction';

    let withdrawalAmount = null;
    let balance = null;

    if (hasWithdrawalColumn && amounts.length >= 2) {
      if (amounts.length >= 3) {
        const w = amounts[0].value, d = amounts[1].value;
        balance = amounts[amounts.length - 1].value;
        if (w > 0 && d === 0) withdrawalAmount = w;
        else if (w > 0 && !CREDIT_KEYWORDS.test(upperFull)) withdrawalAmount = w;
      } else {
        const amt = amounts[0].value;
        balance = amounts[1].value;
        if (DEBIT_KEYWORDS.test(upperFull)) {
          withdrawalAmount = amt;
        } else if (!CREDIT_KEYWORDS.test(upperFull)) {
          // Balance math fallback
          const prev = i > 0 ? rawTxns[i - 1] : null;
          if (prev) {
            const prevAmts = parseAmounts([prev.rawLine, ...prev.extraLines].join(' '));
            const prevBal  = prevAmts.length > 0 ? prevAmts[prevAmts.length - 1].value : null;
            if (prevBal !== null && Math.abs(prevBal - amt - balance) < 1) withdrawalAmount = amt;
            else if (prevBal !== null && Math.abs(prevBal + amt - balance) >= 1) withdrawalAmount = amt;
          } else {
            withdrawalAmount = amt;
          }
        }
      }
    } else {
      balance = amounts[amounts.length - 1].value;
      const amt = amounts[0].value;
      if (DEBIT_KEYWORDS.test(upperFull)) withdrawalAmount = amt;
      else if (!CREDIT_KEYWORDS.test(upperFull)) withdrawalAmount = amt;
    }

    if (withdrawalAmount && withdrawalAmount > 0) {
      transactions.push({
        tempId: `temp-${tempId++}`,
        date: parsedDate,
        description: truncate(narration, 200),
        amount: withdrawalAmount,
        balance: balance ?? null,
        type: 'debit',
      });
    }
  }

  return transactions;
}

// ─── Row-based extraction (Excel) ─────────────────────────────
function extractTransactionsFromRows(rows) {
  const transactions = [];
  let tempId = 1;

  const headers    = Object.keys(rows[0]).map((h) => h.toLowerCase().trim());
  const columnMap  = detectColumns(headers, Object.keys(rows[0]));

  for (const row of rows) {
    const dateVal   = row[columnMap.date];
    const descVal   = row[columnMap.description] || '';
    const debitVal  = columnMap.debit   ? row[columnMap.debit]   : null;
    const creditVal = columnMap.credit  ? row[columnMap.credit]  : null;
    const amountVal = columnMap.amount  ? row[columnMap.amount]  : null;
    const balanceVal= columnMap.balance ? row[columnMap.balance] : null;

    if (!dateVal) continue;

    let amount = null;
    if (debitVal !== null && debitVal !== '' && debitVal !== undefined) {
      amount = parseFloat(String(debitVal).replace(/,/g, ''));
    } else if (creditVal !== null && creditVal !== '' && creditVal !== undefined) {
      continue; // credit — skip
    } else if (amountVal !== null && amountVal !== '' && amountVal !== undefined) {
      const parsed = parseFloat(String(amountVal).replace(/,/g, ''));
      if (parsed < 0) amount = Math.abs(parsed);
      else continue;
    }

    if (!amount || amount <= 0 || isNaN(amount)) continue;

    let parsedDate;
    if (dateVal instanceof Date) {
      parsedDate = dateVal.toISOString().split('T')[0];
    } else if (typeof dateVal === 'number') {
      const excelDate = XLSX.SSF.parse_date_code(dateVal);
      if (excelDate) parsedDate = `${excelDate.y}-${String(excelDate.m).padStart(2,'0')}-${String(excelDate.d).padStart(2,'0')}`;
    } else {
      parsedDate = normalizeDate(String(dateVal).trim());
    }
    if (!parsedDate) continue;

    const description = String(descVal).trim() || 'Bank Transaction';
    const balance     = balanceVal ? parseFloat(String(balanceVal).replace(/,/g, '')) : null;

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

// ─── Column detection (Excel) ─────────────────────────────────
function detectColumns(lowerHeaders, originalHeaders) {
  const map = { date: null, description: null, debit: null, credit: null, amount: null, balance: null };

  const patterns = {
    date:        ['date', 'txn date', 'transaction date', 'trans date', 'value date', 'posting date'],
    description: ['description', 'narration', 'particulars', 'details', 'remarks', 'transaction details'],
    debit:       ['debit', 'withdrawal', 'withdrawals', 'debit amount', 'dr', 'debit(rs)', 'withdrawal amt'],
    credit:      ['credit', 'deposit', 'deposits', 'credit amount', 'cr', 'credit(rs)', 'deposit amt'],
    amount:      ['amount', 'transaction amount', 'txn amount'],
    balance:     ['balance', 'closing balance', 'running balance', 'available balance', 'bal'],
  };

  for (const [field, keywords] of Object.entries(patterns)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (keywords.some((k) => lowerHeaders[i].includes(k))) {
        map[field] = originalHeaders[i];
        break;
      }
    }
  }

  if (!map.date && originalHeaders.length >= 3) {
    map.date = originalHeaders[0];
    map.description = originalHeaders[1];
    map.amount = originalHeaders[2];
    if (originalHeaders.length >= 4) map.balance = originalHeaders[3];
  }
  if (!map.description) map.description = originalHeaders[1] || originalHeaders[0];

  return map;
}

// ─── Date helpers ──────────────────────────────────────────────

// Standard numeric dates: DD/MM/YYYY, YYYY-MM-DD, DD/MM/YY
function normalizeDate(raw) {
  if (!raw) return null;

  let m = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;

  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;

  m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const year = parseInt(m[3]) > 50 ? `19${m[3]}` : `20${m[3]}`;
    return `${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }

  return null;
}

// Federal Bank month names: DD-MMM-YYYY → YYYY-MM-DD
const MONTH_MAP = {
  JAN:'01', FEB:'02', MAR:'03', APR:'04', MAY:'05', JUN:'06',
  JUL:'07', AUG:'08', SEP:'09', OCT:'10', NOV:'11', DEC:'12',
};
function normalizeFederalDate(raw) {
  if (!raw) return null;
  const m = raw.match(/^(\d{2})-([A-Z]{3})-(\d{4})$/i);
  if (!m) return null;
  const month = MONTH_MAP[m[2].toUpperCase()];
  if (!month) return null;
  return `${m[3]}-${month}-${m[1]}`;
}

function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

// ─── Save confirmed transactions ───────────────────────────────
export async function saveConfirmedTransactions(userId, transactions) {
  const expenses = transactions.map((t) => ({
    amount:     t.amount,
    categoryId: t.categoryId,
    date:       new Date(t.date),
    notes:      t.notes || t.description || null,
    userId,
  }));

  return prisma.expense.createMany({ data: expenses });
}
