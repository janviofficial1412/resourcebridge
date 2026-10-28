import { api } from '../../services/api';
import {
  ResourceResponse,
  CreateResourceRequest,
  UpdateResourceRequest,
  CategoryResponse,
  CreateCategoryRequest,
} from './resourceTypes';

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
