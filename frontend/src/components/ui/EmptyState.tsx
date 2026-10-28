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
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 ${className}`}
    >
      <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm mb-4">
        {icon}
      </div>

      {badgeText && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 mb-2">
          {badgeText}
        </span>
      )}

      <h3 className="text-base font-semibold text-slate-900 tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && actionHref && (
          <Link to={actionHref}>
            <Button variant="primary" size="sm">
              {actionLabel}
            </Button>
          </Link>
        )}

        {actionLabel && onAction && !actionHref && (
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};
