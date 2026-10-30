import React from 'react';
import { HelpCircle } from 'lucide-react';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  status?: 'active' | 'unavailable' | 'pending';
  badgeText?: string;
  helpText?: string;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  description,
  status = 'pending',
  badgeText,
  helpText,
  className = '',
}) => {
  const getStatusBadge = () => {
    if (badgeText) {
      const styles = {
        active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        unavailable: 'bg-rose-50 text-rose-700 border-rose-200',
        pending: 'bg-amber-50 text-amber-700 border-amber-200',
      }[status];

      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${styles}`}
        >
          {badgeText}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-white border border-[#e7e5df] rounded-2xl p-5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-md flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
          {getStatusBadge()}
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {helpText && (
        <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-400">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{helpText}</span>
        </div>
      )}
    </div>
  );
};
