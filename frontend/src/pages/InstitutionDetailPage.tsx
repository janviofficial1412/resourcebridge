import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Globe,
  Clock,
  ArrowLeft,
  Shield,
  CheckCircle2,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { institutionService } from '../features/institutions/institutionService';
import {
  InstitutionDetail,
  InstitutionMember,
} from '../features/institutions/institutionTypes';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';
import { ApiClientError } from '../services/api';
import { ResourcePhoto } from '../features/resources/ResourcePhoto';
import { validateImageFile } from '../features/images/validateImageFile';
import { IncidentReportsPanel } from '../features/incidents/IncidentReportsPanel';

export const InstitutionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<InstitutionDetail | null>(null);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [logoVersion, setLogoVersion] = useState(0);

  const fetchDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [detailData, memberList] = await Promise.all([
        institutionService.getInstitutionDetails(id),
        institutionService.getInstitutionMembers(id),
      ]);
      setInstitution(detailData);
      setMembers(memberList);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        if (err.status === 403) {
          setError('Access denied: You do not have active membership in this institution.');
        } else if (err.status === 404) {
          setError('Institution not found.');
        } else {
          setError(err.message || 'Failed to load institution details');
        }
      } else {
        setError('Network error: Unable to contact institution service');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    if (!selectedLogo) {
      setLogoPreviewUrl(null);
      return;
    }
    const preview = URL.createObjectURL(selectedLogo);
    setLogoPreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [selectedLogo]);

  const saveLogo = async () => {
    if (!id || !selectedLogo || logoError) return;
    setIsSavingLogo(true);
    setLogoError(null);
    try {
      await institutionService.uploadInstitutionLogo(id, selectedLogo);
      setSelectedLogo(null);
      setLogoVersion((version) => version + 1);
      await fetchDetails();
    } catch (err) {
      setLogoError(err instanceof ApiClientError
        ? err.message
        : 'Network error while uploading institution logo.');
    } finally {
      setIsSavingLogo(false);
    }
  };

  const removeLogo = async () => {
    if (!id) return;
    setIsSavingLogo(true);
    setLogoError(null);
    try {
      await institutionService.removeInstitutionLogo(id);
      setLogoVersion((version) => version + 1);
      await fetchDetails();
    } catch (err) {
      setLogoError(err instanceof ApiClientError
        ? err.message
        : 'Network error while removing institution logo.');
    } finally {
      setIsSavingLogo(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <Loader size="lg" label="Loading institution details..." />
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link to="/institutions">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to Institutions
            </Button>
          </Link>
        </div>
        <ErrorState
          title="Could not display institution"
          message={error || 'Institution details unavailable.'}
          onRetry={fetchDetails}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div>
        <Link to="/institutions">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to Institutions
          </Button>
        </Link>
      </div>

      {/* Institution Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <ResourcePhoto
              key={logoVersion}
              imageId={institution.logoId}
              alt={`${institution.name} logo`}
              className="h-20 w-20 shrink-0 rounded-xl object-cover border border-slate-200"
            />
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Your Role: {institution.role}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Status: {institution.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Building2 className="h-7 w-7 text-indigo-600 shrink-0" />
                <span>{institution.name}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  slug: {institution.slug}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Timezone: {institution.timezone}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  Created: {new Date(institution.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDetails}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>
        {institution.role === 'ADMIN' && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <label htmlFor="institution-logo-update" className="block text-xs font-semibold text-slate-700 mb-1">
                  Institution logo
                </label>
                <input
                  id="institution-logo-update"
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
              </div>
              {selectedLogo && logoPreviewUrl && (
                <img src={logoPreviewUrl} alt="New institution logo preview" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
              )}
              {selectedLogo && (
                <Button variant="primary" size="sm" isLoading={isSavingLogo} onClick={saveLogo}>
                  Save Logo
                </Button>
              )}
              {selectedLogo && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedLogo(null);
                    setLogoError(null);
                  }}
                >
                  Cancel
                </Button>
              )}
              {institution.logoId && !selectedLogo && (
                <Button variant="secondary" size="sm" isLoading={isSavingLogo} onClick={removeLogo}>
                  Remove Logo
                </Button>
              )}
              {logoError && <p role="alert" className="text-xs text-rose-600">{logoError}</p>}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              JPEG, PNG, or WebP up to 5 MB. A logo does not verify an institution's identity.
            </p>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Enrolled Members
            </span>
            <Users className="h-4 w-4 text-brand-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{institution.memberCount}</p>
          <p className="text-[11px] text-slate-400">Verified institutional members</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tenant Isolation
            </span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800">Enforced</p>
          <p className="text-[11px] text-slate-400">Composite foreign key database boundaries</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Membership State
            </span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-base font-bold text-slate-800">{institution.membershipStatus}</p>
          <p className="text-[11px] text-slate-400">Verified departmental status</p>
        </div>
      </div>

      {/* Members Directory */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Verified Membership Roster
            </h2>
            <p className="text-xs text-slate-500">
              Users holding authorized roles within {institution.name}
            </p>
          </div>
          <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Verified</th>
                <th className="pb-3 pl-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{member.fullName}</p>
                        <p className="text-xs text-slate-400">@{member.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {member.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500">
                    {member.verifiedAt ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {new Date(member.verifiedAt).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">Pending</span>
                    )}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <IncidentReportsPanel institutionId={institution.id} />
    </div>
  );
};
