import { api } from '../../services/api';

export interface DashboardData {
  institutionId: string;
  institutionName: string;
  role: 'ADMIN' | 'MEMBER';
  totalResources: number;
  availableResources: number;
  pendingBookingRequests: number;
  activeStudents: number;
  pendingIncidents: number;
  myBookings: number;
  myPendingBookings: number;
  myIncidents: number;
}

export const dashboardService = {
  get(institutionId: string): Promise<DashboardData> {
    const query = new URLSearchParams({ institutionId });
    return api.get<DashboardData>(`/api/dashboard?${query.toString()}`);
  },
};
