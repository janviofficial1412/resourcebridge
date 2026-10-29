/**
 * Types specific to institutions, memberships, and institution administrative actions.
 */

import type { MembershipRole } from '../../types';

export interface InstitutionSummary {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
  role: MembershipRole;
  membershipStatus: string;
  createdAt: string;
  logoId?: string | null;
}

export interface CreateInstitutionRequest {
  name: string;
  slug: string;
  timezone?: string;
}

export interface InstitutionDetail {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
  role: MembershipRole;
  membershipStatus: string;
  memberCount: number;
  createdAt: string;
  logoId?: string | null;
}

export interface InstitutionMember {
  id: string;
  username: string;
  fullName: string;
  role: MembershipRole;
  status: string;
  verifiedAt?: string | null;
  createdAt: string;
}
