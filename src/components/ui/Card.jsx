import React from 'react';

/**
 * Reusable Card component matching the design tokens
 */
const Card = ({
  children,
  className = '',
  hoverEffect = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface 
        rounded-md 
        border 
        border-gray-100 
        shadow-sm 
        overflow-hidden 
        transition-all 
        duration-300 
        ${hoverEffect ? 'hover:shadow-md hover:-translate-y-1 hover:border-gray-200' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-gray-100 bg-gray-50/50 ${className}`}>
    {children}
  </div>
);

export default Card;
