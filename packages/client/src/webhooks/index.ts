/**
 * Webhook utilities — typed event shapes and a body parser.
 *
 * See the Webhooks documentation page for the receiving-server walkthrough.
 */

export { parseWebhookEvent } from './parse.js';
export { markTagDirection } from './mark-tag.js';
export type {
  CampaignLinkClickedEvent,
  CampaignOpenedEvent,
  CampaignSentEvent,
  ImportFinishedEvent,
  SubscriberAddedToSegmentEvent,
  SubscriberAddedToTagEvent,
  SubscriberBouncedEvent,
  SubscriberOptedInEvent,
  SubscriberRemovedFromTagEvent,
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
