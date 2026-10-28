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
    if (path.startsWith('/dashboard')) return 'Dashboard Overview';
    if (path.startsWith('/discover')) return 'Resource Discovery';
    if (path.startsWith('/my-resources')) return 'My Resources';
    if (path.startsWith('/institutions')) return 'Partner Institutions';
    if (path.startsWith('/profile')) return 'Profile & Security';
    return 'ResourceBridge';
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg focus:shadow-md focus:outline-none"
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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col z-50">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Mobile brand (shown only on small screens) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="h-7 w-7 rounded-md bg-brand-600 text-white flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <span className="font-bold text-slate-900 text-sm">ResourceBridge</span>
            </div>

            {/* Desktop page breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium">Platform</span>
              <span className="text-slate-300">/</span>
              <h1 className="font-semibold text-slate-900">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <Link to="/discover">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex text-xs"
                leftIcon={<Compass className="h-3.5 w-3.5" />}
              >
                Explore Catalog
              </Button>
            </Link>

            {/* User Session Quick Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <UserIcon className="h-3.5 w-3.5 text-brand-600 hidden sm:inline" />
              <span className="max-w-[140px] truncate font-medium text-xs">
                {user?.username ? `@${user.username}` : 'User'}
              </span>
            </div>
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
