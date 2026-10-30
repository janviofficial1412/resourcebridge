import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  ArrowLeft,
  Building2,
  Tag,
  MapPin,
  Clock,
  Shield,
  Edit2,
  Trash2,
  RefreshCw,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { resourceService } from '../features/resources/resourceService';
import { ResourceResponse } from '../features/resources/resourceTypes';
import { ResourcePhoto } from '../features/resources/ResourcePhoto';
import { institutionService } from '../features/institutions/institutionService';
import { InstitutionSummary } from '../features/institutions/institutionTypes';
import { ResourceFormModal } from '../features/resources/ResourceFormModal';
import { DeleteResourceModal } from '../features/resources/DeleteResourceModal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Loader } from '../components/ui/Loader';
import { ApiClientError } from '../services/api';
import { bookingService } from '../features/bookings/bookingService';
import { BookingResponse } from '../features/bookings/bookingTypes';
import { formatDateTimeRange } from '../features/bookings/bookingUtils';

export const MyResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const adminInstitutions = institutions.filter((institution) => institution.role === 'ADMIN');
  const canCreateResource = adminInstitutions.length > 0;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<ResourceResponse | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<ResourceResponse | null>(null);
  const [historyResource, setHistoryResource] = useState<ResourceResponse | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const membershipData = await institutionService.listMyInstitutions();
      setInstitutions(membershipData);
      const managedInstitutions = membershipData
        .filter((institution) => institution.role === 'ADMIN')
        .filter((institution) =>
        !selectedInstitutionId || institution.id === selectedInstitutionId);
      const resourceLists = await Promise.all(
        managedInstitutions.map((institution) => resourceService.getInstitutionResources(institution.id))
      );
      setResources(resourceLists.flat());
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to retrieve your resources');
      } else {
        setError('Network error: Unable to connect to resource service');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedInstitutionId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleOpenCreateModal = () => {
    setResourceToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (resource: ResourceResponse) => {
    setResourceToEdit(resource);
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (resource: ResourceResponse) => {
    setResourceToDelete(resource);
  };

  const handleOpenBookingHistory = async (resource: ResourceResponse) => {
    setHistoryResource(resource);
    setBookingHistory([]);
    setHistoryError(null);
    setIsLoadingHistory(true);
    try {
      setBookingHistory(await bookingService.getResourceHistory(resource.id));
    } catch (reason: unknown) {
      setHistoryError(reason instanceof ApiClientError
        ? reason.message
        : 'Unable to load booking history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleResourceFormSuccess = useCallback(() => {
    setIsFormModalOpen(false);
    setResourceToEdit(null);

    if (location.pathname !== '/my-resources') {
      navigate('/my-resources', { replace: true });
      return;
    }

    void fetchResources();
  }, [fetchResources, location.pathname, navigate]);

  // Helper formatting badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Available
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
      case 'RETIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Retired
          </span>
        );
      default:
        return <span className="text-xs text-slate-600">{status}</span>;
    }
  };

  const renderConditionBadge = (condition: string) => {
    switch (condition) {
      case 'NEW':
        return <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">New Condition</span>;
      case 'GOOD':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Good Condition</span>;
      case 'FAIR':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Fair Condition</span>;
      case 'POOR':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">Poor Condition</span>;
      default:
        return <span className="text-xs text-slate-500">{condition}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Institution administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="h-7 w-7 text-brand-600" />
            Resource Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Manage the resources shared by the institutions where you are an active administrator.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard">
            <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Dashboard
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchResources}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          {canCreateResource && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Share New Resource
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      {adminInstitutions.length > 0 && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span>Filter by Institution:</span>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedInstitutionId}
              onChange={(e) => setSelectedInstitutionId(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Institutions ({resources.length} total)</option>
              {adminInstitutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader size="lg" />
          <p className="text-xs text-slate-500 font-medium">Loading your registered resources...</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to Load Resources"
          message={error}
          onRetry={fetchResources}
        />
      ) : resources.length === 0 ? (
        institutions.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-7 w-7 text-brand-600" />}
            title="Institutional Membership Required"
            badgeText="No Active Memberships"
            description="You must be an active member of at least one institution before you can register equipment or facilities."
            actionLabel="Browse or Create Institutions"
            actionHref="/institutions"
          />
        ) : (
          <EmptyState
            icon={<Briefcase className="h-7 w-7 text-brand-600" />}
            title={canCreateResource ? 'No institutional resources yet' : 'Administrator access required'}
            badgeText={canCreateResource ? 'Ready for Sharing' : 'No admin memberships'}
            description={canCreateResource
              ? 'No resources are registered in the institutions you administer. Add a resource to make it available for eligible members.'
              : 'Resource creation and management are available to active institution administrators.'}
            actionLabel={canCreateResource ? 'Register First Resource' : undefined}
            onAction={canCreateResource ? handleOpenCreateModal : undefined}
          />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <ResourcePhoto
                  imageId={res.imageId}
                  alt={`${res.name} photo`}
                  className="h-40 w-full rounded-xl object-cover"
                />
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                      {res.resourceType}
                    </span>
                    {renderConditionBadge(res.conditionRating)}
                  </div>
                  {renderStatusBadge(res.status)}
                </div>

                {/* Resource Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {res.description || 'No detailed description provided.'}
                  </p>
                </div>

                {/* Metadata Details */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 truncate">
                      {res.institutionName || 'Unknown Institution'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{res.categoryName || 'General Category'}</span>
                  </div>

                  {res.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{res.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {res.requiresApproval ? 'Requires Owner Approval' : 'Instant Reservation'}
                    </span>
                    {res.maxBookingMinutes && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Max {res.maxBookingMinutes}m
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleOpenBookingHistory(res)}
                  leftIcon={<History className="h-3.5 w-3.5" />}
                >
                  Booking history
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleOpenEditModal(res)}
                  leftIcon={<Edit2 className="h-3.5 w-3.5 text-slate-500" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleOpenDeleteModal(res)}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {historyResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resource-booking-history-title"
        >
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="resource-booking-history-title" className="text-lg font-bold text-slate-900">
                  Booking history
                </h2>
                <p className="mt-1 text-sm text-slate-500">{historyResource.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setHistoryResource(null)}>Close</Button>
            </div>
            {isLoadingHistory ? (
              <div className="flex justify-center py-10"><Loader label="Loading booking history..." /></div>
            ) : historyError ? (
              <ErrorState title="Unable to load booking history" message={historyError}
                onRetry={() => void handleOpenBookingHistory(historyResource)} />
            ) : bookingHistory.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No booking requests have been made for this resource.
              </p>
            ) : (
              <ul className="space-y-3">
                {bookingHistory.map((booking) => {
                  const completed = booking.status === 'CONFIRMED'
                    && new Date(booking.endTime).getTime() < Date.now();
                  return (
                    <li key={booking.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{booking.requesterName}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDateTimeRange(booking.startTime, booking.endTime)}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {completed ? 'COMPLETED' : booking.status.replace('_', ' ')}
                        </span>
                      </div>
                      {booking.requesterMessage && (
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{booking.requesterMessage}</p>
                      )}
                      {booking.decisionMessage && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                          Decision note: {booking.decisionMessage}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <ResourceFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setResourceToEdit(null);
        }}
        onSuccess={handleResourceFormSuccess}
        resourceToEdit={resourceToEdit}
        institutions={adminInstitutions}
      />

      <DeleteResourceModal
        isOpen={Boolean(resourceToDelete)}
        resource={resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onSuccess={fetchResources}
      />
    </div>
  );
};
