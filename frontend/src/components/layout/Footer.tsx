import React from 'react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';

export const Footer: React.FC<{ variant?: 'full' | 'compact' }> = ({ variant = 'full' }) => {
  const { isAuthenticated } = useAuth();
  const year = new Date().getFullYear();

  if (variant === 'compact') {
    return (
      <footer className="border-t border-slate-200/80 bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:px-6 lg:px-8">
          <p>&copy; {year} ResourceBridge</p>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link to="/discover" className="hover:text-brand-700">Discover</Link>
            <Link to="/bookings" className="hover:text-brand-700">Bookings</Link>
            <Link to="/institutions" className="hover:text-brand-700">Institutions</Link>
            <Link to="/profile" className="hover:text-brand-700">Profile</Link>
          </nav>
        </div>
      </footer>
    );
  }

  const columns = [
    {
      heading: 'Platform',
      links: [
        { label: 'Discover resources', to: '/discover' },
        { label: 'Institutions', to: '/institutions' },
        { label: 'How it works', to: '/#how-it-works' },
      ],
    },
    {
      heading: isAuthenticated ? 'Your workspace' : 'Account',
      links: isAuthenticated
        ? [
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'My bookings', to: '/bookings' },
            { label: 'My resources', to: '/my-resources' },
          ]
        : [
            { label: 'Sign in', to: '/login' },
            { label: 'Create an account', to: '/register' },
          ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className={clsx('grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4')}>
          <div className="space-y-4 lg:col-span-2">
            <Logo />
            <p className="max-w-sm text-sm leading-relaxed text-slate-500">
              A shared catalogue of equipment, labs, and spaces for universities and research institutions, so good resources get used.
            </p>
          </div>
          {columns.map((column) => (
            <div key={column.heading}>
              <h2 className="eyebrow mb-4 font-sans">{column.heading}</h2>
              <ul className="space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className="text-slate-600 transition-colors hover:text-brand-700">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>&copy; {year} ResourceBridge. All rights reserved.</p>
          <p>Built for universities, labs, and research communities.</p>
        </div>
      </div>
    </footer>
  );
};
