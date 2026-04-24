import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/ui/Button';

const loginSchema = z.object({
  phone: z.string().min(10, 'Enter a valid phone number').regex(/^\+?[0-9]+$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: '', password: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6 py-12 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <img src="/xpense-logo.png" alt="Xpense Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-text">Welcome Back</h1>
        <p className="text-sm text-text-secondary mt-1">Sign in to your SpendWise account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              {...register('phone')}
              type="tel"
              placeholder="Phone number"
              className="w-full pl-12 pr-4 py-3.5 bg-surface-alt border border-border rounded-2xl text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="login-phone"
            />
          </div>
          {errors.phone && <p className="text-xs text-danger mt-1.5 ml-1">{errors.phone.message}</p>}
        </div>

        <div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              className="w-full pl-12 pr-12 py-3.5 bg-surface-alt border border-border rounded-2xl text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="login-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1.5 ml-1">{errors.password.message}</p>}
        </div>

        <Button type="submit" size="full" loading={loading} className="mt-6">
          Sign In
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-text-secondary mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-dark font-semibold">Sign Up</Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-6 p-3 bg-surface-alt rounded-xl text-center">
        <p className="text-xs text-text-muted">Demo: +1234567890 / demo1234</p>
      </div>
    </div>
  );
}
