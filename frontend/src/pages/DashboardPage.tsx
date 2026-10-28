import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Layers, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome header banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Session Authenticated
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome, <span className="text-brand-600">{user?.email || 'Scholar'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Your institutional access is active via secure Spring Security HTTP session.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/discover">
              <Button variant="secondary" size="sm" leftIcon={<Layers className="h-4 w-4" />}>
                Browse Resources
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Domain Status Information Banner */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-slate-700 space-y-1">
          <p className="font-semibold text-slate-900">
            Phase 2 Authentication Complete — Core Domain Modules Ahead
          </p>
          <p className="text-slate-600 leading-relaxed">
            Your login session has been established directly with the Spring Boot backend (`JSESSIONID` cookie and `XSRF-TOKEN` CSRF protection). 
            Institution management (Phase 4), Resource operations (Phase 5), and Discovery (Phase 6) are prepared to integrate as their respective backend controllers are connected.
          </p>
        </div>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Institutions */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">My Institutions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect to your university, faculty, or laboratory. Manage departmental memberships and role authorizations.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Phase 4 Roadmap</span>
            <Link to="/institutions">
              <span className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>

        {/* Card 2: Shared Resources */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Equipment & Spaces</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              List shared 3D printers, testing suites, microscope benches, or reserve tools from fellow researchers.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Phase 5 Roadmap</span>
            <Link to="/discover">
              <span className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Explore <ExternalLink className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>

        {/* Card 3: Custody & Bookings */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-900">Active Bookings</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track reserved time slots, supervisor approvals, condition ratings, and return schedules.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Phase 6 Roadmap</span>
            <span className="text-xs font-medium text-slate-400">Pending Bookings API</span>
          </div>
        </div>
      </div>

      {/* Security Architecture Audit Details */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Active Security Guarantees
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <div className="font-semibold text-slate-700">Authentication</div>
            <div className="text-slate-500">HTTP-only `JSESSIONID` session cookie</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <div className="font-semibold text-slate-700">CSRF Strategy</div>
            <div className="text-slate-500">`XSRF-TOKEN` cookie & `X-XSRF-TOKEN` header</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <div className="font-semibold text-slate-700">Storage Security</div>
            <div className="text-slate-500">Zero sensitive credentials in `localStorage`</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
            <div className="font-semibold text-slate-700">Password Security</div>
            <div className="text-slate-500">BCrypt (cost factor 10) on backend</div>
          </div>
        </div>
      </div>
    </div>
  );
};
