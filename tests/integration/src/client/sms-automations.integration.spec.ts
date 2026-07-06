import { RuleClient, RuleApiError } from '@rule/client';
import { createTestClient } from '../helpers/client.js';
import { testName, testEmail } from '../helpers/test-data.js';

describe('AutomationsClient — SMS', () => {
  const client = createTestClient();
  const createdIds: number[] = [];
  const createdMessageIds: number[] = [];
  const createdTemplateIds: number[] = [];
  const createdDynamicSetIds: number[] = [];

  let tagId: number;
  let bootstrapEmail: string;

  beforeAll(async () => {
    bootstrapEmail = testEmail('sms-auto-setup');
    const tagName = testName('sms-auto-trigger-tag');

    await client.subscribers.create({ email: bootstrapEmail, status: 'ACTIVE' });
    await client.subscribers.addSubscriberTag({ email: bootstrapEmail }, tagName);
    const tag = await client.tags.getByName(tagName);

    if (!tag) throw new Error(`beforeAll: trigger tag not found: ${tagName}`);
    tagId = tag.id;
  });

  afterAll(async () => {
    await Promise.allSettled(createdDynamicSetIds.map((id) => client.dynamicSets.delete(id)));
    await Promise.allSettled(createdMessageIds.map((id) => client.messages.delete(id)));
    await Promise.allSettled(createdTemplateIds.map((id) => client.templates.delete(id)));
    await Promise.allSettled(createdIds.map((id) => client.automations.delete(id)));
  });

  afterAll(async () => {
    await Promise.allSettled([
      client.tags.deleteById(tagId),
      client.subscribers.deleteByEmail(bootstrapEmail),
    ]);
  });

  describe('createSmsAutomation', () => {
    it('creates an SMS automation with name only and returns a numeric ID', async () => {
      const name = testName('sms-auto-create');
      const result = await client.automations.createSmsAutomation({ name });
      const id = result.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe(name);
    });

    it('creates an SMS automation with a TAG trigger', async () => {
      const name = testName('sms-auto-create-trigger');
      const result = await client.automations.createSmsAutomation({
        name,
        trigger: { type: 'TAG', id: tagId },
        sendoutType: 'marketing',
      });
      const id = result.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);
      expect(result.name).toBe(name);
      expect(result.trigger?.type).toBe('TAG');
      expect(result.trigger?.id).toBe(tagId);
    });
  });

  describe('setSmsAutomation', () => {
    it('upserts an SMS automation with all required fields', async () => {
      const name = testName('sms-auto-set');
      const created = await client.automations.createSmsAutomation({ name });
      const id = created.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);

      const newName = testName('sms-auto-set-upserted');
      const result = await client.automations.setSmsAutomation(id, {
        name: newName,
        active: false,
        trigger: { type: 'TAG', id: tagId },
        sendoutType: 'marketing',
      });

      expect(result.id).toBe(id);
      expect(result.name).toBe(newName);
    });
  });

  describe('updateSmsAutomation', () => {
    it('persists a partial name update', async () => {
      const name = testName('sms-auto-update');
      const created = await client.automations.createSmsAutomation({
        name,
        trigger: { type: 'TAG', id: tagId },
        sendoutType: 'marketing',
      });
      const id = created.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);

      const newName = testName('sms-auto-update-renamed');
      const updated = await client.automations.updateSmsAutomation(id, { name: newName });

      expect(updated.name).toBe(newName);

      const fetched = await client.automations.get(id);

      expect(fetched!.name).toBe(newName);
    });

    it('toggles the active flag', async () => {
      const name = testName('sms-auto-update-active');
      const created = await client.automations.createSmsAutomation({
        name,
        trigger: { type: 'TAG', id: tagId },
        sendoutType: 'marketing',
      });
      const id = created.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);

      const updated = await client.automations.updateSmsAutomation(id, { active: true });

      expect(updated.active).toBe(true);
    });
  });

  describe('get', () => {
    it('returns the automation for a known ID (round-trip)', async () => {
      const name = testName('sms-auto-get');
      const created = await client.automations.createSmsAutomation({ name });
      const id = created.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);

      const found = await client.automations.get(id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(id);
      expect(found!.name).toBe(name);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await client.automations.get(999_999_999);

      expect(result).toBeNull();
    });
  });

  describe('listAutomations', () => {
    it('includes the created SMS automation in results', async () => {
      const name = testName('sms-auto-list');
      const created = await client.automations.createSmsAutomation({ name });
      const id = created.id!;

      createdIds.push(id);
      const setup = await client.automations.createDefaultSmsMessage(id);

      createdMessageIds.push(setup.messageId);
      createdTemplateIds.push(setup.templateId);
      createdDynamicSetIds.push(setup.dynamicSetId);

      const results = await client.automations.listAllAutomations();
      const found = results.some((a) => a.id === created.id);

      expect(found).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes the automation and subsequent get returns null', async () => {
      const name = testName('sms-auto-delete');
      const created = await client.automations.createSmsAutomation({ name });

      await client.automations.delete(created.id!);

      const found = await client.automations.get(created.id!);

      expect(found).toBeNull();
    });
  });

  describe('error handling', () => {
    it('throws RuleApiError with isAuthError() when API key is invalid', async () => {
      const bad = new RuleClient({ apiKey: 'invalid-key' });

      await expect(bad.automations.listAutomations()).rejects.toSatisfy(
        (e: unknown) => e instanceof RuleApiError && e.isAuthError()
      );
    });
  });
});
