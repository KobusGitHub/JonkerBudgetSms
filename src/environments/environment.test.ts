import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test('disables SMS for the Hosting build', async () => {
  vi.stubEnv('VITE_SMS_ENABLED', 'false');
  vi.resetModules();
  const { environment } = await import('./environment');
  expect(environment.smsEnabled).toBe(false);
});

test('keeps SMS enabled by default', async () => {
  vi.stubEnv('VITE_SMS_ENABLED', 'true');
  vi.resetModules();
  const { environment } = await import('./environment');
  expect(environment.smsEnabled).toBe(true);
});