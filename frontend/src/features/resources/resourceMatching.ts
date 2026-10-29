import { ResourceMatchResponse, ResourceResponse } from './resourceTypes';

export function readSubmittedMatchRequest(formData: FormData): string {
  const value = formData.get('request');
  return typeof value === 'string' ? value.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isResourceResponse(value: unknown): value is ResourceResponse {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.institutionId === 'string'
    && typeof value.institutionName === 'string'
    && typeof value.ownerMembershipId === 'string'
    && typeof value.ownerName === 'string'
    && typeof value.categoryId === 'string'
    && typeof value.categoryName === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && (value.resourceType === 'EQUIPMENT' || value.resourceType === 'SPACE')
    && (value.conditionRating === 'NEW' || value.conditionRating === 'GOOD'
      || value.conditionRating === 'FAIR' || value.conditionRating === 'POOR')
    && (value.status === 'DRAFT' || value.status === 'AVAILABLE'
      || value.status === 'MAINTENANCE' || value.status === 'RETIRED')
    && typeof value.requiresApproval === 'boolean';
}

export function isResourceMatchResponse(value: unknown): value is ResourceMatchResponse {
  if (!isRecord(value)
      || (value.rankingMethod !== 'AI' && value.rankingMethod !== 'DETERMINISTIC')
      || typeof value.bookingWindowChecked !== 'boolean'
      || typeof value.message !== 'string'
      || !Array.isArray(value.matches)) {
    return false;
  }
  return value.matches.every((match: unknown) =>
    isRecord(match)
      && isResourceResponse(match.resource)
      && typeof match.explanation === 'string'
  );
}
