import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badgeText?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  badgeText,
  actionLabel,
  onAction,
  actionHref,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center animate-fade-up sm:p-12 ${className}`}
    >
      <div className="bridge-pattern pointer-events-none absolute inset-x-0 top-0 h-28 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 [&_svg]:text-brand-700">
        {icon}
      </div>

      {badgeText && (
        <span className="relative mb-3 inline-flex items-center rounded-full border border-accent-200 bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-800">
          {badgeText}
        </span>
      )}

      <h2 className="relative mb-1.5 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="relative mb-6 max-w-md text-sm leading-relaxed text-slate-500">{description}</p>

      <div className="relative flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref && (
          <Link to={actionHref} tabIndex={-1}>
            <Button variant="primary" size="md">
              {actionLabel}
            </Button>
          </Link>
        )}
        {actionLabel && onAction && !actionHref && (
          <Button variant="primary" size="md" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" size="md" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
