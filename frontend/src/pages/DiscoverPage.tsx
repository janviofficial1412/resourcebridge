import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Search,
  Building2,
  Tag,
  MapPin,
  Clock,
  Shield,
  RefreshCw,
  X,
  SlidersHorizontal,
  User,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resourceService } from '../features/resources/resourceService';
import { isResourceMatchResponse, readSubmittedMatchRequest } from '../features/resources/resourceMatching';
import { ResourcePhoto } from '../features/resources/ResourcePhoto';
import {
  ResourceResponse,
  ResourceType,
  ConditionRating,
  ResourceMatchResponse,
} from '../features/resources/resourceTypes';
import { CategoryResponse } from '../features/resources/resourceTypes';
import { institutionService } from '../features/institutions/institutionService';
import { InstitutionSummary } from '../features/institutions/institutionTypes';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Loader } from '../components/ui/Loader';
import { ApiClientError } from '../services/api';

// ─── Label maps ──────────────────────────────────────────────────────────────

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  EQUIPMENT: 'Equipment',
  SPACE: 'Space',
};

const CONDITION_LABELS: Record<ConditionRating, string> = {
  NEW: 'New Condition',
  GOOD: 'Good Condition',
  FAIR: 'Fair Condition',
  POOR: 'Poor Condition',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'AVAILABLE') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Available
      </span>
    );
  }
  return <span className="text-xs text-slate-500">{status}</span>;
}

function ConditionBadge({ condition }: { condition: ConditionRating }) {
  const colorMap: Record<ConditionRating, string> = {
    NEW: 'text-sky-700 bg-sky-50 border-sky-200',
    GOOD: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    FAIR: 'text-amber-700 bg-amber-50 border-amber-200',
    POOR: 'text-rose-700 bg-rose-50 border-rose-200',
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${colorMap[condition] ?? 'text-slate-600 bg-slate-100 border-slate-200'}`}>
      {CONDITION_LABELS[condition] ?? condition}
    </span>
  );
}

function ResourceCard({ resource }: { resource: ResourceResponse }) {
  return (
    <article className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        <ResourcePhoto
          imageId={resource.imageId}
          alt={`${resource.name} photo`}
          className="h-40 w-full rounded-xl object-cover"
        />
        {/* Badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
              {RESOURCE_TYPE_LABELS[resource.resourceType] ?? resource.resourceType}
            </span>
            <ConditionBadge condition={resource.conditionRating} />
          </div>
          <StatusBadge status={resource.status} />
        </div>

        {/* Title & description */}
        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {resource.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {resource.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Metadata */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
            <span className="font-medium text-slate-800 truncate">{resource.institutionName || 'Unknown Institution'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
            <span className="truncate">{resource.categoryName || 'General Category'}</span>
          </div>

          {resource.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
              <span className="truncate">{resource.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
            <span className="truncate text-slate-500">{resource.ownerName || 'Unknown Owner'}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Shield className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
            <span>{resource.requiresApproval ? 'Requires Owner Approval' : 'Instant Reservation'}</span>
            {resource.maxBookingMinutes && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" aria-hidden />
                  Max {resource.maxBookingMinutes}m
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* View Details link */}
      <div className="pt-3 border-t border-slate-100">
        <Link
          to={`/resources/${resource.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          aria-label={`View details for ${resource.name}`}
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function ResourceMatchCard({ match }: { match: ResourceMatchResponse['matches'][number] }) {
  return (
    <div className="space-y-2">
      <p className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs leading-relaxed text-brand-900">
        {match.explanation}
      </p>
      <ResourceCard resource={match.resource} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const DiscoverPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Institution & category data
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  // Filter state
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedResourceType, setSelectedResourceType] = useState<ResourceType | ''>('');
  const [selectedCondition, setSelectedCondition] = useState<ConditionRating | ''>('');
  const [matchingRequest, setMatchingRequest] = useState('');
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');

  // Results state
  const [resources, setResources] = useState<ResourceResponse[]>([]);
  const [matchResponse, setMatchResponse] = useState<ResourceMatchResponse | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchingError, setMatchingError] = useState<string | null>(null);
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Track in-flight fetch to prevent stale response overwrite
  const fetchSeqRef = useRef(0);
  const categorySeqRef = useRef(0);
  const matchSeqRef = useRef(0);
  const matchAbortRef = useRef<AbortController | null>(null);
  const matchInFlightRef = useRef(false);

  // ── Debounce search input (400 ms) ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Load institutions on mount (authenticated only) ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoadingInstitutions(true);
    institutionService.listMyInstitutions()
      .then((data) => {
        const active = data.filter((i) => i.membershipStatus === 'ACTIVE');
        setInstitutions(active);
      })
      .catch(() => {
        // Non-fatal — user can still see the selector empty
      })
      .finally(() => setIsLoadingInstitutions(false));
  }, [isAuthenticated]);

  // Invalidate requests before a stale response can commit after any filter change.
  useLayoutEffect(() => {
    fetchSeqRef.current += 1;
    setIsLoadingResources(true);
    return () => {
      fetchSeqRef.current += 1;
    };
  }, [
    selectedInstitutionId,
    searchInput,
    debouncedSearch,
    selectedCategoryId,
    selectedResourceType,
    selectedCondition,
  ]);

  // ── Load categories for all active institutions or the selected institution ──
  useEffect(() => {
    const seq = ++categorySeqRef.current;
    const institutionIds = selectedInstitutionId
      ? [selectedInstitutionId]
      : institutions.map((institution) => institution.id);

    setCategories([]);
    setCategoryError(null);
    if (institutionIds.length === 0) {
      setSelectedCategoryId('');
      setIsLoadingCategories(false);
      return;
    }

    setIsLoadingCategories(true);
    Promise.all(institutionIds.map((id) => resourceService.getCategories(id)))
      .then((categoryLists) => {
        if (seq !== categorySeqRef.current) return;
        const availableCategories = categoryLists.flat();
        setCategories(availableCategories);
        setSelectedCategoryId((current) =>
          current && availableCategories.some((category) => category.id === current)
            ? current
            : ''
        );
      })
      .catch((err: unknown) => {
        if (seq !== categorySeqRef.current) return;
        setCategories([]);
        setCategoryError(err instanceof ApiClientError
          ? err.message
          : 'Unable to load categories for this institution.');
        setSelectedCategoryId('');
      })
      .finally(() => {
        if (seq === categorySeqRef.current) setIsLoadingCategories(false);
      });
  }, [institutions, selectedInstitutionId]);

  // ── Fetch discoverable resources ─────────────────────────────────────────────
  const fetchResources = useCallback(async () => {
    const seq = ++fetchSeqRef.current;
    if (authLoading || !isAuthenticated) {
      setResources([]);
      setIsLoadingResources(false);
      return;
    }

    setIsLoadingResources(true);
    setError(null);
    try {
      const data = await resourceService.discoverResources({
        institutionId: selectedInstitutionId || undefined,
        search: debouncedSearch || undefined,
        categoryId: selectedCategoryId || undefined,
        resourceType: selectedResourceType || undefined,
        conditionRating: selectedCondition || undefined,
      });
      // Discard stale responses
      if (seq === fetchSeqRef.current) {
        setResources(data);
      }
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load resources');
      } else {
        setError('Network error: Unable to connect to the resource service');
      }
    } finally {
      if (seq === fetchSeqRef.current) {
        setIsLoadingResources(false);
      }
    }
  }, [
    authLoading,
    isAuthenticated,
    selectedInstitutionId,
    debouncedSearch,
    selectedCategoryId,
    selectedResourceType,
    selectedCondition,
  ]);

  const resetMatchingResults = () => {
    matchSeqRef.current += 1;
    matchAbortRef.current?.abort();
    matchAbortRef.current = null;
    matchInFlightRef.current = false;
    setMatchResponse(null);
    setMatchingError(null);
    setIsMatching(false);
  };

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // The debounced keyword is derived from searchInput; its delayed update must not cancel a match.
  useEffect(() => {
    resetMatchingResults();
  }, [
    selectedInstitutionId,
    searchInput,
    selectedCategoryId,
    selectedResourceType,
    selectedCondition,
  ]);

  const runResourceMatch = async (requestText: string) => {
    if (matchInFlightRef.current) return;
    setMatchingError(null);

    if (Boolean(bookingStart) !== Boolean(bookingEnd)) {
      setMatchingError('Choose both a booking start and end time, or leave both blank.');
      return;
    }

    if (!requestText || requestText.length > 1000) {
      setMatchingError('Describe what you need in 1,000 characters or fewer.');
      return;
    }

    const seq = ++matchSeqRef.current;
    const controller = new AbortController();
    matchAbortRef.current = controller;
    matchInFlightRef.current = true;
    setIsMatching(true);
    setMatchResponse(null);
    try {
      const response = await resourceService.matchResources({
        request: requestText,
        search: searchInput.trim() || undefined,
        institutionId: selectedInstitutionId || undefined,
        categoryId: selectedCategoryId || undefined,
        resourceType: selectedResourceType || undefined,
        conditionRating: selectedCondition || undefined,
        startTime: bookingStart ? new Date(bookingStart).toISOString() : undefined,
        endTime: bookingEnd ? new Date(bookingEnd).toISOString() : undefined,
      }, controller.signal);
      if (!isResourceMatchResponse(response)) {
        throw new Error('The matching service returned an invalid response. Please try again.');
      }
      if (seq === matchSeqRef.current) setMatchResponse(response);
    } catch (err) {
      if (seq !== matchSeqRef.current) return;
      setMatchingError(err instanceof ApiClientError
        ? err.isAuthError
          ? 'Your session has expired. Sign in again before matching resources.'
          : err.status === 403
            ? 'You are not authorized to match resources for this institution.'
            : err.status >= 500
              ? 'The matching service is temporarily unavailable. Please try again.'
              : err.message
        : err instanceof Error
          ? err.message
          : 'Unable to match resources right now. Please try again.');
    } finally {
      if (seq === matchSeqRef.current) {
        matchInFlightRef.current = false;
        matchAbortRef.current = null;
        setIsMatching(false);
      }
    }
  };

  const handleResourceMatch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requestText = readSubmittedMatchRequest(new FormData(event.currentTarget));
    void runResourceMatch(requestText);
  };

  // ── Clear all filters ────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setSelectedInstitutionId('');
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedCategoryId('');
    setSelectedResourceType('');
    setSelectedCondition('');
  };

  const hasActiveFilters =
    selectedInstitutionId !== '' ||
    searchInput !== '' ||
    selectedCategoryId !== '' ||
    selectedResourceType !== '' ||
    selectedCondition !== '';

  // ─── Unauthenticated state ──────────────────────────────────────────────────
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Compass className="h-7 w-7 text-brand-600" aria-hidden />
              Discover Campus Resources
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Search laboratory instruments, makerspace machinery, and research facilities across verified academic partner institutions.
            </p>
          </div>
        </div>

        <EmptyState
          icon={<Lock className="h-6 w-6 text-brand-600" />}
          title="Sign In to Discover Resources"
          description="Resource discovery is available to verified institutional members. Sign in to search and browse available equipment and spaces across your campus network."
          actionLabel="Sign In"
          actionHref="/login"
          secondaryActionLabel="Create Account"
          onSecondaryAction={() => { window.location.href = '/register'; }}
        />
      </div>
    );
  }

  // ─── Auth loading ───────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader size="lg" label="Checking session..." />
      </div>
    );
  }

  // ─── Authenticated discovery UI ─────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Phase 6.1 · Discovery API Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Compass className="h-7 w-7 text-brand-600" aria-hidden />
            Discover Campus Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Search laboratory instruments, makerspace machinery, and research facilities across verified academic partner institutions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={fetchResources}
          disabled={isLoadingResources}
          leftIcon={<RefreshCw className={`h-4 w-4 ${isLoadingResources ? 'animate-spin' : ''}`} aria-hidden />}
        >
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden />
          <span>Filter Resources</span>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              aria-label="Clear all filters"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Clear filters
            </button>
          )}
        </div>

        {/* Row 1: Institution selector */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label htmlFor="discover-institution" className="block text-[11px] font-semibold text-slate-600 mb-1">
              Institution
            </label>
            {isLoadingInstitutions ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 h-[34px]">
                <Loader size="sm" label="" />
                <span>Loading institutions…</span>
              </div>
            ) : institutions.length === 0 ? (
              <p className="text-xs text-slate-500 italic h-[34px] flex items-center">
                No active institutional memberships found.{' '}
                <Link to="/institutions" className="ml-1 text-brand-600 hover:underline">
                  Browse institutions →
                </Link>
              </p>
            ) : (
              <>
                <select
                  id="discover-institution"
                  value={selectedInstitutionId}
                  onChange={(e) => {
                    const institutionId = e.target.value;
                    setSelectedInstitutionId(institutionId);
                    if (institutionId && selectedCategoryId) {
                      const category = categories.find((item) => item.id === selectedCategoryId);
                      if (!category || category.institutionId !== institutionId) {
                        setSelectedCategoryId('');
                      }
                    }
                  }}
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">All active institutions</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
                {selectedInstitutionId && (() => {
                  const selectedInstitution = institutions.find(
                    (institution) => institution.id === selectedInstitutionId
                  );
                  return selectedInstitution && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <ResourcePhoto
                        imageId={selectedInstitution.logoId}
                        alt={`${selectedInstitution.name} logo`}
                        className="h-8 w-8 rounded object-cover border border-slate-200"
                      />
                      <span>{selectedInstitution.name}</span>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>

        {/* Search and filters apply across all active institutions by default. */}
        {institutions.length > 0 && (
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <label htmlFor="discover-search" className="sr-only">
                Search resources
              </label>
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" aria-hidden />
              <input
                id="discover-search"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name or description…"
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Search resources by name or description"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="sm:w-44">
              <label htmlFor="discover-category" className="sr-only">
                Filter by category
              </label>
              <select
                id="discover-category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                disabled={isLoadingCategories}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => {
                  const institutionName = institutions.find((item) => item.id === cat.institutionId)?.name;
                  const label = selectedInstitutionId || !institutionName
                    ? cat.name
                    : `${cat.name} — ${institutionName}`;
                  return (
                    <option key={cat.id} value={cat.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Resource type filter */}
            <div className="sm:w-36">
              <label htmlFor="discover-type" className="sr-only">
                Filter by resource type
              </label>
              <select
                id="discover-type"
                value={selectedResourceType}
                onChange={(e) => setSelectedResourceType(e.target.value as ResourceType | '')}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Filter by resource type"
              >
                <option value="">All Types</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="SPACE">Space</option>
              </select>
            </div>

            {/* Condition filter */}
            <div className="sm:w-40">
              <label htmlFor="discover-condition" className="sr-only">
                Filter by condition
              </label>
              <select
                id="discover-condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value as ConditionRating | '')}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                aria-label="Filter by condition rating"
              >
                <option value="">All Conditions</option>
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
          </div>
        )}
        {categoryError && (
          <p role="alert" className="text-xs text-rose-600">{categoryError}</p>
        )}
      </div>

      {/* Natural-language matching */}
      {institutions.length > 0 && (
        <form
          onSubmit={handleResourceMatch}
          className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-4 shadow-xs space-y-3"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Describe what you need</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Local AI ranks eligible resources from your active institutions. Existing filters still apply.
              </p>
            </div>
          </div>
          <label htmlFor="resource-match-request" className="sr-only">
            Describe the resource you are looking for
          </label>
          <textarea
            id="resource-match-request"
            name="request"
            value={matchingRequest}
            onChange={(event) => {
              setMatchingRequest(event.target.value);
              resetMatchingResults();
            }}
            maxLength={1000}
            rows={2}
            placeholder="For example: I need a laptop for Python development for three days."
            className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="match-booking-start" className="mb-1 block text-xs font-medium text-slate-700">
                Booking starts (optional)
              </label>
              <input
                id="match-booking-start"
                type="datetime-local"
                value={bookingStart}
                onChange={(event) => {
                  setBookingStart(event.target.value);
                  resetMatchingResults();
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label htmlFor="match-booking-end" className="mb-1 block text-xs font-medium text-slate-700">
                Booking ends (optional)
              </label>
              <input
                id="match-booking-end"
                type="datetime-local"
                value={bookingEnd}
                onChange={(event) => {
                  setBookingEnd(event.target.value);
                  resetMatchingResults();
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-slate-500">
              Without a time window, current booking conflicts cannot be confirmed.
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!matchingRequest.trim() || isMatching || matchInFlightRef.current}
              leftIcon={isMatching
                ? <Loader size="sm" label="" />
                : <Sparkles className="h-4 w-4" aria-hidden />}
            >
              {isMatching ? 'Finding matches…' : 'Find matches'}
            </Button>
          </div>
          {matchingError && (
            <p role="alert" className="text-xs text-rose-600">{matchingError}</p>
          )}
        </form>
      )}

      {/* Results area */}
      {institutions.length === 0 && isLoadingInstitutions ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading your institutions…" />
        </div>
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6 text-brand-600" />}
          title="No Active Institutions"
          description="Join an institution with an active membership to discover its available resources."
        />
      ) : isMatching ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3" aria-live="polite">
          <Loader size="lg" />
          <p className="text-xs text-slate-500 font-medium">Checking eligibility and ranking matches locally…</p>
        </div>
      ) : matchingError ? (
        <ErrorState
          title="Unable to Match Resources"
          message={matchingError}
          onRetry={() => void runResourceMatch(matchingRequest.trim())}
        />
      ) : matchResponse ? (
        matchResponse.matches.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-6 w-6 text-brand-600" />}
            title="No Strong Matches"
            description={matchResponse.message}
          />
        ) : (
          <>
            <div role="status" className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold text-slate-800">
                {matchResponse.rankingMethod === 'AI' ? 'Locally AI-ranked matches' : 'Fallback suggestions'}
              </p>
              <p className="mt-1 text-xs text-slate-600">{matchResponse.message}</p>
              <button
                type="button"
                onClick={() => setMatchResponse(null)}
                className="mt-2 text-xs font-medium text-brand-700 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                Back to discovery results
              </button>
            </div>
            <div
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              aria-label={`${matchResponse.matches.length} matched resources`}
              aria-live="polite"
            >
              {matchResponse.matches.map((match) => (
                <ResourceMatchCard key={match.resource.id} match={match} />
              ))}
            </div>
          </>
        )
      ) : isLoadingResources ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader size="lg" />
          <p className="text-xs text-slate-500 font-medium">Searching available resources…</p>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to Load Resources"
          message={error}
          onRetry={fetchResources}
        />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6 text-brand-600" />}
          title={hasActiveFilters ? 'No Resources Match Your Filters' : 'No Available Resources'}
          description={
            hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more results.'
              : 'Your active institutions have no available resources at the moment. Check back later.'
          }
          {...(hasActiveFilters
            ? { actionLabel: 'Clear Filters', onAction: handleClearFilters }
            : {})}
        />
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              {resources.length} resource{resources.length !== 1 ? 's' : ''} available
              {hasActiveFilters && ' (filtered)'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-brand-600 hover:text-brand-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Resource grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label={`${resources.length} available resources`}
            aria-live="polite"
            aria-busy={isLoadingResources}
          >
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
