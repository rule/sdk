/**
 * Root `RuleClient` tests.
 *
 * Scope:
 * 1. Lazy singleton invariants (doc §9):
 *    - `client.subscribers === client.subscribers`
 *    - `client.recipients.segments === client.recipients.segments`
 *    - Namespaces are not instantiated until accessed.
 *    - Every namespace shares the same `HttpTransport`.
 * 2. Deprecated-alias delegation smoke tests — a representative subset of
 *    wrappers, not exhaustive. The existing `tests/client.test.ts` exercises
 *    each deprecated method's HTTP behavior; here we just verify the wrapper
 *    forwards to the namespaced method.
 *
 * Constructor / config validation is covered by `config.test.ts` and by the
 * legacy `tests/client.test.ts` constructor block.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RuleApiError } from './errors.js';
import { RuleClientError } from './errors.js';
import type { RcmlDocument } from '@rule/rcml';

import {
  createMock204Response,
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  type MockFetch,
} from './core/mock-fetch.js';
import { AnalyticsClient } from './resources/analytics/analytics.client.js';
import { ApiKeysClient } from './resources/api-keys/api-keys.client.js';
import { AutomationsClient } from './resources/automations/automations.client.js';
import { BrandStylesClient } from './resources/brand-styles/brand-styles.client.js';
import { CampaignsClient } from './resources/campaigns/campaigns.client.js';
import { DynamicSetsClient } from './resources/dynamic-sets/dynamic-sets.client.js';
import { ExportsClient } from './resources/exports/exports.client.js';
import { MessagesClient } from './resources/messages/messages.client.js';
import { RecipientsClient } from './resources/recipients/recipients.client.js';
import { SubscribersClient } from './resources/subscribers/subscribers.client.js';
import { TagsClient } from './resources/tags/tags.client.js';
import { TemplatesClient } from './resources/templates/templates.client.js';
import { RuleClient } from './client.js';

function makeClient(fetchMock: MockFetch): RuleClient {
  return new RuleClient({ apiKey: 'test-key', fetch: fetchMock });
}

describe('RuleClient — namespaced API', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('namespace types', () => {
    it('exposes one instance of each documented namespace client', () => {
      const client = makeClient(fetchMock);

      expect(client.subscribers).toBeInstanceOf(SubscribersClient);
      expect(client.tags).toBeInstanceOf(TagsClient);
      expect(client.automations).toBeInstanceOf(AutomationsClient);
      expect(client.messages).toBeInstanceOf(MessagesClient);
      expect(client.templates).toBeInstanceOf(TemplatesClient);
      expect(client.dynamicSets).toBeInstanceOf(DynamicSetsClient);
      expect(client.campaigns).toBeInstanceOf(CampaignsClient);
      expect(client.brandStyles).toBeInstanceOf(BrandStylesClient);
      expect(client.apiKeys).toBeInstanceOf(ApiKeysClient);
      expect(client.exports).toBeInstanceOf(ExportsClient);
      expect(client.analytics).toBeInstanceOf(AnalyticsClient);
      expect(client.recipients).toBeInstanceOf(RecipientsClient);
    });

    it('exposes nested recipient namespaces of the right type', () => {
      // RecipientsClient is a flat namespace — no sub-namespaces
    });
  });

  describe('lazy singleton invariants', () => {
    it('returns the same instance on repeated top-level access', () => {
      const client = makeClient(fetchMock);

      expect(client.subscribers).toBe(client.subscribers);
      expect(client.automations).toBe(client.automations);
      expect(client.brandStyles).toBe(client.brandStyles);
      expect(client.recipients).toBe(client.recipients);
    });

    it('returns the same instance on repeated nested access', () => {
      // RecipientsClient is a flat namespace — no nested access to test
    });

    it('does not instantiate namespaces that are never accessed', () => {
      const client = makeClient(fetchMock);

      // Reach into the inherited cache. Newly-constructed client touched no
      // namespaces, so the cache should be empty.
      const cacheSize = (client as unknown as { cache: { size: number } }).cache.size;

      expect(cacheSize).toBe(0);
    });

    it('caches a namespace exactly once per access', () => {
      const client = makeClient(fetchMock);

      void client.tags;
      void client.tags;
      void client.tags;

      const cacheSize = (client as unknown as { cache: { size: number } }).cache.size;

      // Only `tags` should have been cached.
      expect(cacheSize).toBe(1);
    });
  });

  describe('shared transport', () => {
    it('every namespace points at the same HttpTransport instance', () => {
      const client = makeClient(fetchMock);

      // Reach into the protected `transport` field; this is a load-bearing
      // architectural invariant from the doc (§2.4 "one client → one transport").
      type WithTransport = { transport: unknown };
      const rootTransport = (client as unknown as WithTransport).transport;
      const namespaces = [
        client.subscribers,
        client.tags,
        client.automations,
        client.messages,
        client.templates,
        client.dynamicSets,
        client.campaigns,
        client.brandStyles,
        client.apiKeys,
        client.exports,
        client.analytics,
        client.recipients,
      ];

      for (const ns of namespaces) {
        expect((ns as unknown as WithTransport).transport).toBe(rootTransport);
      }

      // Nested clients also share the same transport.
    });
  });
});

describe('RuleClient — deprecated-alias delegation', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  it('syncSubscriber delegates to subscribers.sync with the new signature', async () => {
    const client = makeClient(fetchMock);
    const spy = vi.spyOn(client.subscribers, 'sync');

    fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 1, email: 'a@b.c' } }));
    fetchMock.mockResolvedValueOnce(createMock204Response());
    await client.syncSubscriber({ email: 'a@b.c', tags: ['t'] }, 'Booking');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual({ subscriber: { email: 'a@b.c' }, tags: ['t'] });
  });

  it('getAnalytics delegates to analytics.get', async () => {
    const client = makeClient(fetchMock);
    const spy = vi.spyOn(client.analytics, 'get');

    fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
    await client.getAnalytics({ dateFrom: '2024-01-01', dateTo: '2024-01-31' });

    expect(spy).toHaveBeenCalledTimes(1);
  });


  it('addSubscriberTagsV3 delegates to subscribers._addSubscriberTags', async () => {
    const client = makeClient(fetchMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spy = vi.spyOn(client.subscribers as any, '_addSubscriberTags');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as Response);
    await client.addSubscriberTagsV3('user@example.com', { tags: ['vip'] }, 'email');

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]![0]).toEqual({ email: 'user@example.com' });
    expect(spy.mock.calls[0]![1]).toEqual(['vip']);
    expect(spy.mock.calls[0]![2]).toEqual({ automation: undefined, syncSegments: undefined });
  });

  it('preserves the original v2 endpoint for addSubscriberTags (does NOT route through subscribers.addSubscriberTags v3)', async () => {
    const client = makeClient(fetchMock);
    const spy = vi.spyOn(client.subscribers, 'addSubscriberTags');

    fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
    await client.addSubscriberTags('user@example.com', ['vip']);

    // The v2 wrapper must NOT delegate to the v3 namespace method.
    expect(spy).not.toHaveBeenCalled();
    // It calls v2 directly.
    const url = fetchMock.mock.calls[0]![0] as string;

    expect(url).toContain('/api/v2/subscribers/');
  });
});

const MINIMAL_TEMPLATE: RcmlDocument = {
  tagName: 'rcml',
  children: [
    { tagName: 'rc-head', children: [] },
    { tagName: 'rc-body', children: [] },
  ],
};

describe('createAutomationEmail orchestration', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  it('rejects when neither template nor brandStyleId is provided', async () => {
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        triggerType: 'tag',
        triggerValue: 'Newsletter',
        subject: 'Test',
      })
    ).rejects.toThrow(RuleClientError);
  });

  it('rejects when both template and brandStyleId are provided', async () => {
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        triggerType: 'tag',
        triggerValue: 'Newsletter',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
        brandStyleId: 976,
      })
    ).rejects.toThrow(RuleClientError);
  });

  it('auto-fetches the brand style and builds RCML when brandStyleId is provided', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse({
          data: {
            id: 976,
            account_id: 1,
            name: 'Test Brand',
            is_default: true,
            colours: [
              { id: 1, brand_style_id: 976, type: 'accent', hex: '#FF0000', brightness: 50 },
              { id: 2, brand_style_id: 976, type: 'dark', hex: '#111111', brightness: 10 },
              { id: 3, brand_style_id: 976, type: 'light', hex: '#FAFAFA', brightness: 95 },
              { id: 4, brand_style_id: 976, type: 'brand', hex: '#0066CC', brightness: 40 },
            ],
            fonts: [],
            images: [],
          },
        })
      )
      .mockResolvedValueOnce(createMockResponse({ tags: [{ id: 10, name: 'Newsletter' }] }))
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockResolvedValueOnce(createMockResponse({ data: { id: 400 } })); // dynamic set
    const client = makeClient(fetchMock);

    const result = await client.createAutomationEmail({
      name: 'Welcome',
      triggerType: 'tag',
      triggerValue: 'Newsletter',
      subject: 'Welcome!',
      brandStyleId: 976,
    });

    expect(result.automationId).toBe(100);
    expect(result.automailId).toBe(100);
    expect(result.messageId).toBe(200);
    expect(result.templateId).toBe(300);
    expect(result.dynamicSetId).toBe(400);

    // The 5th call (template create) embeds the auto-built RCML.
    const templateBody = JSON.parse(fetchMock.mock.calls[4]![1]!.body as string);
    const rcml = JSON.stringify(templateBody.template);

    expect(rcml).toContain('rc-brand-style');
    expect(rcml).toContain('rcml-h1-style');
    expect(rcml).toContain('Replace this title');
    expect(rcml).toContain('Click me!');
    expect(rcml).toContain('Certified by Rule');
  });

  it('throws RuleApiError when the brand style is not found', async () => {
    fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        triggerType: 'tag',
        triggerValue: 'Newsletter',
        subject: 'Test',
        brandStyleId: 99999,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('cleans up automation + message when template creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockRejectedValueOnce(new Error('Template creation failed'))
      .mockResolvedValueOnce(createMock204Response()) // delete message
      .mockResolvedValueOnce(createMock204Response()); // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Template creation failed');

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('cleans up the automation when message creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockRejectedValueOnce(new Error('Message creation failed'))
      .mockResolvedValueOnce(createMock204Response()); // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Message creation failed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('cleans up automation + message + template when dynamic set creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockRejectedValueOnce(new Error('Dynamic set failed'))
      .mockResolvedValueOnce(createMock204Response())                    // delete template
      .mockResolvedValueOnce(createMock204Response())                    // delete message
      .mockResolvedValueOnce(createMock204Response());                   // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Dynamic set failed');

    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it('swallows cleanup errors and re-throws the original error', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockRejectedValueOnce(new Error('Template failed'))
      .mockRejectedValueOnce(new Error('Delete message failed'))        // cleanup fails
      .mockRejectedValueOnce(new Error('Delete automation failed'));    // cleanup fails
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Template failed');
  });

  it('throws RuleApiError when brand style returns a response with no data', async () => {
    fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404)); // brand style not found
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        brandStyleId: 42,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when automation creation returns no id', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ data: {} })); // no id
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when message creation returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: {} }))          // message (no id)
      .mockResolvedValueOnce(createMock204Response());                   // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when template creation returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: {} }))          // template (no id)
      .mockResolvedValueOnce(createMock204Response())                    // delete message
      .mockResolvedValueOnce(createMock204Response());                   // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when dynamic set creation returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // automation
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockResolvedValueOnce(createMockResponse({ data: {} }))          // dynamic set (no id)
      .mockResolvedValueOnce(createMock204Response())                    // delete template
      .mockResolvedValueOnce(createMock204Response())                    // delete message
      .mockResolvedValueOnce(createMock204Response());                   // delete automation
    const client = makeClient(fetchMock);

    await expect(
      client.createAutomationEmail({
        name: 'Test',
        subject: 'Test',
        triggerType: 'segment',
        triggerValue: '12345',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });
});

describe('createCampaignEmail orchestration', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  it('rejects when neither template nor brandStyleId is provided', async () => {
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({ name: 'Test', subject: 'Test' })
    ).rejects.toThrow(RuleClientError);
  });

  it('rejects when both template and brandStyleId are provided', async () => {
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
        brandStyleId: 976,
      })
    ).rejects.toThrow(RuleClientError);
  });

  it('throws RuleApiError when brand style returns a response with no data', async () => {
    fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404)); // brand style not found
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({ name: 'Test', subject: 'Test', brandStyleId: 999 })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when campaign creation returns no id', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ data: {} })); // campaign (no id)
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({ name: 'Test', subject: 'Test', template: MINIMAL_TEMPLATE })
    ).rejects.toThrow(RuleApiError);
  });

  it('auto-fetches brand style and builds RCML when brandStyleId is provided', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse({
          data: {
            id: 976,
            account_id: 1,
            name: 'Test Brand',
            is_default: true,
            colours: [
              { id: 1, brand_style_id: 976, type: 'accent', hex: '#FF0000', brightness: 50 },
              { id: 2, brand_style_id: 976, type: 'dark', hex: '#111111', brightness: 10 },
              { id: 3, brand_style_id: 976, type: 'side', hex: '#FF5204', brightness: 50 },
              { id: 4, brand_style_id: 976, type: 'brand', hex: '#0066CC', brightness: 40 },
            ],
            fonts: [],
            images: [],
          },
        })
      )
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockResolvedValueOnce(createMockResponse({ data: { id: 400 } })); // dynamic set
    const client = makeClient(fetchMock);

    const result = await client.createCampaignEmail({
      name: 'Welcome Campaign',
      subject: 'Welcome!',
      brandStyleId: 976,
      tags: [{ id: 42, negative: false }],
    });

    expect(result.campaignId).toBe(100);
    expect(result.messageId).toBe(200);
    expect(result.templateId).toBe(300);
    expect(result.dynamicSetId).toBe(400);

    const templateBody = JSON.parse(fetchMock.mock.calls[3]![1]!.body as string);
    const rcml = JSON.stringify(templateBody.template);

    expect(rcml).toContain('rc-brand-style');
    expect(rcml).toContain('Replace this title');
    expect(rcml).toContain('Certified by Rule');
  });

  it('uses the provided template directly when no brandStyleId is set', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockResolvedValueOnce(createMockResponse({ data: { id: 400 } })); // dynamic set
    const client = makeClient(fetchMock);

    const result = await client.createCampaignEmail({
      name: 'Direct Template',
      subject: 'Test',
      template: MINIMAL_TEMPLATE,
    });

    expect(result.campaignId).toBe(100);
    expect(fetchMock).toHaveBeenCalledTimes(4); // No brand-style fetch.
  });

  it('cleans up campaign + message when template creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createMockResponse({
          data: {
            id: 976,
            account_id: 1,
            name: 'Test',
            is_default: true,
            colours: [],
            fonts: [],
            images: [],
          },
        })
      )
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockRejectedValueOnce(new Error('Template creation failed'))
      .mockResolvedValueOnce(createMock204Response()) // delete message
      .mockResolvedValueOnce(createMock204Response()); // delete campaign
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        brandStyleId: 976,
      })
    ).rejects.toThrow('Template creation failed');
  });

  it('cleans up campaign + message + template when dynamic set creation fails', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockRejectedValueOnce(new Error('Dynamic set failed'))
      .mockResolvedValueOnce(createMock204Response()) // delete template
      .mockResolvedValueOnce(createMock204Response()) // delete message
      .mockResolvedValueOnce(createMock204Response()); // delete campaign
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Dynamic set failed');

    // 7 calls total: create campaign/message/template, fail dynamic-set, delete 3
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it('throws RuleApiError when dynamic set returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: { id: 300 } })) // template
      .mockResolvedValueOnce(createMockResponse({ data: {} }))         // dynamic set (no id)
      .mockResolvedValueOnce(createMock204Response())                   // delete template
      .mockResolvedValueOnce(createMock204Response())                   // delete message
      .mockResolvedValueOnce(createMock204Response());                  // delete campaign
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when message creation returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: {} }))         // message (no id)
      .mockResolvedValueOnce(createMock204Response());                  // delete campaign
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('throws RuleApiError when template creation returns no id', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockResolvedValueOnce(createMockResponse({ data: {} }))         // template (no id)
      .mockResolvedValueOnce(createMock204Response())                   // delete message
      .mockResolvedValueOnce(createMock204Response());                  // delete campaign
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow(RuleApiError);
  });

  it('swallows cleanup errors and still re-throws the original error', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ data: { id: 100 } })) // campaign
      .mockResolvedValueOnce(createMockResponse({ data: { id: 200 } })) // message
      .mockRejectedValueOnce(new Error('Template failed'))
      .mockRejectedValueOnce(new Error('Delete message failed'))       // cleanup fails
      .mockRejectedValueOnce(new Error('Delete campaign failed'));      // cleanup fails
    const client = makeClient(fetchMock);

    await expect(
      client.createCampaignEmail({
        name: 'Test',
        subject: 'Test',
        template: MINIMAL_TEMPLATE,
      })
    ).rejects.toThrow('Template failed');
  });
});

describe('RuleClient — deprecated subscriber delegations', () => {
  let fetchMock: MockFetch;
  let client: RuleClient;

  beforeEach(() => {
    fetchMock = createMockFetch();
    client = makeClient(fetchMock);
  });

  it('getSubscriber delegates to subscribers.getByEmail', async () => {
    const spy = vi.spyOn(client.subscribers, 'getByEmail').mockResolvedValueOnce(null);

    await client.getSubscriber('a@b.c');
    expect(spy).toHaveBeenCalledWith('a@b.c');
  });

  it('getSubscriberFields throws with migration guidance', async () => {
    await expect(client.getSubscriberFields('a@b.c')).rejects.toThrow('listCustomFieldData');
  });

  it('getSubscriberTags delegates to subscribers.getSubscriberTags', async () => {
    const spy = vi.spyOn(client.subscribers, 'getSubscriberTags').mockResolvedValueOnce([]);

    await client.getSubscriberTags('a@b.c');
    expect(spy).toHaveBeenCalledWith({ email: 'a@b.c' });
  });

  it('removeSubscriberTags sends one DELETE per tag via v2', async () => {
    fetchMock
      .mockResolvedValueOnce(createMockResponse({ success: true }))
      .mockResolvedValueOnce(createMockResponse({ success: true }));

    const result = await client.removeSubscriberTags('a@b.c', ['tag1', 'tag2']);

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]![0]).toContain('/api/v2/subscribers/');
  });

  it('deleteSubscriber DELETEs via v2', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));

    await client.deleteSubscriber('old@example.com');
    expect(fetchMock.mock.calls[0]![0]).toContain('/api/v2/subscribers/');
  });

  it('createSubscriberV3 delegates to subscribers.create', async () => {
    const spy = vi.spyOn(client.subscribers, 'create').mockResolvedValueOnce({ data: { id: 1, email: 'a@b.c', status: 'ACTIVE' } });

    await client.createSubscriberV3({ email: 'a@b.c' });
    expect(spy).toHaveBeenCalledWith({ email: 'a@b.c' });
  });

  it('deleteSubscriberV3 delegates to subscribers.deleteByEmail', async () => {
    const spy = vi.spyOn(client.subscribers, 'deleteByEmail').mockResolvedValueOnce({ success: true });

    await client.deleteSubscriberV3('a@b.c', 'email');
    expect(spy).toHaveBeenCalledWith('a@b.c');
  });

  it('blockSubscribers delegates to subscribers.block', async () => {
    const spy = vi.spyOn(client.subscribers, 'block').mockResolvedValueOnce({ success: true });

    await client.blockSubscribers([{ email: 'a@b.c' }]);
    expect(spy).toHaveBeenCalled();
  });

  it('unblockSubscribers delegates to subscribers.unblock', async () => {
    const spy = vi.spyOn(client.subscribers, 'unblock').mockResolvedValueOnce({ success: true });

    await client.unblockSubscribers([{ email: 'a@b.c' }]);
    expect(spy).toHaveBeenCalled();
  });

  it('bulkAddTags delegates to subscribers.bulkAddTags', async () => {
    const spy = vi.spyOn(client.subscribers, 'bulkAddTags').mockResolvedValueOnce({ success: true });

    await client.bulkAddTags({ subscribers: [{ email: 'a@b.c' }], tags: ['t'] });
    expect(spy).toHaveBeenCalled();
  });

  it('bulkRemoveTags delegates to subscribers.bulkRemoveTags', async () => {
    const spy = vi.spyOn(client.subscribers, 'bulkRemoveTags').mockResolvedValueOnce({ success: true });

    await client.bulkRemoveTags({ subscribers: [{ email: 'a@b.c' }], tags: ['t'] });
    expect(spy).toHaveBeenCalled();
  });

  it('removeSubscriberTagV3 delegates to subscribers.removeSubscriberTag', async () => {
    const spy = vi.spyOn(client.subscribers, 'removeSubscriberTag').mockResolvedValueOnce({ success: true });

    await client.removeSubscriberTagV3('a@b.c', 'old-tag', 'email');
    expect(spy).toHaveBeenCalledWith({ email: 'a@b.c' }, 'old-tag');
  });

  it('addSubscriberTags sends automation flag in payload when triggerAutomation is truthy', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
    await client.addSubscriberTags('a@b.c', ['t'], 'force');
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

    expect(body.automation).toBe('force');
  });

  it('addSubscriberTags omits automation when triggerAutomation is false', async () => {
    fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
    await client.addSubscriberTags('a@b.c', ['t'], false);
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

    expect(body.automation).toBeUndefined();
  });
});

describe('RuleClient — deprecated brand-styles/api-keys/exports delegations', () => {
  let fetchMock: MockFetch;
  let client: RuleClient;

  beforeEach(() => {
    fetchMock = createMockFetch();
    client = makeClient(fetchMock);
  });

  it('listApiKeys delegates to apiKeys.list', async () => {
    const spy = vi.spyOn(client.apiKeys, 'list').mockResolvedValueOnce({ data: [] });

    await client.listApiKeys();
    expect(spy).toHaveBeenCalled();
  });

  it('createApiKey delegates to apiKeys.create', async () => {
    const spy = vi.spyOn(client.apiKeys, 'create').mockResolvedValueOnce({ data: { id: 1 } });

    await client.createApiKey({ name: 'Key', permissions: [] });
    expect(spy).toHaveBeenCalled();
  });

  it('updateApiKey delegates to apiKeys.update', async () => {
    const spy = vi.spyOn(client.apiKeys, 'update').mockResolvedValueOnce({ data: { id: 1 } });

    await client.updateApiKey(1, { name: 'Updated' });
    expect(spy).toHaveBeenCalledWith(1, { name: 'Updated' });
  });

  it('deleteApiKey delegates to apiKeys.delete', async () => {
    const spy = vi.spyOn(client.apiKeys, 'delete').mockResolvedValueOnce({ success: true });

    await client.deleteApiKey(1);
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('exportDispatchers delegates to exports.dispatchers', async () => {
    const spy = vi.spyOn(client.exports, 'dispatchers').mockResolvedValueOnce([]);

    await client.exportDispatchers({ dateFrom: '2024-01-01', dateTo: '2024-01-01' });
    expect(spy).toHaveBeenCalled();
  });

  it('exportStatistics delegates to exports.statistics', async () => {
    const spy = vi.spyOn(client.exports, 'statistics').mockResolvedValueOnce({ data: [] });

    await client.exportStatistics({ dateFrom: '2024-01-01', dateTo: '2024-01-01' });
    expect(spy).toHaveBeenCalled();
  });

  it('exportSubscribers delegates to exports.subscribers', async () => {
    const spy = vi.spyOn(client.exports, 'subscribers').mockResolvedValueOnce([]);

    await client.exportSubscribers({ dateFrom: '2024-01-01', dateTo: '2024-01-01' });
    expect(spy).toHaveBeenCalled();
  });

  it('getApiKey returns the api key string', () => {
    expect(client.getApiKey()).toBe('test-key');
  });

  it('customField namespace is defined', () => {
    expect(client.customField).toBeDefined();
  });
});

