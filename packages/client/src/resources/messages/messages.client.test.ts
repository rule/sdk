import { beforeEach, describe, expect, it } from 'vitest';

import { RuleApiError } from '../../errors.js';

import {
  createMockErrorResponse,
  createMockFetch,
  createMockResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { MessagesClient } from './messages.client.js';

const WIRE_MESSAGE = {
  id: 10,
  type: 1,
  subject: 'Hello world',
  pre_header: 'Preview text',
  sender: {
    name: 'Jane',
    email: 'jane@acme.com',
    phone_number: null,
  },
  utm_campaign: 'spring',
  utm_term: null,
  dispatcher: { id: 42, type: 1 },
  created_at: '2024-01-01 10:00:00',
  updated_at: '2024-01-02 10:00:00',
};

function createClient(fetchMock: MockFetch): MessagesClient {
  return new MessagesClient(createMockTransport(fetchMock));
}

describe('MessagesClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('createEmailCampaignMessage', () => {
    it('POSTs to v3 /editor/message with campaign dispatcher and maps response to camelCase', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      const result = await client.createEmailCampaignMessage(42, {
        subject: 'Hello world',
        fromName: 'Jane',
        fromEmail: 'jane@acme.com',
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/message');
      expect((init as RequestInit).method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.dispatcher).toEqual({ id: 42, type: 'campaign' });
      expect(body.type).toBe(1);
      // sender is a nested object on the wire
      expect(body.sender).toEqual({ name: 'Jane', email: 'jane@acme.com' });
      // no flat from_name/from_email
      expect(body).not.toHaveProperty('from_name');
      expect(body).not.toHaveProperty('from_email');
      // no automail_setting for campaign messages
      expect(body.automail_setting).toBeUndefined();

      // response normalised to camelCase
      expect(result.id).toBe(10);
      expect(result.fromName).toBe('Jane');
      expect(result.fromEmail).toBe('jane@acme.com');
      expect(result.utmCampaign).toBe('spring');
      expect(result.utmTerm).toBeNull();
      expect(result.messageType).toBe(1);
      expect(result.dispatcher).toEqual({ id: 42, type: 1 });
      expect(result.createdAt).toBe('2024-01-01 10:00:00');
      // no snake_case keys on the entity
      expect(result).not.toHaveProperty('pre_header');
      expect(result).not.toHaveProperty('utm_campaign');
    });

    it('maps preheader to pre_header on the wire', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      await client.createEmailCampaignMessage(1, {
        subject: 'S',
        preheader: 'Check this out',
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.pre_header).toBe('Check this out');
      expect(body).not.toHaveProperty('preheader');
    });

    it('omits sender object when neither fromName nor fromEmail is provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      await client.createEmailCampaignMessage(1, { subject: 'S' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.sender).toBeUndefined();
    });
  });

  describe('createEmailAutomationMessage', () => {
    it('POSTs with automail dispatcher and maps automail_setting with integer delay', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      await client.createEmailAutomationMessage(99, {
        subject: 'Welcome',
        automailSetting: { active: true, delayInSeconds: '3600' },
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.dispatcher).toEqual({ id: 99, type: 'automail' });
      // delay_in_seconds must be a number, not a string
      expect(body.automail_setting).toEqual({ active: true, delay_in_seconds: 3600 });
      expect(typeof body.automail_setting.delay_in_seconds).toBe('number');
    });

    it('maps camelCase payload fields to snake_case wire body', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      await client.createEmailAutomationMessage(1, {
        subject: 'S',
        fromName: 'Bob',
        utmCampaign: 'launch',
        utmTerm: 'beta',
      });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.sender.name).toBe('Bob');
      expect(body.utm_campaign).toBe('launch');
      expect(body.utm_term).toBe('beta');
      expect(body).not.toHaveProperty('utmCampaign');
    });
  });

  describe('get', () => {
    it('returns the message as a camelCase entity on 200', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      const result = await client.get(10);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(10);
      expect(result!.fromName).toBe('Jane');
      expect(result!.fromEmail).toBe('jane@acme.com');
      expect(result!.preheader).toBe('Preview text');
      expect(result!.messageType).toBe(1);
      expect(result!.createdAt).toBe('2024-01-01 10:00:00');
      // no snake_case keys
      expect(result).not.toHaveProperty('pre_header');
      expect(result).not.toHaveProperty('from_name');
    });

    it('returns null on 404', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 404));
      const client = createClient(fetchMock);

      expect(await client.get(5)).toBeNull();
    });

    it('rethrows non-404 errors', async () => {
      fetchMock.mockResolvedValueOnce(createMockErrorResponse({}, 500));
      const client = createClient(fetchMock);

      await expect(client.get(5)).rejects.toBeInstanceOf(RuleApiError);
    });

    describe('automail_setting mapping', () => {
      it('maps type=delay with non-zero delay to entity discriminant with string delayInSeconds', async () => {
        const wire = {
          ...WIRE_MESSAGE,
          dispatcher: { id: 77, type: -2 },
          automail_setting: { type: 'delay', active: true, delay: 259200 },
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({ data: wire }));
        const client = createClient(fetchMock);

        const result = await client.get(10);

        expect(result!.automailSetting).toEqual({
          type: 'delay',
          active: true,
          delayInSeconds: '259200',
        });
        expect(typeof (result!.automailSetting as { delayInSeconds: string }).delayInSeconds).toBe(
          'string'
        );
      });

      it('maps type=delay with delay=0 to delayInSeconds="0" (immediate delivery)', async () => {
        const wire = {
          ...WIRE_MESSAGE,
          dispatcher: { id: 77, type: -2 },
          automail_setting: { type: 'delay', active: true, delay: 0 },
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({ data: wire }));
        const client = createClient(fetchMock);

        const result = await client.get(10);

        expect(result!.automailSetting).toEqual({
          type: 'delay',
          active: true,
          delayInSeconds: '0',
        });
      });

      it('maps type=custom without delay to entity discriminant without delayInSeconds', async () => {
        const wire = {
          ...WIRE_MESSAGE,
          dispatcher: { id: 77, type: -2 },
          automail_setting: { type: 'custom', active: false },
        };

        fetchMock.mockResolvedValueOnce(createMockResponse({ data: wire }));
        const client = createClient(fetchMock);

        const result = await client.get(10);

        expect(result!.automailSetting).toEqual({ type: 'custom', active: false });
        expect(result!.automailSetting).not.toHaveProperty('delayInSeconds');
      });

      it('leaves automailSetting undefined for campaign messages (no automail_setting on wire)', async () => {
        fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
        const client = createClient(fetchMock);

        const result = await client.get(10);

        expect(result!.automailSetting).toBeUndefined();
        expect(result).not.toHaveProperty('automail_setting');
      });
    });
  });

  describe('updateEmailCampaignMessage', () => {
    it('PUTs camelCase payload mapped to snake_case body without automail_setting', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      const result = await client.updateEmailCampaignMessage(10, {
        subject: 'New subject',
        fromName: 'Bob',
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/message/10');
      expect((init as RequestInit).method).toBe('PUT');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subject).toBe('New subject');
      expect(body.sender.name).toBe('Bob');
      // campaign messages must not send automail_setting
      expect(body.automail_setting).toBeUndefined();
      expect(body).not.toHaveProperty('fromName');

      expect(result.id).toBe(10);
    });
  });

  describe('updateEmailAutomationMessage', () => {
    it('PUTs with automail_setting mapped to integer delay', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      const result = await client.updateEmailAutomationMessage(10, {
        subject: 'Welcome — updated',
        automailSetting: { active: true, delayInSeconds: '3600' },
      });

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v3/editor/message/10');
      expect((init as RequestInit).method).toBe('PUT');

      const body = JSON.parse((init as RequestInit).body as string);

      expect(body.subject).toBe('Welcome — updated');
      expect(body.automail_setting).toEqual({ active: true, delay_in_seconds: 3600 });
      expect(typeof body.automail_setting.delay_in_seconds).toBe('number');
      expect(body).not.toHaveProperty('automailSetting');

      expect(result.id).toBe(10);
    });

    it('omits automail_setting when not provided', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: WIRE_MESSAGE }));
      const client = createClient(fetchMock);

      await client.updateEmailAutomationMessage(10, { subject: 'Only subject' });

      const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);

      expect(body.automail_setting).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('DELETEs the message and returns void', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ success: true }));
      const client = createClient(fetchMock);

      const result = await client.delete(5);

      expect(result).toBeUndefined();
      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toBe('https://app.rule.io/api/v3/editor/message/5');
    });
  });

  describe('listCampaignMessages', () => {
    it('GETs with dispatcher_type=campaign and returns EmailCampaignMessage[]', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [WIRE_MESSAGE] }));
      const client = createClient(fetchMock);

      const result = await client.listCampaignMessages(123);

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe(10);
      expect(result[0]!.fromName).toBe('Jane');

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('id=123');
      expect(url).toContain('dispatcher_type=campaign');
    });

    it('returns empty array when data is empty', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [] }));
      const client = createClient(fetchMock);

      expect(await client.listCampaignMessages(1)).toEqual([]);
    });
  });

  describe('listAutomationMessages', () => {
    it('GETs with dispatcher_type=automail and returns EmailAutomationMessage[]', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse({ data: [WIRE_MESSAGE] }));
      const client = createClient(fetchMock);

      await client.listAutomationMessages(77);

      const url = fetchMock.mock.calls[0]![0] as string;

      expect(url).toContain('id=77');
      expect(url).toContain('dispatcher_type=automail');
    });
  });
});
