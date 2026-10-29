import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  User,
  MessageSquare,
  Check,
  X,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { bookingService } from '../features/bookings/bookingService';
import { BookingResponse, BookingStatus } from '../features/bookings/bookingTypes';
import {
  formatDateTime,
  formatDateTimeRange,
  formatDuration,
  formatDateOnly,
} from '../features/bookings/bookingUtils';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { Loader } from '../components/ui/Loader';
import { ApiClientError } from '../services/api';

type FilterOption = 'ALL' | BookingStatus;

const FILTER_TABS: { label: string; value: FilterOption }[] = [
  { label: 'Pending Approval', value: 'PENDING' },
  { label: 'All Requests', value: 'ALL' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function StatusBadge({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
          Confirmed
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden />
          Pending Approval
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden />
          Rejected
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Ban className="h-3.5 w-3.5 text-slate-500" aria-hidden />
          Cancelled
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
}

export const IncomingBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Approval Modal State
  const [bookingToApprove, setBookingToApprove] = useState<BookingResponse | null>(null);
  const [approveMessage, setApproveMessage] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Rejection Modal State
  const [bookingToReject, setBookingToReject] = useState<BookingResponse | null>(null);
  const [rejectMessage, setRejectMessage] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const fetchIncomingBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = selectedFilter === 'ALL' ? undefined : selectedFilter;
      const data = await bookingService.getIncomingBookings(statusParam);
      setBookings(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load incoming booking requests.');
      } else {
        setError('Network error: Unable to connect to the booking service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchIncomingBookings();
  }, [fetchIncomingBookings]);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!bookingToApprove) return;
    setIsApproving(true);
    setApproveError(null);

    try {
      await bookingService.approveBooking(
        bookingToApprove.id,
        approveMessage.trim() || undefined
      );
      setNotification(`Approved request for "${bookingToApprove.resourceName}" from ${bookingToApprove.requesterName}.`);
      setBookingToApprove(null);
      setApproveMessage('');
      await fetchIncomingBookings();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.isConflict || err.status === 409) {
          setApproveError('Conflict: This resource already has an overlapping confirmed reservation. Approval cannot be completed.');
        } else {
          setApproveError(err.message || 'Failed to approve booking request.');
        }
      } else {
        setApproveError('Network error: Unable to reach the server.');
      }
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!bookingToReject) return;
    setIsRejecting(true);
    setRejectError(null);

    try {
      await bookingService.rejectBooking(
        bookingToReject.id,
        rejectMessage.trim() || undefined
      );
      setNotification(`Rejected request for "${bookingToReject.resourceName}" from ${bookingToReject.requesterName}.`);
      setBookingToReject(null);
      setRejectMessage('');
      await fetchIncomingBookings();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setRejectError(err.message || 'Failed to reject booking request.');
      } else {
        setRejectError('Network error: Unable to reach the server.');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Incoming Booking Requests</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review and respond to reservation requests for equipment and spaces you manage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchIncomingBookings}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <SlidersHorizontal className="h-4 w-4 text-slate-400 mr-2 shrink-0 hidden sm:block" />
        {FILTER_TABS.map((tab) => {
          const active = selectedFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedFilter(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active
                  ? 'bg-brand-50 text-brand-700 border border-brand-200 shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading incoming requests…" />
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load incoming requests"
          message={error}
          onRetry={fetchIncomingBookings}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && bookings.length === 0 && (
        selectedFilter === 'PENDING' ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No pending requests"
            description="You do not have any incoming booking requests waiting for approval right now."
            actionLabel="View All Requests"
            onAction={() => setSelectedFilter('ALL')}
          />
        ) : (
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No incoming requests found"
            description={`No requests matched the "${selectedFilter}" status filter.`}
            actionLabel="Show Pending Requests"
            onAction={() => setSelectedFilter('PENDING')}
          />
        )
      )}

      {/* Requests List */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs hover:border-brand-200 hover:shadow-xs transition-all space-y-4"
            >
              {/* Header: Resource name, Requester, Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/resources/${booking.resourceId}`}
                      className="text-base font-bold text-slate-900 hover:text-brand-600 transition-colors flex items-center gap-1.5 group"
                    >
                      <span>{booking.resourceName}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand-600 transition-colors" />
                    </Link>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                      {booking.resourceType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span className="font-medium text-slate-800">
                      {booking.requesterName || 'Unknown User'}
                    </span>
                    <span className="text-slate-300">·</span>
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500">{booking.institutionName}</span>
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={booking.status} />
                </div>
              </div>

              {/* Booking schedule & timing info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Requested Time Window
                  </span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                    <span>{formatDateTimeRange(booking.startTime, booking.endTime)}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Duration: {formatDuration(booking.startTime, booking.endTime)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Request Info
                  </span>
                  <div className="text-slate-700">
                    <span>Submitted: </span>
                    <strong className="font-semibold text-slate-800">{formatDateOnly(booking.createdAt)}</strong>
                  </div>
                  {booking.decidedAt && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Decided: {formatDateTime(booking.decidedAt)}{booking.decidedByName ? ` by ${booking.decidedByName}` : ''}
                    </div>
                  )}
                  {booking.cancelledAt && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Cancelled by requester: {formatDateTime(booking.cancelledAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Requester Message */}
              {booking.requesterMessage && (
                <div className="text-xs text-slate-700 bg-sky-50/50 p-3.5 rounded-xl border border-sky-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-800 flex items-center gap-1.5 mb-1">
                    <MessageSquare className="h-3 w-3 text-sky-600" />
                    Requester Note
                  </span>
                  <p className="italic text-slate-800 leading-relaxed whitespace-pre-line">
                    "{booking.requesterMessage}"
                  </p>
                </div>
              )}

              {/* Decision Note (if already decided) */}
              {booking.decisionMessage && (
                <div className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 block mb-0.5">
                    Decision Message:
                  </span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                    "{booking.decisionMessage}"
                  </p>
                </div>
              )}

              {/* Action Buttons for PENDING requests */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <Link
                  to={`/resources/${booking.resourceId}`}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                >
                  View Resource
                  <ArrowRight className="h-3 w-3" />
                </Link>

                {booking.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRejectError(null);
                        setRejectMessage('');
                        setBookingToReject(booking);
                      }}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      leftIcon={<X className="h-3.5 w-3.5" />}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setApproveError(null);
                        setApproveMessage('');
                        setBookingToApprove(booking);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
                      leftIcon={<Check className="h-3.5 w-3.5" />}
                    >
                      Approve Request
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {bookingToApprove && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Approve Booking Request</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Confirm reservation for <strong className="text-slate-800">{bookingToApprove.resourceName}</strong> requested by{' '}
                  <strong className="text-slate-800">{bookingToApprove.requesterName}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div>
                <span className="text-slate-400">Scheduled: </span>
                <span className="font-semibold text-slate-800">
                  {formatDateTimeRange(bookingToApprove.startTime, bookingToApprove.endTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Duration: </span>
                <span className="text-slate-800">
                  {formatDuration(bookingToApprove.startTime, bookingToApprove.endTime)}
                </span>
              </div>
              {bookingToApprove.requesterMessage && (
                <div className="pt-1 text-[11px] text-slate-500 italic">
                  Note: "{bookingToApprove.requesterMessage}"
                </div>
              )}
            </div>

            <div>
              <label htmlFor="approve-message" className="block text-xs font-semibold text-slate-700 mb-1">
                Instructions or Note to Requester <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="approve-message"
                rows={3}
                maxLength={2000}
                value={approveMessage}
                onChange={(e) => setApproveMessage(e.target.value)}
                placeholder="Include access codes, pickup location, safety instructions, or contact details..."
                disabled={isApproving}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none resize-none"
              />
            </div>

            {approveError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{approveError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBookingToApprove(null)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApprove}
                isLoading={isApproving}
                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
                leftIcon={<Check className="h-3.5 w-3.5" />}
              >
                Confirm Approval
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Confirmation Modal */}
      {bookingToReject && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Booking Request</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Decline request for <strong className="text-slate-800">{bookingToReject.resourceName}</strong> from{' '}
                  <strong className="text-slate-800">{bookingToReject.requesterName}</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600 border border-slate-200">
              <div>
                <span className="text-slate-400">Scheduled: </span>
                <span className="font-semibold text-slate-800">
                  {formatDateTimeRange(bookingToReject.startTime, bookingToReject.endTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Duration: </span>
                <span className="text-slate-800">
                  {formatDuration(bookingToReject.startTime, bookingToReject.endTime)}
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="reject-message" className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="reject-message"
                rows={3}
                maxLength={2000}
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                placeholder="Explain why this request is being declined (e.g. maintenance, scheduling conflict, etc.)..."
                disabled={isRejecting}
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 focus:outline-none resize-none"
              />
            </div>

            {rejectError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBookingToReject(null)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmReject}
                isLoading={isRejecting}
                className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                leftIcon={<X className="h-3.5 w-3.5" />}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
