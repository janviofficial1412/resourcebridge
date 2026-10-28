/**
 * Types specific to institutions, memberships, and institution administrative actions.
 */

export interface InstitutionSummary {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
  role: string;
  membershipStatus: string;
  createdAt: string;
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
  role: string;
  membershipStatus: string;
  memberCount: number;
  createdAt: string;
}

export interface InstitutionMember {
  id: string;
  username: string;
  fullName: string;
  role: string;
  status: string;
  verifiedAt?: string | null;
  createdAt: string;
}
