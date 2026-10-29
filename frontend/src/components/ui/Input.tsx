import React, { InputHTMLAttributes, useState, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, type = 'text', className, id, disabled, required, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
            {required && <span className="ml-1 text-accent-600" aria-hidden="true">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={twMerge(
              clsx(
                'field',
                leftIcon && 'pl-10',
                isPassword && 'pr-11',
                error && 'border-rose-300 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-rose-100',
                className
              )
            )}
            {...props}
          />

          {isPassword && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 hover:text-slate-700 focus-visible:text-slate-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {error ? (
          <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 animate-fade-in" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
