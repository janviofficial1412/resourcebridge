import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, X, Compass } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

const SECTION_TITLES: [string, string][] = [
  ['/dashboard', 'Dashboard'],
  ['/discover', 'Discover'],
  ['/bookings/incoming', 'Incoming requests'],
  ['/bookings', 'My bookings'],
  ['/my-resources', 'My resources'],
  ['/resources', 'Resource'],
  ['/institutions', 'Institutions'],
  ['/profile', 'Profile'],
];

export const AuthenticatedLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  const sectionTitle = SECTION_TITLES.find(([prefix]) => location.pathname.startsWith(prefix))?.[1] ?? 'ResourceBridge';
  const userInitial = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>

      <div className="z-30 hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar className="h-full w-64" />
      </div>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true" />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col shadow-2xl animate-slide-in-left">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute right-3 top-3.5 z-10 rounded-lg p-2 text-brand-100 hover:bg-white/10 focus-visible:ring-offset-brand-950"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} className="h-full" />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="-ml-2 rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
              aria-label="Open navigation menu"
              aria-expanded={mobileSidebarOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link to="/dashboard" className="rounded-lg lg:hidden" aria-label="ResourceBridge dashboard">
              <Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:flex" />
            </Link>
            <p className="hidden truncate font-display text-base font-semibold text-slate-900 lg:block">{sectionTitle}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {!location.pathname.startsWith('/discover') && (
              <Link to="/discover" tabIndex={-1} className="hidden sm:block">
                <Button variant="secondary" size="sm" leftIcon={<Compass className="h-4 w-4" />}>
                  Find resources
                </Button>
              </Link>
            )}
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
              aria-label="Your profile"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-500 font-display text-xs font-semibold text-white">
                {userInitial}
              </span>
              <span className="max-w-[120px] truncate text-xs">{user?.username ? `@${user.username}` : 'Profile'}</span>
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
        <Footer variant="compact" />
      </div>
    </div>
  );
};
