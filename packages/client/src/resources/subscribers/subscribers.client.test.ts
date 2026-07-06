import { beforeEach, describe, expect, it } from 'vitest';

import { RuleApiError } from '../../errors.js';
import { RuleClientError } from '../../errors.js';
import type { Subscriber } from './subscribers.types.js';

import {
  createMock204Response,
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { SubscribersClient } from './subscribers.client.js';

function createClient(fetchMock: MockFetch): SubscribersClient {
  return new SubscribersClient(createMockTransport(fetchMock));
}

describe('SubscribersClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  // ── v3 sync (new signature) ────────────────────────────────────────────────
  describe('sync', () => {
    it('POSTs to v3 /subscribers, then writes fields and tags in parallel', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 123, email: 'test@example.com' } })
      );
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { Booking: { FirstName: 'Anna', LastName: 'Svensson' } },
        tags: ['booking-confirmed'],
      });

      expect(result.id).toBe(123);
      expect(result.email).toBe('test@example.com');
      expect(fetchMock.mock.calls).toHaveLength(3);

      // Call 1: POST /v3/subscribers
      const [url1, init1] = fetchMock.mock.calls[0]!;

      expect(url1).toBe('https://app.rule.io/api/v3/subscribers');
      expect((init1 as RequestInit).method).toBe('POST');
      expect(JSON.parse((init1 as RequestInit).body as string)).toEqual({
        email: 'test@example.com',
      });

      // Call 2: POST /v3/custom-field-data/123
      const [url2, init2] = fetchMock.mock.calls[1]!;

      expect(url2).toBe('https://app.rule.io/api/v3/custom-field-data/123');
      expect((init2 as RequestInit).method).toBe('POST');
      const fieldBody = JSON.parse((init2 as RequestInit).body as string);

      expect(fieldBody.groups[0].group).toBe('Booking');
      expect(fieldBody.groups[0].values).toContainEqual({ field: 'FirstName', value: 'Anna' });
      expect(fieldBody.groups[0].values).toContainEqual({ field: 'LastName', value: 'Svensson' });

      // Call 3: PUT /v3/subscribers/{email}/tags
      const [url3, init3] = fetchMock.mock.calls[2]!;

      expect(url3).toBe(
        'https://app.rule.io/api/v3/subscribers/test%40example.com/tags?identified_by=email'
      );
      expect((init3 as RequestInit).method).toBe('PUT');
      expect(JSON.parse((init3 as RequestInit).body as string).tags).toEqual(['booking-confirmed']);
    });

    it('sends full subscriber object to POST /subscribers', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 123, email: 'test@example.com' } })
      );
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com', status: 'ACTIVE', language: 'sv' },
      });

      expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
        email: 'test@example.com',
        status: 'ACTIVE',
        language: 'sv',
      });
    });

    it('sends multiple groups when fields span more than one group', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 150, email: 'test@example.com' } })
      );
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: {
          Profile: { FirstName: 'Jane', Language: 'sv' },
          Order:   { Ref: 'ORD-9921', Total: '149.00' },
        },
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups).toHaveLength(2);
      const groupNames = fieldBody.groups.map((g: { group: string }) => g.group);

      expect(groupNames).toContain('Profile');
      expect(groupNames).toContain('Order');
    });

    it('filters out undefined and empty-string fields', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 200, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { Booking: { FirstName: 'Anna', LastName: undefined, Phone: '' } },
        tags: ['test'],
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);
      const fieldNames = fieldBody.groups[0].values.map((f: { field: string }) => f.field);

      expect(fieldNames).toContain('FirstName');
      expect(fieldNames).not.toContain('LastName');
      expect(fieldNames).not.toContain('Phone');
    });

    it('writes fields under the specified group name', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 300, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { Order: { Ref: 'ORD-123' } },
        tags: ['test'],
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups[0].group).toBe('Order');
      expect(fieldBody.groups[0].values).toContainEqual({ field: 'Ref', value: 'ORD-123' });
    });

    it('falls back to v2 GET when v3 subscriber create fails', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Duplicate' }, 422));
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '999', email: 'test@example.com' } })
      );
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { Booking: { FirstName: 'Anna' } },
        tags: ['test'],
      });

      expect(result.email).toBe('test@example.com');
      expect(fetchMock.mock.calls).toHaveLength(4);
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/subscribers');
      expect(fetchMock.mock.calls[1]![0]).toMatch(/\/api\/v2\/subscribers\//);
      expect(fetchMock.mock.calls[2]![0]).toBe('https://app.rule.io/api/v3/custom-field-data/999');
    });

    it('falls back to v2 GET by phone when v3 create fails and no email is present', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Duplicate' }, 422));
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '888', email: null, phone_number: '+46701234567' } })
      );
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.sync({ subscriber: { phoneNumber: '+46701234567' } });

      expect(result.phone).toBe('+46701234567');
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/subscribers');
      expect(fetchMock.mock.calls[1]![0]).toMatch(/identified_by=phone/);
    });

    it('falls back to v2 GET by customIdentifier when v3 create fails and no email is present', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Duplicate' }, 422));
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '777', email: null, custom_identifier: 'ext-42' } })
      );
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.sync({ subscriber: { customIdentifier: 'ext-42' } });

      expect(result.customIdentifier).toBe('ext-42');
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/subscribers');
      expect(fetchMock.mock.calls[1]![0]).toMatch(/identified_by=custom_identifier/);
    });

    it('rethrows the API error when v3 create fails and v2 fallback also fails (404)', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Conflict' }, 409));
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not Found' }, 404));
      const client = createClient(fetchMock);

      await expect(
        client.sync({ subscriber: { email: 'missing@example.com' } })
      ).rejects.toThrow(RuleApiError);
    });

    it('rethrows non-RuleApiError errors from v3 create', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Network failure'));
      const client = createClient(fetchMock);

      await expect(
        client.sync({ subscriber: { email: 'a@example.com' } })
      ).rejects.toThrow(TypeError);
    });

    it('throws RuleClientError when a field key contains a dot', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.sync({
          subscriber: { email: 'test@example.com' },
          customFieldData: { Booking: { 'First.Name': 'Anna' } },
        })
      ).rejects.toThrow(RuleClientError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws RuleClientError when a group name is empty', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.sync({ subscriber: { email: 'test@example.com' }, customFieldData: { '': { FirstName: 'Anna' } } })
      ).rejects.toThrow(RuleClientError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws RuleClientError when a group name contains a dot', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.sync({ subscriber: { email: 'test@example.com' }, customFieldData: { 'A.B': { Ref: '1' } } })
      ).rejects.toThrow(RuleClientError);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('trims whitespace from group names', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 400, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { '  Booking  ': { Ref: '1' } },
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups[0].group).toBe('Booking');
      expect(fieldBody.groups[0].values).toContainEqual({ field: 'Ref', value: '1' });
    });

    it('uses phone_number for tags when no email is set', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 500, phone: '+46701234567' } }));
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { phoneNumber: '+46701234567' },
        tags: ['sms-opt-in'],
      });

      const url = fetchMock.mock.calls[1]![0] as string;

      expect(url).toContain('identified_by=phone_number');
      expect(url).toContain(encodeURIComponent('+46701234567'));
    });
  });

  // ── sync — historicalCustomFieldData ─────────────────────────────────────────
  describe('sync historicalCustomFieldData', () => {
    it('sends historical: true on groups from historicalCustomFieldData', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 123, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        historicalCustomFieldData: { Purchases: { Product: 'Widget A', Amount: '49.99' } },
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups[0].group).toBe('Purchases');
      expect(fieldBody.groups[0].historical).toBe(true);
      expect(fieldBody.groups[0].values).toContainEqual({ field: 'Product', value: 'Widget A' });
    });

    it('omits historical flag on regular fields groups', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 123, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData: { Profile: { FirstName: 'Jane' } },
      });

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups[0].historical).toBeUndefined();
    });

    it('combines customFieldData and historicalCustomFieldData into a single POST', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: { id: 123, email: 'test@example.com' } }));
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      await client.sync({
        subscriber: { email: 'test@example.com' },
        customFieldData:          { Profile: { FirstName: 'Jane' } },
        historicalCustomFieldData: { Purchases: { Product: 'Widget A' } },
      });

      expect(fetchMock.mock.calls).toHaveLength(2); // only one custom-field-data POST

      const fieldBody = JSON.parse(fetchMock.mock.calls[1]![1]!.body as string);

      expect(fieldBody.groups).toHaveLength(2);
      const profileGroup = fieldBody.groups.find((g: { group: string }) => g.group === 'Profile');
      const purchasesGroup = fieldBody.groups.find((g: { group: string }) => g.group === 'Purchases');

      expect(profileGroup.historical).toBeUndefined();
      expect(purchasesGroup.historical).toBe(true);
    });

    it('throws RuleClientError when a historicalCustomFieldData group name contains a dot', async () => {
      const client = createClient(fetchMock);

      await expect(
        client.sync({
          subscriber: { email: 'test@example.com' },
          historicalCustomFieldData: { 'A.B': { Ref: '1' } },
        })
      ).rejects.toThrow(RuleClientError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  // ── v2 reads ───────────────────────────────────────────────────────────────
  describe('getByEmail', () => {
    it('returns the subscriber payload on 200', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '123', email: 'a@b.c' } })
      );
      const client = createClient(fetchMock);

      const result = await client.getByEmail('a@b.c');

      expect(result?.email).toBe('a@b.c');
      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe('https://app.rule.io/api/v2/subscribers/a%40b.c?identified_by=email');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
      const client = createClient(fetchMock);

      expect(await client.getByEmail('missing@example.com')).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.getByEmail('x@y.z')).rejects.toBeInstanceOf(RuleApiError);
    });
  });

  describe('getById', () => {
    it('uses identified_by=id in the URL', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '42', email: 'a@b.c' } })
      );
      const client = createClient(fetchMock);

      await client.getById(42);

      expect(fetchMock.mock.calls[0]![0] as string).toBe(
        'https://app.rule.io/api/v2/subscribers/42?identified_by=id'
      );
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
      const client = createClient(fetchMock);

      expect(await client.getById(999)).toBeNull();
    });
  });

  describe('getByPhone', () => {
    it('URL-encodes the phone number and uses identified_by=phone_number', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '7', email: 'a@b.c' } })
      );
      const client = createClient(fetchMock);

      await client.getByPhone('+46123456789');

      expect(fetchMock.mock.calls[0]![0] as string).toBe(
        'https://app.rule.io/api/v2/subscribers/%2B46123456789?identified_by=phone_number'
      );
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
      const client = createClient(fetchMock);

      expect(await client.getByPhone('+00000000000')).toBeNull();
    });
  });

  describe('getByCustomIdentifier', () => {
    it('uses identified_by=custom_identifier in the URL', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: '99', email: 'a@b.c' } })
      );
      const client = createClient(fetchMock);

      await client.getByCustomIdentifier('ext-user-123');

      expect(fetchMock.mock.calls[0]![0] as string).toBe(
        'https://app.rule.io/api/v2/subscribers/ext-user-123?identified_by=custom_identifier'
      );
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
      const client = createClient(fetchMock);

      expect(await client.getByCustomIdentifier('no-such-id')).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.getByCustomIdentifier('bad')).rejects.toBeInstanceOf(RuleApiError);
    });

    it('maps custom_identifier from the wire response', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscriber: { id: 99, email: 'a@b.c', custom_identifier: 'ext-123' } })
      );
      const client = createClient(fetchMock);

      const result = await client.getByCustomIdentifier('ext-123');

      expect(result?.customIdentifier).toBe('ext-123');
    });
  });

  describe('getSubscriberTags', () => {
    it('returns tag objects with id and name', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ tags: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }] })
      );
      const client = createClient(fetchMock);

      expect(await client.getSubscriberTags({ email: 'a@b.c' })).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
      expect(fetchMock.mock.calls[0]![0]).toBe(
        'https://app.rule.io/api/v2/subscribers/a%40b.c/tags?identified_by=email'
      );
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      expect(await client.getSubscriberTags({ email: 'missing@example.com' })).toBeNull();
    });

    it('returns [] when the API omits tags', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      const client = createClient(fetchMock);

      expect(await client.getSubscriberTags({ email: 'a@b.c' })).toEqual([]);
    });

    it('uses identified_by=phone_number when given a phoneNumber', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ tags: [] }));
      const client = createClient(fetchMock);

      await client.getSubscriberTags({ phoneNumber: '+46701234567' });

      expect(fetchMock.mock.calls[0]![0]).toMatch(/identified_by=phone_number/);
    });

    it('uses identified_by=id when given an id', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ tags: [] }));
      const client = createClient(fetchMock);

      await client.getSubscriberTags({ id: 42 });

      expect(fetchMock.mock.calls[0]![0]).toMatch(/\/subscribers\/42\/tags\?identified_by=id/);
    });

    it('uses identified_by=custom_identifier when given a customIdentifier', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ tags: [] }));
      const client = createClient(fetchMock);

      await client.getSubscriberTags({ customIdentifier: 'ext-123' });

      expect(fetchMock.mock.calls[0]![0]).toMatch(/identified_by=custom_identifier/);
    });
  });

  // ── v3 single-subscriber writes ────────────────────────────────────────────
  describe('create', () => {
    it('POSTs to v3 /subscribers with the request body', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ data: { id: 100, email: 'new@example.com', status: 'ACTIVE' } })
      );
      const client = createClient(fetchMock);

      const result = await client.create({
        email: 'new@example.com',
        status: 'ACTIVE',
        language: 'sv',
      });

      expect(result.id).toBe(100);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers');
      expect((init as RequestInit).method).toBe('POST');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body).toEqual({ email: 'new@example.com', status: 'ACTIVE', language: 'sv' });
    });
  });

  describe('bulkCreateSubscribers', () => {
    it('POSTs to v2 /subscribers with an array of entries plus batch flags', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          message: 'Success',
          subscribers_created: 1,
          subscribers_updated: 1,
        })
      );
      const client = createClient(fetchMock);

      const result = await client.bulkCreateSubscribers({
        subscribers: [
          { email: 'jane@example.com' },
          { email: 'john@example.com', phoneNumber: '+46701234567' },
        ],
        tags: ['newsletter'],
        updateOnDuplicate: true,
      });

      expect(result).toEqual({
        success: true,
        message: 'Success',
        subscribersCreated: 1,
        subscribersUpdated: 1,
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v2/subscribers');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body).toEqual({
        subscribers: [
          { email: 'jane@example.com' },
          { email: 'john@example.com', phone_number: '+46701234567' },
        ],
        tags: ['newsletter'],
        update_on_duplicate: true,
      });
    });

    it('maps phoneNumber to phone_number on every entry', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      const client = createClient(fetchMock);

      await client.bulkCreateSubscribers({
        subscribers: [
          { phoneNumber: '+46700000001' },
          { phoneNumber: '+46700000002' },
        ],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.subscribers).toEqual([
        { phone_number: '+46700000001' },
        { phone_number: '+46700000002' },
      ]);
    });

    it('emits per-entry fields as { key, value, type } arrays and omits type when undefined', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      const client = createClient(fetchMock);

      await client.bulkCreateSubscribers({
        subscribers: [
          {
            email: 'a@example.com',
            fields: [
              { key: 'Group.FirstName', value: 'Jane', type: 'text' },
              { key: 'Group.Items', value: ['Item1', 'Item2'], type: 'multiple' },
              { key: 'Group.Note', value: 'no type set' },
            ],
          },
        ],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.subscribers[0].fields).toEqual([
        { key: 'Group.FirstName', value: 'Jane', type: 'text' },
        { key: 'Group.Items', value: ['Item1', 'Item2'], type: 'multiple' },
        { key: 'Group.Note', value: 'no type set' },
      ]);
    });

    it('surfaces every counter the API includes in the response', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers_created: 5,
          subscribers_updated: 2,
          subscribers_suppressed: 1,
        })
      );
      const client = createClient(fetchMock);

      const result = await client.bulkCreateSubscribers({
        subscribers: [{ email: 'a@example.com' }],
      });

      expect(result).toEqual({
        success: true,
        subscribersCreated: 5,
        subscribersUpdated: 2,
        subscribersSuppressed: 1,
      });
    });

    it('omits undefined batch-level fields from the wire body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({}));
      const client = createClient(fetchMock);

      await client.bulkCreateSubscribers({
        subscribers: [{ email: 'a@example.com' }],
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body).toEqual({ subscribers: [{ email: 'a@example.com' }] });
      expect(Object.keys(body)).toEqual(['subscribers']);
    });
  });

  describe('deleteByEmail', () => {
    it('DELETEs by email', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.deleteByEmail('old@example.com');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/old%40example.com?identified_by=email');
      expect((init as RequestInit).method).toBe('DELETE');
    });
  });

  describe('deleteById', () => {
    it('DELETEs by numeric ID', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.deleteById(12345);

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/12345?identified_by=id');
    });
  });

  describe('deleteByPhoneNumber', () => {
    it('DELETEs by phone number', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.deleteByPhoneNumber('+46701234567');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/%2B46701234567?identified_by=phone_number');
      expect((init as RequestInit).method).toBe('DELETE');
    });
  });

  describe('deleteByCustomIdentifier', () => {
    it('DELETEs by custom identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.deleteByCustomIdentifier('ext-123');

      expect(result.success).toBe(true);
      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/ext-123?identified_by=custom_identifier');
    });
  });

  describe('addSubscriberTags', () => {
    it('POSTs to /subscribers/tags with email identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.addSubscriberTags(
        { email: 'customer@example.com' },
        ['vip', 'returning'],
      );

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('POST');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subscribers).toEqual([{ email: 'customer@example.com' }]);
      expect(body.tags).toEqual(['vip', 'returning']);
    });

    it('routes id identifier in subscribers array', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.addSubscriberTags({ id: 42 }, ['vip']);

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.subscribers).toEqual([{ id: 42 }]);
    });

    it('sends callback_url when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.addSubscriberTags(
        { email: 'customer@example.com' },
        ['vip'],
        { callbackUrl: 'https://example.com/callback' },
      );

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.callback_url).toBe('https://example.com/callback');
    });
  });

  describe('removeSubscriberTags', () => {
    it('DELETEs to /subscribers/tags with email identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.removeSubscriberTags(
        { email: 'customer@example.com' },
        ['old-promo'],
      );

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('DELETE');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subscribers).toEqual([{ email: 'customer@example.com' }]);
      expect(body.tags).toEqual(['old-promo']);
    });

    it('routes id identifier in subscribers array', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.removeSubscriberTags({ id: 42 }, ['old-promo']);

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.subscribers).toEqual([{ id: 42 }]);
    });

    it('sends callback_url when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.removeSubscriberTags(
        { email: 'customer@example.com' },
        ['old-promo'],
        { callbackUrl: 'https://example.com/callback' },
      );

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.callback_url).toBe('https://example.com/callback');
    });
  });

  describe('_addSubscriberTags', () => {
    it('PUTs the tag list with email identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (client as any)._addSubscriberTags(
        { email: 'customer@example.com' },
        ['vip', 'returning'],
      );

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('PUT');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.tags).toEqual(['vip', 'returning']);
      expect(Object.prototype.hasOwnProperty.call(body, 'automation')).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(body, 'sync_subscriber')).toBe(false);
    });

    it('routes id identifier to identified_by=id', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any)._addSubscriberTags({ id: 42 }, ['vip']);

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/42/tags?identified_by=id'
      );
    });

    it('maps trigger to automation=send on the wire', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any)._addSubscriberTags({ email: 'user@example.com' }, ['vip'], { automation: 'trigger' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.automation).toBe('send');
    });

    it('passes force directly on the wire', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any)._addSubscriberTags({ email: 'user@example.com' }, ['vip'], { automation: 'force' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.automation).toBe('force');
    });

    it('sends sync_subscriber=false when syncSegments is false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any)._addSubscriberTags({ email: 'user@example.com' }, ['vip'], { syncSegments: false });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.sync_subscriber).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(body, 'automation')).toBe(false);
    });

    it('combines trigger and syncSegments=false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (client as any)._addSubscriberTags(
        { email: 'user@example.com' },
        ['vip'],
        { automation: 'trigger', syncSegments: false },
      );

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.automation).toBe('send');
      expect(body.sync_subscriber).toBe(false);
    });
  });

  describe('addSubscriberTag', () => {
    it('PUTs a single tag with email identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.addSubscriberTag({ email: 'customer@example.com' }, 'vip');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('PUT');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.tags).toEqual(['vip']);
    });

    it('routes id identifier to identified_by=id', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.addSubscriberTag({ id: 42 }, 7);

      const [url] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/42/tags?identified_by=id');
    });

    it('sends sync_subscriber=false when syncSegments is false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.addSubscriberTag({ email: 'customer@example.com' }, 'vip', { syncSegments: false });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.sync_subscriber).toBe(false);
    });
  });

  describe('triggerTagAutomation', () => {
    it('PUTs with automation=send and no sync_subscriber override by default', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.triggerTagAutomation({ email: 'customer@example.com' }, 'onboarding');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('PUT');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.tags).toEqual(['onboarding']);
      expect(body.automation).toBe('send');
      expect(body.sync_subscriber).toBeUndefined();
    });

    it('sends sync_subscriber=false when syncSegments is false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.triggerTagAutomation({ email: 'customer@example.com' }, 'onboarding', { syncSegments: false });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.automation).toBe('send');
      expect(body.sync_subscriber).toBe(false);
    });
  });

  describe('forceTagAutomation', () => {
    it('PUTs with automation=force and no sync_subscriber override', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.forceTagAutomation({ email: 'customer@example.com' }, 'promo');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('PUT');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.tags).toEqual(['promo']);
      expect(body.automation).toBe('force');
      expect(body.sync_subscriber).toBeUndefined();
    });

    it('sends sync_subscriber=false when syncSegments is false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.forceTagAutomation({ email: 'customer@example.com' }, 'promo', { syncSegments: false });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.sync_subscriber).toBe(false);
    });
  });

  describe('resetTagAutomation', () => {
    it('PUTs with automation=reset and no sync_subscriber override', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.resetTagAutomation({ email: 'customer@example.com' }, 'onboarding');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('PUT');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.tags).toEqual(['onboarding']);
      expect(body.automation).toBe('reset');
      expect(body.sync_subscriber).toBeUndefined();
    });

    it('sends sync_subscriber=false when syncSegments is false', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.resetTagAutomation({ email: 'customer@example.com' }, 'onboarding', { syncSegments: false });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.sync_subscriber).toBe(false);
    });
  });

  describe('removeSubscriberTag', () => {
    it('DELETEs a single tag by name with email identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.removeSubscriberTag({ email: 'customer@example.com' }, 'old-promo');

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/customer%40example.com/tags/old-promo?identified_by=email'
      );
      expect((init as RequestInit).method).toBe('DELETE');
    });

    it('routes id identifier to identified_by=id', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.removeSubscriberTag({ id: 42 }, 7);

      const [url] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/42/tags/7?identified_by=id');
    });

    it('routes customIdentifier to identified_by=custom_identifier', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.removeSubscriberTag({ customIdentifier: 'cust-123' }, 'old-promo');

      const [url] = fetchMock.mock.calls[0]!;

      expect(url).toBe(
        'https://app.rule.io/api/v3/subscribers/cust-123/tags/old-promo?identified_by=custom_identifier'
      );
    });
  });

  describe('bulkAddSubscriberTags', () => {
    it('POSTs to /subscribers/tags with multiple subscribers', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.bulkAddSubscriberTags(
        [{ email: 'a@example.com' }, { email: 'b@example.com' }],
        ['newsletter', 'promo-2024'],
      );

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('POST');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subscribers).toHaveLength(2);
      expect(body.tags).toEqual(['newsletter', 'promo-2024']);
    });

    it('sends callback_url when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.bulkAddSubscriberTags(
        [{ email: 'a@example.com' }],
        ['vip'],
        { callbackUrl: 'https://example.com/callback' },
      );

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.callback_url).toBe('https://example.com/callback');
    });
  });

  describe('bulkRemoveSubscriberTags', () => {
    it('DELETEs to /subscribers/tags with multiple subscribers', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.bulkRemoveSubscriberTags(
        [{ email: 'a@example.com' }],
        ['old-campaign'],
      );

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('DELETE');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subscribers).toEqual([{ email: 'a@example.com' }]);
      expect(body.tags).toEqual(['old-campaign']);
    });

    it('sends callback_url when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.bulkRemoveSubscriberTags(
        [{ email: 'a@example.com' }],
        ['old-campaign'],
        { callbackUrl: 'https://example.com/callback' },
      );

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.callback_url).toBe('https://example.com/callback');
    });
  });

  // ── v3 bulk + block/unblock ────────────────────────────────────────────────
  describe('block', () => {
    it('POSTs the subscribers list to /subscribers/block', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      const result = await client.block([{ email: 'spam@example.com' }, { id: 456 }]);

      expect(result.success).toBe(true);
      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/block');
      expect((init as RequestInit).method).toBe('POST');
      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subscribers).toHaveLength(2);
      expect(body.callback_url).toBeUndefined();
    });

    it('includes callback_url when provided', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.block([{ email: 'a@b.c' }], { callbackUrl: 'https://example.com/webhook' });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.callback_url).toBe('https://example.com/webhook');
    });
  });

  describe('unblock', () => {
    it('POSTs to /subscribers/unblock', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.unblock([
        { email: 'restored@example.com' },
        { phoneNumber: '+46701234567' },
      ]);

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/unblock');
    });
  });

  describe('bulkAddTags (deprecated)', () => {
    it('delegates to bulkAddSubscriberTags', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.bulkAddTags({
        subscribers: [{ email: 'a@example.com' }],
        tags: ['newsletter'],
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('POST');
    });
  });

  describe('bulkRemoveTags (deprecated)', () => {
    it('delegates to bulkRemoveSubscriberTags', async () => {
      fetchMock.mockResolvedValueOnce(createMock204Response());
      const client = createClient(fetchMock);

      await client.bulkRemoveTags({
        subscribers: [{ email: 'a@example.com' }],
        tags: ['old-campaign'],
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/subscribers/tags');
      expect((init as RequestInit).method).toBe('DELETE');
    });
  });

  describe('listSubscribersByTagIds', () => {
    it('throws RuleClientError when tagIds is empty', async () => {
      const client = createClient(fetchMock);

      await expect(client.listSubscribersByTagIds({ tagIds: [] })).rejects.toThrow(RuleClientError);
    });

    it('returns only subscribers matching all supplied tag ids', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [
            { id: 1, email: 'a@example.com', tags: [{ id: 10 }, { id: 20 }] },
            { id: 2, email: 'b@example.com', tags: [{ id: 10 }] },
            { id: 3, email: 'c@example.com', tags: [] },
          ],
          meta: { next: null },
        })
      );
      const client = createClient(fetchMock);

      const result = await client.listSubscribersByTagIds({ tagIds: [10, 20] });

      expect(result.matched).toBe(1);
      expect(result.subscribers[0]!.email).toBe('a@example.com');
      expect(result.scanned).toBe(3);
      expect(result.nextPage).toBeNull();
    });

    it('parses nextPage from meta.next URL', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 1, email: 'a@example.com', tags: [{ id: 10 }] }],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?page=2&limit=10' },
        })
      );
      const client = createClient(fetchMock);

      const result = await client.listSubscribersByTagIds({ tagIds: [10], pagination: { page: 1, pageSize: 10 } });

      expect(result.nextPage).toBe(2);
    });

    it('returns nextPage null when meta is absent', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscribers: [], meta: {} })
      );
      const client = createClient(fetchMock);

      const result = await client.listSubscribersByTagIds({ tagIds: [10] });

      expect(result.nextPage).toBeNull();
    });

    it('returns nextPage null when next URL has no page param', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?limit=10' },
        })
      );
      const client = createClient(fetchMock);

      const result = await client.listSubscribersByTagIds({ tagIds: [10] });

      expect(result.nextPage).toBeNull();
    });

    it('returns nextPage null when next is not a valid URL', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscribers: [], meta: { next: 'not-a-url' } })
      );
      const client = createClient(fetchMock);

      const result = await client.listSubscribersByTagIds({ tagIds: [10] });

      expect(result.nextPage).toBeNull();
    });
  });

  describe('iterateSubscribersByTagIds', () => {
    it('yields all matching subscribers across two pages', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 1, email: 'a@example.com', tags: [{ id: 10 }] }],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?page=2&limit=100' },
        })
      );
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 2, email: 'b@example.com', tags: [{ id: 10 }] }],
          meta: { next: null },
        })
      );
      const client = createClient(fetchMock);

      const items: Subscriber[] = [];

      for await (const item of client.iterateSubscribersByTagIds({ tagIds: [10] })) {
        items.push(item);
      }

      expect(items).toHaveLength(2);
      expect(items[0]!.email).toBe('a@example.com');
      expect(items[1]!.email).toBe('b@example.com');
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('yields nothing when no subscribers match', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({ subscribers: [], meta: {} })
      );
      const client = createClient(fetchMock);

      const items: Subscriber[] = [];

      for await (const item of client.iterateSubscribersByTagIds({ tagIds: [99] })) {
        items.push(item);
      }

      expect(items).toHaveLength(0);
    });
  });

  describe('iterateSubscribersByTagIdsPages', () => {
    it('yields full result pages and stops when nextPage is null', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 1, email: 'a@example.com', tags: [{ id: 10 }] }],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?page=2&limit=100' },
        })
      );
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 2, email: 'b@example.com', tags: [{ id: 10 }] }],
          meta: { next: null },
        })
      );
      const client = createClient(fetchMock);

      const pages: { subscribers: Subscriber[]; nextPage: number | null }[] = [];

      for await (const page of client.iterateSubscribersByTagIdsPages({ tagIds: [10] })) {
        pages.push({ subscribers: page.subscribers, nextPage: page.nextPage });
      }

      expect(pages).toHaveLength(2);
      expect(pages[0]!.subscribers[0]!.email).toBe('a@example.com');
      expect(pages[0]!.nextPage).toBe(2);
      expect(pages[1]!.subscribers[0]!.email).toBe('b@example.com');
      expect(pages[1]!.nextPage).toBeNull();
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('starts from the given pagination.page', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 3, email: 'c@example.com', tags: [{ id: 10 }] }],
          meta: { next: null },
        })
      );
      const client = createClient(fetchMock);

      const pages = [];

      for await (const page of client.iterateSubscribersByTagIdsPages({ tagIds: [10], pagination: { page: 3 } })) {
        pages.push(page);
      }

      expect(pages).toHaveLength(1);
      const [url] = fetchMock.mock.calls[0]!;

      expect(url).toContain('page=3');
    });
  });

  describe('listAllSubscribersByTagIds', () => {
    it('collects all subscribers across pages into a single array', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 1, email: 'a@example.com', tags: [{ id: 10 }] }],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?page=2&limit=100' },
        })
      );
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [{ id: 2, email: 'b@example.com', tags: [{ id: 10 }] }],
          meta: { next: null },
        })
      );
      const client = createClient(fetchMock);

      const subs = await client.listAllSubscribersByTagIds({ tagIds: [10] });

      expect(subs).toHaveLength(2);
      expect(subs[0]!.email).toBe('a@example.com');
    });

    it('stops early when maxItems is reached', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockResponse({
          subscribers: [
            { id: 1, email: 'a@example.com', tags: [{ id: 10 }] },
            { id: 2, email: 'b@example.com', tags: [{ id: 10 }] },
            { id: 3, email: 'c@example.com', tags: [{ id: 10 }] },
          ],
          meta: { next: 'https://app.rule.io/api/v2/subscribers?page=2&limit=100' },
        })
      );
      const client = createClient(fetchMock);

      const subs = await client.listAllSubscribersByTagIds({ tagIds: [10], maxItems: 2 });

      expect(subs).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSubscriberTags — non-404 error rethrow', () => {
    it('rethrows non-404 errors from GET /subscribers/:email/tags', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Server error' }, 500));
      const client = createClient(fetchMock);

      await expect(client.getSubscriberTags({ email: 'a@example.com' })).rejects.toThrow(RuleApiError);
    });
  });

  // ── Custom field data ──────────────────────────────────────────────────────
  describe('custom field data', () => {
    describe('listCustomFieldData', () => {
      it('GETs /custom-field-data/:id without params', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        await client.listCustomFieldData(42);

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
      });

      it('appends query params when supplied', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        await client.listCustomFieldData(42, { pagination: { page: 2, pageSize: 10 }, filters: { groupIds: [1, 2] } });

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toContain('page=2');
        expect(url).toContain('per_page=10');
        expect(url).toContain('groups_id%5B%5D=1');
        expect(url).toContain('groups_id%5B%5D=2');
      });
    });

    describe('writeCustomFieldData', () => {
      it('POSTs to /custom-field-data/:id with the groups body', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.writeCustomFieldData(42, {
          groups: [
            {
              group: 'Order',
              createIfNotExists: true,
              values: [{ field: 'OrderRef', value: 'ORD-001' }],
            },
          ],
        });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.groups).toHaveLength(1);
        expect(body.groups[0].group).toBe('Order');
        expect(body.groups[0].values[0].field).toBe('OrderRef');
      });
    });

    describe('upsertCustomFieldData', () => {
      it('calls writeCustomFieldData with historical=false and createIfNotExists=true', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.upsertCustomFieldData(42, { Profile: { Name: 'Astrid', Lang: 'sv' } });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.groups).toHaveLength(1);
        expect(body.groups[0].group).toBe('Profile');
        expect(body.groups[0].historical).toBe(false);
        expect(body.groups[0].create_if_not_exists).toBe(true);
        expect(body.groups[0].values).toHaveLength(2);
        expect(body.groups[0].values[0].create_if_not_exists).toBe(true);
      });

      it('coerces boolean, null, and number values to strings', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.upsertCustomFieldData(42, {
          Profile: { Active: true, Score: 42, Opt: null },
        });

        const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
        const values: Array<{ field: string; value: string }> = body.groups[0].values;

        expect(values.find((v) => v.field === 'Active')?.value).toBe('true');
        expect(values.find((v) => v.field === 'Score')?.value).toBe('42');
        expect(values.find((v) => v.field === 'Opt')?.value).toBe('');
      });
    });

    describe('updateCustomFieldData', () => {
      it('calls writeCustomFieldData with historical=false and createIfNotExists=false', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.updateCustomFieldData(42, { Profile: { Name: 'Astrid' } });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.groups[0].historical).toBe(false);
        expect(body.groups[0].create_if_not_exists).toBe(false);
        expect(body.groups[0].values[0].create_if_not_exists).toBe(false);
      });
    });

    describe('upsertHistoricalCustomFieldData', () => {
      it('calls writeCustomFieldData with historical=true and createIfNotExists=true', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.upsertHistoricalCustomFieldData(42, { Purchases: { OrderRef: 'ORD-9921', Total: '149.00' } });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.groups[0].group).toBe('Purchases');
        expect(body.groups[0].historical).toBe(true);
        expect(body.groups[0].create_if_not_exists).toBe(true);
        expect(body.groups[0].values[0].create_if_not_exists).toBe(true);
      });
    });

    describe('updateHistoricalCustomFieldData', () => {
      it('calls writeCustomFieldData with historical=true and createIfNotExists=false', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.updateHistoricalCustomFieldData(42, { Purchases: { OrderRef: 'ORD-9921' } });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('POST');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.groups[0].historical).toBe(true);
        expect(body.groups[0].create_if_not_exists).toBe(false);
        expect(body.groups[0].values[0].create_if_not_exists).toBe(false);
      });
    });

    describe('patchCustomFieldData', () => {
      it('PUTs to /custom-field-data/:id with identifier and values', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
        const client = createClient(fetchMock);

        await client.patchCustomFieldData(42, {
          identifier: { group: 'Order', field: 'OrderRef', value: 'ORD-001' },
          values: [{ field: 'OrderRef', value: 'ORD-002' }],
        });

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42');
        expect((init as RequestInit).method).toBe('PUT');
        const body = JSON.parse((init as RequestInit).body as string);

        expect(body.identifier.group).toBe('Order');
        expect(body.values[0].field).toBe('OrderRef');
        expect(body.values[0].value).toBe('ORD-002');
      });
    });

    describe('listCustomFieldDataByGroup', () => {
      it('GETs /custom-field-data/:id/group/:group with numeric group', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        await client.listCustomFieldDataByGroup(42, 7);

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42/group/7');
      });

      it('GETs /custom-field-data/:id/group/:group with string group', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        await client.listCustomFieldDataByGroup(42, 'Order');

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42/group/Order');
      });

      it('appends query params when supplied', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        await client.listCustomFieldDataByGroup(42, 'Order', { pagination: { page: 1 }, filters: { fields: ['OrderRef'] } });

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toContain('page=1');
        expect(url).toContain('fields%5B%5D=OrderRef');
      });
    });

    describe('iterateCustomFieldDataPages', () => {
      it('yields pages and stops when the last page is partial', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 3, values: [] }] }));
        const client = createClient(fetchMock);

        const pages = [];

        for await (const page of client.iterateCustomFieldDataPages(42, { pagination: { pageSize: 2 } })) {
          pages.push(page);
        }

        expect(pages).toHaveLength(2);
        expect(pages[0]!.data).toHaveLength(2);
        expect(pages[1]!.data).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });

      it('stops after the first page when it is empty', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        const pages = [];

        for await (const page of client.iterateCustomFieldDataPages(42)) {
          pages.push(page);
        }

        expect(pages).toHaveLength(1);
        expect(pages[0]!.data).toHaveLength(0);
        expect(fetchMock).toHaveBeenCalledTimes(1);
      });

      it('starts from pagination.page when supplied', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        for await (const _ of client.iterateCustomFieldDataPages(42, { pagination: { page: 3, pageSize: 10 } })) { /* noop */ }

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toContain('page=3');
        expect(url).toContain('per_page=10');
      });
    });

    describe('iterateCustomFieldData', () => {
      it('yields individual records across all pages', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 3, values: [] }] }));
        const client = createClient(fetchMock);

        const records = [];

        for await (const record of client.iterateCustomFieldData(42, { pagination: { pageSize: 2 } })) {
          records.push(record);
        }

        expect(records).toHaveLength(3);
        expect(records[0]!.id).toBe(1);
        expect(records[2]!.id).toBe(3);
      });
    });

    describe('listAllCustomFieldData', () => {
      it('collects all records into a single array', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 3, values: [] }] }));
        const client = createClient(fetchMock);

        const records = await client.listAllCustomFieldData(42, { pagination: { pageSize: 2 } });

        expect(records).toHaveLength(3);
      });

      it('stops early when maxItems is reached', async () => {
        fetchMock.mockResolvedValueOnce(
          createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }, { id: 3, values: [] }] })
        );
        const client = createClient(fetchMock);

        const records = await client.listAllCustomFieldData(42, { maxItems: 2 });

        expect(records).toHaveLength(2);
      });
    });

    describe('iterateCustomFieldDataByGroupPages', () => {
      it('yields pages and stops when the last page is partial', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 3, values: [] }] }));
        const client = createClient(fetchMock);

        const pages = [];

        for await (const page of client.iterateCustomFieldDataByGroupPages(42, 'Order', { pagination: { pageSize: 2 } })) {
          pages.push(page);
        }

        expect(pages).toHaveLength(2);
        expect(fetchMock).toHaveBeenCalledTimes(2);
      });
    });

    describe('iterateCustomFieldDataByGroup', () => {
      it('yields individual records across all pages', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        const records = [];

        for await (const record of client.iterateCustomFieldDataByGroup(42, 'Order', { pagination: { pageSize: 1 } })) {
          records.push(record);
        }

        expect(records).toHaveLength(1);
        expect(records[0]!.id).toBe(1);
      });
    });

    describe('listAllCustomFieldDataByGroup', () => {
      it('collects all records into a single array', async () => {
        fetchMock
          .mockResolvedValueOnce(createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }] }))
          .mockResolvedValueOnce(createMockResponse({ data: [] }));
        const client = createClient(fetchMock);

        const records = await client.listAllCustomFieldDataByGroup(42, 'Order', { pagination: { pageSize: 2 } });

        expect(records).toHaveLength(2);
      });

      it('stops early when maxItems is reached', async () => {
        fetchMock.mockResolvedValueOnce(
          createMockResponse({ data: [{ id: 1, values: [] }, { id: 2, values: [] }, { id: 3, values: [] }] })
        );
        const client = createClient(fetchMock);

        const records = await client.listAllCustomFieldDataByGroup(42, 'Order', { maxItems: 1 });

        expect(records).toHaveLength(1);
      });
    });

    describe('deleteCustomFieldDataByGroup', () => {
      it('DELETEs /custom-field-data/:id/group/:group', async () => {
        fetchMock.mockResolvedValueOnce(createMock204Response());
        const client = createClient(fetchMock);

        await client.deleteCustomFieldDataByGroup(42, 'Order');

        const [url, init] = fetchMock.mock.calls[0]!;

        expect(url).toBe('https://app.rule.io/api/v3/custom-field-data/42/group/Order');
        expect((init as RequestInit).method).toBe('DELETE');
      });
    });

    describe('findCustomFieldData', () => {
      it('GETs /custom-field-data/:id/search and returns data on 200', async () => {
        const record = { id: 1, values: [] };

        fetchMock.mockResolvedValueOnce(createMockResponse({ data: record }));
        const client = createClient(fetchMock);

        const result = await client.findCustomFieldData(42, { group: 'Order', field: 'OrderRef' });

        const [url] = fetchMock.mock.calls[0]!;

        expect(url).toContain('/custom-field-data/42/search');
        expect(url).toContain('group=Order');
        expect(url).toContain('field=OrderRef');
        expect(result?.data?.id).toBe(1);
        expect(result?.data?.values).toEqual([]);
      });

      it('returns null on 404', async () => {
        fetchMock.mockResolvedValueOnce(createMockErrorResponse({ error: 'Not found' }, 404));
        const client = createClient(fetchMock);

        const result = await client.findCustomFieldData(42, { group: 'Missing' });

        expect(result).toBeNull();
      });

      it('rethrows non-404 errors', async () => {
        fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
        const client = createClient(fetchMock);

        await expect(client.findCustomFieldData(42, { group: 'Order' })).rejects.toThrow(RuleApiError);
      });
    });
  });
});
