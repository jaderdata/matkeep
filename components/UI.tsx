
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-none shadow-[var(--shadow-sm)] hover-lift transition-ui ${className}`} {...props}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ children, variant = 'primary', className, ...props }) => {
  const variants = {
    primary: 'bg-[var(--accent-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent-hover)] hover:shadow-lg hover:-translate-y-0.5',
    secondary: 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] hover:shadow-md',
    danger: 'bg-red-600/90 text-white hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 shadow-sm'
  };

  return (
    <button
      className={`px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-ui rounded-none disabled:opacity-50 active:scale-95 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string; helperText?: string }> = ({ label, helperText, className, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1 w-full group">
      {label && <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest group-focus-within:text-[var(--text-primary)] transition-ui">{label}</label>}
      <div className="relative">
        <input
          type={inputType}
          className={`bg-[var(--bg-card)] border border-[var(--border-color)] p-3 text-sm focus:outline-none focus:border-[var(--text-primary)] focus:ring-1 focus:ring-[var(--text-primary)]/20 rounded-none w-full transition-ui placeholder:text-[var(--text-secondary)] shadow-sm ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-ui"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {helperText && <p className="text-[9px] text-[var(--text-secondary)] italic uppercase font-bold tracking-tighter">{helperText}</p>}
    </div>
  );
};

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }> = ({ label, options, className, ...props }) => (
  <div className="flex flex-col gap-1 w-full group">
    {label && <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest group-focus-within:text-[var(--text-primary)] transition-ui">{label}</label>}
    <select
      className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 text-sm focus:outline-none focus:border-[var(--text-primary)] rounded-none text-[var(--text-primary)] transition-ui cursor-pointer ${className}`}
      {...props}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[var(--bg-secondary)]">{opt.label}</option>
      ))}
    </select>
  </div>
);

export const Badge: React.FC<{ color: 'green' | 'yellow' | 'red' | 'gray' | 'blue'; children: React.ReactNode }> = ({ color, children }) => {
  const colors = {
    green: 'bg-green-500/10 text-green-500 border-green-500/20',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    red: 'bg-red-500/10 text-red-500 border-red-500/20',
    gray: 'bg-gray-500/10 text-[var(--text-secondary)] border-gray-500/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  };

  return (
    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border rounded-none inline-block transition-ui ${colors[color]}`}>
      {children}
    </span>
  );
};

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
  <div className="flex items-center gap-3 group">
    <div className="relative flex items-center">
      <input
        type="checkbox"
        id={id}
        className="w-5 h-5 border-[var(--border-color)] rounded-none bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)] transition-ui cursor-pointer"
        {...props}
      />
    </div>
    <label htmlFor={id} className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest cursor-pointer group-hover:text-[var(--text-primary)] transition-ui">
      {label}
    </label>
  </div>
);
