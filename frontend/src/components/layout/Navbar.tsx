import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LogOut, LayoutDashboard } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  label: string;
  path: string;
}

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate('/login');
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
    }
  };

  const navLinks: NavLinkItem[] = isAuthenticated
    ? [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Discover', path: '/discover' },
        { label: 'Institutions', path: '/institutions' },
      ]
    : [
        { label: 'How it works', path: '/#how-it-works' },
        { label: 'Discover', path: '/discover' },
        { label: 'Institutions', path: '/institutions' },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="rounded-lg" aria-label="ResourceBridge home">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={clsx(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white text-brand-800 shadow-xs ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" tabIndex={-1}>
                  <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="h-4 w-4" />}>
                    Open workspace
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} isLoading={isLoggingOut} leftIcon={<LogOut className="h-4 w-4" />}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" tabIndex={-1}>
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register" tabIndex={-1}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="-mr-2 rounded-lg p-2 text-slate-700 hover:bg-white md:hidden"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="space-y-1 border-t border-slate-200 bg-white px-4 pb-5 pt-3 animate-fade-up md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              aria-current={location.pathname === link.path ? 'page' : undefined}
              className="block rounded-xl px-3 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
            {isAuthenticated ? (
              <Button variant="secondary" className="w-full" onClick={handleLogout} isLoading={isLoggingOut} leftIcon={<LogOut className="h-4 w-4" />}>
                Sign out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} tabIndex={-1}>
                  <Button variant="secondary" className="w-full">Sign in</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} tabIndex={-1}>
                  <Button variant="primary" className="w-full">Create an account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
