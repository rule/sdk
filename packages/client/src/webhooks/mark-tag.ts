/**
 * Public API: commit the direction of a `subscriber.tag-changed` event.
 */

import { RuleClientError } from '../errors.js';

import type {
  SubscriberAddedToTagEvent,
  SubscriberRemovedFromTagEvent,
  SubscriberTagChangedEvent,
  WebhookEvent,
} from './types.js';

/**
 * Commit the direction of a `subscriber.tag-changed` event.
 *
 * Rule.io's "added to tag" and "removed from tag" webhook bodies are
 * identical — `parseWebhookEvent` therefore returns the ambiguous
 * `subscriber.tag-changed` shape. Once the receiver knows which
 * direction the request represents (typically because the URL was
 * configured for one or the other in Rule.io's account UI), call this
 * helper to narrow the type.
 *
 * The returned event preserves the original `tag` and `subscriber`
 * fields — only the discriminator changes.
 *
 * @throws {RuleClientError} If `event.type` is not
 *   `'subscriber.tag-changed'`.
 *
 * @example
 * ```typescript
 * import { parseWebhookEvent, markTagDirection } from '@rule/client';
 *
 * app.post('/webhooks/rule/tag-added', (req, res) => {
 *   const parsed = parseWebhookEvent(req.body);
 *
 *   if (parsed.type !== 'subscriber.tag-changed') {
 *     // unexpected — only tag webhooks should reach this URL
 *     return res.status(400).end();
 *   }
 *
 *   const event = markTagDirection(parsed, 'added');
 *   // event.type === 'subscriber.added-to-tag'
 *
 *   res.status(200).end();
 * });
 * ```
 *
 * @public
 */
export function markTagDirection(
  event: SubscriberTagChangedEvent,
  direction: 'added',
): SubscriberAddedToTagEvent;
export function markTagDirection(
  event: SubscriberTagChangedEvent,
  direction: 'removed',
): SubscriberRemovedFromTagEvent;
export function markTagDirection(
  event: SubscriberTagChangedEvent,
  direction: 'added' | 'removed',
): SubscriberAddedToTagEvent | SubscriberRemovedFromTagEvent;

export function markTagDirection(
  event: WebhookEvent,
  direction: 'added' | 'removed',
): SubscriberAddedToTagEvent | SubscriberRemovedFromTagEvent {
  if (event.type !== 'subscriber.tag-changed') {
    throw new RuleClientError(
      `markTagDirection only accepts events with type 'subscriber.tag-changed' (got '${event.type}')`,
    );
  }

  return {
    type: direction === 'added' ? 'subscriber.added-to-tag' : 'subscriber.removed-from-tag',
    tag: event.tag,
    subscriber: event.subscriber,
  };
}
