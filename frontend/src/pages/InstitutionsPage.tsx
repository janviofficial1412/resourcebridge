import React from 'react';
import { Building2, ArrowLeft, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const InstitutionsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 mb-2">
            <span>Phase 4 Roadmap</span>
            <span>•</span>
            <span>Institution Management Pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-indigo-600" />
            Partner Institutions & Memberships
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Universities, research consortia, and laboratories participating in the ResourceBridge verified network.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Schema / Architecture Transparency Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="h-4 w-4 text-brand-600" />
          Backend Model Status
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          The database schema contains <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">institution</code> and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">membership</code> tables enforcing strict tenant isolation. In Phase 4, the Spring Boot controllers for institution onboarding (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">POST /api/institutions</code>) and verified membership approvals will be integrated.
        </p>
      </div>

      {/* Empty / Honest State */}
      <EmptyState
        icon={<Building2 className="h-6 w-6 text-indigo-600" />}
        title="Institution Directory Connecting in Phase 4"
        badgeText="Phase 4 Planned Integration"
        description="No active institutions are currently linked to your session. Once the institution and membership endpoints are released in Phase 4, you can join campus directories, verify student credentials, and manage department affiliations."
        actionLabel="Return to Dashboard"
        actionHref="/dashboard"
      />
    </div>
  );
};
