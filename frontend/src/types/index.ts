/**
 * Core domain types reflecting backend models and schema definitions.
 */

// ==================== User & Identity ====================

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface LoginResponse {
  email: string;
}

// ==================== Error Handling ====================

export interface FieldProblem {
  field: string;
  message: string;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
  fieldErrors: FieldProblem[];
}

// ==================== Institutions & Memberships ====================

export type InstitutionStatus = 'ACTIVE' | 'SUSPENDED';

export interface Institution {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: InstitutionStatus;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole = 
  | 'INSTITUTION_ADMIN'
  | 'RESOURCE_OWNER'
  | 'TRAINER'
  | 'MEMBER'
  | 'BORROWER';

export type MembershipStatus = 
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'REJECTED';

export interface Membership {
  id: string;
  userId: string;
  institutionId: string;
  role: MembershipRole;
  status: MembershipStatus;
  verifiedByMembershipId?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: AppUser;
  institution?: Institution;
}

// ==================== Resource Categories & Resources ====================

export interface ResourceCategory {
  id: string;
  institutionId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type ResourceType = 'EQUIPMENT' | 'SPACE';
export type ConditionRating = 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ResourceStatus = 'DRAFT' | 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';

export interface Resource {
  id: string;
  institutionId: string;
  ownerMembershipId: string;
  categoryId: string;
  name: string;
  description: string;
  resourceType: ResourceType;
  location?: string | null;
  conditionRating: ConditionRating;
  status: ResourceStatus;
  requiresApproval: boolean;
  maxBookingMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  institutionName?: string;
}
