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
    it('persists an updated name', async () => {
      const name = testName('sms-tmpl-update');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(created.id);

      const newName = testName('sms-tmpl-update-renamed');
      const updated = await client.templates.updateSmsTemplate(created.id, { name: newName });

      expect(updated.name).toBe(newName);

      const fetched = await client.templates.get(created.id);

      expect(fetched!.name).toBe(newName);
    });

    it('persists updated content', async () => {
      const name = testName('sms-tmpl-update-content');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      createdIds.push(created.id);

      const newContent = createSmsDocument({ content: 'Updated content for integration test' });
      const updated = await client.templates.updateSmsTemplate(created.id, { content: newContent });

      expect(updated.id).toBe(created.id);
    });
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
