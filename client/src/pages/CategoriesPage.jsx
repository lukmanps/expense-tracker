import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Edit3 } from 'lucide-react';
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
        <h1 className="text-2xl font-black text-text tracking-tight">Manage Categories</h1>
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

      <div className="px-5 space-y-2">
        {loading ? (
          [...Array(5)].map((_, i) => <CardSkeleton key={i} />)
        ) : (
          categories.map((cat) => {
            const IconComp = getIcon(cat.icon);
            return (
              <Card key={cat.id} className="p-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <IconComp className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-text">{cat.name}</p>
                    <p className="text-xs text-text-muted">{cat.isDefault ? 'Default' : 'Custom'}</p>
                  </div>
                  {!cat.isDefault && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 rounded-lg hover:bg-surface-alt"
                      >
                        <Edit3 className="w-4 h-4 text-text-muted" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 rounded-lg hover:bg-surface-alt"
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })
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
                    <IconComp className="w-5 h-5 text-text" />
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

          <Button onClick={handleSave} size="full" loading={saving}>
            {editingId ? 'Update' : 'Create'} Category
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
