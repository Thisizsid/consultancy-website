import React from 'react';

/**
 * Reusable Badge component for status highlights
 */
const Badge = ({
  children,
  variant = 'neutral', // success, warning, danger, info, neutral, accent
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold leading-4 tracking-wide border';

  const variants = {
    success: 'bg-secondary/10 text-secondary border-secondary/25',
    warning: 'bg-secondary/10 text-secondary-dark border-secondary/25',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-accent/10 text-accent-light border-accent/25',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200',
    accent: 'bg-secondary/15 text-secondary border-secondary/30',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
