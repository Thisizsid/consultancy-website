import React from 'react';

/**
 * Reusable Table component for list pages and CMS panels
 */
const Table = ({
  headers = [], // Array of string header titles or objects { key, label, className }
  children,
  className = '',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-md border border-gray-150 shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-surface text-xs font-semibold text-text-primary uppercase tracking-wider">
          <tr>
            {headers.map((header, idx) => {
              const label = typeof header === 'string' ? header : header.label;
              const colClass = typeof header === 'string' ? '' : (header.className || '');
              return (
                <th key={idx} scope="col" className={`px-6 py-3.5 ${colClass}`}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 bg-white text-text-secondary">
          {children}
        </tbody>
      </table>
    </div>
  );
};

export const TableRow = ({ children, className = '', onClick }) => (
  <tr 
    onClick={onClick}
    className={`
      transition-colors duration-150 
      ${onClick ? 'cursor-pointer hover:bg-gray-50/50' : ''} 
      ${className}
    `}
  >
    {children}
  </tr>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap align-middle ${className}`}>
    {children}
  </td>
);

export default Table;
