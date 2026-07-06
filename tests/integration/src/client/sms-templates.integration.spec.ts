import { RuleClient, RuleApiError } from '@rule/client';
import { createSmsDocument } from '@rule/rcml';
import { createTestClient } from '../helpers/client.js';
import { testName } from '../helpers/test-data.js';

const minimalSmsDoc = createSmsDocument({ content: 'Hello from integration test' });

describe('TemplatesClient — SMS', () => {
  const client = createTestClient();
  const createdIds: number[] = [];

  afterAll(async () => {
    await Promise.allSettled(createdIds.map((id) => client.templates.delete(id)));
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('createSmsTemplate', () => {
    it('creates an SMS template and returns a numeric ID', async () => {
      const name = testName('sms-tmpl-create');
      const result = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(result.id);
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe(name);
      expect(result.messageType).toBe('text_message');
    });

    it('creates an SMS template with only required fields', async () => {
      const name = testName('sms-tmpl-create-min');
      const result = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(result.id);
      expect(typeof result.id).toBe('number');
    });
  });

  // ── get ───────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the template for a known ID (round-trip)', async () => {
      const name = testName('sms-tmpl-get');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(created.id);

      const found = await client.templates.get(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.name).toBe(name);
      expect(found!.messageType).toBe('text_message');
    });

    it('returns null for a non-existent ID', async () => {
      const result = await client.templates.get(999_999_999);

      expect(result).toBeNull();
    });
  });

  // ── list ──────────────────────────────────────────────────────────────────

  describe('listTemplates', () => {
    it('returns an array of templates', async () => {
      const results = await client.templates.listTemplates();

      expect(Array.isArray(results)).toBe(true);
    });

    it('includes the created SMS template in results', async () => {
      const name = testName('sms-tmpl-list');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(created.id);

      const results = await client.templates.listAllTemplates();
      const found = results.some((t: { id: number }) => t.id === created.id);

      expect(found).toBe(true);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('updateSmsTemplate', () => {
    // NOTE: The Rule.io API requires message_type on PUT /editor/template but
    // updateSmsTemplate does not include it. This is a known client limitation.
    // The test below documents the current API contract expectation.
    it.todo('persists an updated name (blocked: API requires message_type on PUT)');
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the template and subsequent get returns null', async () => {
      const name = testName('sms-tmpl-delete');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      await client.templates.delete(created.id);

      const found = await client.templates.get(created.id);

      expect(found).toBeNull();
    });
  });

  // ── error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws RuleApiError with isAuthError() when API key is invalid', async () => {
      const bad = new RuleClient({ apiKey: 'invalid-key' });

      await expect(bad.templates.listTemplates()).rejects.toSatisfy(
        (e: unknown) => e instanceof RuleApiError && e.isAuthError()
      );
    });
  });
});
