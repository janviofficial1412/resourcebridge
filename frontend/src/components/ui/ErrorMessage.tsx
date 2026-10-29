import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
  className?: string;
}

const styles = {
  error: {
    container: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden />,
    title: 'text-rose-900',
    closeBtn: 'text-rose-500 hover:bg-rose-100',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />,
    title: 'text-amber-950',
    closeBtn: 'text-amber-600 hover:bg-amber-100',
  },
  info: {
    container: 'bg-brand-50 border-brand-200 text-brand-900',
    icon: <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />,
    title: 'text-brand-950',
    closeBtn: 'text-brand-600 hover:bg-brand-100',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />,
    title: 'text-emerald-950',
    closeBtn: 'text-emerald-600 hover:bg-emerald-100',
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ title, message, variant = 'error', onDismiss, className }) => {
  const current = styles[variant];
  return (
    <div
      role={variant === 'error' || variant === 'warning' ? 'alert' : 'status'}
      className={twMerge(clsx('flex items-start gap-3 rounded-xl border p-3.5 text-sm animate-fade-up', current.container, className))}
    >
      {current.icon}
      <div className="flex-grow space-y-0.5">
        {title && <p className={clsx('font-semibold', current.title)}>{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={clsx('-mr-1 -mt-1 rounded-lg p-1.5 transition-colors', current.closeBtn)}
          aria-label="Dismiss message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
