import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  breadcrumbs?: Crumb[];
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, eyebrow, breadcrumbs, actions }) => (
  <header className="animate-fade-up space-y-3">
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-slate-500">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
                {crumb.href && !isLast ? (
                  <Link to={crumb.href} className="rounded transition-colors hover:text-brand-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'max-w-[16rem] truncate text-slate-700' : ''}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden />}
              </li>
            );
          })}
        </ol>
      </nav>
    )}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <div>{eyebrow}</div>}
        <h1 className="text-balance text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-pretty text-sm leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  </header>
);
