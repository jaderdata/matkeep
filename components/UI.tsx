
import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={`bg-white border border-gray-300 rounded-none ${className}`} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ children, variant = 'primary', className, ...props }) => {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-black',
    secondary: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      className={`px-4 py-2 font-medium text-sm transition-colors rounded-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className, ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-semibold text-gray-700 uppercase">{label}</label>}
    <input
      className={`border border-gray-300 p-2 text-sm focus:outline-none focus:border-gray-900 rounded-none ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    {label && <label className="text-xs font-semibold text-gray-700 uppercase">{label}</label>}
    <select
      className={`border border-gray-300 p-2 text-sm focus:outline-none focus:border-gray-900 rounded-none bg-white ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Badge: React.FC<{ color: 'green' | 'yellow' | 'red' | 'gray' | 'blue'; children: React.ReactNode }> = ({ color, children }) => {
  const colors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border rounded-none inline-block ${colors[color]}`}>
      {children}
    </span>
  );
};
