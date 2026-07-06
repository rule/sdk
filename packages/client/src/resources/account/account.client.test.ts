import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMockFetch,
  createMockResponse,
  createMockTransport,
  type MockFetch,
} from '../../core/mock-fetch.js';
import { AccountClient } from './account.client.js';

const WIRE_SENDER = {
  status: 200,
  account_id: 42,
  name: 'Acme Sender',
  email: 'sender@acme.com',
  company: 'Acme Inc',
  text_message_sender_name: 'Acme',
  link_instead_of_stop_word: true,
};

function createClient(fetchMock: MockFetch): AccountClient {
  return new AccountClient(createMockTransport(fetchMock));
}

describe('AccountClient', () => {
  let fetchMock: MockFetch;

  beforeEach(() => {
    fetchMock = createMockFetch();
  });

  describe('getSenderDetails', () => {
    it('GETs the v2 sender/details endpoint', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      const client = createClient(fetchMock);

      await client.getSenderDetails();

      const [url, init] = fetchMock.mock.calls[0]!;

      expect(url).toBe('https://app.rule.io/api/v2/sender/details');
      expect((init as RequestInit).method).toBe('GET');
    });

    it('maps wire snake_case to camelCase entity', async () => {
      fetchMock.mockResolvedValueOnce(createMockResponse(WIRE_SENDER));
      const client = createClient(fetchMock);

      const result = await client.getSenderDetails();

      expect(result).toEqual({
        accountId: 42,
        name: 'Acme Sender',
        email: 'sender@acme.com',
        company: 'Acme Inc',
        textMessageSenderName: 'Acme',
        linkInsteadOfStopWord: true,
      });
    });

    it('maps undefined link_instead_of_stop_word to undefined', async () => {
      const wire = { ...WIRE_SENDER };

      delete (wire as Partial<typeof WIRE_SENDER>).link_instead_of_stop_word;
      fetchMock.mockResolvedValueOnce(createMockResponse(wire));
      const client = createClient(fetchMock);

      const result = await client.getSenderDetails();

      expect(result.linkInsteadOfStopWord).toBeUndefined();
    });
  });
});
