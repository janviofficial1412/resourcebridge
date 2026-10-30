import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  Globe,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { institutionService } from '../features/institutions/institutionService';
import { InstitutionDirectoryEntry, InstitutionSummary } from '../features/institutions/institutionTypes';
import { ResourcePhoto } from '../features/resources/ResourcePhoto';
import { validateImageFile } from '../features/images/validateImageFile';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Loader } from '../components/ui/Loader';
import { ApiClientError } from '../services/api';

export const InstitutionsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState<InstitutionSummary[]>([]);
  const [memberships, setMemberships] = useState<InstitutionSummary[]>([]);
  const [directory, setDirectory] = useState<InstitutionDirectoryEntry[]>([]);
  const [membershipActionId, setMembershipActionId] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal form states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [createdInstitutionId, setCreatedInstitutionId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInstitutions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, membershipData, directoryData] = await Promise.all([
        institutionService.listMyInstitutions(),
        institutionService.listMyMemberships(),
        institutionService.listDirectory(),
      ]);
      setInstitutions(data);
      setMemberships(membershipData);
      setDirectory(directoryData);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load institutions');
      } else {
        setError('Network error: Unable to connect to institution service');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestMembership = async (institutionId: string) => {
    setMembershipActionId(institutionId);
    setMembershipError(null);
    try {
      await institutionService.requestMembership(institutionId);
      const [membershipData, institutionData] = await Promise.all([
        institutionService.listMyMemberships(),
        institutionService.listMyInstitutions(),
      ]);
      setMemberships(membershipData);
      setInstitutions(institutionData);
    } catch (err: unknown) {
      setMembershipError(err instanceof ApiClientError
        ? err.message
        : 'Unable to send the membership request. Please try again.');
    } finally {
      setMembershipActionId(null);
    }
  };

  const membershipByInstitution = new Map(memberships.map((membership) => [membership.id, membership]));

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  useEffect(() => {
    const navigationState = location.state as { openCreateInstitution?: boolean } | null;
    if (navigationState?.openCreateInstitution) {
      setShowCreateModal(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key, location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!showCreateModal || !selectedLogo) {
      setLogoPreviewUrl(null);
      return;
    }
    const preview = URL.createObjectURL(selectedLogo);
    setLogoPreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [showCreateModal, selectedLogo]);

  // Auto-generate slug from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
    if (formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: '' }));
    }
  };

  const generateSlug = (str: string) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const finishInstitutionCreation = async () => {
    setShowCreateModal(false);
    setCreatedInstitutionId(null);
    setSelectedLogo(null);
    setLogoError(null);
    setName('');
    setSlug('');
    setTimezone('UTC');
    setFormErrors({});
    await fetchInstitutions();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Institution name is required';
    } else if (name.trim().length > 200) {
      errors.name = 'Name must be at most 200 characters';
    }

    const trimmedSlug = slug.trim().toLowerCase();
    if (!trimmedSlug) {
      errors.slug = 'Slug is required';
    } else if (trimmedSlug.length > 64) {
      errors.slug = 'Slug must be at most 64 characters';
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(trimmedSlug)) {
      errors.slug = 'Slug must be lowercase alphanumeric with hyphens (e.g. mit-media-lab)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (logoError) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    let activeInstitutionId = createdInstitutionId;
    try {
      if (!activeInstitutionId) {
        const created = await institutionService.createInstitution({
          name: name.trim(),
          slug: slug.trim().toLowerCase(),
          timezone: timezone.trim() || 'UTC',
        });
        activeInstitutionId = created.id;
        setCreatedInstitutionId(activeInstitutionId);
      }

      if (selectedLogo) {
        await institutionService.uploadInstitutionLogo(activeInstitutionId, selectedLogo);
      }

      setShowCreateModal(false);
      setName('');
      setSlug('');
      setTimezone('UTC');
      setSelectedLogo(null);
      setLogoError(null);
      setCreatedInstitutionId(null);
      setFormErrors({});
      await fetchInstitutions();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (activeInstitutionId) {
          setFormErrors((prev) => ({
            ...prev,
            general: `Institution created, but the logo could not be uploaded. Retry to upload the logo without creating a duplicate. ${err.message}`,
          }));
        } else if (err.status === 409) {
          setFormErrors((prev) => ({
            ...prev,
            slug: 'An institution with this slug already exists. Please choose another.',
          }));
        } else if (err.status === 400 && err.fieldErrors) {
          const apiMap: Record<string, string> = {};
          err.fieldErrors.forEach((fe) => {
            apiMap[fe.field] = fe.message;
          });
          setFormErrors(apiMap);
        } else {
          setFormErrors((prev) => ({
            ...prev,
            general: err.message || 'Failed to create institution',
          }));
        }
      } else {
        setFormErrors((prev) => ({
          ...prev,
          general: activeInstitutionId
            ? 'Institution created, but logo upload failed. Retry to upload the logo without creating a duplicate.'
            : 'Network error. Please try again.',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Your campus network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-brand-700" />
            Institutions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Universities, research consortia, and laboratories using ResourceBridge to coordinate resource sharing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchInstitutions}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Institution
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader size="lg" label="Loading institutions..." />
        </div>
      ) : error ? (
        <ErrorState
          title="Could not load institutions"
          message={error}
          onRetry={fetchInstitutions}
        />
      ) : institutions.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-7 w-7 text-indigo-600" />}
          title="No Institutions Found"
          badgeText="Active Membership Required"
          description="Create an institution to become its administrator, or request to join an existing institution."
          actionLabel="Create Your First Institution"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {institutions.map((inst) => (
            <div
              key={inst.id}
              className="bg-white border border-[#e7e5df] rounded-2xl p-6 shadow-sm hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <ResourcePhoto
                    imageId={inst.logoId}
                    alt={`${inst.name} logo`}
                    className="h-14 w-14 rounded-xl object-cover border border-[#e7e5df]"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                      {inst.role}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {inst.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base tracking-tight mb-1">
                    {inst.name}
                  </h3>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <span>Local time zone: {inst.timezone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>Created: {new Date(inst.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-5">
                <Link to={`/institutions/${inst.id}`}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center text-xs"
                    rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                  >
                    Manage & View Members
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="space-y-5" aria-labelledby="institution-directory-heading">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="institution-directory-heading" className="text-lg font-bold text-slate-900">
              Find an institution
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Request access to an active institution. An administrator must approve your membership.
            </p>
          </div>
        </div>
        {membershipError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {membershipError}
          </div>
        )}
        {directory.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
            No institutions are currently listed.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {directory.map((entry) => {
              const membership = membershipByInstitution.get(entry.id);
              const status = membership?.membershipStatus;
              return (
                <article key={entry.id} className="flex items-center justify-between gap-4 rounded-2xl border border-[#e7e5df] bg-white p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <ResourcePhoto
                      imageId={entry.logoId}
                      alt={`${entry.name} logo`}
                      className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-slate-900">{entry.name}</h3>
                      <p className="text-xs text-slate-500">{entry.timezone}</p>
                      {status && <p className="mt-1 text-xs font-medium text-brand-700">Membership: {status}</p>}
                    </div>
                  </div>
                  {status === 'ACTIVE' ? (
                    <Link to={`/institutions/${entry.id}`}>
                      <Button variant="secondary" size="sm">View</Button>
                    </Link>
                  ) : status === 'PENDING' ? (
                    <Button variant="secondary" size="sm" disabled>Pending</Button>
                  ) : status === 'SUSPENDED' ? (
                    <Button variant="secondary" size="sm" disabled>Unavailable</Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={membershipActionId === entry.id}
                      disabled={membershipActionId !== null}
                      onClick={() => void requestMembership(entry.id)}
                    >
                      {status === 'REJECTED' ? 'Request again' : 'Request to join'}
                    </Button>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Create Institution Modal Dialog */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-institution-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[11px] font-semibold border border-brand-200">
                  Initial Admin Assignment
                </div>
                <h2 id="create-institution-title" className="text-xl font-bold text-slate-900">
                  Register New Institution
                </h2>
                <p className="text-xs text-slate-500">
                  You will automatically become the initial administrator of this institution.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (createdInstitutionId) {
                    void finishInstitutionCreation();
                  } else {
                    setShowCreateModal(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formErrors.general && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {formErrors.general}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
              <Input
                id="inst-name"
                name="name"
                type="text"
                label="Institution Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Oakridge University Makerspace"
                required
                error={formErrors.name}
                helperText="Official university, laboratory, or faculty name."
              />

              <Input
                id="inst-slug"
                name="slug"
                type="text"
                label="Institution URL Slug"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
                }}
                placeholder="e.g. oakridge-univ-makerspace"
                required
                error={formErrors.slug}
                helperText="Unique lowercase identifier with hyphens (e.g. mit-media-lab)."
              />

              <Input
                id="inst-timezone"
                name="timezone"
                type="text"
                label="Primary Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="UTC or America/New_York"
                helperText="Standard IANA timezone identifier (defaults to UTC)."
              />

              <div className="space-y-2">
                <label htmlFor="institution-logo" className="block text-xs font-semibold text-slate-700">
                  Institution Logo <span className="font-normal text-slate-500">(optional, JPEG/PNG/WebP up to 5 MB)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt="Institution logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <ResourcePhoto alt="No institution logo selected" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      id="institution-logo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const validationError = validateImageFile(file, 'logo');
                        if (validationError) {
                          setLogoError(validationError);
                          event.target.value = '';
                        } else {
                          setSelectedLogo(file);
                          setLogoError(null);
                        }
                      }}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
                    />
                    {selectedLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLogo(null);
                          setLogoError(null);
                        }}
                        className="text-xs font-medium text-rose-600 hover:text-rose-700"
                      >
                        Remove selected logo
                      </button>
                    )}
                    {logoError && <p role="alert" className="text-xs text-rose-600">{logoError}</p>}
                    <p className="text-[11px] text-slate-500">A logo does not verify an institution's identity.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                {createdInstitutionId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => void finishInstitutionCreation()}
                  >
                    Finish without logo
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => {
                    if (createdInstitutionId) {
                      void finishInstitutionCreation();
                    } else {
                      setShowCreateModal(false);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                >
                  {createdInstitutionId ? 'Retry Logo Upload' : 'Create & Initialize'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
