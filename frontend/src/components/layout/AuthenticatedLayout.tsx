import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Menu, X, Layers, Compass, User as UserIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export const AuthenticatedLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Close mobile sidebar upon route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidebarOpen]);

  // Derive human-readable page title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Your workspace';
    if (path.startsWith('/discover') || path.startsWith('/resources/')) return 'Discover resources';
    if (path.startsWith('/my-resources')) return 'My Resources';
    if (path.startsWith('/institutions')) return 'Institutions';
    if (path.startsWith('/bookings/incoming')) return 'Incoming requests';
    if (path.startsWith('/bookings')) return 'My bookings';
    if (path.startsWith('/profile')) return 'Your profile';
    return 'ResourceBridge';
  };

  return (
    <div className="min-h-screen flex bg-[#faf9f6] text-slate-800">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-800 focus:text-white focus:rounded-lg focus:shadow-md focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar (Fixed Left) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-sm">
        <Sidebar className="w-64 h-full" />
      </div>

      {/* Mobile Drawer Backdrop & Sliding Panel */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#f7f6f1] shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-white hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close navigation drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar onNavigate={() => setMobileSidebarOpen(false)} className="h-full border-r-0" />
          </div>
        </div>
      )}

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b border-[#e7e5df] bg-[#faf9f6]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile brand (shown only on small screens) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-white">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-slate-900">ResourceBridge</span>
            </div>

            {/* Desktop page breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-400">Workspace</span>
              <span className="text-slate-300">/</span>
              <p className="font-semibold text-slate-900">{getPageTitle()}</p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <Link to="/discover">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                leftIcon={<Compass className="h-3.5 w-3.5" />}
              >
                Discover resources
              </Button>
            </Link>

            {/* User Session Quick Badge */}
            <Link to="/profile" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <UserIcon className="h-3.5 w-3.5 text-brand-600 hidden sm:inline" />
              <span className="max-w-[140px] truncate font-medium text-xs">
                {user?.username ? `@${user.username}` : 'User'}
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
