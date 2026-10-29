import React from 'react';
import { clsx } from 'clsx';

export const LogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" className={clsx('h-9 w-9', className)} aria-hidden="true">
    <rect width="32" height="32" rx="9" className="fill-brand-700" />
    <path d="M6 21.5c3-6.2 6.4-9.3 10-9.3s7 3.1 10 9.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M6 21.5h20" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 21.5v-4.6M16 21.5v-7.2M21 21.5v-4.6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
    <circle cx="16" cy="9.2" r="2.1" className="fill-accent-400" />
  </svg>
);

export const Logo: React.FC<{ className?: string; tone?: 'dark' | 'light'; subtitle?: string }> = ({
  className,
  tone = 'dark',
  subtitle,
}) => (
  <span className={clsx('flex items-center gap-2.5', className)}>
    <LogoMark />
    <span className="flex flex-col leading-none">
      <span className={clsx('font-display text-[17px] font-semibold tracking-tight', tone === 'dark' ? 'text-slate-900' : 'text-white')}>
        ResourceBridge
      </span>
      {subtitle && (
        <span className={clsx('mt-1 text-[11px] font-medium', tone === 'dark' ? 'text-slate-500' : 'text-brand-100/80')}>{subtitle}</span>
      )}
    </span>
  </span>
);
