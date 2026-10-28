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

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  variant = 'error',
  onDismiss,
  className,
}) => {
  const styles = {
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />,
      closeBtn: 'text-red-500 hover:bg-red-100',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />,
      closeBtn: 'text-amber-500 hover:bg-amber-100',
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
      closeBtn: 'text-blue-500 hover:bg-blue-100',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />,
      closeBtn: 'text-emerald-500 hover:bg-emerald-100',
    },
  };

  const current = styles[variant];

  return (
    <div
      role="alert"
      className={twMerge(
        clsx(
          'p-3.5 rounded-lg border text-xs sm:text-sm flex items-start gap-2.5 transition-all',
          current.container,
          className
        )
      )}
    >
      {current.icon}
      <div className="flex-grow space-y-0.5">
        {title && <p className="font-semibold text-slate-900">{title}</p>}
        <p className="leading-relaxed">{message}</p>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={twMerge(
            clsx(
              'p-1 -mr-1 -mt-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
              current.closeBtn
            )
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};
