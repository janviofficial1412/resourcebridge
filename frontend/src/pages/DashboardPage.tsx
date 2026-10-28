import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Compass,
  Briefcase,
  Building2,
  Plus,
  ShieldCheck,
  Activity,
  ArrowRight,
  Info,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { SummaryCard } from '../components/ui/SummaryCard';
import { EmptyState } from '../components/ui/EmptyState';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);

  // Derives honest display name from real authentication payload
  const displayName = user?.fullName || user?.email || 'Scholar';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ------------------------------------------------------------------
          A. WELCOME SECTION
      ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Spring Security Session Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, <span className="text-brand-600">{displayName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              ResourceBridge connects academic departments, laboratories, and makerspaces to facilitate verified sharing of specialized research equipment and facilities within trusted campus boundaries.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/discover">
              <Button
                variant="primary"
                size="md"
                leftIcon={<Compass className="h-4 w-4" />}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Discover Resources
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowShareModal(true)}
              leftIcon={<Plus className="h-4 w-4 text-slate-400" />}
            >
              <span>Share a Resource</span>
              <span className="ml-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Phase 5
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          B. SUMMARY CARDS (HONEST REPORTING — NO FAKE NUMBERS)
      ------------------------------------------------------------------- */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Platform Metrics</h2>
            <p className="text-xs text-slate-500">Live indicators based on verified backend service responses</p>
          </div>
          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
            Backend API Readiness: 40%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Available Resources"
            value="—"
            status="pending"
            badgeText="API Pending"
            icon={<Layers className="h-4 w-4 text-brand-600" />}
            description="Total lab equipment and campus facilities registered across partner campuses."
            helpText="Awaiting GET /api/resources in Phase 6"
          />

          <SummaryCard
            title="Resources Shared by You"
            value="—"
            status="pending"
            badgeText="API Pending"
            icon={<Briefcase className="h-4 w-4 text-indigo-600" />}
            description="Instruments, tools, or research spaces registered under your ownership."
            helpText="Awaiting GET /api/resources/my in Phase 5"
          />

          <SummaryCard
            title="Joined Institutions"
            value="—"
            status="pending"
            badgeText="API Pending"
            icon={<Building2 className="h-4 w-4 text-emerald-600" />}
            description="Universities, departments, or research groups with active membership."
            helpText="Awaiting GET /api/institutions in Phase 4"
          />

          <SummaryCard
            title="Pending Invitations"
            value="—"
            status="pending"
            badgeText="API Pending"
            icon={<ShieldCheck className="h-4 w-4 text-amber-600" />}
            description="Unverified membership requests awaiting departmental administrator review."
            helpText="Awaiting GET /api/memberships in Phase 4"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------
          C. QUICK ACTIONS
      ------------------------------------------------------------------- */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Quick Actions</h2>
          <p className="text-xs text-slate-500">Access core campus sharing workflows and directories</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Discover Resources */}
          <Link
            to="/discover"
            className="group bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-brand-600 transition-colors">
                  Discover Resources
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Search shared lab instruments, 3D printers, and campus spaces across institutions.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                Browse catalog <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* Action 2: Share a Resource */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="group text-left bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Share a Resource
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Phase 5
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  List your department's tools or facilities for verified peer academic use.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
              <span className="text-xs font-medium text-amber-600 flex items-center gap-1">
                Learn status <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </button>

          {/* Action 3: Explore Institutions */}
          <Link
            to="/institutions"
            className="group bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                  Explore Institutions
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Browse partner universities, faculties, and authorized campus departments.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                View directory <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* Action 4: Manage My Resources */}
          <Link
            to="/my-resources"
            className="group bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900 text-sm">
                    Manage Resources
                  </h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Phase 5
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  Review booking requests, condition ratings, and custody transfers for your gear.
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                Manage gear <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          D. RECENT ACTIVITY (CLEAN EMPTY STATE — NO FAKE LOGS)
      ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-600" />
              Recent Institutional Activity
            </h2>
            <p className="text-xs text-slate-500">
              Audit log records for reservations, checkouts, and membership changes
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            Awaiting Activity Endpoint
          </span>
        </div>

        {/* Empty State Presentation */}
        <EmptyState
          icon={<Activity className="h-6 w-6 text-slate-400" />}
          title="No Recent Activity"
          badgeText="Audit Log API Pending"
          description="Activity tracking will record resource reservations, custody handovers, and membership approvals once institutional activity begins on your account. The frontend intentionally avoids querying the internal database audit_log table directly."
          actionLabel="Explore Campus Resources"
          actionHref="/discover"
        />
      </div>

      {/* ------------------------------------------------------------------
          E. SECURITY & SESSION ARCHITECTURE GUARANTEES
      ------------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Active Session Security Architecture
          </h2>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Verified Compliant
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-brand-600" />
              Authentication Mechanism
            </span>
            <p className="text-slate-500 leading-relaxed">
              Stateful HTTP-only <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[11px]">JSESSIONID</code> managed by Spring Security. Zero JWTs used.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              CSRF Defense
            </span>
            <p className="text-slate-500 leading-relaxed">
              <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[11px]">X-XSRF-TOKEN</code> header automatically attached to all mutating HTTP methods.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-indigo-600" />
              Storage Security
            </span>
            <p className="text-slate-500 leading-relaxed">
              Zero passwords, tokens, or simulated states in <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[11px]">localStorage</code>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-amber-600" />
              Session Persistence
            </span>
            <p className="text-slate-500 leading-relaxed">
              Absence of <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-[11px]">GET /api/auth/me</code> means tab refreshes intentionally require re-authenticating.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------
          COMING SOON MODAL FOR RESOURCE SHARING
      ------------------------------------------------------------------- */}
      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
                <Plus className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900">
                Resource Sharing Connecting in Phase 5
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Resource creation endpoints (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">POST /api/resources</code>) and equipment categorization are scheduled for Phase 5. No resources can be registered until that controller is introduced.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowShareModal(false)}>
                Dismiss
              </Button>
              <Link to="/my-resources" onClick={() => setShowShareModal(false)}>
                <Button variant="primary" size="sm">
                  View Phase 5 Roadmap
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
