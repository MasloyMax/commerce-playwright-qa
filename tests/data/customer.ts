export const demoUser = { email: 'demo@example.test', password: 'Demo-pass-123' } as const;
export function customer(overrides: Partial<{ name: string; address: string }> = {}) {
  return { name: 'Alex Example', address: '42 Test Street', ...overrides };
}
