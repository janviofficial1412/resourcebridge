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

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Loader: React.FC<LoaderProps> = ({ label = 'Loading…', size = 'md', fullScreen = false, className }) => {
  const content = (
    <div
      role="status"
      aria-live="polite"
      className={twMerge(clsx('flex flex-col items-center justify-center gap-3 text-slate-500 animate-fade-in', className))}
    >
      <span className="relative flex items-center justify-center">
        <span className={clsx('absolute rounded-full bg-brand-100', size === 'lg' ? 'h-14 w-14' : size === 'md' ? 'h-10 w-10' : 'h-7 w-7')} aria-hidden />
        <Loader2 className={clsx('relative animate-spin text-brand-700', sizes[size])} aria-hidden />
      </span>
      {label && <p className="text-xs font-medium text-slate-600">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-[50vh] items-center justify-center">{content}</div>;
  }
  return content;
};
