import { describe, expect, it } from 'vitest';
import { isResourceMatchResponse, readSubmittedMatchRequest } from './resourceMatching';

describe('resource matching form submission', () => {
  it('uses the latest submitted request without requiring a trailing space', () => {
    const formData = new FormData();
    formData.set('request', 'I need a laptop for Python development');

    expect(readSubmittedMatchRequest(formData)).toBe('I need a laptop for Python development');
  });

  it('rejects malformed matching responses instead of treating them as empty results', () => {
    expect(isResourceMatchResponse({ matches: [] })).toBe(false);
    expect(isResourceMatchResponse({
      rankingMethod: 'AI',
      bookingWindowChecked: false,
      message: 'No eligible resources matched.',
      matches: [],
    })).toBe(true);
  });
});
