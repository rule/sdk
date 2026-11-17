/**
 * Norce Tag Definitions
 *
 * Tags match the Norce→Rule.io integration exactly (the Rule app's
 * `NorceOrderTransformer::getTags`). An order event adds the tag for the
 * order's status and removes the other order tags — unless the subscriber
 * already has that tag (then nothing is removed). A status outside the
 * list below changes no tags. So a subscriber can hold more than one.
 * @see https://help.rule.io/en/articles/349489-norce-integration
 */

import type { VendorTagSchema } from '@rule/vendor';

/**
 * Norce tags for Rule.io automations, keyed by the Norce order status that
 * sets them.
 *
 * @example
 * ```typescript
 * import { NORCE_TAGS } from '@rule/vendor-norce';
 *
 * await client.syncSubscriber({
 *   email: 'customer@example.com',
 *   tags: [NORCE_TAGS.orderProcessing],
 * }, 'Order');
 * ```
 */
export const NORCE_TAGS = {
  /** Norce status `Created`. */
  orderPlaced: 'OrderPlaced',
  /** Norce status `Confirmed`. Triggers the order-confirmation email. */
  orderProcessing: 'OrderProcessing',
  /** Norce status `Delivered`. */
  orderShipped: 'OrderShipped',
  /** Norce status `Invoiced`. */
  orderCompleted: 'OrderCompleted',
  /**
   * Norce statuses `Cancelled` and `Credited` (both set this tag). The
   * spelling with one L is the integration's own.
   */
  orderCanceled: 'OrderCanceled',
} as const satisfies VendorTagSchema;

/** Object type of the Norce tag schema. */
export type NorceTagSchema = typeof NORCE_TAGS;

/** Union of logical Norce tag name keys. */
export type NorceTagNames = keyof NorceTagSchema;
