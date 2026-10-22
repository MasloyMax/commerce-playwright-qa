export const demoUser = { email: 'demo@example.test', password: 'Demo-pass-123' } as const;

export type Customer = { name: string; address: string };

export function customer(overrides: Partial<Customer> = {}): Customer {
  return { name: 'Alex Example', address: '42 Test Street', ...overrides };
}
