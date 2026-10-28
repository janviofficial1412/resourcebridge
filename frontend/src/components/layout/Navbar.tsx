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
    { label: 'How It Works', path: '/#how-it-works' },
  ];

  const navLinks: NavLinkItem[] = isAuthenticated ? authenticatedLinks : publicLinks;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          >
            <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:bg-brand-700 transition-colors">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                ResourceBridge
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  Campus
                </span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Educational Resource Sharing</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-5" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? 'page' : undefined}
                  className={`text-xs sm:text-sm font-medium transition-colors hover:text-brand-600 flex items-center gap-1.5 px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isActive ? 'text-brand-600 font-semibold bg-brand-50/60' : 'text-slate-600'
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
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
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
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}

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
