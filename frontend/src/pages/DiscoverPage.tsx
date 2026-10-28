import React from 'react';
import { Compass, Filter, Search, ArrowLeft, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const DiscoverPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <span>Phase 6 Roadmap</span>
            <span>•</span>
            <span>Catalog API Pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-brand-600" />
            Discover Campus Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Search laboratory instruments, makerspace fabrication machinery, and research facilities across verified academic partner institutions.
          </p>
        </div>

        <Link to="/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Disabled / Preview Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm opacity-80 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              disabled
              placeholder="Search equipment by name, category, or model (Awaiting Phase 6 API)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>All Categories</span>
            </button>
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Campuses</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty / Honest State */}
      <EmptyState
        icon={<Compass className="h-6 w-6 text-brand-600" />}
        title="Resource Catalog Under Construction"
        badgeText="Phase 6 Planned Integration"
        description="The backend currently provides authentication services (Registration and Login). Resource queries against `GET /api/resources` and full-text catalog indexing will be connected in Phase 6."
        actionLabel="Return to Dashboard"
        actionHref="/dashboard"
      />
    </div>
  );
};
