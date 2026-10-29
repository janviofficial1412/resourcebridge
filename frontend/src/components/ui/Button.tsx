import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles =
  'group/button inline-flex items-center justify-center font-semibold transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 active:scale-[0.97] select-none whitespace-nowrap';

const variants = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 shadow-xs border border-brand-800/40',
  accent:
    'bg-accent-600 text-white hover:bg-accent-700 shadow-xs border border-accent-700/40 focus-visible:ring-accent-500',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 shadow-xs',
  outline:
    'border border-brand-600 text-brand-700 hover:bg-brand-50',
  ghost:
    'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-xs border border-rose-700/40 focus-visible:ring-rose-500',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs border border-emerald-700/40 focus-visible:ring-emerald-500',
};

const sizes = {
  sm: 'text-xs h-9 px-3 rounded-lg gap-1.5',
  md: 'text-sm h-10 px-4 rounded-xl gap-2',
  lg: 'text-base h-12 px-6 rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-current" aria-hidden /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex transition-transform duration-150 group-hover/button:translate-x-0.5">
          {rightIcon}
        </span>
      )}
    </button>
  );
};
