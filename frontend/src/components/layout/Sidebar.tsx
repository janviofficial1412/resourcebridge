import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Briefcase,
  Building2,
  UserCheck,
  Layers,
  LogOut,
  ChevronRight,
  CalendarCheck,
  Inbox,
  FileText,
  Users,
  Settings,
  SearchCheck,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { institutionService } from '../../features/institutions/institutionService';

export interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [hasAdminMembership, setHasAdminMembership] = useState(false);
  const [adminInstitutionId, setAdminInstitutionId] = useState<string | null>(null);
  const [memberInstitutionId, setMemberInstitutionId] = useState<string | null>(null);
  const [membershipLoadError, setMembershipLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    institutionService.listMyInstitutions()
      .then((institutions) => {
        if (active) {
          const admin = institutions.find((institution) => institution.role === 'ADMIN');
          const member = institutions.find((institution) => institution.role === 'MEMBER');
          setHasAdminMembership(Boolean(admin));
          setAdminInstitutionId(admin?.id ?? null);
          setMemberInstitutionId(member?.id ?? null);
          setMembershipLoadError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setHasAdminMembership(false);
          setMembershipLoadError(cause instanceof Error
            ? cause.message
            : 'Could not load institution permissions.');
        }
      });
    return () => {
      active = false;
    };
  }, []);

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
    ...(hasAdminMembership ? [
      { label: 'Resources', path: '/my-resources', icon: <Briefcase className="h-4 w-4" /> },
      { label: 'Booking Requests', path: '/bookings/incoming', icon: <Inbox className="h-4 w-4" /> },
      { label: 'Matching', path: '/discover#matching', icon: <SearchCheck className="h-4 w-4" /> },
      ...(adminInstitutionId ? [
        { label: 'Incident Reports', path: `/institutions/${adminInstitutionId}#incidents`, icon: <FileText className="h-4 w-4" /> },
        { label: 'Students', path: `/institutions/${adminInstitutionId}#members`, icon: <Users className="h-4 w-4" /> },
        { label: 'Institution Settings', path: `/institutions/${adminInstitutionId}#settings`, icon: <Settings className="h-4 w-4" /> },
      ] : []),
      { label: 'Institutions', path: '/institutions', icon: <Building2 className="h-4 w-4" /> },
    ] : []),
    ...(memberInstitutionId ? [
      { label: 'Discover Resources', path: '/discover', icon: <Compass className="h-4 w-4" /> },
      { label: 'Find Matches', path: '/discover#matching', icon: <SearchCheck className="h-4 w-4" /> },
      { label: 'My Bookings', path: '/bookings', icon: <CalendarCheck className="h-4 w-4" /> },
      ...(memberInstitutionId ? [
        { label: 'Report Incident', path: `/institutions/${memberInstitutionId}#incident-report-text`, icon: <FileText className="h-4 w-4" /> },
        { label: 'My Reports', path: `/institutions/${memberInstitutionId}#my-reports`, icon: <ClipboardList className="h-4 w-4" /> },
      ] : []),
    ] : []),
    ...(hasAdminMembership || memberInstitutionId
      ? []
      : [{ label: 'Institutions', path: '/institutions', icon: <Building2 className="h-4 w-4" /> }]),
    {
      label: 'Your profile',
      path: '/profile',
      icon: <UserCheck className="h-4 w-4" />,
    },
  ];

  const userInitial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <aside
      className={`flex h-full flex-col border-r border-[#e7e5df] bg-[#f7f6f1] text-slate-700 ${className}`}
      aria-label="Application sidebar navigation"
    >
      {/* Brand Logo Header */}
      <div className="flex h-[4.5rem] items-center border-b border-[#e7e5df] px-5">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-800 text-white shadow-sm">
            <Layers className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">ResourceBridge</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Campus resource network</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6" aria-label="Main menu">
        <div className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
          Workspace
        </div>
        {membershipLoadError && (
          <p role="alert" className="mx-2 mb-3 rounded-lg bg-rose-50 px-2.5 py-2 text-[11px] text-rose-700">
            {membershipLoadError}
          </p>
        )}

        {navItems.map((item) => {
          const [itemPath, itemHash] = item.path.split('#');
          const isActive = (location.pathname === itemPath
            && (itemHash ? location.hash === `#${itemHash}` : !location.hash)) ||
            (item.path === '/discover' && location.pathname.startsWith('/resources/')) ||
            (itemPath === '/institutions' && location.pathname.startsWith('/institutions/'));

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                isActive
                  ? 'bg-white text-brand-800 font-semibold shadow-sm ring-1 ring-brand-100'
                  : 'text-slate-600 hover:bg-white/70 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {isActive ? (
                <ChevronRight className="h-3.5 w-3.5 text-brand-500" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Sign Out */}
      <div className="border-t border-[#e7e5df] p-3">
        <Link to="/profile" onClick={onNavigate} className="mb-2 flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate" title={user?.fullName || user?.username}>
                {user?.fullName || `@${user?.username}`}
              </p>
              <p className="text-[10px] text-slate-400 truncate" title={user?.username ? `@${user.username}` : ''}>
                {user?.username ? `@${user.username}` : ''}
              </p>
            </div>
          </div>
        </Link>

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
