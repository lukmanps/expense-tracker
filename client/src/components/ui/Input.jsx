import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, className = '', ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-text placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${
          error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
