import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Building2,
  UserCheck,
  Layers,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'info' | 'roadmap';
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      if (onNavigate) {
        onNavigate();
      }
    }
  };

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: 'Discover Resources',
      path: '/discover',
      icon: <Compass className="h-4 w-4" />,
    },
    {
      label: 'My Resources',
      path: '/my-resources',
      icon: <Briefcase className="h-4 w-4" />,
      badge: 'Phase 5',
      badgeType: 'roadmap',
    },
    {
      label: 'Institutions',
      path: '/institutions',
      icon: <Building2 className="h-4 w-4" />,
      badge: 'Phase 4',
      badgeType: 'roadmap',
    },
    {
      label: 'Profile & Session',
      path: '/profile',
      icon: <UserCheck className="h-4 w-4" />,
    },
  ];

  const userInitial = (user?.fullName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-slate-200/90 text-slate-700 select-none ${className}`}
      aria-label="Application sidebar navigation"
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/80">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
        >
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm tracking-tight">ResourceBridge</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-brand-50 text-brand-700 border border-brand-200">
                SaaS
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Campus Exchange</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main menu">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge ? (
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                    item.badgeType === 'roadmap'
                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                      : 'bg-brand-50 text-brand-600 border-brand-200'
                  }`}
                >
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="h-3.5 w-3.5 text-brand-500" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Session Security Details Badge */}
      <div className="px-4 py-3 mx-3 my-2 rounded-lg bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 mb-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Spring Security Active</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Stateful <code className="bg-slate-200/60 px-1 py-0.5 rounded">JSESSIONID</code> & CSRF protected.
        </p>
      </div>

      {/* User Footer Profile & Sign Out */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white border border-slate-200 shadow-sm mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate" title={user?.fullName || user?.email}>
                {user?.fullName || user?.email || 'User'}
              </p>
              <p className="text-[10px] text-slate-400 truncate" title={user?.email}>
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-slate-600 hover:text-rose-600 hover:bg-rose-50"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<LogOut className="h-3.5 w-3.5" />}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
};
