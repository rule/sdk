import { beforeEach, describe, expect, it } from 'vitest';

import { RuleApiError } from '../../errors.js';
import type { RcmlDocument, SmsDocument } from '@rule/rcml';

import {
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  createMockTextResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { TemplatesClient } from './templates.client.js';

const RCML_DOCUMENT: RcmlDocument = {
  tagName: 'rcml',
  children: [
    { tagName: 'rc-head', children: [] },
    { tagName: 'rc-body', children: [] },
  ],
};

const WIRE_TEMPLATE = {
  id: 456,
  name: 'Welcome email — v1',
  message_type: 'email',
  template: RCML_DOCUMENT,
  created_at: '2024-01-01 10:00:00',
  updated_at: '2024-01-02 10:00:00',
};

function createClient(fetchMock: MockFetch): TemplatesClient {
  return new TemplatesClient(createMockTransport(fetchMock));
}

describe('TemplatesClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('createEmailTemplate', () => {
    it('POSTs to v3 /editor/template with message_type=email hardcoded', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      const client = createClient(fetchMock);

      const result = await client.createEmailTemplate({
        name: 'Welcome email — v1',
        content: RCML_DOCUMENT,
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/template');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      // message_type is always 'email' — not from payload
      expect(body.message_type).toBe('email');
      // RCML body is mapped to wire's 'template' field
      expect(body.template).toEqual(RCML_DOCUMENT);
      expect(body).not.toHaveProperty('messageType');
      expect(body).not.toHaveProperty('content');
      // message_id must NOT be sent (not in API spec)
      expect(body).not.toHaveProperty('message_id');

      // response normalised to camelCase
      expect(result.id).toBe(456);
      expect(result.name).toBe('Welcome email — v1');
      expect(result.content).toEqual(RCML_DOCUMENT);
      expect(result.messageType).toBe('email');
      expect(result.createdAt).toBe('2024-01-01 10:00:00');
      expect(result.updatedAt).toBe('2024-01-02 10:00:00');
      // no snake_case fields on the entity
      expect(result).not.toHaveProperty('message_type');
      expect(result).not.toHaveProperty('template');
    });

    it('sends the RCML document as a single object, not wrapped in an array', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.createEmailTemplate({ name: 'T', content: RCML_DOCUMENT });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.template).toEqual(RCML_DOCUMENT);
      expect(Array.isArray(body.template)).toBe(false);
    });
  });

  describe('get', () => {
    it('returns the template as a camelCase entity on 200', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      const client = createClient(fetchMock);

      const result = await client.get(456);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(456);
      expect(result!.content).toEqual(RCML_DOCUMENT);
      expect(result!.messageType).toBe('email');
      expect(result!.createdAt).toBe('2024-01-01 10:00:00');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      expect(await client.get(999)).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.get(1)).rejects.toBeInstanceOf(RuleApiError);
    });
  });

  describe('updateEmailTemplate', () => {
    it('PUTs payload mapped to snake_case body (content → template)', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      const client = createClient(fetchMock);

      const result = await client.updateEmailTemplate(456, { name: 'Welcome email — v2' });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/template/456');
      expect((init as RequestInit).method).toBe('PUT');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body).toEqual({ name: 'Welcome email — v2' });
      expect(result.id).toBe(456);
    });

    it('maps content to template field in wire body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.updateEmailTemplate(456, { content: RCML_DOCUMENT });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.template).toEqual(RCML_DOCUMENT);
      expect(body).not.toHaveProperty('content');
    });
  });

  describe('createSmsTemplate', () => {
    const SMS_DOCUMENT: SmsDocument = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tagName: 'rc-sms',
      content: { type: 'sms', content: [{ type: 'message', text: 'Hello!' }] },
    };

    const WIRE_SMS_TEMPLATE = {
      id: 789,
      name: 'Order SMS',
      message_type: 'text_message',
      template: SMS_DOCUMENT,
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-02 10:00:00',
    };

    it('POSTs to v3 /editor/template with message_type=text_message', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.createSmsTemplate({ name: 'Order SMS', content: SMS_DOCUMENT });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/template');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.message_type).toBe('text_message');
    });

    it('preserves a valid UUID id on the template field', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.createSmsTemplate({ content: SMS_DOCUMENT });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.template.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('auto-injects a UUID when id is missing', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      const docWithoutId: SmsDocument = {
        tagName: 'rc-sms',
        content: { type: 'sms', content: [{ type: 'message', text: 'Hello!' }] },
      };

      await client.createSmsTemplate({ content: docWithoutId });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.template.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('replaces a malformed id with a valid UUID', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      const docWithBadId: SmsDocument = {
        id: 'not-a-uuid',
        tagName: 'rc-sms',
        content: { type: 'sms', content: [{ type: 'message', text: 'Hello!' }] },
      };

      await client.createSmsTemplate({ content: docWithBadId });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.template.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      expect(body.template.id).not.toBe('not-a-uuid');
    });
  });

  describe('updateSmsTemplate', () => {
    const SMS_DOCUMENT: SmsDocument = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tagName: 'rc-sms',
      content: { type: 'sms', content: [{ type: 'message', text: 'Updated!' }] },
    };

    const WIRE_SMS_TEMPLATE = {
      id: 789,
      name: 'Order SMS',
      message_type: 'text_message',
      template: SMS_DOCUMENT,
      created_at: '2024-01-01 10:00:00',
      updated_at: '2024-01-02 10:00:00',
    };

    it('PUTs to /editor/template/:id and preserves valid UUID', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.updateSmsTemplate(789, { content: SMS_DOCUMENT });

      const [url] = fetchMock.mock.calls[0]!;
      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(url).toBe('https://app.rule.io/api/v3/editor/template/789');
      expect(body.template.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('auto-injects a UUID when content has no id', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      const docWithoutId: SmsDocument = {
        tagName: 'rc-sms',
        content: { type: 'sms', content: [{ type: 'message', text: 'Updated!' }] },
      };

      await client.updateSmsTemplate(789, { content: docWithoutId });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body.template.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('omits template field when content is not provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_SMS_TEMPLATE }));
      const client = createClient(fetchMock);

      await client.updateSmsTemplate(789, { name: 'New name' });

      const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);

      expect(body).not.toHaveProperty('template');
      expect(body.name).toBe('New name');
    });
  });

  describe('delete', () => {
    it('DELETEs the template and returns void', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      const result = await client.delete(456);

      expect(result).toBeUndefined();
      expect(fetchMock.mock.calls[0]![0]).toBe('https://app.rule.io/api/v3/editor/template/456');
    });
  });

  describe('listTemplates', () => {
    it('GETs /editor/template with no params by default', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [WIRE_TEMPLATE] }));
      const client = createClient(fetchMock);

      const result = await client.listTemplates();

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(456);
      expect(result[0]!.messageType).toBe('email');
    });

    it('maps pageSize to per_page in query string', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      await client.listTemplates({ pagination: { page: 2, pageSize: 50 } });

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('page=2');
      expect(url).toContain('per_page=50');
      expect(url).not.toContain('pageSize');
    });

    it('returns empty array when data is empty', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      expect(await client.listTemplates()).toEqual([]);
    });
  });

  describe('iterateTemplatesPages', () => {
    it('yields page arrays and stops when a page is smaller than pageSize', async () => {
      // Page 1: full page of 2, page 2: partial page of 1 → stop
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_TEMPLATE, WIRE_TEMPLATE] }))
        .mockResolvedValueOnce(createMockResponse({ data: [WIRE_TEMPLATE] }));
      const client = createClient(fetchMock);

      const pages: number[] = [];

      for await (const page of client.iterateTemplatesPages({ pagination: { pageSize: 2 } })) {
        pages.push(page.length);
      }

      expect(pages).toEqual([2, 1]);
      expect(fetchMock.mock.calls).toHaveLength(2);
    });

    it('stops immediately on empty first page', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      const pages: number[] = [];

      for await (const page of client.iterateTemplatesPages()) {
        pages.push(page.length);
      }

      expect(pages).toEqual([0]);
    });
  });

  describe('iterateTemplates', () => {
    it('yields individual templates across pages', async () => {
      const t1 = { ...WIRE_TEMPLATE, id: 1 };
      const t2 = { ...WIRE_TEMPLATE, id: 2 };
      const t3 = { ...WIRE_TEMPLATE, id: 3 };

      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [t1, t2] }))
        .mockResolvedValueOnce(createMockResponse({ data: [t3] }));
      const client = createClient(fetchMock);

      const ids: number[] = [];

      for await (const template of client.iterateTemplates({ pagination: { pageSize: 2 } })) {
        ids.push(template.id);
      }

      expect(ids).toEqual([1, 2, 3]);
    });
  });

  describe('listAllTemplates', () => {
    it('collects all templates from all pages into a single array', async () => {
      const t1 = { ...WIRE_TEMPLATE, id: 1 };
      const t2 = { ...WIRE_TEMPLATE, id: 2 };

      // pageSize=2: page 1 returns 2 items (full), page 2 returns 0 (stop)
      fetchMock
        .mockResolvedValueOnce(createMockResponse({ data: [t1, t2] }))
        .mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      const result = await client.listAllTemplates({ pagination: { pageSize: 2 } });

      expect(result.map((t) => t.id)).toEqual([1, 2]);
    });
  });

  describe('render', () => {
    it('returns the rendered HTML on 200', async () => {
      const html = '<html><body><h1>Hello</h1></body></html>';

      fetchMock.mockResolvedValueOnce(createMockTextResponse(html));
      const client = createClient(fetchMock);

      expect(await client.render(42)).toBe(html);
      expect(fetchMock.mock.calls[0]![0]).toBe(
        'https://app.rule.io/api/v3/editor/template/42/render'
      );
    });

    it('maps subscriberId to subscriber_id in query string', async () => {
      fetchMock.mockResolvedValueOnce(
        createMockTextResponse('<html><body>Hello Anna</body></html>')
      );
      const client = createClient(fetchMock);

      await client.render(42, { subscriberId: 1001 });

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('/template/42/render?');
      expect(url).toContain('subscriber_id=1001');
      expect(url).not.toContain('subscriberId');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse('Not found', 404));
      const client = createClient(fetchMock);

      expect(await client.render(99999)).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.render(42)).rejects.toBeInstanceOf(RuleApiError);
    });
  });
});
