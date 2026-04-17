import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { categoryService } from '../services/category.service';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import BottomSheet from '../components/ui/BottomSheet';
import FilterChips from '../components/ui/FilterChips';
import { getIcon } from '../components/ui/CategoryGrid';
import { CardSkeleton } from '../components/ui/SkeletonLoader';

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

export default function CategoriesPage() {
  const navigate = useNavigate();
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
    loadCategories();
  }, [typeFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.list(typeFilter);
      setCategories(res.categories);
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
        const { category } = await categoryService.update(editingId, formData);
        setCategories((prev) => prev.map((c) => (c.id === editingId ? category : c)));
        toast.success('Category updated');
      } else {
        const { category } = await categoryService.create({ ...formData, type: typeFilter });
        setCategories((prev) => [...prev, category]);
        toast.success('Category created');
      }
      closeForm();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await categoryService.delete(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success('Category deleted');
    } catch (err) {
      toast.error(err.message || 'Cannot delete this category');
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

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="text-text-secondary p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[28px] font-black text-text tracking-tight">
          Categories<span className="text-primary">.</span>
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 -mr-2 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6 text-text" />
        </button>
      </div>

      <div className="px-5 pb-3">
        <FilterChips
          options={[
            { value: 'expense', label: 'Expense' },
            { value: 'income', label: 'Income' },
          ]}
          selected={typeFilter}
          onSelect={setTypeFilter}
        />
      </div>

      <div className="px-5 pt-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center animate-pulse">
                <div className="w-[56px] h-[56px] rounded-[18px] bg-border/20 mb-2" />
                <div className="w-12 h-2.5 rounded-full bg-border/20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-x-2 gap-y-6">
            {categories.map((cat) => {
              const IconComp = getIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={!cat.isDefault ? () => openEdit(cat) : undefined}
                  disabled={cat.isDefault}
                  title={cat.isDefault ? 'System Category (Cannot be edited)' : 'Edit Custom Category'}
                  className={`flex flex-col items-center justify-start group transition-all relative ${
                    !cat.isDefault ? 'cursor-pointer active:scale-95' : 'opacity-80 grayscale-[0.2]'
                  }`}
                >
                  <div
                    className={`w-[56px] h-[56px] rounded-[18px] flex items-center justify-center flex-shrink-0 mb-2 transition-transform shadow-inner ${
                      !cat.isDefault ? 'group-hover:ring-2 ring-border/50 ring-offset-2 ring-offset-bg' : ''
                    }`}
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <IconComp className="w-6 h-6" style={{ color: cat.color }} />
                    {!cat.isDefault && (
                       <div className="absolute top-0 flex-shrink-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-bg shadow-sm" />
                    )}
                  </div>
                  <p className={`text-[11px] font-bold tracking-tight text-center truncate w-full px-1 ${
                    cat.isDefault ? 'text-text-secondary/80' : 'text-text'
                  }`}>
                    {cat.name}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Bottom Sheet */}
      <BottomSheet isOpen={showForm} onClose={closeForm} title={editingId ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Category name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {PRESET_ICONS.map((icon) => {
                const IconComp = getIcon(icon);
                return (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                      formData.icon === icon
                        ? 'bg-primary ring-2 ring-primary-dark'
                        : 'bg-surface-alt hover:bg-border'
                    }`}
                  >
                    <IconComp className={`w-5 h-5 ${formData.icon === icon ? 'text-[#0a0a0b]' : 'text-text'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === color ? 'ring-2 ring-offset-2 ring-primary-dark scale-110' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button onClick={handleSave} size="full" loading={saving}>
              {editingId ? 'Update Category' : 'Create Category'}
            </Button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this category?')) {
                    handleDelete(editingId);
                    closeForm();
                  }
                }}
                className="w-full py-4 text-sm font-bold text-danger hover:bg-danger/10 rounded-xl transition-colors"
              >
                Delete Category
              </button>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
