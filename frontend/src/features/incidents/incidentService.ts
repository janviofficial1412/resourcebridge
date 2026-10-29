import { api } from '../../services/api';

export interface IncidentReport {
  id: string;
  institutionId: string;
  institutionName: string;
  reporterMembershipId: string;
  reporterName: string;
  reportText: string;
  createdAt: string;
}

export interface IncidentSummary {
  incidentId: string;
  aiGenerated: true;
  requiresHumanReview: true;
  label: string;
  incidentSummary: string;
  reportedIssue: string;
  reportedDelay: string;
  evidenceMentioned: string;
  suggestedNextAction: string;
  missingInformation: string;
}

export const incidentService = {
  create(institutionId: string, reportText: string): Promise<IncidentReport> {
    return api.post<IncidentReport>(
      `/api/institutions/${encodeURIComponent(institutionId)}/incidents`,
      { reportText }
    );
  },

  get(incidentId: string): Promise<IncidentReport> {
    return api.get<IncidentReport>(`/api/incidents/${encodeURIComponent(incidentId)}`);
  },

  summarize(incidentId: string): Promise<IncidentSummary> {
    return api.post<IncidentSummary>(
      `/api/incidents/${encodeURIComponent(incidentId)}/summary`,
      {}
    );
  },
};
