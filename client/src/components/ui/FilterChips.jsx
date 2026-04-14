export default function FilterChips({ options, selected, onSelect, className = '' }) {
  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar pb-1 ${className}`}>
      {options.map((option) => {
        const isActive = selected === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              isActive
                ? 'bg-primary text-text shadow-sm'
                : 'bg-surface-alt text-text-secondary hover:bg-border'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
