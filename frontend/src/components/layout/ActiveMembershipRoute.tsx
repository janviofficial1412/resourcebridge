import React, { useCallback, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { institutionService } from '../../features/institutions/institutionService';
import { InstitutionSummary } from '../../features/institutions/institutionTypes';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Loader } from '../ui/Loader';

export const ActiveMembershipRoute: React.FC = () => {
  const [institutions, setInstitutions] = useState<InstitutionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInstitutions = useCallback(() => {
    setError(null);
    setInstitutions(null);
    institutionService.listMyInstitutions()
      .then(setInstitutions)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : 'Unable to verify your institution memberships.');
      });
  }, []);

  useEffect(() => {
    loadInstitutions();
  }, [loadInstitutions]);

  if (error) {
    return <ErrorState title="Unable to Load Memberships" message={error} onRetry={loadInstitutions} />;
  }
  if (institutions === null) {
    return <Loader fullScreen label="Checking institution access..." />;
  }
  if (institutions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<Building2 className="h-7 w-7 text-brand-600" />}
          title="An active institution membership is required"
          badgeText="No active memberships"
          description="Create an institution to start sharing resources. Joining an existing institution is not available yet."
          actionLabel="Create an Institution"
          actionHref="/institutions"
        />
      </div>
    );
  }
  return <Outlet />;
};
