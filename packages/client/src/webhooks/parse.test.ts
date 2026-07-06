import { describe, expect, it } from 'vitest';

import { RuleClientError } from '../errors.js';
import { parseWebhookEvent } from './parse.js';

// Apidoc literal payload fixtures — verbatim from
// https://apidoc.rule.se/#webhooks (with email substituted to a real-looking
// address since the apidoc shows `[email protected]` as a placeholder).

const SUBSCRIBER = {
  id: 111111,
  email: 'jane@example.com',
  phone_number: '+46705555555',
};

const SUBSCRIBER_CAMEL = {
  id: 111111,
  email: 'jane@example.com',
  phoneNumber: '+46705555555',
};

describe('parseWebhookEvent', () => {
  describe('input handling', () => {
    it('accepts a JSON string body', () => {
      const event = parseWebhookEvent(
        JSON.stringify({ subscriber: SUBSCRIBER }),
      );

      expect(event.type).toBe('subscriber.opted-in');
    });

    it('accepts an already-parsed object body', () => {
      const event = parseWebhookEvent({ subscriber: SUBSCRIBER });

      expect(event.type).toBe('subscriber.opted-in');
    });

    it('throws RuleClientError on invalid JSON', () => {
      expect(() => parseWebhookEvent('{ not json')).toThrow(RuleClientError);
    });

    it('throws RuleClientError when body is not a JSON object', () => {
      expect(() => parseWebhookEvent('[1,2,3]')).toThrow(RuleClientError);
    });

    it('throws RuleClientError with the offending keys for unknown shapes', () => {
      expect(() => parseWebhookEvent({ unknownKey: 1, anotherKey: 2 })).toThrow(
        /unknownKey, anotherKey/,
      );
    });

    it('throws RuleClientError on preference payloads (currently unsupported)', () => {
      const body = {
        preferences: [{ id: 1, name: 'A' }],
        preference_group: { id: 2, name: 'G' },
        subscriber: SUBSCRIBER,
      };

      expect(() => parseWebhookEvent(body)).toThrow(/Preference webhook events/);
    });
  });

  describe('transactions', () => {
    it('parses transaction.sent', () => {
      const event = parseWebhookEvent({
        message: {
          id: 111111,
          transaction_id: 111111,
          subject: 'dummy-subject',
          type: 'email',
          created_at: '1970-01-01 00:00:00',
        },
        subscriber: SUBSCRIBER,
      });

      expect(event).toEqual({
        type: 'transaction.sent',
        message: {
          id: 111111,
          transactionId: 111111,
          subject: 'dummy-subject',
          type: 'email',
          createdAt: '1970-01-01 00:00:00',
        },
        subscriber: SUBSCRIBER_CAMEL,
      });
    });

    it('parses transaction.link-clicked', () => {
      const event = parseWebhookEvent({
        transaction: { id: 111111, name: 'transaction-name', message_type: 'email' },
        subscriber: SUBSCRIBER,
        link: 'https://www.example.com',
      });

      expect(event).toEqual({
        type: 'transaction.link-clicked',
        transaction: { id: 111111, name: 'transaction-name', messageType: 'email' },
        subscriber: SUBSCRIBER_CAMEL,
        link: 'https://www.example.com',
      });
    });

    it('parses transaction.opened', () => {
      const event = parseWebhookEvent({
        transaction: { id: 111111, name: 'transaction-name', message_type: 'text_message' },
        subscriber: SUBSCRIBER,
      });

      expect(event.type).toBe('transaction.opened');

      if (event.type !== 'transaction.opened') return;
      expect(event.transaction.messageType).toBe('text_message');
    });
  });

  describe('campaigns', () => {
    it('parses campaign.sent (no subscriber)', () => {
      const event = parseWebhookEvent({
        campaign: {
          id: 111111,
          name: 'campaign-name',
          message_type: 'email',
          number_of_recipients: 123,
          total_sent: 123,
        },
      });

      expect(event).toEqual({
        type: 'campaign.sent',
        campaign: {
          id: 111111,
          name: 'campaign-name',
          messageType: 'email',
          numberOfRecipients: 123,
          totalSent: 123,
        },
      });
    });

    it('parses campaign.link-clicked', () => {
      const event = parseWebhookEvent({
        campaign: { id: 111111, name: 'campaign-name', message_type: 'email' },
        subscriber: SUBSCRIBER,
        link: 'https://www.example.com',
      });

      expect(event.type).toBe('campaign.link-clicked');

      if (event.type !== 'campaign.link-clicked') return;
      expect(event.link).toBe('https://www.example.com');
      expect(event.campaign.name).toBe('campaign-name');
    });

    it('parses campaign.opened (subscriber, no link)', () => {
      const event = parseWebhookEvent({
        campaign: { id: 111111, name: 'campaign-name', message_type: 'email' },
        subscriber: SUBSCRIBER,
      });

      expect(event.type).toBe('campaign.opened');
    });
  });

  describe('subscribers', () => {
    it('parses subscriber.opted-in (subscriber only)', () => {
      const event = parseWebhookEvent({ subscriber: SUBSCRIBER });

      expect(event).toEqual({
        type: 'subscriber.opted-in',
        subscriber: SUBSCRIBER_CAMEL,
      });
    });

    it('parses subscriber.resubscribed (subscriber + account)', () => {
      const event = parseWebhookEvent({
        subscriber: SUBSCRIBER,
        account: { name: 'account-name' },
      });

      expect(event).toEqual({
        type: 'subscriber.resubscribed',
        subscriber: SUBSCRIBER_CAMEL,
        account: { name: 'account-name' },
      });
    });

    it('parses subscriber.suppressed', () => {
      const event = parseWebhookEvent({
        dispatcher_type: 'campaign',
        message_type: 'email',
        suppressed_source_type: 'user',
        subscriber: SUBSCRIBER,
        account: { name: 'account-name' },
      });

      expect(event).toEqual({
        type: 'subscriber.suppressed',
        dispatcherType: 'campaign',
        messageType: 'email',
        suppressedSourceType: 'user',
        subscriber: SUBSCRIBER_CAMEL,
        account: { name: 'account-name' },
      });
    });

    it('parses subscriber.bounced', () => {
      const event = parseWebhookEvent({
        bounce: {
          dispatcher_id: 111111,
          type: 'soft',
          message_type: 'email',
          dispatcher_type: 'campaign',
          bounce_message: 'bounce message',
        },
        subscriber: SUBSCRIBER,
        account: { name: 'account-name' },
      });

      expect(event).toEqual({
        type: 'subscriber.bounced',
        bounce: {
          dispatcherId: 111111,
          type: 'soft',
          messageType: 'email',
          dispatcherType: 'campaign',
          bounceMessage: 'bounce message',
        },
        subscriber: SUBSCRIBER_CAMEL,
        account: { name: 'account-name' },
      });
    });

    it('parses subscriber.added-to-segment with account nested under subscriber', () => {
      const event = parseWebhookEvent({
        segment: { id: 111111, name: 'segment-name' },
        subscriber: {
          ...SUBSCRIBER,
          account: { id: 'account-id', name: 'account-name' },
        },
      });

      expect(event.type).toBe('subscriber.added-to-segment');

      if (event.type !== 'subscriber.added-to-segment') return;
      expect(event.subscriber.account).toEqual({ id: 'account-id', name: 'account-name' });
      expect(event.segment).toEqual({ id: 111111, name: 'segment-name' });
    });
  });

  describe('tag-changed (ambiguous direction)', () => {
    it('parses an "added to tag" body as subscriber.tag-changed', () => {
      const event = parseWebhookEvent({
        tag: { id: 111111, name: 'tag-name' },
        subscriber: SUBSCRIBER,
      });

      expect(event).toEqual({
        type: 'subscriber.tag-changed',
        tag: { id: 111111, name: 'tag-name' },
        subscriber: SUBSCRIBER_CAMEL,
      });
    });

    it('parses a "removed from tag" body identically to "added to tag"', () => {
      // Same body shape per the apidoc — direction is not in the body.
      const event = parseWebhookEvent({
        tag: { id: 222222, name: 'other-tag' },
        subscriber: SUBSCRIBER,
      });

      expect(event.type).toBe('subscriber.tag-changed');
    });
  });

  describe('imports', () => {
    it('parses import.finished (counters as strings)', () => {
      const event = parseWebhookEvent({
        import: {
          id: 'import-id',
          total: 'import-total',
          new: 'import-new',
          updated: 'import-updated',
          failed: 'import-failed',
          partial_failed: 'import-partial-failed',
        },
      });

      expect(event).toEqual({
        type: 'import.finished',
        import: {
          id: 'import-id',
          total: 'import-total',
          new: 'import-new',
          updated: 'import-updated',
          failed: 'import-failed',
          partialFailed: 'import-partial-failed',
        },
      });
    });
  });
});
