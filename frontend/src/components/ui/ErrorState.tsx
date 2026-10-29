import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/60 p-8 text-center animate-fade-up sm:p-10 ${className}`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-xs ring-1 ring-rose-200">
        <AlertCircle className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="mb-1 text-base font-semibold text-rose-900">{title}</h2>
      <p className="mb-5 max-w-md text-sm leading-relaxed text-rose-800/90">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
          Try again
        </Button>
      )}
    </div>
  );
};
