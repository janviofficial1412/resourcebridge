import { describe, expect, it } from 'vitest';
import { getPostRegistrationDestination } from './registrationIntent';

describe('registration intent onboarding', () => {
  it('sends student registrants to membership discovery without implying active access', () => {
    expect(getPostRegistrationDestination('STUDENT')).toEqual({
      path: '/dashboard',
      state: { registrationIntent: 'STUDENT' },
    });
  });

  it('opens institution creation for administrator-intent registrants', () => {
    expect(getPostRegistrationDestination('ADMIN')).toEqual({
      path: '/institutions',
      state: { registrationIntent: 'ADMIN', openCreateInstitution: true },
    });
  });
});
