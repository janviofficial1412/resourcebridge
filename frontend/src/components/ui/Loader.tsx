import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface LoaderProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  label = 'Loading...',
  size = 'md',
  fullScreen = false,
  className,
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const content = (
    <div
      role="status"
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center gap-3 text-slate-500',
          className
        )
      )}
    >
      <Loader2
        className={twMerge(
          clsx('animate-spin text-brand-600', sizes[size])
        )}
      />
      {label && <p className="text-xs font-medium text-slate-600">{label}</p>}
      <span className="sr-only">{label}</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
