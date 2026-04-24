import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Phone, Lock, User, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/ui/Button';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Enter a valid phone number').regex(/^\+?[0-9]+$/, 'Invalid phone number'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser({
        name: data.name,
        phone: data.phone,
        password: data.password,
        email: data.email || null,
      });
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', icon: User, type: 'text', placeholder: 'Full name' },
    { name: 'phone', icon: Phone, type: 'tel', placeholder: 'Phone number' },
    { name: 'email', icon: Mail, type: 'email', placeholder: 'Email (optional)' },
  ];

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6 py-12 max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4 bg-black p-2 rounded-lg">
          <img src="/xpense-logo.png" alt="Xpense Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold text-text">Create Account</h1>
        <p className="text-sm text-text-secondary mt-1">Start tracking your expenses today</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {fields.map((field) => (
          <div key={field.name}>
            <div className="relative">
              <field.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                {...register(field.name)}
                type={field.type}
                placeholder={field.placeholder}
                className="w-full pl-12 pr-4 py-3.5 bg-surface-alt border border-border rounded-2xl text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id={`register-${field.name}`}
              />
            </div>
            {errors[field.name] && <p className="text-xs text-danger mt-1.5 ml-1">{errors[field.name].message}</p>}
          </div>
        ))}

        {['password', 'confirmPassword'].map((name) => (
          <div key={name}>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <input
                {...register(name)}
                type={showPassword ? 'text' : 'password'}
                placeholder={name === 'password' ? 'Password' : 'Confirm password'}
                className="w-full pl-12 pr-12 py-3.5 bg-surface-alt border border-border rounded-2xl text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id={`register-${name}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors[name] && <p className="text-xs text-danger mt-1.5 ml-1">{errors[name].message}</p>}
          </div>
        ))}

        <Button type="submit" size="full" loading={loading} className="mt-4">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary mt-8">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-dark font-semibold">Sign In</Link>
      </p>
    </div>
  );
}
