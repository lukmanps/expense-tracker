import * as Icons from 'lucide-react';

const iconMap = {
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

function getIcon(iconName) {
  return iconMap[iconName] || Icons.Circle;
}

export default function CategoryGrid({ categories, selected, onSelect, columns = 5 }) {
  return (
    <div
      className="grid gap-2 gap-y-3"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {categories.map((cat) => {
        const IconComp = getIcon(cat.icon);
        const isSelected = selected === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1 py-1 transition-all"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isSelected
                  ? 'ring-2 ring-primary shadow-md scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: isSelected ? cat.color : `${cat.color}20` }}
            >
              <IconComp
                className="w-4.5 h-4.5"
                style={{ color: isSelected ? '#fff' : cat.color }}
              />
            </div>
            <span className={`text-[11px] font-medium leading-tight text-center ${
              isSelected ? 'text-text' : 'text-text-secondary'
            }`}>
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { getIcon };
