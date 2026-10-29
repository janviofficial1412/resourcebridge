import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { clsx } from 'clsx';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  tone?: 'brand' | 'accent' | 'amber' | 'emerald';
  href?: string;
  isLoading?: boolean;
  className?: string;
}

const tones = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-100',
  accent: 'bg-accent-50 text-accent-700 ring-accent-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  description,
  tone = 'brand',
  href,
  isLoading = false,
  className = '',
}) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className={clsx('flex h-10 w-10 items-center justify-center rounded-xl ring-1', tones[tone])}>{icon}</div>
        {href && (
          <ArrowUpRight
            className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-5">
        <p className="eyebrow">{title}</p>
        {isLoading ? (
          <div className="skeleton mt-2 h-8 w-16" aria-hidden />
        ) : (
          <p className="mt-1 font-display text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
    </>
  );

  const classes = clsx('group flex flex-col p-5', href ? 'surface-interactive' : 'surface', className);

  if (href) {
    return (
      <Link to={href} className={classes} aria-label={`${title}: ${isLoading ? 'loading' : value}`}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
};
