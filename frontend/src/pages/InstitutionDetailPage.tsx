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
  X,
} from 'lucide-react';
import { bookingService } from '../features/bookings/bookingService';
import { BookingResponse } from '../features/bookings/bookingTypes';
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
  const [membershipActionId, setMembershipActionId] = useState<string | null>(null);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [historyMember, setHistoryMember] = useState<InstitutionMember | null>(null);
  const [memberBookings, setMemberBookings] = useState<BookingResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

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

  const handleMembershipAction = async (
    membershipId: string,
    action: 'approve' | 'reject' | 'deactivate'
  ) => {
    if (!id) return;
    if (action === 'deactivate'
      && !window.confirm('Deactivate this student membership? They will lose institution access.')) return;
    setMembershipActionId(membershipId);
    setMembershipError(null);
    try {
      if (action === 'approve') await institutionService.approveMembership(id, membershipId);
      if (action === 'reject') await institutionService.rejectMembership(id, membershipId);
      if (action === 'deactivate') await institutionService.deactivateMembership(id, membershipId);
      await fetchDetails();
    } catch (err: unknown) {
      setMembershipError(err instanceof ApiClientError
        ? err.message
        : 'Unable to update this membership. Please try again.');
    } finally {
      setMembershipActionId(null);
    }
  };

  const showBookingHistory = async (member: InstitutionMember) => {
    if (!id) return;
    setHistoryMember(member);
    setMemberBookings([]);
    setHistoryError(null);
    setIsLoadingHistory(true);
    try {
      setMemberBookings(await bookingService.getMemberHistory(id, member.id));
    } catch (err) {
      setHistoryError(err instanceof ApiClientError
        ? err.message
        : 'Unable to load this student’s booking history.');
    } finally {
      setIsLoadingHistory(false);
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
      <div id="settings" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
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
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-slate-400" />
                  Local time zone: {institution.timezone}
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
          <p className="text-[11px] text-slate-400">All membership statuses included</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Institution access
            </span>
            <Shield className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-base font-bold text-slate-800">Enforced</p>
          <p className="text-[11px] text-slate-400">Access is scoped to authorized members</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Membership State
            </span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-base font-bold text-slate-800">{institution.membershipStatus}</p>
          <p className="text-[11px] text-slate-400">Your access state for this institution</p>
        </div>
      </div>

      {/* Members Directory */}
      <div id="members" className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Institution members
            </h2>
            <p className="text-xs text-slate-500">
              {institution.role === 'ADMIN'
                ? `Review membership requests and manage active students at ${institution.name}.`
                : `Active members of ${institution.name}.`}
            </p>
          </div>
          <span className="text-xs font-medium bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {membershipError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {membershipError}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
                <th className="pb-3 pr-4">User</th>
                <th className="pb-3 px-4">Role</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4">Verified</th>
                <th className="pb-3 pl-4">Joined Date</th>
                {institution.role === 'ADMIN' && <th className="pb-3 pl-4">Actions</th>}
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
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                      member.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : member.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
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
                      <span className="text-slate-400">Not approved</span>
                    )}
                  </td>
                  <td className="py-3 pl-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {new Date(member.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  {institution.role === 'ADMIN' && (
                    <td className="py-3 pl-4">
                      <div className="flex flex-wrap gap-2">
                        {member.role === 'MEMBER' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={membershipActionId !== null}
                            onClick={() => void showBookingHistory(member)}
                          >
                            Booking history
                          </Button>
                        )}
                        {member.role === 'MEMBER' && member.status === 'PENDING' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={membershipActionId === member.id}
                              disabled={membershipActionId !== null}
                              onClick={() => void handleMembershipAction(member.id, 'approve')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={membershipActionId !== null}
                              onClick={() => void handleMembershipAction(member.id, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {member.role === 'MEMBER' && member.status === 'ACTIVE' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={membershipActionId !== null}
                            onClick={() => void handleMembershipAction(member.id, 'deactivate')}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="incidents">
        <IncidentReportsPanel institutionId={institution.id} role={institution.role} />
      </div>

      {historyMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setHistoryMember(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="member-booking-history-title"
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="member-booking-history-title" className="text-lg font-semibold text-slate-900">
                  Booking history
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {historyMember.fullName} · @{historyMember.username}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close booking history"
                onClick={() => setHistoryMember(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isLoadingHistory ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading booking history…</div>
            ) : historyError ? (
              <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                {historyError}
              </p>
            ) : memberBookings.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                This student has no booking history at this institution.
              </p>
            ) : (
              <div className="space-y-3">
                {memberBookings.map((booking) => (
                  <article key={booking.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{booking.resourceName}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(booking.startTime).toLocaleString()} – {new Date(booking.endTime).toLocaleString()}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {booking.status === 'CONFIRMED' && new Date(booking.endTime) < new Date()
                          ? 'COMPLETED'
                          : booking.status}
                      </span>
                    </div>
                    {booking.requesterMessage && (
                      <p className="mt-3 text-sm text-slate-600">{booking.requesterMessage}</p>
                    )}
                    {booking.decisionMessage && (
                      <p className="mt-2 text-sm text-slate-600">
                        Decision: {booking.decisionMessage}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
