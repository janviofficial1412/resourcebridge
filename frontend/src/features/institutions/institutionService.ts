import { api } from '../../services/api';
import {
  InstitutionSummary,
  CreateInstitutionRequest,
  InstitutionDetail,
  InstitutionMember,
} from './institutionTypes';

export const institutionService = {
  /**
   * Lists institutions where the authenticated user has an active membership.
   */
  async listMyInstitutions(): Promise<InstitutionSummary[]> {
    return api.get<InstitutionSummary[]>('/api/institutions');
  },

  /**
   * Creates a new institution and assigns the creator as its initial ADMIN.
   * Mutating call requiring X-XSRF-TOKEN CSRF verification.
   */
  async createInstitution(data: CreateInstitutionRequest): Promise<InstitutionDetail> {
    return api.post<InstitutionDetail>('/api/institutions', data);
  },

  async uploadInstitutionLogo(institutionId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await api.post<void>(
      `/api/institutions/${encodeURIComponent(institutionId)}/logo`,
      formData
    );
  },

  async removeInstitutionLogo(institutionId: string): Promise<void> {
    return api.delete<void>(`/api/institutions/${encodeURIComponent(institutionId)}/logo`);
  },

  /**
   * Retrieves full details for an institution accessible to the authenticated user.
   */
  async getInstitutionDetails(id: string): Promise<InstitutionDetail> {
    return api.get<InstitutionDetail>(`/api/institutions/${id}`);
  },

  /**
   * Lists members of an institution accessible to the authenticated user.
   */
  async getInstitutionMembers(id: string): Promise<InstitutionMember[]> {
    return api.get<InstitutionMember[]>(`/api/institutions/${id}/members`);
  },
};
