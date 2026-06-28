import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Pencil, Trash2, Tag, Loader2, Users } from 'lucide-react';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// --- Constants ---
const PRESET_COLORS = [
  '#C8E972', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1',
  '#F43F5E', '#06B6D4', '#78716C',
];

const PRESET_ICONS = [
  'utensils', 'car', 'shopping-bag', 'home', 'receipt',
  'film', 'heart', 'book-open', 'plane', 'gift',
  'laptop', 'banknote', 'trending-up', 'plus-circle', 'tag',
];

const CATEGORY_ICONS = {
  'utensils': Icons.UtensilsCrossed,
  'car': Icons.Car,
  'shopping-bag': Icons.ShoppingBag,
  'home': Icons.Home,
  'receipt': Icons.Receipt,
  'film': Icons.Film,
  'heart': Icons.Heart,
  'book-open': Icons.BookOpen,
  'plane': Icons.Plane,
  'more-horizontal': Icons.MoreHorizontal,
  'banknote': Icons.Banknote,
  'laptop': Icons.Laptop,
  'gift': Icons.Gift,
  'trending-up': Icons.TrendingUp,
  'plus-circle': Icons.PlusCircle,
  'circle': Icons.Circle,
  'tag': Icons.Tag,
};

function CategoryIcon({ iconName, className, style }) {
  const IconComp = CATEGORY_ICONS[iconName] || Icons.Circle;
  return <IconComp className={className} style={style} size={14} />;
}

function ModalShell({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function CategoriesPage() {
  const accounts = useAdminStore((s) => s.accounts);
  const isAccountsLoaded = useAdminStore((s) => s.isAccountsLoaded);
  const selectedAccountId = useAdminStore((s) => s.selectedAccountId);
  const selectedIdx = accounts.findIndex((a) => a.id === selectedAccountId);
  const selectedAccount = selectedIdx >= 0 ? accounts[selectedIdx] : null;

  const [categories, setCategories] = useState([]);
  const [typeFilter, setTypeFilter] = useState('expense');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'tag',
    color: '#C8E972',
    type: 'expense',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedAccountId) {
      loadCategories();
    }
  }, [selectedAccountId, typeFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const resData = await adminService.userCategories(selectedAccountId);
      setCategories((resData.data || resData).categories?.filter(c => c.type === typeFilter) || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await adminService.updateCategory(selectedAccountId, editingId, formData);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? res.data?.category || res.category : c)));
        toast.success('Category updated');
      } else {
        const res = await adminService.createCategory(selectedAccountId, { ...formData, type: typeFilter });
        const newCat = res.data?.category || res.category;
        setCategories((prev) => [...prev, newCat]);
        toast.success('Category created');
      }
      closeForm();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await adminService.deleteCategory(selectedAccountId, id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Cannot delete this category');
    }
  };

  const openEdit = (cat) => {
    setEditingId(cat.id);
    setFormData({ name: cat.name, icon: cat.icon, color: cat.color, type: cat.type });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', icon: 'tag', color: '#C8E972', type: 'expense' });
  };

  if (!isAccountsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="font-medium text-gray-600 animate-pulse">Loading accounts...</p>
      </div>
    );
  }

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users size={42} className="mb-4 opacity-30" />
        <p className="font-semibold text-gray-600">No account selected</p>
        <p className="text-sm mt-1">Select an account from the top-bar dropdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Categories</h1>
        <Button onClick={() => setShowForm(true)} className="gap-1.5 h-9">
          <Plus size={16} /> New Category
        </Button>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100/50 rounded-xl w-max border border-gray-100">
        <button
          onClick={() => setTypeFilter('expense')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
            typeFilter === 'expense' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Expenses
        </button>
        <button
          onClick={() => setTypeFilter('income')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200',
            typeFilter === 'income' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Income
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        {loading ? (
          <div className="flex justify-center items-center py-24 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Tag size={42} className="mb-4 opacity-30" />
            <p className="font-semibold text-gray-600">No categories found</p>
            <p className="text-sm mt-1">Create a new category to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "relative group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200",
                  !cat.isDefault ? "hover:bg-gray-50 border border-transparent hover:border-gray-100" : "opacity-75 grayscale-[0.2]"
                )}
              >
                {!cat.isDefault && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => openEdit(cat)} className="p-1 rounded-md bg-white border shadow-sm text-gray-500 hover:text-primary hover:border-primary/30">
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
                
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner relative"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon iconName={cat.icon} style={{ color: cat.color }} className="w-5 h-5" />
                  {!cat.isDefault && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                  )}
                </div>
                <div className="text-center w-full">
                  <p className={cn("text-xs font-semibold truncate", cat.isDefault ? 'text-gray-500' : 'text-gray-800')} title={cat.name}>
                    {cat.name}
                  </p>
                  {cat.isDefault && <p className="text-[9px] text-gray-400 font-medium">SYSTEM</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <ModalShell title={editingId ? 'Edit Category' : 'New Category'} onClose={closeForm}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Name</label>
              <Input
                placeholder="Category name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Icon</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_ICONS.map((icon) => {
                  const isSelected = formData.icon === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={cn(
                        "aspect-square rounded-xl flex items-center justify-center transition-all duration-200",
                        isSelected
                          ? "bg-primary shadow-md ring-2 ring-primary/20 ring-offset-1"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      <CategoryIcon iconName={icon} className={cn("w-5 h-5", isSelected ? 'text-white' : '')} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Color</label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 shadow-inner",
                      formData.color === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="pt-6 border-t space-y-3">
              <Button onClick={handleSave} className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update Category' : 'Create Category'}
              </Button>
              {editingId && (
                <Button
                  variant="destructive"
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-0"
                  onClick={() => {
                    handleDelete(editingId);
                    closeForm();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Category
                </Button>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
