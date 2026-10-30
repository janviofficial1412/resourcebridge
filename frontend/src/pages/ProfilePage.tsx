import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck, 
  Shield, 
  Lock, 
  LogOut, 
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
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="h-7 w-7 text-brand-600" />
            Your profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review the account details associated with your campus community.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          isLoading={isLoggingOut}
          leftIcon={<LogOut className="h-4 w-4" />}
        >
          Sign out
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white border border-[#e7e5df] rounded-2xl p-6 shadow-sm space-y-6">
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
                <span>Signed in</span>
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

          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Your account, kept secure
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#f7f6f1] rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <UserCheck className="h-3.5 w-3.5 text-brand-600" />
                  <span>Protected sign-in</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Your account is available only after you sign in with your credentials.
                </p>
              </div>

              <div className="p-4 bg-[#f7f6f1] rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Shield className="h-3.5 w-3.5 text-brand-600" />
                  <span>Safer account actions</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Account changes use additional protections to help prevent actions you did not intend.
                </p>
              </div>

              <div className="p-4 bg-[#f7f6f1] rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Lock className="h-3.5 w-3.5 text-brand-600" />
                  <span>Your credentials stay private</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Passwords and sign-in details are not shown in your profile.
                </p>
              </div>

              <div className="p-4 bg-[#f7f6f1] rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                  <span>Pick up where you left off</span>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  Your sign-in is remembered securely as you move between pages.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
