export const ts = Date.now();
export const testName = (label: string) => `[test-integration] ${label}-${ts}`;
export const testEmail = (label: string) => `test-integration+${label}-${ts}@example.com`;
