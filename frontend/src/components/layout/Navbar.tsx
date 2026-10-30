import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  Menu,
  X,
  ArrowRight,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Compass,
  Building2,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      setMobileMenuOpen(false);
    }
  };

  const authenticatedLinks: NavLinkItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="h-3.5 w-3.5" /> },
    { label: 'Institutions', path: '/institutions', icon: <Building2 className="h-3.5 w-3.5" /> },
    { label: 'My Resources', path: '/my-resources', icon: <Briefcase className="h-3.5 w-3.5" /> },
    { label: 'Profile', path: '/profile', icon: <UserCheck className="h-3.5 w-3.5" /> },
  ];

  const publicLinks: NavLinkItem[] = [
    { label: 'Explore Resources', path: '/discover' },
    { label: 'Institutions', path: '/institutions' },
    { label: 'How it works', path: '/#how-it-works' },
  ];

  const navLinks: NavLinkItem[] = isAuthenticated ? authenticatedLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 border-b border-[#e7e5df] bg-[#faf9f6]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] items-center justify-between">
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="group flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm transition-colors group-hover:bg-brand-700">
              <Layers className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1.5 font-semibold leading-tight tracking-tight text-slate-900">
                ResourceBridge
              </span>
              <span className="text-[11px] font-medium text-slate-500">A campus resource network</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path === '/discover' && location.pathname.startsWith('/resources/'));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isActive ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-slate-600'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  title="View Profile and Session"
                >
                  <UserIcon className="h-3.5 w-3.5 text-brand-600" />
                  <span className="max-w-[150px] truncate">
                    {user?.username ? `@${user.username}` : user?.fullName || 'User'}
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  isLoading={isLoggingOut}
                  leftIcon={<LogOut className="h-3.5 w-3.5 text-slate-500" />}
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 shadow-lg shadow-slate-900/5">
          <nav className="space-y-1" aria-label="Mobile navigation">
          {isAuthenticated && user && (
            <div className="p-3 mb-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-400 block font-normal">Signed in as</span>
              <span className="font-semibold text-slate-800 break-all">
                @{user.username} {user.fullName && `(${user.fullName})`}
              </span>
            </div>
          )}

          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                      ? 'bg-brand-50 text-brand-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
          </nav>

          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={handleLogout}
                isLoading={isLoggingOut}
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out
              </Button>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="secondary" className="w-full justify-center">
                    Log in
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="w-full">
                  <Button variant="primary" className="w-full justify-center">
                    Create Account
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
