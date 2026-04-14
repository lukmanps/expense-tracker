import { Delete } from 'lucide-react';

const keys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'delete'],
];

export default function NumericKeypad({ value, onChange, maxLength = 10 }) {
  const handlePress = (key) => {
    if (key === 'delete') {
      onChange(value.slice(0, -1) || '0');
    } else if (key === '.') {
      if (!value.includes('.')) {
        onChange(value + '.');
      }
    } else {
      if (value === '0' && key !== '.') {
        onChange(key);
      } else if (value.length < maxLength) {
        // Limit decimal places to 2
        const parts = value.split('.');
        if (parts[1] && parts[1].length >= 2) return;
        onChange(value + key);
      }
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 px-2">
      {keys.flat().map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => handlePress(key)}
          className={`h-14 rounded-2xl text-xl font-medium transition-all active:scale-95 ${
            key === 'delete'
              ? 'bg-surface-alt text-text flex items-center justify-center'
              : 'bg-surface-alt text-text hover:bg-border'
          }`}
        >
          {key === 'delete' ? <Delete className="w-6 h-6" /> : key}
        </button>
      ))}
    </div>
  );
}
