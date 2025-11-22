import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- 3D CARD ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  noPadding?: boolean;
}

export const Card3D: React.FC<CardProps> = ({ children, className = '', onClick, noPadding = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white 
        border-2 border-slate-900 
        rounded-2xl 
        shadow-3d 
        transition-all duration-200
        ${onClick ? 'cursor-pointer active:translate-y-1 active:shadow-3d-active hover:shadow-3d-hover' : ''}
        ${noPadding ? '' : 'p-5'}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// --- 3D BUTTON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button3D: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  loading,
  ...props 
}) => {
  
  const baseStyles = "relative inline-flex items-center justify-center font-bold rounded-xl border-2 border-slate-900 transition-all duration-100 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-indigo-600 text-white shadow-[0_6px_0_#312e81] hover:bg-indigo-500",
    secondary: "bg-white text-slate-900 shadow-[0_6px_0_#cbd5e1] hover:bg-slate-50",
    danger: "bg-rose-500 text-white shadow-[0_6px_0_#9f1239] hover:bg-rose-400",
    success: "bg-emerald-500 text-white shadow-[0_6px_0_#065f46] hover:bg-emerald-400",
    ghost: "bg-transparent border-transparent shadow-none active:translate-y-0 text-slate-600 hover:bg-slate-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${props.disabled ? 'shadow-none translate-y-1' : ''} px-5 py-3`}
      {...props}
    >
      {loading ? (
        <span className="animate-spin mr-2">⏳</span>
      ) : Icon ? (
        <Icon size={20} className={children ? "mr-2" : ""} />
      ) : null}
      {children}
    </button>
  );
};

// --- INPUT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input3D: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      <label className="text-sm font-bold text-slate-700 mb-1 ml-1">{label}</label>
      <input 
        className={`
          w-full bg-white 
          border-2 border-slate-300 
          rounded-xl px-4 py-3 
          text-slate-900 font-medium
          placeholder-slate-400
          focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-indigo-100
          transition-colors
        `}
        {...props} 
      />
      {error && <span className="text-rose-600 text-xs mt-1 font-bold ml-1">{error}</span>}
    </div>
  );
};

// --- SELECT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string; label: string }[];
}

export const Select3D: React.FC<SelectProps> = ({ label, options, ...props }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-bold text-slate-700 mb-1 ml-1">{label}</label>
      <div className="relative">
        <select 
          className={`
            w-full bg-white appearance-none
            border-2 border-slate-300 
            rounded-xl px-4 py-3 
            text-slate-900 font-medium
            focus:outline-none focus:border-slate-900 focus:ring-2 focus:ring-indigo-100
            transition-colors
          `}
          {...props}
        >
          {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          ▼
        </div>
      </div>
    </div>
  );
};
