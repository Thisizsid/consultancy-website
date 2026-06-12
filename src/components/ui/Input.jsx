import React from 'react';

/**
 * Reusable Input/Textarea component for form validations
 */
const Input = React.forwardRef(({
  label,
  type = 'text',
  placeholder = '',
  error = '',
  className = '',
  rows = 4,
  ...props
}, ref) => {
  const baseInputStyles = 'w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors duration-200 bg-white border-gray-300 text-text-primary placeholder-gray-400';
  const errorStyles = 'border-red-500 focus:ring-red-500 focus:border-red-500';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-text-primary mb-1.5">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          ref={ref}
          placeholder={placeholder}
          rows={rows}
          className={`${baseInputStyles} ${error ? errorStyles : ''}`}
          {...props}
        />
      ) : (
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={`${baseInputStyles} ${error ? errorStyles : ''}`}
          {...props}
        />
      )}
      {error && (
        <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
