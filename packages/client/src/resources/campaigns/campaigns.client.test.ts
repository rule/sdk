import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createSmsDocument } from '@rule/rcml';

import { RuleApiError } from '../../errors.js';

import {
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { CampaignsClient } from './campaigns.client.js';

const WIRE_CAMPAIGN = {
  id: 100,
  name: 'Spring Newsletter',
  status: { value: 1, key: 'draft', description: 'Draft' },
  message_type: { value: 1, key: 'email', description: 'Email' },
  sendout_type: { value: 1, key: 'marketing', description: 'Marketing' },
  number_of_recipients: 500,
  total_sent: null,
  recipients: {
    tags: [{ id: 42, name: 'VIP', negative: false }],
    segments: [],
    subscribers: [{ id: 1, email: 'a@b.com', phone_number: '+1234567890' }],
  },
  created_at: '2024-01-01 10:00:00',
  updated_at: '2024-01-02 10:00:00',
};

function createClient(fetchMock: MockFetch): CampaignsClient {
  return new CampaignsClient(createMockTransport(fetchMock));
}

describe('CampaignsClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('createEmailCampaign', () => {
    it('POSTs with message_type=1 hardcoded and maps response to camelCase', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      const result = await client.createEmailCampaign({
        sendoutType: 'marketing',
        tags: [{ id: 42, negative: false }],
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/campaign');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.message_type).toBe('1');
      expect(body.sendout_type).toBe('1');
      expect(body).not.toHaveProperty('messageType');
      expect(body).not.toHaveProperty('sendoutType');

      expect(result.id).toBe(100);
      expect(result.messageType.key).toBe('email');
      expect(result.sendoutType.key).toBe('marketing');
    });

    it('maps sendoutType: transactional → sendout_type: 2', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      await client.createEmailCampaign({ sendoutType: 'transactional' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.sendout_type).toBe('2');
    });
  });

  describe('get', () => {
    it('returns the campaign as a camelCase entity on 200', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      const result = await client.get(100);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(100);
      expect(result!.messageType.key).toBe('email');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      expect(await client.get(1)).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.get(1)).rejects.toBeInstanceOf(RuleApiError);
    });
  });

  describe('setEmailCampaign', () => {
    it('PUTs full body in snake_case — no messageType in payload or body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      const result = await client.setEmailCampaign(100, {
        name: 'Updated',
        sendoutType: 'marketing',
        tags: [{ id: 42, negative: false }],
        segments: [{ id: 7, negative: false }],
        subscribers: [101, 102],
      });

      expect(fetchMock.mock.calls).toHaveLength(1);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/campaign/100');
      expect((init as RequestInit).method).toBe('PUT');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body).toEqual({
        name: 'Updated',
        sendout_type: '1',
        tags: [{ id: 42, negative: false }],
        segments: [{ id: 7, negative: false }],
        subscribers: [101, 102],
      });
      // messageType must NOT appear in the wire body (it's hardcoded as 1 on create only)
      expect(body).not.toHaveProperty('message_type');
      expect(result.id).toBe(100);
    });

    it('falls back to POST with message_type=1 when campaign does not exist (404)', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      await client.setEmailCampaign(1, {
        name: 'New',
        sendoutType: 'marketing',
        tags: [],
        segments: [],
        subscribers: [],
      });

      expect(fetchMock.mock.calls).toHaveLength(2);
      expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('PUT');
      expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('POST');

      const postBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      // hardcoded email create
      expect(postBody.message_type).toBe('1');
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(
        client.setEmailCampaign(1, { name: 'N', sendoutType: 'marketing', tags: [], segments: [], subscribers: [] })
      ).rejects.toBeInstanceOf(RuleApiError);
    });
  });

  describe('updateEmailCampaign', () => {
    it('always does read-modify-write (GET + PUT)', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      await client.updateEmailCampaign(100, { name: 'New Name' });

      expect(fetchMock.mock.calls).toHaveLength(2);
      expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('GET');
      expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('PUT');
    });

    it('merges partial input — name-only update preserves existing recipients', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      await client.updateEmailCampaign(100, { name: 'New Name' });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody).toEqual({
        name: 'New Name',
        sendout_type: '1',
        tags: [{ id: 42, name: 'VIP', negative: false }],
        segments: [],
        subscribers: [1],
      });
    });

    it('maps sendoutType string to numeric wire value', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({
          data: { ...WIRE_CAMPAIGN, sendout_type: { value: 1, key: 'marketing', description: 'Marketing' } },
        }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      const client = createClient(fetchMock);

      await client.updateEmailCampaign(100, { sendoutType: 'transactional' });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody.sendout_type).toBe('2');
    });

    it('throws RuleApiError(404) when campaign does not exist', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      await expect(client.updateEmailCampaign(999, { name: 'New' })).rejects.toThrow(/Campaign 999 not found/);
    });

    it('throws RuleClientError when existing record has no sendoutType', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 1, name: 'C', recipients: { tags: [] } } })
      );
      const client = createClient(fetchMock);

      await expect(client.updateEmailCampaign(1, { name: 'New' })).rejects.toThrow(/no sendout_type/);
    });
  });

  describe('convenience methods', () => {
    it('renameCampaign delegates to updateEmailCampaign with {name}', async () => {
      const client = createClient(fetchMock);
      const spy = vi.spyOn(client, 'updateEmailCampaign').mockResolvedValueOnce({} as never);

      await client.renameCampaign(42, 'New Name');

      expect(spy).toHaveBeenCalledWith(42, { name: 'New Name' });
    });

    it('setCampaignSendoutType delegates to updateEmailCampaign with {sendoutType}', async () => {
      const client = createClient(fetchMock);
      const spy = vi.spyOn(client, 'updateEmailCampaign').mockResolvedValueOnce({} as never);

      await client.setCampaignSendoutType(42, 'transactional');

      expect(spy).toHaveBeenCalledWith(42, { sendoutType: 'transactional' });
    });

    it('setCampaignTags delegates to updateEmailCampaign with {tags}', async () => {
      const client = createClient(fetchMock);
      const spy = vi.spyOn(client, 'updateEmailCampaign').mockResolvedValueOnce({} as never);
      const tags = [{ id: 10, negative: false }];

      await client.setCampaignTags(42, tags);

      expect(spy).toHaveBeenCalledWith(42, { tags });
    });

    it('setCampaignSegments delegates to updateEmailCampaign with {segments}', async () => {
      const client = createClient(fetchMock);
      const spy = vi.spyOn(client, 'updateEmailCampaign').mockResolvedValueOnce({} as never);
      const segments = [{ id: 5, negative: false }];

      await client.setCampaignSegments(42, segments);

      expect(spy).toHaveBeenCalledWith(42, { segments });
    });

    it('setCampaignSubscribers delegates to updateEmailCampaign with {subscribers}', async () => {
      const client = createClient(fetchMock);
      const spy = vi.spyOn(client, 'updateEmailCampaign').mockResolvedValueOnce({} as never);

      await client.setCampaignSubscribers(42, [101, 102]);

      expect(spy).toHaveBeenCalledWith(42, { subscribers: [101, 102] });
    });
  });

  describe('delete', () => {
    it('DELETEs the campaign and returns void', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      const result = await client.delete(1);

      expect(result).toBeUndefined();
    });
  });

  describe('copy', () => {
    it('POSTs to /editor/campaign/{id}/copy and returns camelCase entity', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { ...WIRE_CAMPAIGN, id: 200 } }));
      const client = createClient(fetchMock);

      const result = await client.copy(100);

      expect(result.id).toBe(200);
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/editor/campaign/100/copy');
    });
  });

  describe('schedule', () => {
    it('sends now and returns void', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      const result = await client.schedule(1, { type: 'now' });

      expect(result).toBeUndefined();
      expect(JSON.parse((fetchMock.mock.calls[0]![1]!.body as string))).toEqual({ type: 'now' });
    });

    it('schedules with a datetime', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.schedule(1, { type: 'schedule', datetime: '2025-06-15T10:00:00+02:00' });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body).toEqual({ type: 'schedule', datetime: '2025-06-15T10:00:00+02:00' });
    });

    it('cancels with type: null', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.schedule(1, { type: null });

      expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({ type: null });
    });
  });

  describe('listCampaigns', () => {
    it('returns Campaign[] and maps nested params to flat wire params', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [WIRE_CAMPAIGN] }));
      const client = createClient(fetchMock);

      const result = await client.listCampaigns({
        filters: { messageType: 'email' },
        pagination: { page: 2, pageSize: 20 },
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.messageType.key).toBe('email');

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('page=2');
      expect(url).toContain('per_page=20');
      expect(url).toContain('message_type=1');
    });

    it('omits query string when no params provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      await client.listCampaigns();

      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/editor/campaign');
    });
  });

  describe('iterateCampaignsPages', () => {
    it('yields page arrays and stops when a page is smaller than pageSize', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_CAMPAIGN, WIRE_CAMPAIGN] }))
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_CAMPAIGN] }));
      const client = createClient(fetchMock);

      const pages: number[] = [];

      for await (const page of client.iterateCampaignsPages({ pagination: { pageSize: 2 } })) {
        pages.push(page.length);
      }

      expect(pages).toEqual([2, 1]);
    });
  });

  describe('listAllCampaigns', () => {
    it('collects all campaigns from all pages', async () => {
      const c2 = { ...WIRE_CAMPAIGN, id: 200 };

      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_CAMPAIGN, c2] }))
        .mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      const result = await client.listAllCampaigns({ pagination: { pageSize: 2 } });

      expect(result.map((c) => c.id)).toEqual([100, 200]);
    });
  });

  describe('createDefaultEmailCampaign', () => {
    const WIRE_BRAND_STYLE_FULL = {
      id: 1,
      account_id: 1,
      name: 'Default',
      is_default: true,
      description: null,
      domain: null,
      colours: [],
      links: [],
      fonts: [],
      images: [],
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    };
    const WIRE_MESSAGE = { id: 10, subject: 'Spring Newsletter' };
    const WIRE_TEMPLATE = { id: 20, name: 'Campaign 100 template', message_type: 'email', created_at: '2024-01-01', updated_at: '2024-01-01' };
    const WIRE_DYNAMIC_SET = { id: 30, name: 'ds', active: false, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' };

    function setupHappyPath(): void {
      // 1. GET brand style by id
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_BRAND_STYLE_FULL }));
      // 2. POST campaign
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      // 3a. POST message (parallel)
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      // 3b. POST template (parallel)
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      // 4. POST dynamic set
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_DYNAMIC_SET }));
    }

    it('returns IDs of all created resources on success', async () => {
      setupHappyPath();
      const client = createClient(fetchMock);

      const result = await client.createDefaultEmailCampaign({ brandStyleId: 1 });

      expect(result).toEqual({
        campaignId: 100,
        messageId: 10,
        templateId: 20,
        dynamicSetId: 30,
      });
    });

    it('rolls back campaign and any created resources if template creation fails', async () => {
      // 1. GET brand style by id
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_BRAND_STYLE_FULL }));
      // 2. POST campaign — succeeds
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      // 3a. POST message — succeeds
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      // 3b. POST template — fails
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      // 4. DELETE message (rollback)
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      // 5. DELETE campaign (rollback)
      fetchMock.mockResolvedValueOnce(createMockResponse({}));

      const client = createClient(fetchMock);

      await expect(
        client.createDefaultEmailCampaign({ brandStyleId: 1 })
      ).rejects.toBeInstanceOf(RuleApiError);

      const deletedUrls = fetchMock.mock.calls
        .filter(([, init]) => (init as RequestInit).method === 'DELETE')
        .map(([url]) => url as string);

      // Both the message and the campaign must be deleted
      expect(deletedUrls.some((u) => u.includes('/editor/message/10'))).toBe(true);
      expect(deletedUrls.some((u) => u.includes('/editor/campaign/100'))).toBe(true);
    });

    it('message override replaces the default subject', async () => {
      setupHappyPath();
      const client = createClient(fetchMock);

      await client.createDefaultEmailCampaign({
        brandStyleId: 1,
        message: { subject: 'Custom subject', preheader: 'Custom preheader' },
      });

      const messagePostCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          (url as string).includes('/editor/message') &&
          (init as RequestInit).method === 'POST'
      );
      const body = JSON.parse((messagePostCall![1] as RequestInit).body as string);

      expect(body.subject).toBe('Custom subject');
      expect(body.pre_header).toBe('Custom preheader');
    });

    it('template.content override skips the brand style fetch', async () => {
      // No brand style fetch — only 4 calls (campaign, message, template, dynamic set)
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_CAMPAIGN }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      await client.createDefaultEmailCampaign({
        brandStyleId: 1,
        template: { content: { tagName: 'rc-email', attributes: {}, head: { tagName: 'rc-head', attributes: {}, children: [] }, body: { tagName: 'rc-body', attributes: {}, children: [] } } },
      });

      const brandStyleFetched = fetchMock.mock.calls.some(([url]) =>
        (url as string).includes('/brand-styles')
      );

      expect(brandStyleFetched).toBe(false);
      expect(fetchMock.mock.calls).toHaveLength(4);
    });

    it('template.name override uses the custom name', async () => {
      setupHappyPath();
      const client = createClient(fetchMock);

      await client.createDefaultEmailCampaign({
        brandStyleId: 1,
        template: { name: 'My Custom Template' },
      });

      const templatePostCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          (url as string).includes('/editor/template') &&
          (init as RequestInit).method === 'POST'
      );
      const body = JSON.parse((templatePostCall![1] as RequestInit).body as string);

      expect(body.name).toBe('My Custom Template');
    });
  });

  describe('createDefaultSmsCampaign', () => {
    const WIRE_SENDER = {
      status: 200,
      account_id: 1,
      name: 'Acme',
      email: 'acme@example.com',
      company: 'Acme Inc',
      text_message_sender_name: 'Acme',
      link_instead_of_stop_word: false,
    };
    const WIRE_SMS_CAMPAIGN = { ...WIRE_CAMPAIGN, id: 200 };
    const WIRE_SMS_MESSAGE = { id: 11, subject: 'Your message here.\n[Subscriber:stop_word]' };
    const WIRE_SMS_TEMPLATE = { id: 21, name: 'Campaign 200 SMS template', message_type: 'sms', created_at: '2024-01-01', updated_at: '2024-01-01' };
    const WIRE_SMS_DYNAMIC_SET = { id: 31, name: 'ds', active: false, position: 0, created_at: '2024-01-01', updated_at: '2024-01-01' };

    it('returns IDs of all created resources on success', async () => {
      // 1. GET sender details
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      // 2. POST SMS campaign
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      // 3a. POST SMS message (parallel)
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_MESSAGE }));
      // 3b. POST SMS template (parallel)
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      // 4. POST dynamic set
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      const result = await client.createDefaultSmsCampaign();

      expect(result).toEqual({
        campaignId: 200,
        messageId: 11,
        templateId: 21,
        dynamicSetId: 31,
      });
    });

    it('does not set subject on the SMS message POST', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_MESSAGE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      await client.createDefaultSmsCampaign();

      const messagePostCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          (url as string).includes('/editor/message') &&
          (init as RequestInit).method === 'POST'
      );

      const body = JSON.parse((messagePostCall![1] as RequestInit).body as string);

      expect(body.subject).toBeUndefined();
    });

    it('rolls back created resources when message creation fails', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      // message fails, template succeeds
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      // rollbacks
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      fetchMock.mockResolvedValueOnce(createMockResponse({}));

      const client = createClient(fetchMock);

      await expect(client.createDefaultSmsCampaign()).rejects.toBeInstanceOf(RuleApiError);

      const deletedUrls = fetchMock.mock.calls
        .filter(([, init]) => (init as RequestInit).method === 'DELETE')
        .map(([url]) => url as string);

      expect(deletedUrls.some((u) => u.includes('/editor/template/21'))).toBe(true);
      expect(deletedUrls.some((u) => u.includes('/editor/campaign/200'))).toBe(true);
    });

    it('skips getSenderDetails when template.content is provided', async () => {
      // No sender mock — getSenderDetails is only called to build the default template content
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_MESSAGE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      const result = await client.createDefaultSmsCampaign({
        template: {
          content: createSmsDocument({ content: 'Custom SMS body.' }),
        },
      });

      expect(result).toEqual({
        campaignId: 200,
        messageId: 11,
        templateId: 21,
        dynamicSetId: 31,
      });
    });

    it('omits unsubscribe footer and skips getSenderDetails for transactional sendout', async () => {
      // No sender mock — getSenderDetails is skipped for transactional campaigns
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_MESSAGE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      await client.createDefaultSmsCampaign({ sendoutType: 'transactional' });

      const templatePostCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          (url as string).includes('/editor/template') &&
          (init as RequestInit).method === 'POST'
      );
      const body = JSON.parse((templatePostCall![1] as RequestInit).body as string);
      const contentStr = JSON.stringify(body.template);

      // Template content must not contain any unsubscribe element
      expect(contentStr).not.toContain('unsubscribe');
      expect(contentStr).not.toContain('stop_word');
    });

    it('template.name override uses the custom name', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_CAMPAIGN }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_MESSAGE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_DYNAMIC_SET }));

      const client = createClient(fetchMock);

      await client.createDefaultSmsCampaign({
        template: { name: 'Order Shipped SMS' },
      });

      const templatePostCall = fetchMock.mock.calls.find(
        ([url, init]) =>
          (url as string).includes('/editor/template') &&
          (init as RequestInit).method === 'POST'
      );
      const body = JSON.parse((templatePostCall![1] as RequestInit).body as string);

      expect(body.name).toBe('Order Shipped SMS');
    });
  });
});
