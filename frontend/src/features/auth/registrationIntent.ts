export type RegistrationIntent = 'STUDENT' | 'ADMIN';

export interface RegistrationDestination {
  path: string;
  state: Record<string, string | boolean>;
}

export function getPostRegistrationDestination(intent: RegistrationIntent): RegistrationDestination {
  if (intent === 'ADMIN') {
    return {
      path: '/institutions',
      state: { registrationIntent: 'ADMIN', openCreateInstitution: true },
    };
  }
  return {
    path: '/dashboard',
    state: { registrationIntent: 'STUDENT' },
  };
}
