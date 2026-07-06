/**
 * Public API: parse a Rule.io webhook body into a typed event.
 */

import { RuleClientError } from '../errors.js';

import type {
  CampaignLinkClickedEvent,
  CampaignOpenedEvent,
  CampaignSentEvent,
  ImportFinishedEvent,
  SubscriberAddedToSegmentEvent,
  SubscriberBouncedEvent,
  SubscriberOptedInEvent,
  SubscriberResubscribedEvent,
  SubscriberSuppressedEvent,
  SubscriberTagChangedEvent,
  TransactionLinkClickedEvent,
  TransactionOpenedEvent,
  TransactionSentEvent,
  WebhookAccount,
  WebhookBounceInfo,
  WebhookCampaignRef,
  WebhookEvent,
  WebhookImportSummary,
  WebhookSegmentRef,
  WebhookSubscriber,
  WebhookTagRef,
  WebhookTransactionMessage,
  WebhookTransactionRef,
} from './types.js';

// ── Per-ref camelCase mappers ────────────────────────────────────────────────

/** @internal */
function toSubscriber(raw: Record<string, unknown>): WebhookSubscriber {
  return {
    id: raw['id'] as number,
    ...(raw['email'] !== undefined ? { email: raw['email'] as string | null } : {}),
    ...(raw['phone_number'] !== undefined
      ? { phoneNumber: raw['phone_number'] as string | null }
      : {}),
  };
}

/** @internal */
function toAccount(raw: Record<string, unknown>): WebhookAccount {
  return {
    ...(raw['id'] !== undefined ? { id: raw['id'] as string } : {}),
    ...(raw['name'] !== undefined ? { name: raw['name'] as string } : {}),
  };
}

/** @internal */
function toTagRef(raw: Record<string, unknown>): WebhookTagRef {
  return { id: raw['id'] as number, name: raw['name'] as string };
}

/** @internal */
function toSegmentRef(raw: Record<string, unknown>): WebhookSegmentRef {
  return { id: raw['id'] as number, name: raw['name'] as string };
}

/** @internal */
function toCampaignRef(raw: Record<string, unknown>): WebhookCampaignRef {
  return {
    id: raw['id'] as number,
    name: raw['name'] as string,
    messageType: raw['message_type'] as string,
    ...(raw['number_of_recipients'] !== undefined
      ? { numberOfRecipients: raw['number_of_recipients'] as number }
      : {}),
    ...(raw['total_sent'] !== undefined ? { totalSent: raw['total_sent'] as number } : {}),
  };
}

/** @internal */
function toTransactionRef(raw: Record<string, unknown>): WebhookTransactionRef {
  return {
    id: raw['id'] as number,
    name: raw['name'] as string,
    messageType: raw['message_type'] as string,
  };
}

/** @internal */
function toTransactionMessage(raw: Record<string, unknown>): WebhookTransactionMessage {
  return {
    id: raw['id'] as number,
    transactionId: raw['transaction_id'] as number,
    subject: raw['subject'] as string,
    type: raw['type'] as string,
    createdAt: raw['created_at'] as string,
  };
}

/** @internal */
function toBounceInfo(raw: Record<string, unknown>): WebhookBounceInfo {
  return {
    dispatcherId: raw['dispatcher_id'] as number,
    type: raw['type'] as string,
    messageType: raw['message_type'] as string,
    dispatcherType: raw['dispatcher_type'] as string,
    bounceMessage: raw['bounce_message'] as string,
  };
}

/** @internal */
function toImportSummary(raw: Record<string, unknown>): WebhookImportSummary {
  return {
    id: raw['id'] as string,
    total: raw['total'] as string,
    new: raw['new'] as string,
    updated: raw['updated'] as string,
    failed: raw['failed'] as string,
    partialFailed: raw['partial_failed'] as string,
  };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

/**
 * Parse a Rule.io webhook body into a typed {@link WebhookEvent}.
 *
 * Accepts either a JSON string or a parsed object. The discriminator on
 * the returned event is a synthetic `type` literal the SDK derives from
 * which top-level keys are present in the body — Rule.io's payloads
 * have no `event_type` field of their own.
 *
 * Tag webhooks (add and remove) are returned as `'subscriber.tag-changed'`
 * because the apidoc body shapes are identical. Use `markTagDirection`
 * to commit the direction once you know which URL received the
 * request.
 *
 * @throws {RuleClientError} On invalid JSON, on payload shapes the
 *   parser does not recognise, and on the documented preference
 *   payloads (currently unsupported).
 *
 * @example
 * ```typescript
 * import { parseWebhookEvent } from '@rule/client';
 *
 * app.post('/webhooks/rule', (req, res) => {
 *   const event = parseWebhookEvent(req.body);
 *
 *   switch (event.type) {
 *     case 'subscriber.opted-in':
 *       // event.subscriber is typed
 *       break;
 *     case 'subscriber.bounced':
 *       // event.bounce is typed
 *       break;
 *   }
 *
 *   res.status(200).end();
 * });
 * ```
 *
 * @public
 */
export function parseWebhookEvent(body: string | object): WebhookEvent {
  let raw: Record<string, unknown>;

  if (typeof body === 'string') {
    try {
      raw = JSON.parse(body) as Record<string, unknown>;
    } catch (cause) {
      throw new RuleClientError('Webhook body is not valid JSON', { cause });
    }
  } else {
    raw = body as Record<string, unknown>;
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new RuleClientError('Webhook body must be a JSON object');
  }

  // Preference payloads are documented but not supported.
  if ('preferences' in raw && 'preference_group' in raw) {
    throw new RuleClientError(
      'Preference webhook events are not supported by this SDK. Open an issue if you need them.',
    );
  }

  // ── import.finished
  if ('import' in raw && raw['import'] !== undefined) {
    const event: ImportFinishedEvent = {
      type: 'import.finished',
      import: toImportSummary(raw['import'] as Record<string, unknown>),
    };

    return event;
  }

  // ── subscriber.bounced
  if ('bounce' in raw && raw['bounce'] !== undefined) {
    const event: SubscriberBouncedEvent = {
      type: 'subscriber.bounced',
      bounce: toBounceInfo(raw['bounce'] as Record<string, unknown>),
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
      account: toAccount((raw['account'] ?? {}) as Record<string, unknown>),
    };

    return event;
  }

  // ── subscriber.added-to-segment
  if ('segment' in raw && raw['segment'] !== undefined) {
    const subRaw = raw['subscriber'] as Record<string, unknown>;
    const subscriber: WebhookSubscriber & { account?: WebhookAccount } = toSubscriber(subRaw);

    if (subRaw['account'] !== undefined) {
      subscriber.account = toAccount(subRaw['account'] as Record<string, unknown>);
    }

    const event: SubscriberAddedToSegmentEvent = {
      type: 'subscriber.added-to-segment',
      segment: toSegmentRef(raw['segment'] as Record<string, unknown>),
      subscriber,
    };

    return event;
  }

  // ── subscriber.suppressed
  if ('dispatcher_type' in raw && 'suppressed_source_type' in raw) {
    const event: SubscriberSuppressedEvent = {
      type: 'subscriber.suppressed',
      dispatcherType: raw['dispatcher_type'] as string,
      messageType: raw['message_type'] as string,
      suppressedSourceType: raw['suppressed_source_type'] as string,
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
      account: toAccount((raw['account'] ?? {}) as Record<string, unknown>),
    };

    return event;
  }

  // ── transactions
  if ('transaction' in raw && raw['transaction'] !== undefined) {
    if ('link' in raw && raw['link'] !== undefined) {
      const event: TransactionLinkClickedEvent = {
        type: 'transaction.link-clicked',
        transaction: toTransactionRef(raw['transaction'] as Record<string, unknown>),
        subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
        link: raw['link'] as string,
      };

      return event;
    }

    const event: TransactionOpenedEvent = {
      type: 'transaction.opened',
      transaction: toTransactionRef(raw['transaction'] as Record<string, unknown>),
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
    };

    return event;
  }

  // ── transaction.sent (message + subscriber, no transaction key)
  if ('message' in raw && raw['message'] !== undefined && 'subscriber' in raw) {
    const event: TransactionSentEvent = {
      type: 'transaction.sent',
      message: toTransactionMessage(raw['message'] as Record<string, unknown>),
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
    };

    return event;
  }

  // ── campaigns
  if ('campaign' in raw && raw['campaign'] !== undefined) {
    if ('link' in raw && raw['link'] !== undefined) {
      const event: CampaignLinkClickedEvent = {
        type: 'campaign.link-clicked',
        campaign: toCampaignRef(raw['campaign'] as Record<string, unknown>),
        subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
        link: raw['link'] as string,
      };

      return event;
    }

    if ('subscriber' in raw && raw['subscriber'] !== undefined) {
      const event: CampaignOpenedEvent = {
        type: 'campaign.opened',
        campaign: toCampaignRef(raw['campaign'] as Record<string, unknown>),
        subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
      };

      return event;
    }

    const event: CampaignSentEvent = {
      type: 'campaign.sent',
      campaign: toCampaignRef(raw['campaign'] as Record<string, unknown>),
    };

    return event;
  }

  // ── tag-changed (ambiguous direction; caller commits via markTagDirection)
  if ('tag' in raw && raw['tag'] !== undefined && 'subscriber' in raw) {
    const event: SubscriberTagChangedEvent = {
      type: 'subscriber.tag-changed',
      tag: toTagRef(raw['tag'] as Record<string, unknown>),
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
    };

    return event;
  }

  // ── subscriber-only events
  if ('subscriber' in raw && raw['subscriber'] !== undefined) {
    if ('account' in raw && raw['account'] !== undefined) {
      const event: SubscriberResubscribedEvent = {
        type: 'subscriber.resubscribed',
        subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
        account: toAccount(raw['account'] as Record<string, unknown>),
      };

      return event;
    }

    const event: SubscriberOptedInEvent = {
      type: 'subscriber.opted-in',
      subscriber: toSubscriber(raw['subscriber'] as Record<string, unknown>),
    };

    return event;
  }

  // ── No recognised shape
  const keys = Object.keys(raw).join(', ') || '(none)';

  throw new RuleClientError(
    `Webhook body did not match any known event shape. Top-level keys: ${keys}`,
  );
}
