import { RuleClient, RuleApiError } from '@rule/client';
import { createTestClient } from '../helpers/client.js';
import { testName, testEmail } from '../helpers/test-data.js';

describe('MessagesClient — SMS', () => {
  const client = createTestClient();
  const createdMessageIds: number[] = [];
  const createdCampaignIds: number[] = [];
  const createdAutomationIds: number[] = [];

  let sharedCampaignId: number;
  let sharedCampaignMessageId: number;
  let sharedAutomationId: number;
  let sharedAutomationMessageId: number;
  let tagId: number;
  let bootstrapEmail: string;

  beforeAll(async () => {
    // Bootstrap a tag for the automation trigger
    bootstrapEmail = testEmail('sms-msg-setup');
    const tagName = testName('sms-msg-trigger-tag');

    await client.subscribers.create({ email: bootstrapEmail, status: 'ACTIVE' });
    await client.subscribers.addSubscriberTag({ email: bootstrapEmail }, tagName);
    const tag = await client.tags.getByName(tagName);

    if (!tag) throw new Error(`beforeAll: trigger tag not found: ${tagName}`);
    tagId = tag.id;

    // Bootstrap an SMS campaign + message
    const campaign = await client.campaigns.createSmsCampaign({
      name: testName('sms-msg-setup-campaign'),
    });

    sharedCampaignId = campaign.id!;
    createdCampaignIds.push(sharedCampaignId);

    const campaignMessage = await client.messages.createSmsCampaignMessage(sharedCampaignId, {});

    sharedCampaignMessageId = campaignMessage.id!;
    createdMessageIds.push(sharedCampaignMessageId);

    // Bootstrap an SMS automation + message
    const automation = await client.automations.createSmsAutomation({
      name: testName('sms-msg-setup-automation'),
      trigger: { type: 'TAG', id: tagId },
      sendoutType: 'marketing',
    });

    sharedAutomationId = automation.id!;
    createdAutomationIds.push(sharedAutomationId);

    const automationMessage = await client.messages.createSmsAutomationMessage(
      sharedAutomationId,
      { automailSetting: { active: false, delayInSeconds: '0' } }
    );

    sharedAutomationMessageId = automationMessage.id!;
    createdMessageIds.push(sharedAutomationMessageId);
  });

  afterAll(async () => {
    await Promise.allSettled(createdMessageIds.map((id) => client.messages.delete(id)));
    await Promise.allSettled(createdAutomationIds.map((id) => client.automations.delete(id)));
    await Promise.allSettled(createdCampaignIds.map((id) => client.campaigns.delete(id)));

    const tagCleanup = tagId ? [client.tags.deleteById(tagId)] : [];
    const subCleanup = bootstrapEmail ? [client.subscribers.deleteByEmail(bootstrapEmail).catch(() => undefined)] : [];

    await Promise.allSettled([...tagCleanup, ...subCleanup]);
  });

  describe('createSmsCampaignMessage', () => {
    it('creates a campaign SMS message and returns a numeric ID', async () => {
      const campaign = await client.campaigns.createSmsCampaign({
        name: testName('sms-msg-create-camp'),
      });

      createdCampaignIds.push(campaign.id!);

      const result = await client.messages.createSmsCampaignMessage(campaign.id!, {});

      createdMessageIds.push(result.id!);
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.messageType).toBe(2);
    });

    it('creates a campaign SMS message with UTM params', async () => {
      const campaign = await client.campaigns.createSmsCampaign({
        name: testName('sms-msg-create-camp-utm'),
      });

      createdCampaignIds.push(campaign.id!);

      const result = await client.messages.createSmsCampaignMessage(campaign.id!, {
        utmCampaign: 'spring-sale',
        utmTerm: 'sms',
      });

      createdMessageIds.push(result.id!);
      expect(result.utmCampaign).toBe('spring-sale');
      expect(result.utmTerm).toBe('sms');
    });
  });

  describe('createSmsAutomationMessage', () => {
    it('creates an automation SMS message and returns a numeric ID', async () => {
      const automation = await client.automations.createSmsAutomation({
        name: testName('sms-msg-create-auto'),
        trigger: { type: 'TAG', id: tagId },
        sendoutType: 'marketing',
      });

      createdAutomationIds.push(automation.id!);

      const result = await client.messages.createSmsAutomationMessage(automation.id!, {
        automailSetting: { active: true, delayInSeconds: '0' },
      });

      createdMessageIds.push(result.id!);
      expect(typeof result.id).toBe('number');
      expect(result.id).toBeGreaterThan(0);
      expect(result.messageType).toBe(2);
    });
  });

  describe('get', () => {
    it('returns the campaign SMS message for a known ID (round-trip)', async () => {
      const found = await client.messages.get(sharedCampaignMessageId);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(sharedCampaignMessageId);
      expect(found!.messageType).toBe(2);
    });

    it('returns null for a non-existent ID', async () => {
      const result = await client.messages.get(999_999_999);

      expect(result).toBeNull();
    });
  });

  describe('listCampaignMessages', () => {
    it('includes the created campaign SMS message in results', async () => {
      const results = await client.messages.listCampaignMessages(sharedCampaignId);

      expect(Array.isArray(results)).toBe(true);
      const found = results.some((m) => m.id === sharedCampaignMessageId);

      expect(found).toBe(true);
    });
  });

  describe('listAutomationMessages', () => {
    it('includes the created automation SMS message in results', async () => {
      const results = await client.messages.listAutomationMessages(sharedAutomationId);

      expect(Array.isArray(results)).toBe(true);
      const found = results.some((m) => m.id === sharedAutomationMessageId);

      expect(found).toBe(true);
    });
  });

  describe('updateSmsCampaignMessage', () => {
    it('persists updated UTM campaign', async () => {
      const updated = await client.messages.updateSmsCampaignMessage(sharedCampaignMessageId, {
        utmCampaign: 'updated-campaign',
      });

      expect(updated.utmCampaign).toBe('updated-campaign');

      const fetched = await client.messages.get(sharedCampaignMessageId);

      expect(fetched!.utmCampaign).toBe('updated-campaign');
    });

    it('clears UTM fields when set to null', async () => {
      const updated = await client.messages.updateSmsCampaignMessage(sharedCampaignMessageId, {
        utmCampaign: null,
        utmTerm: null,
      });

      expect(updated.utmCampaign).toBeNull();
    });
  });

  describe('updateSmsAutomationMessage', () => {
    it('persists updated UTM term', async () => {
      const updated = await client.messages.updateSmsAutomationMessage(sharedAutomationMessageId, {
        utmTerm: 'sms-updated',
      });

      expect(updated.utmTerm).toBe('sms-updated');

      const fetched = await client.messages.get(sharedAutomationMessageId);

      expect(fetched!.utmTerm).toBe('sms-updated');
    });

    it('updates automailSetting delay', async () => {
      const updated = await client.messages.updateSmsAutomationMessage(sharedAutomationMessageId, {
        automailSetting: { active: false, delayInSeconds: '3600' },
      });

      expect(updated.id).toBe(sharedAutomationMessageId);
    });
  });

  describe('delete', () => {
    it('deletes the message and subsequent get returns null', async () => {
      const campaign = await client.campaigns.createSmsCampaign({
        name: testName('sms-msg-delete-camp'),
      });

      createdCampaignIds.push(campaign.id!);

      const message = await client.messages.createSmsCampaignMessage(campaign.id!, {});

      await client.messages.delete(message.id!);

      const found = await client.messages.get(message.id!);

      expect(found).toBeNull();
    });
  });

  describe('error handling', () => {
    it('throws RuleApiError with isAuthError() when API key is invalid', async () => {
      const bad = new RuleClient({ apiKey: 'invalid-key' });

      await expect(bad.messages.listCampaignMessages(1)).rejects.toSatisfy(
        (e: unknown) => e instanceof RuleApiError && e.isAuthError()
      );
    });
  });
});
