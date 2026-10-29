import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Compass, Briefcase, Building2, UserCircle2, LogOut, CalendarCheck, Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../ui/Logo';

export interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  exact?: boolean;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Explore',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-[18px] w-[18px]" /> },
      { label: 'Discover', path: '/discover', icon: <Compass className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    heading: 'Bookings',
    items: [
      { label: 'My bookings', path: '/bookings', icon: <CalendarCheck className="h-[18px] w-[18px]" />, exact: true },
      { label: 'Incoming requests', path: '/bookings/incoming', icon: <Inbox className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    heading: 'Manage',
    items: [
      { label: 'My resources', path: '/my-resources', icon: <Briefcase className="h-[18px] w-[18px]" /> },
      { label: 'Institutions', path: '/institutions', icon: <Building2 className="h-[18px] w-[18px]" /> },
      { label: 'Profile', path: '/profile', icon: <UserCircle2 className="h-[18px] w-[18px]" /> },
    ],
  },
];

const isPathActive = (pathname: string, item: NavItem) => {
  if (item.exact) return pathname === item.path;
  if (item.path === '/my-resources') return pathname === item.path || pathname.startsWith('/resources/');
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
};

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
      onNavigate?.();
    }
  };

  const userInitial = (user?.fullName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <aside className={clsx('flex h-full flex-col bg-brand-950 text-brand-100', className)} aria-label="Application sidebar">
      <div className="flex h-16 items-center px-5">
        <Link to="/dashboard" onClick={onNavigate} className="rounded-lg focus-visible:ring-offset-brand-950">
          <Logo tone="light" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main menu">
        {NAV_GROUPS.map((group) => (
          <div key={group.heading}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-300/60">{group.heading}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = isPathActive(location.pathname, item);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={isActive ? 'page' : undefined}
                      className={clsx(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus-visible:ring-offset-brand-950',
                        isActive ? 'bg-white/10 text-white' : 'text-brand-100/75 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span
                        className={clsx(
                          'absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-400 transition-all duration-200',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                        aria-hidden
                      />
                      <span className={clsx('transition-colors', isActive ? 'text-accent-300' : 'text-brand-300/70 group-hover:text-brand-100')}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5 focus-visible:ring-offset-brand-950"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-500 font-display text-sm font-semibold text-white">
            {userInitial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{user?.fullName || user?.username}</span>
            {user?.username && <span className="block truncate text-xs text-brand-200/70">@{user.username}</span>}
          </span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-brand-100/75 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-60 focus-visible:ring-offset-brand-950"
        >
          <LogOut className="h-[18px] w-[18px] text-brand-300/70" aria-hidden />
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
};
