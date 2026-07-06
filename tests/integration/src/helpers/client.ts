import { RuleClient } from '@rule/client';

export function createTestClient(): RuleClient {
  const apiKey = process.env['RULE_API_KEY'];

  if (!apiKey) throw new Error('RULE_API_KEY is required for integration tests');

  return new RuleClient({ apiKey });
}
