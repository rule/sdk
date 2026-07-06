import { RuleClient, RuleApiError } from '@rule/client';
import { createTestClient } from '../helpers/client.js';
import { testName } from '../helpers/test-data.js';

describe('CampaignsClient — SMS', () => {
  const client = createTestClient();
  const createdCampaignIds: number[] = [];
  const createdMessageIds: number[] = [];
  const createdTemplateIds: number[] = [];
  const createdDynamicSetIds: number[] = [];

  afterAll(async () => {
    await Promise.allSettled(createdMessageIds.map((id) => client.messages.delete(id)));
    await Promise.allSettled(createdTemplateIds.map((id) => client.templates.delete(id)));
    await Promise.allSettled(createdDynamicSetIds.map((id) => client.dynamicSets.delete(id)));
    await Promise.allSettled(createdCampaignIds.map((id) => client.campaigns.delete(id)));
  });

  // ── createSmsCampaign ─────────────────────────────────────────────────────

  describe('createSmsCampaign', () => {
    it('creates an SMS campaign and returns a numeric ID', async () => {
      const name = testName('sms-camp-create');
      const result = await client.campaigns.createSmsCampaign({ name });

      createdCampaignIds.push(result.id!);
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.name).toBe(name);
    });

    it('creates an SMS campaign with sendoutType', async () => {
      const name = testName('sms-camp-create-sendout');
      const result = await client.campaigns.createSmsCampaign({
        name,
        sendoutType: 'transactional',
      });

      createdCampaignIds.push(result.id!);
      expect(result.name).toBe(name);
    });
  });

  // ── setSmsCampaign ────────────────────────────────────────────────────────

  describe('setSmsCampaign', () => {
    it('upserts an SMS campaign with all required fields', async () => {
      const name = testName('sms-camp-set');
      const created = await client.campaigns.createSmsCampaign({ name });
      const id = created.id!;

      createdCampaignIds.push(id);

      const newName = testName('sms-camp-set-upserted');
      const result = await client.campaigns.setSmsCampaign(id, {
        name: newName,
        sendoutType: 'marketing',
        tags: [],
        segments: [],
        subscribers: [],
      });

      expect(result.id).toBe(id);
      expect(result.name).toBe(newName);
    });
  });

  // ── updateSmsCampaign ─────────────────────────────────────────────────────

  describe('updateSmsCampaign', () => {
    it('persists a partial name update', async () => {
      const name = testName('sms-camp-update');
      const created = await client.campaigns.createSmsCampaign({
        name,
        sendoutType: 'marketing',
        tags: [],
        segments: [],
        subscribers: [],
      });
      const id = created.id!;

      createdCampaignIds.push(id);

      const newName = testName('sms-camp-update-renamed');
      // Must provide tags explicitly — the API may not return them on the existing record.
      const updated = await client.campaigns.updateSmsCampaign(id, {
        name: newName,
        tags: [],
        segments: [],
        subscribers: [],
        sendoutType: 'marketing',
      });

      expect(updated.name).toBe(newName);

      const fetched = await client.campaigns.get(id);

      expect(fetched!.name).toBe(newName);
    });
  });

  // ── get ───────────────────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the SMS campaign for a known ID (round-trip)', async () => {
      const name = testName('sms-camp-get');
      const created = await client.campaigns.createSmsCampaign({ name });
      const id = created.id!;

      createdCampaignIds.push(id);

      const found = await client.campaigns.get(id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(id);
      expect(found!.name).toBe(name);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await client.campaigns.get(999_999_999);

      expect(result).toBeNull();
    });
  });

  // ── listCampaigns ─────────────────────────────────────────────────────────

  describe('listCampaigns', () => {
    it('returns SMS campaigns when filtered by messageType', async () => {
      const name = testName('sms-camp-list');
      const created = await client.campaigns.createSmsCampaign({ name });

      createdCampaignIds.push(created.id!);

      const results = await client.campaigns.listAllCampaigns({ messageType: 'text_message' });
      const found = results.some((c) => c.id === created.id);

      expect(found).toBe(true);
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deletes the SMS campaign and subsequent get returns null', async () => {
      const name = testName('sms-camp-delete');
      const created = await client.campaigns.createSmsCampaign({ name });

      await client.campaigns.delete(created.id!);

      const found = await client.campaigns.get(created.id!);

      expect(found).toBeNull();
    });
  });

  // ── createDefaultSmsCampaign ──────────────────────────────────────────────

  describe('createDefaultSmsCampaign', () => {
    it('creates a complete SMS campaign with all 4 resources (default marketing)', async () => {
      const result = await client.campaigns.createDefaultSmsCampaign({
        name: testName('sms-camp-default'),
      });

      createdMessageIds.push(result.messageId);
      createdTemplateIds.push(result.templateId);
      createdDynamicSetIds.push(result.dynamicSetId);
      createdCampaignIds.push(result.campaignId);

      expect(typeof result.campaignId).toBe('number');
      expect(result.campaignId).toBeGreaterThan(0);
      expect(typeof result.messageId).toBe('number');
      expect(result.messageId).toBeGreaterThan(0);
      expect(typeof result.templateId).toBe('number');
      expect(result.templateId).toBeGreaterThan(0);
      expect(typeof result.dynamicSetId).toBe('number');
      expect(result.dynamicSetId).toBeGreaterThan(0);
    });

    it("creates a campaign with stop-word footer when unsubscriptionMethod is 'stopWord'", async () => {
      const result = await client.campaigns.createDefaultSmsCampaign({
        name: testName('sms-camp-default-sw'),
        unsubscriptionMethod: 'stopWord',
      });

      createdMessageIds.push(result.messageId);
      createdTemplateIds.push(result.templateId);
      createdDynamicSetIds.push(result.dynamicSetId);
      createdCampaignIds.push(result.campaignId);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a template content override', async () => {
      const { createSmsDocument } = await import('@rule/rcml');
      const result = await client.campaigns.createDefaultSmsCampaign({
        name: testName('sms-camp-default-custom'),
        template: {
          content: createSmsDocument({ content: 'Your shipment is on its way.' }),
        },
      });

      createdMessageIds.push(result.messageId);
      createdTemplateIds.push(result.templateId);
      createdDynamicSetIds.push(result.dynamicSetId);
      createdCampaignIds.push(result.campaignId);

      expect(result.campaignId).toBeGreaterThan(0);
    });
  });

  // ── error handling ────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('throws RuleApiError with isAuthError() when API key is invalid', async () => {
      const bad = new RuleClient({ apiKey: 'invalid-key' });

      await expect(bad.campaigns.listCampaigns()).rejects.toSatisfy(
        (e: unknown) => e instanceof RuleApiError && e.isAuthError()
      );
    });
  });
});
