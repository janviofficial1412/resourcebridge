import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Shield,
  MessageSquare,
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

type FilterOption = 'ALL' | BookingStatus | 'COMPLETED';

const FILTER_TABS: { label: string; value: FilterOption }[] = [
  { label: 'All Bookings', value: 'ALL' },
  { label: 'Pending Approval', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

function BookingStatusBadge({ booking }: { booking: BookingResponse }) {
  const { status, endTime } = booking;
  if (status === 'CONFIRMED' && new Date(endTime).getTime() < Date.now()) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
        <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" aria-hidden />
        Completed
      </span>
    );
  }
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

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal State
  const [bookingToCancel, setBookingToCancel] = useState<BookingResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statusParam = selectedFilter === 'ALL' || selectedFilter === 'COMPLETED'
        ? undefined
        : selectedFilter;
      const data = await bookingService.getMyBookings(statusParam);
      setBookings(selectedFilter === 'COMPLETED'
        ? data.filter((booking) =>
          booking.status === 'CONFIRMED' && new Date(booking.endTime).getTime() < Date.now())
        : data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message || 'Failed to load bookings.');
      } else {
        setError('Network error: Unable to connect to the booking service.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      await bookingService.cancelBooking(bookingToCancel.id);
      setActionSuccessNotice(`Booking for "${bookingToCancel.resourceName}" was cancelled.`);
      setBookingToCancel(null);
      await fetchBookings();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setCancelError(err.message || 'Failed to cancel the booking.');
      } else {
        setCancelError('Network error: Unable to process cancellation.');
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const isCancellable = (booking: BookingResponse): boolean => {
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
      return false;
    }
    const end = new Date(booking.endTime).getTime();
    return end > Date.now();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track, review, and manage your equipment reservations and space requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/discover">
            <Button variant="primary" size="sm" leftIcon={<Compass className="h-4 w-4" />}>
              Discover Resources
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchBookings}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
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

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading your bookings…" />
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <ErrorState
          title="Unable to load bookings"
          message={error}
          onRetry={fetchBookings}
        />
      )}

      {/* Empty state */}
      {!isLoading && !error && bookings.length === 0 && (
        selectedFilter === 'ALL' ? (
          <EmptyState
            icon={<Calendar className="h-6 w-6" />}
            title="No bookings found"
            description="You haven't requested or reserved any resources yet. Explore available equipment and spaces across your institutions."
            actionLabel="Discover Resources"
            actionHref="/discover"
          />
        ) : (
          <EmptyState
            icon={<Calendar className="h-6 w-6" />}
            title={`No ${selectedFilter.toLowerCase()} bookings`}
            description={`You do not have any bookings currently with "${selectedFilter}" status.`}
            actionLabel="Show All Bookings"
            onAction={() => setSelectedFilter('ALL')}
          />
        )
      )}

      {/* Bookings List */}
      {!isLoading && !error && bookings.length > 0 && (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="space-y-4 rounded-2xl border border-[#e7e5df] bg-white p-5 shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5 sm:p-6"
            >
              {/* Header row: resource, institution, status */}
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

                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{booking.institutionName}</span>
                    {booking.ownerName && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span>Owner: {booking.ownerName}</span>
                      </>
                    )}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <BookingStatusBadge booking={booking} />
                </div>
              </div>

              {/* Schedule and details row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Scheduled Window
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
                    Request Details
                  </span>
                  <div className="text-slate-700">
                    <span>Requested on: </span>
                    <strong className="font-semibold text-slate-800">{formatDateOnly(booking.createdAt)}</strong>
                  </div>
                  {booking.cancelledAt && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Cancelled on: {formatDateTime(booking.cancelledAt)}
                    </div>
                  )}
                  {booking.decidedAt && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Decided on: {formatDateTime(booking.decidedAt)}{booking.decidedByName ? ` by ${booking.decidedByName}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Requester note (if submitted) */}
              {booking.requesterMessage && (
                <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-1">
                    <MessageSquare className="h-3 w-3" />
                    Your Note to Owner
                  </span>
                  <p className="italic text-slate-700 leading-relaxed whitespace-pre-line">
                    "{booking.requesterMessage}"
                  </p>
                </div>
              )}

              {/* Decision note (if rejected or approved with message) */}
              {booking.decisionMessage && (
                <div className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-1">
                    <Shield className="h-3 w-3 text-amber-600" />
                    Owner Decision Note {booking.decidedByName ? `(from ${booking.decidedByName})` : ''}
                  </span>
                  <p className="text-amber-900 leading-relaxed whitespace-pre-line">
                    "{booking.decisionMessage}"
                  </p>
                </div>
              )}

              {/* Actions footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <Link
                  to={`/resources/${booking.resourceId}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  View Resource Details
                  <ArrowRight className="h-3 w-3" />
                </Link>

                {isCancellable(booking) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCancelError(null);
                      setBookingToCancel(booking);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {bookingToCancel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Cancel Booking Reservation</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to cancel your reservation for{' '}
                  <strong className="text-slate-800">{bookingToCancel.resourceName}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600 border border-slate-200">
              <div>
                <span className="text-slate-400">Scheduled: </span>
                <span className="font-semibold text-slate-800">
                  {formatDateTimeRange(bookingToCancel.startTime, bookingToCancel.endTime)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Status: </span>
                <span className="font-semibold text-slate-800">{bookingToCancel.status}</span>
              </div>
            </div>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBookingToCancel(null)}
                disabled={isCancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmCancel}
                isLoading={isCancelling}
                className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
