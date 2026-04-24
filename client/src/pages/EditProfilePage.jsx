import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import Button from '../components/ui/Button';

export default function EditProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || null,
      });
      toast.success('Profile updated');
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-sm font-bold">Back</span>
        </button>
        <h1 className="text-2xl font-black text-text tracking-tight">Edit Profile</h1>
        <div className="w-[88px]" />
      </div>

      <div className="px-5 pt-6 flex-1 space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-text-secondary px-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface-alt border border-border rounded-xl text-text placeholder:text-text-muted focus:border-primary transition-all"
            placeholder="Enter your name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-text-secondary px-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3.5 bg-surface-alt border border-border rounded-xl text-text placeholder:text-text-muted focus:border-primary transition-all"
            placeholder="Enter your email"
          />
        </div>

        <div className="space-y-1.5 opacity-60">
          <label className="text-sm font-semibold text-text-secondary px-1">Phone Number (Cannot be changed)</label>
          <input
            type="text"
            value={user?.phone || ''}
            disabled
            className="w-full px-4 py-3.5 bg-surface-alt border border-border rounded-xl text-text cursor-not-allowed"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-6 pt-6">
        <Button onClick={handleSubmit} size="full" loading={loading}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}
