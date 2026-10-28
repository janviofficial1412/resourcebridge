export type ResourceType = 'EQUIPMENT' | 'SPACE';
export type ConditionRating = 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
export type ResourceStatus = 'DRAFT' | 'AVAILABLE' | 'MAINTENANCE' | 'RETIRED';

export interface ResourceCategory {
  id: string;
  institutionId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  id: string;
  institutionId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface ResourceResponse {
  id: string;
  institutionId: string;
  institutionName: string;
  ownerMembershipId: string;
  ownerName: string;
  categoryId: string;
  categoryName: string;
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
}

export interface CreateResourceRequest {
  institutionId: string;
  categoryId: string;
  name: string;
  description?: string;
  resourceType: ResourceType;
  location?: string;
  conditionRating?: ConditionRating;
  status?: ResourceStatus;
  requiresApproval?: boolean;
  maxBookingMinutes?: number;
}

export interface UpdateResourceRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  resourceType?: ResourceType;
  location?: string;
  conditionRating?: ConditionRating;
  status?: ResourceStatus;
  requiresApproval?: boolean;
  maxBookingMinutes?: number;
}
