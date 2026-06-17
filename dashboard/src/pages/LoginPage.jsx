import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore.js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-4 items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <ShieldCheck size={32} className="text-primary-foreground" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
            <CardDescription>
              Management dashboard for Xpense
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-3 mb-4 text-sm font-medium text-destructive-foreground bg-destructive rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-phone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Phone Number
              </label>
              <Input
                id="admin-phone"
                type="tel"
                placeholder="Enter phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-xs text-muted-foreground text-center">
            Only the designated admin account can access this panel.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
