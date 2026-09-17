import { beforeEach, describe, expect, it } from 'vitest';

import { RuleApiError, RuleClientError } from '../../errors.js';

import {
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { AutomationsClient } from './automations.client.js';
import type { SetEmailAutomationPayload, SetSmsAutomationPayload } from './automations.types.js';

const WIRE_AUTOMATION = {
  id: 123,
  name: 'Welcome email',
  description: 'Sends on signup',
  active: true,
  trigger: { type: 'TAG', id: 42, name: 'signup' },
  sendout_type: { value: 1, key: 'marketing', description: 'Marketing' },
  created_at: '2024-01-01 10:00:00',
  updated_at: '2024-01-02 10:00:00',
};

function createClient(fetchMock: MockFetch): AutomationsClient {
  return new AutomationsClient(createMockTransport(fetchMock));
}

describe('AutomationsClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('createEmailAutomation', () => {
    it('POSTs to v3 /editor/automail and maps response to camelCase', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      const result = await client.createEmailAutomation({
        name: 'Welcome email',
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'marketing',
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/automail');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      // sendout_type is integer in automations (unlike campaigns which uses string)
      expect(body.sendout_type).toBe(1);
      expect(body.trigger).toEqual({ type: 'TAG', id: 42 });
      expect(body).not.toHaveProperty('sendoutType');

      // response normalised to camelCase
      expect(result.id).toBe(123);
      expect(result.name).toBe('Welcome email');
      expect(result.sendoutType).toBe('marketing');
      expect(result.active).toBe(true);
      expect(result.trigger).toEqual({ type: 'TAG', id: 42, name: 'signup' });
      expect(result.createdAt).toBe('2024-01-01 10:00:00');
      expect(result).not.toHaveProperty('sendout_type');
      expect(result).not.toHaveProperty('created_at');
    });

    it('maps sendoutType: transactional → sendout_type: 2', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.createEmailAutomation({ name: 'T', sendoutType: 'transactional' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.sendout_type).toBe(2);
    });

    it('maps tagActionsOnFinish to finish_tags in the wire body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.createEmailAutomation({
        name: 'Welcome email',
        tagActionsOnFinish: [{ tagId: 10, action: 'add' }, { tagId: 11, action: 'remove' }],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.finish_tags).toEqual([{ id: 10, detach: false }, { id: 11, detach: true }]);
      expect(body).not.toHaveProperty('tagActionsOnFinish');
    });

    it('omits finish_tags entirely when tagActionsOnFinish is not provided (backward compat)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.createEmailAutomation({ name: 'Welcome email' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body).not.toHaveProperty('finish_tags');
    });

    it('throws RuleClientError when the same tagId appears more than once', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.createEmailAutomation({
          name: 'Welcome email',
          tagActionsOnFinish: [{ tagId: 10, action: 'add' }, { tagId: 10, action: 'remove' }],
        })
      ).rejects.toBeInstanceOf(RuleClientError);
      expect(fetchMock.mock.calls).toHaveLength(0);
    });

    it('lists every duplicate tagId in the error message, not just the first', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.createEmailAutomation({
          name: 'Welcome email',
          tagActionsOnFinish: [
            { tagId: 10, action: 'add' },
            { tagId: 20, action: 'add' },
            { tagId: 10, action: 'remove' },
            { tagId: 20, action: 'remove' },
          ],
        })
      ).rejects.toThrow('tagId(s): 10, 20');
    });
  });

  describe('createSmsAutomation', () => {
    it('maps tagActionsOnFinish to finish_tags in the wire body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.createSmsAutomation({
        name: 'Welcome SMS',
        tagActionsOnFinish: [{ tagId: 10, action: 'add' }, { tagId: 11, action: 'remove' }],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.message_type).toBe(2);
      expect(body.finish_tags).toEqual([{ id: 10, detach: false }, { id: 11, detach: true }]);
      expect(body).not.toHaveProperty('tagActionsOnFinish');
    });

    it('omits finish_tags entirely when tagActionsOnFinish is not provided (backward compat)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.createSmsAutomation({ name: 'Welcome SMS' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body).not.toHaveProperty('finish_tags');
    });
  });

  describe('get', () => {
    it('returns the automation as a camelCase entity on 200', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      const result = await client.get(123);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(123);
      expect(result!.sendoutType).toBe('marketing');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      expect(await client.get(99999)).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.get(1)).rejects.toBeInstanceOf(RuleApiError);
    });

    it('maps finish_tags to tagActionsOnFinish (tagId, name, action)', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          data: {
            ...WIRE_AUTOMATION,
            finish_tags: [
              { id: 196064, name: 'Birthday', detach: false },
              { id: 215636, name: 'Black-Friday', detach: true },
            ],
          },
        })
      );
      const client = createClient(fetchMock);

      const result = await client.get(123);

      expect(result!.tagActionsOnFinish).toEqual([
        { tagId: 196064, name: 'Birthday', action: 'add' },
        { tagId: 215636, name: 'Black-Friday', action: 'remove' },
      ]);
    });

    it('maps finish_tags: null to tagActionsOnFinish: [] when no finish tags are configured', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { ...WIRE_AUTOMATION, finish_tags: null } })
      );
      const client = createClient(fetchMock);

      const result = await client.get(123);

      expect(result!.tagActionsOnFinish).toEqual([]);
    });
  });

  describe('setEmailAutomation', () => {
    it('PUTs full body in snake_case when automation exists', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      const result = await client.setEmailAutomation(123, {
        name: 'Welcome email',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'transactional',
        tagActionsOnFinish: [],
      });

      expect(fetchMock.mock.calls).toHaveLength(1);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/automail/123');
      expect((init as RequestInit).method).toBe('PUT');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body).toEqual({
        name: 'Welcome email',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendout_type: 2,
        finish_tags: [],
      });
      expect(result.id).toBe(123);
    });

    it('falls back to POST when automation does not exist (404)', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockErrorResponse({}, 404))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setEmailAutomation(1, {
        name: 'New',
        active: true,
        trigger: { type: 'TAG', id: 5 },
        sendoutType: 'marketing',
        tagActionsOnFinish: [],
      });

      expect(fetchMock.mock.calls).toHaveLength(2);
      expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('PUT');
      expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('POST');
      expect(fetchMock.mock.calls[1]![0]).toBe('https://app.rule.io/api/v3/editor/automail');
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(
        client.setEmailAutomation(1, {
          name: 'N',
          active: true,
          trigger: { type: 'TAG', id: 5 },
          sendoutType: 'marketing',
          tagActionsOnFinish: [],
        })
      ).rejects.toBeInstanceOf(RuleApiError);
    });

    it('includes finish_tags: [] in the PUT body to explicitly clear finish tags', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setEmailAutomation(123, {
        name: 'Welcome email',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'marketing',
        tagActionsOnFinish: [],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.finish_tags).toEqual([]);
    });

    it('sends finish_tags: [] when tagActionsOnFinish is undefined at runtime (non-TS callers bypassing the required type)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setEmailAutomation(123, {
        name: 'Welcome email',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'marketing',
      } as SetEmailAutomationPayload);

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.finish_tags).toEqual([]);
    });

    it('throws RuleClientError when the same tagId appears more than once', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.setEmailAutomation(123, {
          name: 'Welcome email',
          active: true,
          trigger: { type: 'TAG', id: 42 },
          sendoutType: 'marketing',
          tagActionsOnFinish: [{ tagId: 5, action: 'add' }, { tagId: 5, action: 'remove' }],
        })
      ).rejects.toBeInstanceOf(RuleClientError);
      expect(fetchMock.mock.calls).toHaveLength(0);
    });
  });

  describe('setSmsAutomation', () => {
    it('includes finish_tags in the PUT body when automation exists', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setSmsAutomation(123, {
        name: 'Welcome SMS',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'transactional',
        tagActionsOnFinish: [{ tagId: 10, action: 'add' }, { tagId: 11, action: 'remove' }],
      });

      const [url, init] = fetchMock.mock.calls[0]!;
      const body = JSON.parse((init as RequestInit).body as string);

      expect(url).toBe('https://app.rule.io/api/v3/editor/automail/123');
      expect((init as RequestInit).method).toBe('PUT');
      expect(body.finish_tags).toEqual([{ id: 10, detach: false }, { id: 11, detach: true }]);
    });

    it('sends finish_tags: [] when tagActionsOnFinish is undefined at runtime (non-TS callers bypassing the required type)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setSmsAutomation(123, {
        name: 'Welcome SMS',
        active: true,
        trigger: { type: 'TAG', id: 42 },
        sendoutType: 'transactional',
      } as SetSmsAutomationPayload);

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.finish_tags).toEqual([]);
    });

    it('includes finish_tags in the create-fallback POST body when automation does not exist (404)', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockErrorResponse({}, 404))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.setSmsAutomation(1, {
        name: 'New SMS',
        active: true,
        trigger: { type: 'TAG', id: 5 },
        sendoutType: 'marketing',
        tagActionsOnFinish: [{ tagId: 10, action: 'add' }],
      });

      expect(fetchMock.mock.calls).toHaveLength(2);
      const [url, init] = fetchMock.mock.calls[1]!;
      const body = JSON.parse((init as RequestInit).body as string);

      expect(url).toBe('https://app.rule.io/api/v3/editor/automail');
      expect((init as RequestInit).method).toBe('POST');
      expect(body.message_type).toBe(2);
      expect(body.finish_tags).toEqual([{ id: 10, detach: false }]);
    });
  });

  describe('updateEmailAutomation', () => {
    it('always does read-modify-write (GET + PUT)', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { name: 'Renamed' });

      expect(fetchMock.mock.calls).toHaveLength(2);
      expect((fetchMock.mock.calls[0]![1] as RequestInit).method).toBe('GET');
      expect((fetchMock.mock.calls[1]![1] as RequestInit).method).toBe('PUT');
    });

    it('merges partial input — name-only update preserves existing fields', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { name: 'Renamed' });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody).toEqual({
        name: 'Renamed',
        active: true,
        trigger: { type: 'TAG', id: 42, name: 'signup' },
        sendout_type: 1,  // numeric integer for automations
      });
    });

    it('maps sendoutType string to integer wire value', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { sendoutType: 'transactional' });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody.sendout_type).toBe(2);
    });

    it('throws RuleApiError(404) when automation does not exist', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      await expect(client.updateEmailAutomation(999, { name: 'X' })).rejects.toBeInstanceOf(RuleApiError);
    });

    it('throws RuleClientError when existing automation has no trigger and update omits it', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 1, name: 'No-trigger', active: true, sendout_type: { value: 1, key: 'marketing', description: '' } } })
      );
      const client = createClient(fetchMock);

      await expect(client.updateEmailAutomation(1, { name: 'Rename' })).rejects.toBeInstanceOf(RuleClientError);
    });

    it('throws RuleClientError when existing automation has no sendout_type and update omits it', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 1, name: 'No-sendout', active: true, trigger: { type: 'TAG', id: 5 } } })
      );
      const client = createClient(fetchMock);

      await expect(client.updateEmailAutomation(1, { name: 'Rename' })).rejects.toBeInstanceOf(RuleClientError);
    });

    it('throws RuleClientError when existing automation has no active state and update omits it', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 1, name: 'No-active', trigger: { type: 'TAG', id: 5 }, sendout_type: { value: 1, key: 'marketing', description: '' } } })
      );
      const client = createClient(fetchMock);

      await expect(client.updateEmailAutomation(1, { name: 'Rename' })).rejects.toBeInstanceOf(RuleClientError);
    });

    it('omits finish_tags from the PUT body when not provided — leaves existing finish tags unchanged rather than clearing them (verified against the live API: PUT without the key preserves prior finish_tags)', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { name: 'Renamed' });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody).not.toHaveProperty('finish_tags');
    });

    it('includes finish_tags: [] in the PUT body when explicitly clearing all finish tags', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }))
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { tagActionsOnFinish: [] });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody.finish_tags).toEqual([]);
    });

    it('replaces finish_tags with the full provided list — not a merge with the existing set', async () => {
      fetchMock
        .mockResolvedValueOnce(
          createMockResponse({
            data: { ...WIRE_AUTOMATION, finish_tags: [{ id: 1, name: 'Old', detach: false }] },
          })
        )
        .mockResolvedValueOnce(createMockResponse({ data: WIRE_AUTOMATION }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomation(123, { tagActionsOnFinish: [{ tagId: 99, action: 'remove' }] });

      const putBody = JSON.parse((fetchMock.mock.calls[1]![1] as RequestInit).body as string);

      expect(putBody.finish_tags).toEqual([{ id: 99, detach: true }]);
    });

    it('throws RuleClientError when the same tagId appears more than once, before doing the GET', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.updateEmailAutomation(123, {
          tagActionsOnFinish: [{ tagId: 5, action: 'add' }, { tagId: 5, action: 'remove' }],
        })
      ).rejects.toBeInstanceOf(RuleClientError);
      expect(fetchMock.mock.calls).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('DELETEs the automation and returns void', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      const result = await client.delete(123);

      expect(result).toBeUndefined();
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/editor/automail/123');
    });
  });

  describe('listAutomations', () => {
    it('returns Automation[] and maps nested params to flat wire params', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: [WIRE_AUTOMATION] })
      );
      const client = createClient(fetchMock);

      const result = await client.listAutomations({
        filters: { active: true, messageType: 'email' },
        pagination: { page: 2, pageSize: 20 },
      });

      expect(result).toHaveLength(1);
      expect(result[0]!.sendoutType).toBe('marketing');

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('page=2');
      expect(url).toContain('per_page=20');
      expect(url).toContain('active=true');
      expect(url).toContain('message_type=1');
      expect(url).not.toContain('messageType');
      expect(url).not.toContain('pageSize');
    });

    it('omits query string when no params provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      await client.listAutomations();

      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/editor/automail');
    });

    it('passes query filter through', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      await client.listAutomations({ filters: { query: 'Welcome' } });

      expect(fetchMock.mock.calls[0]![0] as string).toContain('query=Welcome');
    });
  });

  describe('iterateAutomationsPages', () => {
    it('yields page arrays and stops when a page is smaller than pageSize', async () => {
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_AUTOMATION, WIRE_AUTOMATION] }))
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_AUTOMATION] }));
      const client = createClient(fetchMock);

      const pages: number[] = [];

      for await (const page of client.iterateAutomationsPages({ pagination: { pageSize: 2 } })) {
        pages.push(page.length);
      }

      expect(pages).toEqual([2, 1]);
    });
  });

  describe('listAllAutomations', () => {
    it('collects all automations from all pages', async () => {
      const a2 = { ...WIRE_AUTOMATION, id: 456 };

      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_AUTOMATION, a2] }))
        .mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      const result = await client.listAllAutomations({ pagination: { pageSize: 2 } });

      expect(result.map((a) => a.id)).toEqual([123, 456]);
    });
  });
});
