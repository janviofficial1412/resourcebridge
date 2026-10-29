import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Tag,
  MapPin,
  Clock,
  Shield,
  User,
  Compass,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Archive,
  FileText,
  CalendarCheck,
  Calendar,
  Send,
  AlertTriangle,
  Inbox,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { resourceService } from '../features/resources/resourceService';
import { ResourcePhoto } from '../features/resources/ResourcePhoto';
import { ResourceResponse, ResourceType, ConditionRating, ResourceStatus } from '../features/resources/resourceTypes';
import { bookingService } from '../features/bookings/bookingService';
import { BookingResponse } from '../features/bookings/bookingTypes';
import { toDateTimeLocalValue, formatDateTimeRange, formatDuration } from '../features/bookings/bookingUtils';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { ErrorState } from '../components/ui/ErrorState';
import { ApiClientError } from '../services/api';

// ─── Label maps ───────────────────────────────────────────────────────────────

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

const CONDITION_COLORS: Record<ConditionRating, string> = {
  NEW: 'text-sky-700 bg-sky-50 border-sky-200',
  GOOD: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  FAIR: 'text-amber-700 bg-amber-50 border-amber-200',
  POOR: 'text-rose-700 bg-rose-50 border-rose-200',
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ResourceStatus }) {
  const map: Record<ResourceStatus, { label: string; className: string; dot?: string }> = {
    AVAILABLE: {
      label: 'Available',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    DRAFT: {
      label: 'Draft',
      className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
    MAINTENANCE: {
      label: 'Under Maintenance',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    RETIRED: {
      label: 'Retired',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  };
  const cfg = map[status] ?? { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${cfg.className}`}>
      {cfg.dot && <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
        <div className="text-sm text-slate-800 font-medium">{value}</div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ResourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [resource, setResource] = useState<ResourceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  // Booking Form State
  const defaultTimes = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(9, 0, 0, 0);

    const end = new Date(start);
    end.setHours(11, 0, 0, 0);

    return {
      start: toDateTimeLocalValue(start),
      end: toDateTimeLocalValue(end),
    };
  }, []);

  const [startTime, setStartTime] = useState<string>(defaultTimes.start);
  const [endTime, setEndTime] = useState<string>(defaultTimes.end);
  const [requesterMessage, setRequesterMessage] = useState<string>('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [successfulBooking, setSuccessfulBooking] = useState<BookingResponse | null>(null);

  const fetchResource = useCallback(async () => {
    if (!id) {
      setError('No resource ID provided.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const data = await resourceService.getResourceDetails(id);
      setResource(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorStatus(err.status);
        if (err.status === 404) {
          setError('This resource does not exist or has been removed.');
        } else if (err.status === 403) {
          setError('Access denied: You must be an active member of this institution to view this resource.');
        } else if (err.status === 401) {
          setError('Authentication required. Please sign in to view resource details.');
        } else {
          setError(err.message || 'Failed to load resource details.');
        }
      } else {
        setError('Network error: Unable to reach the resource service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  // Check if current user is owner
  const isOwner = Boolean(
    user &&
    resource &&
    resource.ownerName &&
    user.fullName &&
    user.fullName.trim().toLowerCase() === resource.ownerName.trim().toLowerCase()
  );

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource) return;

    setBookingError(null);

    // Validation
    if (!startTime || !endTime) {
      setBookingError('Please specify both a start time and an end time.');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setBookingError('Please enter valid dates and times.');
      return;
    }

    const now = new Date();
    // Allow a 1-minute buffer for form fill time
    if (startDate.getTime() < now.getTime() - 60000) {
      setBookingError('The booking start time must be in the future.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setBookingError('The booking end time must be strictly after the start time.');
      return;
    }

    const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    if (resource.maxBookingMinutes && durationMinutes > resource.maxBookingMinutes) {
      setBookingError(
        `Requested duration of ${durationMinutes} minutes exceeds the maximum allowed duration of ${resource.maxBookingMinutes} minutes.`
      );
      return;
    }

    setIsSubmittingBooking(true);

    try {
      const result = await bookingService.createBooking({
        resourceId: resource.id,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        requesterMessage: requesterMessage.trim() || undefined,
      });

      setSuccessfulBooking(result);
      setBookingError(null);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.isConflict || err.status === 409) {
          setBookingError('This resource is already booked for the selected time window. Please choose different dates or times.');
        } else if (err.status === 400 && err.message.includes('own resource')) {
          setBookingError('You cannot book your own resource.');
        } else if (err.isValidationError && err.fieldErrors.length > 0) {
          setBookingError(err.fieldErrors.map((f) => f.message).join('. '));
        } else {
          setBookingError(err.message || 'Failed to submit booking request.');
        }
      } else {
        setBookingError('Network error: Unable to reach the booking service.');
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleResetBookingForm = () => {
    setSuccessfulBooking(null);
    setBookingError(null);
    setRequesterMessage('');
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <Loader size="lg" label="Loading resource details…" />
      </div>
    );
  }

  // ── Error / not found ───────────────────────────────────────────────────────
  if (error || !resource) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div>
          <Link to="/discover">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" aria-hidden />}>
              Back to Discover
            </Button>
          </Link>
        </div>
        <ErrorState
          title={
            errorStatus === 404
              ? 'Resource Not Found'
              : errorStatus === 403
              ? 'Access Denied'
              : 'Unable to Load Resource'
          }
          message={error ?? 'An unexpected error occurred.'}
          onRetry={errorStatus !== 404 ? fetchResource : undefined}
        />
      </div>
    );
  }

  const nowMinString = toDateTimeLocalValue(new Date());

  // ── Success ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back navigation */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
        <ResourcePhoto
          imageId={resource.imageId}
          alt={`${resource.name} photo`}
          className="mb-6 max-h-[28rem] min-h-48 w-full rounded-xl object-cover"
        />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Type + condition badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded">
                {RESOURCE_TYPE_LABELS[resource.resourceType] ?? resource.resourceType}
              </span>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                  CONDITION_COLORS[resource.conditionRating] ?? 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
              >
                {CONDITION_LABELS[resource.conditionRating] ?? resource.conditionRating}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2">
              {resource.name}
            </h1>

            {/* Institution breadcrumb */}
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
              <span>{resource.institutionName || 'Unknown Institution'}</span>
              <span className="text-slate-300">·</span>
              <Tag className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
              <span>{resource.categoryName || 'General Category'}</span>
            </p>
          </div>

          {/* Status pill */}
          <div className="shrink-0">
            <StatusPill status={resource.status} />
          </div>
        </div>
      </div>

      {/* Two-column layout: description + metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description & Booking Request (wider) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-400" aria-hidden />
              Description
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {resource.description?.trim() || 'No detailed description provided.'}
            </p>
          </div>

          {/* Booking policy */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" aria-hidden />
              Booking Policy
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {resource.requiresApproval ? (
                  <>
                    <div className="h-8 w-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-amber-600" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Requires Owner Approval</p>
                      <p className="text-xs text-slate-500">Booking requests must be approved by the resource owner before confirmation.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Instant Reservation</p>
                      <p className="text-xs text-slate-500">This resource is immediately reserved upon submission without waiting for manual approval.</p>
                    </div>
                  </>
                )}
              </div>

              {resource.maxBookingMinutes && (
                <div className="flex items-center gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
                  <span>
                    Maximum booking duration:{' '}
                    <span className="font-semibold text-slate-800">
                      {resource.maxBookingMinutes >= 60
                        ? `${Math.floor(resource.maxBookingMinutes / 60)}h${resource.maxBookingMinutes % 60 ? ` ${resource.maxBookingMinutes % 60}m` : ''}`
                        : `${resource.maxBookingMinutes} minutes`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Booking Request Form Section ── */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-brand-600" aria-hidden />
                {resource.requiresApproval ? 'Request Booking' : 'Reserve Resource'}
              </h2>
              {resource.requiresApproval ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Approval Required
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Instant Confirmation
                </span>
              )}
            </div>

            {/* Check resource status */}
            {resource.status !== 'AVAILABLE' ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-0.5">Booking Unavailable</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    This resource is currently marked as{' '}
                    <strong className="font-semibold">{resource.status.toLowerCase()}</strong> and cannot accept reservations at this time.
                  </p>
                </div>
              </div>
            ) : isOwner ? (
              /* Resource owner guard */
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-3">
                <Shield className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-800">You are the owner of this resource</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Owners cannot book their own resources. To manage booking requests from other campus members, visit your incoming requests page.
                  </p>
                  <div className="pt-2">
                    <Link to="/bookings/incoming">
                      <Button variant="secondary" size="sm" leftIcon={<Inbox className="h-3.5 w-3.5" />}>
                        View Incoming Requests
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : successfulBooking ? (
              /* Successful Booking Banner */
              <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900">
                      {successfulBooking.status === 'CONFIRMED'
                        ? 'Reservation Confirmed!'
                        : 'Booking Request Submitted!'}
                    </h3>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                      {successfulBooking.status === 'CONFIRMED'
                        ? 'Your reservation is confirmed and ready. A notification has been recorded for the resource.'
                        : 'Your request has been submitted to the owner for review. You will receive an update once decided.'}
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 rounded-lg p-3 border border-emerald-100 text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Reference:</span>
                    <span className="font-mono text-slate-800 text-[11px]">{successfulBooking.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-semibold text-slate-800">
                      {formatDateTimeRange(successfulBooking.startTime, successfulBooking.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="text-slate-800">
                      {formatDuration(successfulBooking.startTime, successfulBooking.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                      {successfulBooking.status}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link to="/bookings">
                    <Button variant="primary" size="sm" leftIcon={<CalendarCheck className="h-3.5 w-3.5" />}>
                      View My Bookings
                    </Button>
                  </Link>
                  <Button variant="secondary" size="sm" onClick={handleResetBookingForm}>
                    Make Another Booking
                  </Button>
                </div>
              </div>
            ) : (
              /* Active Booking Form */
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {bookingError && (
                  <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{bookingError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="booking-start" className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="booking-start"
                      type="datetime-local"
                      value={startTime}
                      min={nowMinString}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={isSubmittingBooking}
                      required
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="booking-end" className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="booking-end"
                      type="datetime-local"
                      value={endTime}
                      min={startTime || nowMinString}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={isSubmittingBooking}
                      required
                      className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="requester-message" className="block text-xs font-semibold text-slate-700 mb-1">
                    Message to Resource Owner <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    id="requester-message"
                    rows={3}
                    maxLength={2000}
                    value={requesterMessage}
                    onChange={(e) => setRequesterMessage(e.target.value)}
                    disabled={isSubmittingBooking}
                    placeholder="Provide details about your project, equipment usage requirements, or planned activity..."
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none resize-none"
                  />
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                    <span>Max 2000 characters</span>
                    <span>{requesterMessage.length}/2000</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {startTime && endTime
                        ? `Selected duration: ${formatDuration(startTime, endTime) || 'Calculating...'}`
                        : 'Select dates to calculate duration'}
                    </span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingBooking}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    {resource.requiresApproval ? 'Submit Request' : 'Reserve Now'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 mb-1">Resource Details</h2>
            <p className="text-[11px] text-slate-400 mb-4">All information provided by the resource owner</p>

            <div>
              <DetailRow
                icon={<Building2 className="h-4 w-4" aria-hidden />}
                label="Institution"
                value={resource.institutionName || 'Unknown'}
              />

              <DetailRow
                icon={<Tag className="h-4 w-4" aria-hidden />}
                label="Category"
                value={resource.categoryName || 'General'}
              />

              {resource.location ? (
                <DetailRow
                  icon={<MapPin className="h-4 w-4" aria-hidden />}
                  label="Location"
                  value={resource.location}
                />
              ) : (
                <DetailRow
                  icon={<MapPin className="h-4 w-4" aria-hidden />}
                  label="Location"
                  value={<span className="text-slate-400 italic">Not specified</span>}
                />
              )}

              <DetailRow
                icon={<User className="h-4 w-4" aria-hidden />}
                label="Owner"
                value={resource.ownerName || 'Unknown'}
              />

              <DetailRow
                icon={
                  resource.status === 'AVAILABLE' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden />
                  ) : resource.status === 'MAINTENANCE' ? (
                    <Wrench className="h-4 w-4 text-amber-600" aria-hidden />
                  ) : resource.status === 'RETIRED' ? (
                    <Archive className="h-4 w-4 text-rose-600" aria-hidden />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-slate-400" aria-hidden />
                  )
                }
                label="Status"
                value={<StatusPill status={resource.status} />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 pb-4 border-t border-slate-200">
        <Link to="/discover">
          <Button variant="secondary" size="sm" leftIcon={<Compass className="h-4 w-4" aria-hidden />}>
            Back to Discover
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchResource}
          leftIcon={<RefreshCw className="h-4 w-4" aria-hidden />}
        >
          Refresh
        </Button>
      </div>
    </div>
  );
};
