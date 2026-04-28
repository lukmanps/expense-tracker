import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Upload, FileText, Trash2, CheckCircle2,
  Lock, Eye, EyeOff, ChevronLeft as PrevIcon, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/ui/Button';
import { statementService } from '../services/statement.service';
import { categoryService } from '../services/category.service';

export default function UploadStatementPage() {
  const navigate = useNavigate();
  const passwordRef = useRef(null);
  const listRef = useRef(null);

  // File + auth state
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Transaction state
  const [allTransactions, setAllTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [categories, setCategories] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [stage, setStage] = useState('upload'); // 'upload' | 'preview'

  useEffect(() => {
    categoryService.list('expense').then((res) => setCategories(res.categories || []));
  }, []);

  useEffect(() => {
    if (needsPassword && passwordRef.current) {
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, [needsPassword]);

  // ── Helpers ──────────────────────────────────────────────────
  const { page, pageSize, total, totalPages } = pagination;
  const pageStart = (page - 1) * pageSize;
  const pageTransactions = allTransactions.slice(pageStart, pageStart + pageSize);

  const goToPage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPagination((p) => ({ ...p, page: newPage }));
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Handlers ─────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setAllTransactions([]);
      setStage('upload');
      setNeedsPassword(false);
      setWrongPassword(false);
      setPassword('');
    }
  };

  const handleProcess = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    if (needsPassword && !password) {
      toast.error('Please enter the PDF password');
      passwordRef.current?.focus();
      return;
    }

    setUploading(true);
    setWrongPassword(false);

    try {
      const res = await statementService.processFile(file, password || null, 1);
      const defaultCategory = categories.length > 0 ? categories[0].id : '';
      const all = (res.allTransactions || res.transactions).map((t) => ({
        ...t,
        categoryId: defaultCategory,
      }));

      setAllTransactions(all);
      setPagination(res.pagination || { page: 1, pageSize: 10, total: all.length, totalPages: Math.ceil(all.length / 10) });
      setStage('preview');
      setNeedsPassword(false);
      setPassword('');
      toast.success(`Found ${all.length} debit transaction${all.length !== 1 ? 's' : ''}`);
    } catch (err) {
      const data = err.data || {};
      if (data.requiresPassword) {
        setNeedsPassword(true);
        if (password) {
          setWrongPassword(true);
          toast.error('Incorrect password. Please try again.');
        } else {
          toast.info('This PDF is password-protected. Please enter the password.');
        }
      } else {
        toast.error(err.message || 'Failed to process file');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateTransaction = (globalIndex, field, value) => {
    const updated = [...allTransactions];
    updated[globalIndex] = { ...updated[globalIndex], [field]: value };
    setAllTransactions(updated);
  };

  const handleDeleteTransaction = (globalIndex) => {
    const updated = allTransactions.filter((_, i) => i !== globalIndex);
    setAllTransactions(updated);
    const newTotal = updated.length;
    const newTotalPages = Math.max(1, Math.ceil(newTotal / pageSize));
    const safePage = Math.min(page, newTotalPages);
    setPagination((p) => ({ ...p, total: newTotal, totalPages: newTotalPages, page: safePage }));
    if (updated.length === 0) {
      toast.info('No transactions left, returning to upload');
      setStage('upload');
      setFile(null);
    }
  };

  const handleConfirm = async () => {
    const invalid = allTransactions.find(
      (t) => !t.categoryId || !t.amount || t.amount <= 0 || !t.date || !t.description
    );
    if (invalid) {
      toast.error('Please ensure all transactions have a valid date, description, amount, and category');
      return;
    }

    setConfirming(true);
    try {
      const res = await statementService.confirmTransactions(allTransactions);
      toast.success(res.message || 'Transactions imported successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to save transactions');
    } finally {
      setConfirming(false);
    }
  };

  // ── Preview Stage ────────────────────────────────────────────
  if (stage === 'preview') {
    return (
      <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col h-screen">
        <div className="flex items-center justify-between px-5 py-4 bg-bg border-b border-border shadow-sm flex-shrink-0">
          <button onClick={() => setStage('upload')} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <h1 className="text-xl font-black text-text tracking-tight">Review Imports</h1>
          <div className="w-[72px]" />
        </div>

        <div className="px-4 pt-3 pb-1 flex-shrink-0">
          <div className="bg-surface-alt p-3 rounded-lg flex items-center justify-between border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-text">{total} Debits Found</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Pg {page}/{totalPages}</span>
              <span className="text-xs font-semibold text-text-muted bg-bg px-2 py-1 rounded-md">
                ₹{allTransactions.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto no-scrollbar px-4 py-2 space-y-4">
          {pageTransactions.map((txn, pageIdx) => {
            const globalIndex = pageStart + pageIdx;
            return (
              <div key={txn.tempId || globalIndex} className="bg-surface rounded-lg p-4 shadow-sm border border-border space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="date"
                    value={txn.date}
                    onChange={(e) => handleUpdateTransaction(globalIndex, 'date', e.target.value)}
                    className="bg-transparent text-sm font-medium text-text outline-none border-b border-transparent focus:border-primary px-1"
                  />
                  <button
                    onClick={() => handleDeleteTransaction(globalIndex)}
                    className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={txn.description}
                    onChange={(e) => handleUpdateTransaction(globalIndex, 'description', e.target.value)}
                    placeholder="Description"
                    className="w-full bg-transparent text-base text-text font-semibold outline-none border-b border-transparent focus:border-primary placeholder:text-text-muted px-1"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-36">
                    <select
                      value={txn.categoryId}
                      onChange={(e) => handleUpdateTransaction(globalIndex, 'categoryId', e.target.value)}
                      className="w-full bg-surface-alt text-sm text-text rounded-lg p-2 outline-none border border-transparent focus:border-primary appearance-none truncate"
                    >
                      <option value="" disabled>Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 flex items-center font-bold text-text bg-surface-alt rounded-lg p-2 border border-transparent focus-within:border-primary">
                    <span className="text-text-muted text-xs mr-1">₹</span>
                    <input
                      type="number"
                      value={txn.amount}
                      onChange={(e) => handleUpdateTransaction(globalIndex, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent outline-none text-right"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-2 flex items-center justify-between border-t border-border flex-shrink-0 bg-bg">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 text-sm font-semibold text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded hover:bg-surface transition-colors"
            >
              <PrevIcon className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs text-text-muted font-medium">
              {pageStart + 1}–{Math.min(pageStart + pageSize, total)} of {total}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-sm font-semibold text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1.5 rounded hover:bg-surface transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="px-5 pb-6 pt-2 bg-bg border-t border-border sticky bottom-0 flex-shrink-0">
          <Button onClick={handleConfirm} size="full" loading={confirming}>
            Confirm & Save
          </Button>
        </div>
      </div>
    );
  }

  // ── Upload Stage ─────────────────────────────────────────────
  const isPdf = file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-sm font-bold">Cancel</span>
        </button>
        <h1 className="text-2xl font-black text-text tracking-tight">Upload Statement</h1>
        <div className="w-[88px]" />
      </div>

      <div className="px-5 py-6 flex-1 flex flex-col gap-5">
        <div className="bg-surface rounded-lg p-6 border-2 border-dashed border-border shadow-sm flex flex-col items-center justify-center min-h-[200px] text-center relative overflow-hidden group">
          <input
            type="file"
            accept=".pdf,.xls,.xlsx,.csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-text mb-1">
            {file ? file.name : 'Tap to select file'}
          </h3>
          <p className="text-sm text-text-muted px-4">
            {file ? 'Tap to change file' : 'Supports PDF, Excel (.xls, .xlsx) and CSV'}
          </p>
          <p className="text-xs text-text-muted mt-1">Only debits will be imported.</p>
        </div>

        {needsPassword && isPdf && (
          <div className="bg-surface rounded-lg p-4 border border-border shadow-sm animate-fade-in">
            <label className="flex items-center gap-2 text-sm font-semibold text-text mb-1">
              <Lock className="w-4 h-4 text-primary" />
              PDF Password Required
            </label>
            <p className="text-xs text-text-muted mb-3">
              This statement is password-protected. Enter your password to unlock it — it won't be stored.
            </p>
            <div className={`flex items-center bg-bg border rounded-lg px-4 overflow-hidden transition-colors ${wrongPassword ? 'border-danger' : 'border-border focus-within:border-primary'}`}>
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setWrongPassword(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleProcess()}
                placeholder="Enter PDF password"
                className="flex-1 bg-transparent py-3 text-text placeholder:text-text-muted outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-text-muted hover:text-text p-1 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {wrongPassword && (
              <p className="text-xs text-danger mt-2">Incorrect password. Please try again.</p>
            )}
          </div>
        )}

        <div className="bg-primary/10 rounded-lg p-4 flex gap-3">
          <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-text">How it works</h4>
            <ol className="text-xs text-text-secondary mt-1 leading-relaxed list-decimal list-inside space-y-0.5">
              <li>Upload your bank statement (PDF, Excel, or CSV)</li>
              <li>If encrypted, enter the document password</li>
              <li>Review &amp; categorize the extracted debits</li>
              <li>Save them as expenses in one tap</li>
            </ol>
          </div>
        </div>

        <div className="mt-auto pt-2 pb-2">
          <Button
            onClick={handleProcess}
            size="full"
            loading={uploading}
            disabled={!file}
          >
            {needsPassword ? 'Unlock & Process' : 'Process Statement'}
          </Button>
        </div>
      </div>
    </div>
  );
}
