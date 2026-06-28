import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      toast.success('Welcome back, Admin!');
      navigate('/');
    } catch (err) {
      if (err.status === 403) {
        setError('This account does not have admin privileges.');
      } else {
        setError(err.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex flex-1 bg-gray-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} className="text-gray-950" />
          </div>
          <span className="text-xl font-bold tracking-tight">Xpense</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Manage your finances<br/>with absolute control.
          </h1>
          <p className="text-gray-400 text-lg">
            The central command center for Xpense. Monitor transactions, manage user accounts, and review platform statistics in real-time.
          </p>
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 lg:p-8">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 lg:hidden flex items-center gap-2 justify-center">
             <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                <ShieldCheck size={24} className="text-white" />
             </div>
             <span className="text-2xl font-bold tracking-tight text-gray-900">Xpense</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 mt-2">Enter your credentials to access the admin panel</p>
          </div>

          {error && (
            <div className="p-3 mb-6 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="admin-phone" className="text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <Input
                id="admin-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="username"
                className="h-12 px-4 rounded-xl border-gray-200 bg-gray-50/50 focus-visible:ring-primary focus-visible:ring-1 focus-visible:bg-white transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 px-4 pr-12 rounded-xl border-gray-200 bg-gray-50/50 focus-visible:ring-primary focus-visible:ring-1 focus-visible:bg-white transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold shadow-md transition-all mt-2" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in securely'}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-xs text-gray-400">
            Secure admin access portal. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
