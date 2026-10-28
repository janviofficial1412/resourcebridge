import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, 
  Shield, 
  Lock, 
  Server, 
  Key, 
  LogOut, 
  Info,
  CheckCircle2,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    }
  };

  const userInitial = (user?.username || user?.fullName || 'U').charAt(0).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="h-7 w-7 text-brand-600" />
            User Profile & Session Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review your academic identity, verified credentials, and active session architecture.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Sign Out of Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-2xl border-2 border-brand-200 shadow-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-900 truncate">
                {user?.fullName || `@${user?.username}`}
              </h2>
              <p className="text-xs font-semibold text-brand-600 font-mono">
                @{user?.username}
              </p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                <span>Session Active</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                <UserIcon className="h-3.5 w-3.5" />
                Username
              </span>
              <span className="font-semibold text-slate-800 font-mono text-sm">
                {user?.username}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-medium flex items-center gap-1.5 mb-0.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </span>
              <span className="font-semibold text-slate-800 break-all">
                {user?.email || (
                  <span className="text-slate-400 font-normal italic">
                    Not provided (Optional)
                  </span>
                )}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-0.5">Full Name</span>
              <span className="font-semibold text-slate-800">
                {user?.fullName || 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 font-medium block mb-0.5">User ID</span>
              <span className="font-semibold text-slate-800 font-mono text-[11px]">
                {user?.id || 'Active Session User'}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Architecture Guarantees */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Active Session Architecture
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Server className="h-3.5 w-3.5 text-brand-600" />
                  <span>Stateful Session</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Authenticated via Tomcat <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">JSESSIONID</code> HTTP-only cookie. No stateless JWTs used.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Key className="h-3.5 w-3.5 text-amber-600" />
                  <span>CSRF Guard</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  CookieCsrfTokenRepository validates <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">XSRF-TOKEN</code> on all state-mutating requests.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Lock className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Credential Hygiene</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Zero session secrets or passwords in <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">localStorage</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Session Restoration</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">GET /api/auth/me</code> automatically re-hydrates authenticated profile on page reload.
                </p>
              </div>
            </div>
          </div>

          {/* Session Restoration Notice */}
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-5 flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1.5">
              <p className="font-semibold text-slate-900">
                Phase 4 Complete: Username Authentication & Session Verification
              </p>
              <p className="text-slate-600 leading-relaxed">
                Login and registration use unique normalized usernames. The backend exposes <code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono text-slate-800">GET /api/auth/me</code>, which is queried on initial application mount to restore user state across browser tab refreshes without insecure local token persistence.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
