import { api } from '../../services/api';
import {
  ResourceResponse,
  CreateResourceRequest,
  UpdateResourceRequest,
  CategoryResponse,
  CreateCategoryRequest,
  ResourceType,
  ConditionRating,
  ResourceMatchRequest,
  ResourceMatchResponse,
} from './resourceTypes';

export interface DiscoverResourcesParams {
  institutionId?: string;
  search?: string;
  categoryId?: string;
  resourceType?: ResourceType;
  conditionRating?: ConditionRating;
}

export const resourceService = {
  /**
   * Retrieves resources owned by the currently authenticated user.
   * Optionally filtered by institution.
   */
  async getMyResources(institutionId?: string): Promise<ResourceResponse[]> {
    const url = institutionId
      ? `/api/resources/my?institutionId=${encodeURIComponent(institutionId)}`
      : '/api/resources/my';
    return api.get<ResourceResponse[]>(url);
  },

  /**
   * Discovers AVAILABLE resources in the caller's active institutions.
   * An institution may optionally narrow the results.
   */
  async discoverResources(params: DiscoverResourcesParams): Promise<ResourceResponse[]> {
    const query = new URLSearchParams();
    if (params.institutionId) {
      query.set('institutionId', params.institutionId);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.categoryId) {
      query.set('categoryId', params.categoryId);
    }
    if (params.resourceType) {
      query.set('resourceType', params.resourceType);
    }
    if (params.conditionRating) {
      query.set('conditionRating', params.conditionRating);
    }
    return api.get<ResourceResponse[]>(`/api/resources?${query.toString()}`);
  },

  async matchResources(request: ResourceMatchRequest, signal?: AbortSignal): Promise<ResourceMatchResponse> {
    return api.post<ResourceMatchResponse>('/api/resources/match', request, { signal });
  },

  /**
   * Retrieves full details for a single resource.
   */
  async getResourceDetails(id: string): Promise<ResourceResponse> {
    return api.get<ResourceResponse>(`/api/resources/${id}`);
  },

  /**
   * Creates a new resource under the authenticated user's membership.
   */
  async createResource(data: CreateResourceRequest): Promise<ResourceResponse> {
    return api.post<ResourceResponse>('/api/resources', data);
  },

  async uploadResourceImage(resourceId: string, file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ id: string; url: string }>(
      `/api/resources/${encodeURIComponent(resourceId)}/image`,
      formData
    );
  },

  async removeResourceImage(resourceId: string): Promise<void> {
    return api.delete<void>(`/api/resources/${encodeURIComponent(resourceId)}/image`);
  },

  /**
   * Updates an existing resource owned by the user (or as institution admin).
   */
  async updateResource(id: string, data: UpdateResourceRequest): Promise<ResourceResponse> {
    return api.put<ResourceResponse>(`/api/resources/${id}`, data);
  },

  /**
   * Deletes a resource owned by the user (or as institution admin).
   */
  async deleteResource(id: string): Promise<void> {
    return api.delete<void>(`/api/resources/${id}`);
  },

  /**
   * Lists categories for an institution.
   */
  async getCategories(institutionId: string): Promise<CategoryResponse[]> {
    return api.get<CategoryResponse[]>(`/api/institutions/${institutionId}/categories`);
  },

  /**
   * Creates a new category for an institution.
   */
  async createCategory(institutionId: string, data: CreateCategoryRequest): Promise<CategoryResponse> {
    return api.post<CategoryResponse>(`/api/institutions/${institutionId}/categories`, data);
  },
};
