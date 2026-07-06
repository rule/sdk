import { RuleClient, RuleApiError } from '@rule/client';
import { createSmsDocument, sms } from '@rule/rcml';
import { createTestClient } from '../helpers/client.js';
import { testName, testEmail } from '../helpers/test-data.js';

const minimalSmsDoc = createSmsDocument({ content: 'Hello from integration test' });

describe('TemplatesClient — SMS', () => {
  const client = createTestClient();
  const createdIds: number[] = [];
  const createdComplexCampaignIds: number[] = [];
  const createdComplexMessageIds: number[] = [];
  const createdComplexTemplateIds: number[] = [];
  const createdComplexDynamicSetIds: number[] = [];
  let previewSubscriberEmail: string;

  afterAll(async () => {
    await Promise.allSettled(createdIds.map((id) => client.templates.delete(id)));
  });

  afterAll(async () => {
    if (previewSubscriberEmail) {
      await client.subscribers.deleteByEmail(previewSubscriberEmail).catch(() => undefined);
    }
    await Promise.allSettled(createdComplexDynamicSetIds.map((id) => client.dynamicSets.delete(id)));
    await Promise.allSettled(createdComplexMessageIds.map((id) => client.messages.delete(id)));
    await Promise.allSettled(createdComplexTemplateIds.map((id) => client.templates.delete(id)));
    await Promise.allSettled(createdComplexCampaignIds.map((id) => client.campaigns.delete(id)));
  });

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

  describe('delete', () => {
    it('deletes the template and subsequent get returns null', async () => {
      const name = testName('sms-tmpl-delete');
      const created = await client.templates.createSmsTemplate({ name, content: minimalSmsDoc });

      await client.templates.delete(created.id);

      const found = await client.templates.get(created.id);

      expect(found).toBeNull();
    });
  });

  describe('complex content', () => {
    beforeAll(async () => {
      await client.customField.createGroups([
        { key: 'Order.Id', type: 'text' },
        { key: 'Order.Total', type: 'text' },
      ]);

      previewSubscriberEmail = testEmail('sms-complex-preview');
      await client.subscribers.sync({
        subscriber: {
          email: previewSubscriberEmail,
          phoneNumber: '+46701234567',
          status: 'ACTIVE',
        },
        customFieldData: {
          Order: { Id: 'ORD-9001', Total: '199.00' },
        },
      });
    });

    async function createComplexCampaign(slug: string, doc: ReturnType<typeof createSmsDocument>) {
      const result = await client.campaigns.createDefaultSmsCampaign({
        name: testName(slug),
        template: { content: doc },
      });

      createdComplexCampaignIds.push(result.campaignId);
      createdComplexMessageIds.push(result.messageId);
      createdComplexTemplateIds.push(result.templateId);
      createdComplexDynamicSetIds.push(result.dynamicSetId);
      return result;
    }

    it('accepts a subscriber placeholder', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Your email: ' }),
            sms.createSubscriberPlaceholder({ field: 'email' }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-subscriber-ph', doc);

      expect(result.campaignId).toBeGreaterThan(0);
      expect(result.templateId).toBeGreaterThan(0);
    });

    it('accepts all five placeholder types in one document', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createSubscriberPlaceholder({ field: 'phone_number' }),
            sms.createMessageNode({ text: ' from ' }),
            sms.createUserPlaceholder({ field: 'CompanyName' }),
            sms.createMessageNode({ text: ': order ' }),
            sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Id' }),
            sms.createMessageNode({ text: ' due ' }),
            sms.createDatePlaceholder({ source: 'tomorrow', format: 'd.m.Y' }),
            sms.createMessageNode({ text: '. Promo: ' }),
            sms.createRemoteContentPlaceholder({ url: 'https://example.com/banner' }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-all-ph-types', doc);

      expect(result.campaignId).toBeGreaterThan(0);
      expect(result.templateId).toBeGreaterThan(0);
    });

    it('accepts a CustomField placeholder with max-length', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Total: ' }),
            sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total', maxLength: 10 }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-cf-maxlen', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a link with tracking and shortening enabled', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Track your order:\n' }),
            sms.createLinkNode({ url: 'https://example.com/track', track: true, shorten: true }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-link-track-shorten', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a link with tracking and shortening disabled', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Info: ' }),
            sms.createLinkNode({ url: 'https://example.com/info', track: false, shorten: false }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-link-no-track', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a Date placeholder with days-from-now source', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Expires: ' }),
            sms.createDatePlaceholder({
              source: { kind: 'days-from-now', count: 7 },
              format: 'Y-m-d',
            }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-date-ph', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a RemoteContent placeholder with a nested subscriber token in URL', async () => {
      const doc = createSmsDocument({
        content: sms.createContent({
          nodes: [
            sms.createMessageNode({ text: 'Your offer: ' }),
            sms.createRemoteContentPlaceholder({
              url: 'https://example.com/promo?sub=[Subscriber:email]',
            }),
            ...sms.createUnsubscribeNodes(),
          ],
        }),
      });
      const result = await createComplexCampaign('sms-tmpl-remote-content', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });

    it('accepts a multi-paragraph message with line breaks', async () => {
      const doc = createSmsDocument({
        content: 'Line one.\nLine two.\nLine three.\n::unsubscribe',
      });
      const result = await createComplexCampaign('sms-tmpl-multiline', doc);

      expect(result.campaignId).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('throws RuleApiError with isAuthError() when API key is invalid', async () => {
      const bad = new RuleClient({ apiKey: 'invalid-key' });

      await expect(bad.templates.listTemplates()).rejects.toSatisfy(
        (e: unknown) => e instanceof RuleApiError && e.isAuthError()
      );
    });
  });
});
