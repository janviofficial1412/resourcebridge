import { ResourceType } from '../resources/resourceTypes';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';

export interface BookingResponse {
  id: string;
  institutionId: string;
  institutionName: string;
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  requesterMembershipId: string;
  requesterUserId: string;
  requesterName: string;
  ownerMembershipId?: string | null;
  ownerUserId?: string | null;
  ownerName?: string | null;
  status: BookingStatus;
  startTime: string; // ISO-8601 string
  endTime: string;   // ISO-8601 string
  requesterMessage?: string | null;
  decisionMessage?: string | null;
  decidedByMembershipId?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingRequest {
  resourceId: string;
  startTime: string; // ISO-8601 string
  endTime: string;   // ISO-8601 string
  requesterMessage?: string;
}

export interface DecisionRequest {
  decisionMessage?: string;
}
