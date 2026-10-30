import { api } from '../../services/api';
import {
  BookingResponse,
  BookingStatus,
  CreateBookingRequest,
  DecisionRequest,
} from './bookingTypes';

export const bookingService = {
  /**
   * Submit a new booking request.
   */
  createBooking: async (request: CreateBookingRequest): Promise<BookingResponse> => {
    return api.post<BookingResponse>('/api/bookings', request);
  },

  /**
   * Fetch all bookings requested by the current authenticated user.
   */
  getMyBookings: async (status?: BookingStatus): Promise<BookingResponse[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return api.get<BookingResponse[]>(`/api/bookings/my${query}`);
  },

  /**
   * Fetch detailed information for a specific booking.
   */
  getBookingDetails: async (id: string): Promise<BookingResponse> => {
    return api.get<BookingResponse>(`/api/bookings/${id}`);
  },

  /**
   * Fetch incoming bookings for resources owned by the user (or managed by institution admin).
   */
  getIncomingBookings: async (
    status?: BookingStatus,
    institutionId?: string
  ): Promise<BookingResponse[]> => {
    const params = new URLSearchParams();
    if (status) {
      params.append('status', status);
    }
    if (institutionId) {
      params.append('institutionId', institutionId);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<BookingResponse[]>(`/api/bookings/incoming${query}`);
  },

  getResourceHistory: async (resourceId: string): Promise<BookingResponse[]> => {
    return api.get<BookingResponse[]>(
      `/api/bookings/resource/${encodeURIComponent(resourceId)}`
    );
  },

  getMemberHistory: async (
    institutionId: string,
    membershipId: string
  ): Promise<BookingResponse[]> => {
    return api.get<BookingResponse[]>(
      `/api/bookings/institution/${encodeURIComponent(institutionId)}/member/${encodeURIComponent(membershipId)}`
    );
  },

  /**
   * Approve a pending booking request.
   */
  approveBooking: async (
    id: string,
    decisionMessage?: string
  ): Promise<BookingResponse> => {
    const body: DecisionRequest | undefined = decisionMessage
      ? { decisionMessage }
      : undefined;
    return api.post<BookingResponse>(`/api/bookings/${id}/approve`, body);
  },

  /**
   * Reject a pending booking request.
   */
  rejectBooking: async (
    id: string,
    decisionMessage?: string
  ): Promise<BookingResponse> => {
    const body: DecisionRequest | undefined = decisionMessage
      ? { decisionMessage }
      : undefined;
    return api.post<BookingResponse>(`/api/bookings/${id}/reject`, body);
  },

  /**
   * Cancel an active booking requested by the user.
   */
  cancelBooking: async (id: string): Promise<BookingResponse> => {
    return api.post<BookingResponse>(`/api/bookings/${id}/cancel`);
  },
};
