/**
 * Public types for Rule.io account-level webhooks.
 *
 * Rule.io configures webhook URLs in the account UI (under
 * Settings → Developer → Webhooks). When an event fires, Rule.io POSTs a
 * JSON body to the configured URL. The bodies are documented in the
 * apidoc at https://apidoc.rule.se/#webhooks.
 *
 * The discriminator on every variant is a synthetic `type` literal the
 * SDK adds to the parsed event — Rule.io's wire bodies have no
 * `event_type` field. The SDK derives it by inspecting which top-level
 * keys are present.
 *
 * Note: preference events (`subscriber.added-to-preference` and
 * `subscriber.removed-from-preference`) exist in the apidoc but are not
 * supported by `parseWebhookEvent` — they currently throw with a clear
 * message. They will be added in a follow-up if needed.
 */

// ── Reusable reference shapes ─────────────────────────────────────────────────

/** Minimal subscriber identity reported in webhook payloads. */
export interface WebhookSubscriber {
  id: number;
  email?: string | null;
  phoneNumber?: string | null;
}

/** Account block included in some events. */
export interface WebhookAccount {
  id?: string;
  name?: string;
}

/** Tag reference attached to tag-changed events. */
export interface WebhookTagRef {
  id: number;
  name: string;
}

/** Segment reference attached to segment-add events. */
export interface WebhookSegmentRef {
  id: number;
  name: string;
}

/** Campaign reference shared by every campaign event. */
export interface WebhookCampaignRef {
  id: number;
  name: string;
  /** `'email'` or `'text_message'` per the apidoc. */
  messageType: string;
  /** Present on `campaign.sent` only. */
  numberOfRecipients?: number;
  /** Present on `campaign.sent` only. */
  totalSent?: number;
}

/** Transaction reference shared by transaction-link and transaction-opened events. */
export interface WebhookTransactionRef {
  id: number;
  name: string;
  messageType: string;
}

/** Message reference attached to `transaction.sent`. */
export interface WebhookTransactionMessage {
  id: number;
  transactionId: number;
  subject: string;
  type: string;
  createdAt: string;
}

/** Bounce metadata attached to `subscriber.bounced`. */
export interface WebhookBounceInfo {
  dispatcherId: number;
  /** `'soft'` or `'hard'` per the apidoc. */
  type: string;
  messageType: string;
  /** `'campaign'` or `'transactional'` per the apidoc. */
  dispatcherType: string;
  bounceMessage: string;
}

/**
 * Counters block attached to `import.finished`.
 *
 * The apidoc example shows every field as a string (e.g. `"import-total"`),
 * not a number; the SDK type mirrors that wire shape verbatim. Cast to
 * a number at the receiver if you need arithmetic.
 */
export interface WebhookImportSummary {
  id: string;
  total: string;
  new: string;
  updated: string;
  failed: string;
  partialFailed: string;
}

// ── Event variants ────────────────────────────────────────────────────────────

export interface TransactionSentEvent {
  type: 'transaction.sent';
  message: WebhookTransactionMessage;
  subscriber: WebhookSubscriber;
}

export interface TransactionLinkClickedEvent {
  type: 'transaction.link-clicked';
  transaction: WebhookTransactionRef;
  subscriber: WebhookSubscriber;
  link: string;
}

export interface TransactionOpenedEvent {
  type: 'transaction.opened';
  transaction: WebhookTransactionRef;
  subscriber: WebhookSubscriber;
}

export interface CampaignSentEvent {
  type: 'campaign.sent';
  campaign: WebhookCampaignRef;
}

export interface CampaignLinkClickedEvent {
  type: 'campaign.link-clicked';
  campaign: WebhookCampaignRef;
  subscriber: WebhookSubscriber;
  link: string;
}

export interface CampaignOpenedEvent {
  type: 'campaign.opened';
  campaign: WebhookCampaignRef;
  subscriber: WebhookSubscriber;
}

export interface SubscriberOptedInEvent {
  type: 'subscriber.opted-in';
  subscriber: WebhookSubscriber;
}

export interface SubscriberSuppressedEvent {
  type: 'subscriber.suppressed';
  /** `'campaign'` or `'transactional'`. */
  dispatcherType: string;
  /** `'email'` or `'text_message'`. */
  messageType: string;
  /** `'user'`, `'admin'`, `'spam'`, or `'api'` per the apidoc. */
  suppressedSourceType: string;
  subscriber: WebhookSubscriber;
  account: WebhookAccount;
}

/**
 * The default shape returned by `parseWebhookEvent` for tag-add and
 * tag-remove webhooks — the wire bodies are identical, so the parser
 * cannot tell them apart from the body alone. Caller commits the
 * direction with `markTagDirection(event, 'added' | 'removed')` once
 * they know which webhook URL received the request.
 */
export interface SubscriberTagChangedEvent {
  type: 'subscriber.tag-changed';
  tag: WebhookTagRef;
  subscriber: WebhookSubscriber;
}

/** Returned by `markTagDirection(event, 'added')`. */
export interface SubscriberAddedToTagEvent {
  type: 'subscriber.added-to-tag';
  tag: WebhookTagRef;
  subscriber: WebhookSubscriber;
}

/** Returned by `markTagDirection(event, 'removed')`. */
export interface SubscriberRemovedFromTagEvent {
  type: 'subscriber.removed-from-tag';
  tag: WebhookTagRef;
  subscriber: WebhookSubscriber;
}

export interface SubscriberAddedToSegmentEvent {
  type: 'subscriber.added-to-segment';
  segment: WebhookSegmentRef;
  /**
   * The apidoc example puts `account` *inside* `subscriber` for this
   * event only. The type matches that shape.
   */
  subscriber: WebhookSubscriber & { account?: WebhookAccount };
}

export interface SubscriberBouncedEvent {
  type: 'subscriber.bounced';
  bounce: WebhookBounceInfo;
  subscriber: WebhookSubscriber;
  account: WebhookAccount;
}

export interface SubscriberResubscribedEvent {
  type: 'subscriber.resubscribed';
  subscriber: WebhookSubscriber;
  account: WebhookAccount;
}

export interface ImportFinishedEvent {
  type: 'import.finished';
  import: WebhookImportSummary;
}

/**
 * Discriminated union of every webhook event the SDK currently parses.
 *
 * Use `switch (event.type)` to narrow downstream. The
 * `'subscriber.tag-changed'` variant is the parser's default for tag
 * webhooks; commit the direction with `markTagDirection` to narrow to
 * `'subscriber.added-to-tag'` or `'subscriber.removed-from-tag'`.
 */
export type WebhookEvent =
  | TransactionSentEvent
  | TransactionLinkClickedEvent
  | TransactionOpenedEvent
  | CampaignSentEvent
  | CampaignLinkClickedEvent
  | CampaignOpenedEvent
  | SubscriberOptedInEvent
  | SubscriberSuppressedEvent
  | SubscriberTagChangedEvent
  | SubscriberAddedToTagEvent
  | SubscriberRemovedFromTagEvent
  | SubscriberAddedToSegmentEvent
  | SubscriberBouncedEvent
  | SubscriberResubscribedEvent
  | ImportFinishedEvent;
