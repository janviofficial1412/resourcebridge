import React, { useState } from 'react';
import { Briefcase, Plus, ArrowLeft, Info, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';

export const MyResourcesPage: React.FC = () => {
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 mb-2">
            <span>Phase 5 Roadmap</span>
            <span>•</span>
            <span>Resource Creation Pending</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="h-7 w-7 text-brand-600" />
            My Shared Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manage laboratory instrumentation, workshop tools, and campus facilities registered under your institutional membership.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Dashboard
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowComingSoonModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Share New Resource
          </Button>
        </div>
      </div>

      {/* Coming Soon Notice Modal */}
      {showComingSoonModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Info className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowComingSoonModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-slate-900">
                Resource Creation Awaiting Phase 5
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                The resource management controller (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">POST /api/resources</code>) is currently pending backend implementation. Resource forms, photo uploads, condition ratings, and category classification will be enabled in Phase 5.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowComingSoonModal(false)}>
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty / Honest State */}
      <EmptyState
        icon={<Briefcase className="h-6 w-6 text-brand-600" />}
        title="No Resources Registered Yet"
        badgeText="Phase 5 Planned Integration"
        description="You have not registered any equipment or spaces for sharing. Resource registration, booking policies, condition ratings, and maintenance logs will be fully connected in Phase 5."
        actionLabel="Explore Campus Catalog"
        actionHref="/discover"
        secondaryActionLabel="Learn More"
        onSecondaryAction={() => setShowComingSoonModal(true)}
      />
    </div>
  );
};
