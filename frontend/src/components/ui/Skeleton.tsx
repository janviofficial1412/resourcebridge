import React from 'react';
import { clsx } from 'clsx';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('skeleton', className)} aria-hidden="true" />
);

export const CardGridSkeleton: React.FC<{ count?: number; label?: string }> = ({ count = 6, label = 'Loading…' }) => (
  <div role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface overflow-hidden">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number; label?: string }> = ({ count = 3, label = 'Loading…' }) => (
  <div role="status" aria-live="polite" className="space-y-4">
    <span className="sr-only">{label}</span>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="surface flex gap-4 p-5">
        <Skeleton className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);
