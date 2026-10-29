import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeTone = 'neutral' | 'brand' | 'accent' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const toneStyles: Record<BadgeTone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  brand: { badge: 'bg-brand-50 text-brand-800 ring-brand-200', dot: 'bg-brand-500' },
  accent: { badge: 'bg-accent-50 text-accent-800 ring-accent-200', dot: 'bg-accent-500' },
  success: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  warning: { badge: 'bg-amber-50 text-amber-900 ring-amber-200', dot: 'bg-amber-500' },
  danger: { badge: 'bg-rose-50 text-rose-800 ring-rose-200', dot: 'bg-rose-500' },
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', icon, dot, children, className }) => (
  <span
    className={twMerge(
      clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset [&_svg]:h-3.5 [&_svg]:w-3.5',
        toneStyles[tone].badge,
        className
      )
    )}
  >
    {dot && <span className={clsx('h-1.5 w-1.5 rounded-full', toneStyles[tone].dot)} aria-hidden />}
    {icon}
    {children}
  </span>
);

const humanize = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const BOOKING_TONES: Record<string, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'neutral',
};

export const BookingStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <Badge tone={BOOKING_TONES[status] ?? 'neutral'} dot className={className}>
    {status === 'PENDING' ? 'Awaiting approval' : humanize(status)}
  </Badge>
);

const RESOURCE_STATUS_TONES: Record<string, BadgeTone> = {
  AVAILABLE: 'success',
  ACTIVE: 'success',
  MAINTENANCE: 'warning',
  UNDER_MAINTENANCE: 'warning',
  UNAVAILABLE: 'danger',
  RETIRED: 'neutral',
  INACTIVE: 'neutral',
};

export const ResourceStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => (
  <Badge tone={RESOURCE_STATUS_TONES[status] ?? 'neutral'} dot className={className}>
    {humanize(status)}
  </Badge>
);

const CONDITION_TONES: Record<string, BadgeTone> = {
  EXCELLENT: 'success',
  NEW: 'success',
  GOOD: 'brand',
  FAIR: 'warning',
  POOR: 'danger',
  NEEDS_REPAIR: 'danger',
};

export const ConditionBadge: React.FC<{ condition: string; className?: string }> = ({ condition, className }) => (
  <Badge tone={CONDITION_TONES[condition] ?? 'neutral'} className={className}>
    {humanize(condition)} condition
  </Badge>
);

export const TypeBadge: React.FC<{ type: string; className?: string }> = ({ type, className }) => (
  <span
    className={twMerge(
      clsx('inline-flex items-center rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm', className)
    )}
  >
    {humanize(type)}
  </span>
);

export const RoleBadge: React.FC<{ role: string; className?: string }> = ({ role, className }) => (
  <Badge tone={role === 'ADMIN' ? 'accent' : 'brand'} className={className}>
    {humanize(role)}
  </Badge>
);

export { humanize };
