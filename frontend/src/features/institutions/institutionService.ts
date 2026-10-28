import { api } from '../../services/api';
import {
  InstitutionSummary,
  CreateInstitutionRequest,
  InstitutionDetail,
  InstitutionMember,
} from './institutionTypes';

export const institutionService = {
  /**
   * Lists all institutions where the authenticated user holds membership.
   */
  async listMyInstitutions(): Promise<InstitutionSummary[]> {
    return api.get<InstitutionSummary[]>('/api/institutions');
  },

  /**
   * Creates a new institution and automatically assigns the creator as initial INSTITUTION_ADMIN.
   * Mutating call requiring X-XSRF-TOKEN CSRF verification.
   */
  async createInstitution(data: CreateInstitutionRequest): Promise<InstitutionDetail> {
    return api.post<InstitutionDetail>('/api/institutions', data);
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
