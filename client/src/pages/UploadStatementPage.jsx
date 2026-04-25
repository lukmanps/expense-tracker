import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, FileText, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/ui/Button';
import { statementService } from '../services/statement.service';
import { categoryService } from '../services/category.service';
import { format } from 'date-fns';

export default function UploadStatementPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [stage, setStage] = useState('upload'); // 'upload' | 'preview'

  useEffect(() => {
    categoryService.list('expense').then((res) => {
      setCategories(res.categories || []);
    });
  }, []);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // Reset state if a new file is selected
      setTransactions([]);
      setStage('upload');
      
      // Simple heuristic for PDFs: sometimes they are password protected.
      if (selected.type === 'application/pdf' || selected.name.toLowerCase().endsWith('.pdf')) {
         setNeedsPassword(true);
      } else {
         setNeedsPassword(false);
         setPassword('');
      }
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    try {
      const res = await statementService.processFile(file, password);
      
      // Map temporary ID and default category
      const defaultCategory = categories.length > 0 ? categories[0].id : '';
      
      const processed = res.transactions.map((t) => ({
        ...t,
        categoryId: defaultCategory,
      }));
      
      setTransactions(processed);
      setStage('preview');
      toast.success(`Found ${processed.length} debit transactions`);
    } catch (err) {
      toast.error(err.message || 'Failed to process file');
      if (err.message && err.message.toLowerCase().includes('password')) {
         setNeedsPassword(true);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateTransaction = (index, field, value) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
  };

  const handleDeleteTransaction = (index) => {
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
    if (updated.length === 0) {
       toast.info('No transactions left, returning to upload');
       setStage('upload');
       setFile(null);
    }
  };

  const handleConfirm = async () => {
    // Validate
    const invalid = transactions.find(t => !t.categoryId || !t.amount || t.amount <= 0 || !t.date || !t.description);
    if (invalid) {
      toast.error('Please ensure all transactions have a valid date, description, amount, and category');
      return;
    }

    setConfirming(true);
    try {
      const res = await statementService.confirmTransactions(transactions);
      toast.success(res.message || 'Transactions imported successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to save transactions');
    } finally {
      setConfirming(false);
    }
  };

  if (stage === 'preview') {
    return (
      <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-bg sticky top-0 z-10 border-b border-border shadow-sm">
          <button onClick={() => setStage('upload')} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm font-bold">Back</span>
          </button>
          <h1 className="text-xl font-black text-text tracking-tight">Review Imports</h1>
          <div className="w-[72px]" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
           <div className="bg-surface-alt p-3 rounded-xl flex items-center justify-between border border-border">
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-success" />
                 <span className="text-sm font-medium text-text">{transactions.length} Debits Found</span>
              </div>
              <span className="text-xs font-semibold text-text-muted bg-bg px-2 py-1 rounded-md">
                 Total: ₹{transactions.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0).toFixed(2)}
              </span>
           </div>

          {transactions.map((txn, index) => (
            <div key={txn.tempId || index} className="bg-surface rounded-2xl p-4 shadow-sm border border-border space-y-3">
              <div className="flex justify-between items-start gap-2">
                <input 
                  type="date"
                  value={txn.date}
                  onChange={(e) => handleUpdateTransaction(index, 'date', e.target.value)}
                  className="bg-transparent text-sm font-medium text-text outline-none border-b border-transparent focus:border-primary px-1"
                />
                <button onClick={() => handleDeleteTransaction(index)} className="p-1 text-text-muted hover:text-danger hover:bg-danger/10 rounded-md transition-colors">
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div>
                <input 
                  type="text"
                  value={txn.description}
                  onChange={(e) => handleUpdateTransaction(index, 'description', e.target.value)}
                  placeholder="Description"
                  className="w-full bg-transparent text-base text-text font-semibold outline-none border-b border-transparent focus:border-primary placeholder:text-text-muted px-1"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                   <select 
                      value={txn.categoryId} 
                      onChange={(e) => handleUpdateTransaction(index, 'categoryId', e.target.value)}
                      className="w-full bg-surface-alt text-sm text-text rounded-lg p-2 outline-none border border-transparent focus:border-primary appearance-none"
                   >
                      <option value="" disabled>Select Category</option>
                      {categories.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                   </select>
                </div>
                <div className="flex items-center font-bold text-text bg-surface-alt rounded-lg p-2 border border-transparent focus-within:border-primary">
                  <span className="text-text-muted text-xs mr-1">₹</span>
                  <input 
                    type="number"
                    value={txn.amount}
                    onChange={(e) => handleUpdateTransaction(index, 'amount', parseFloat(e.target.value) || 0)}
                    className="w-20 bg-transparent outline-none text-right"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 pb-6 pt-4 bg-bg border-t border-border sticky bottom-0">
          <Button onClick={handleConfirm} size="full" loading={confirming}>
            Confirm & Save
          </Button>
        </div>
      </div>
    );
  }

  // Upload Stage
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

      <div className="px-5 py-6 flex-1 flex flex-col">
        <div className="bg-surface rounded-2xl p-6 border border-border shadow-sm flex flex-col items-center justify-center min-h-[240px] text-center border-dashed border-2 relative overflow-hidden group">
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
             {file ? file.name : "Tap to select file"}
          </h3>
          <p className="text-sm text-text-muted px-4">
             {file ? "Tap to change file" : "Supports PDF, Excel (.xls, .xlsx) and CSV."}
          </p>
          <p className="text-xs text-text-muted mt-2">Only debits will be imported.</p>
        </div>

        {file && needsPassword && (
          <div className="mt-6 animate-fade-in">
             <label className="block text-sm font-semibold text-text mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Document Password
             </label>
             <p className="text-xs text-text-muted mb-3">If your PDF statement is protected, enter the password here. It will not be saved.</p>
             <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-surface-alt border border-border rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:border-primary outline-none transition-colors"
             />
          </div>
        )}

        <div className="mt-auto pt-8 pb-2 flex flex-col gap-4">
          <div className="bg-primary/10 rounded-xl p-4 flex gap-3">
             <FileText className="w-6 h-6 text-primary flex-shrink-0" />
             <div>
                <h4 className="text-sm font-bold text-text">How it works</h4>
                <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                   Upload your bank statement. We will extract the debit transactions (expenses) and let you review and categorize them before saving to your account.
                </p>
             </div>
          </div>
          <Button 
            onClick={handleProcess} 
            size="full" 
            loading={uploading}
            disabled={!file}
          >
            Process Statement
          </Button>
        </div>
      </div>
    </div>
  );
}
