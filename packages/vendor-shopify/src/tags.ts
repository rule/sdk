/**
 * Shopify Tag Definitions
 *
 * Tags match the actual Shopify→Rule.io integration exactly.
 * @see https://help.rule.io/en/articles/349484-shopify-integration
 */

import type { VendorTagSchema } from '@rule/vendor';

/**
 * Shopify tags for Rule.io automations.
 *
 * @example
 * ```typescript
 * import { SHOPIFY_TAGS } from '@rule/sdk';
 *
 * await client.syncSubscriber({
 *   email: 'customer@example.com',
 *   tags: [SHOPIFY_TAGS.orderCompleted],
 * }, 'Order');
 * ```
 */
export const SHOPIFY_TAGS = {
  cartInProgress: 'CartInProgress',
  orderCompleted: 'OrderCompleted',
  orderShipped: 'OrderShipped',
  /**
   * Not set by the Shopify app (it syncs no cancellation event). Apply it
   * yourself, e.g. from a Shopify Flow or `orders/cancelled` webhook,
   * before using the order-cancellation template.
   */
  orderCancelled: 'OrderCancelled',
  newsletter: 'Newsletter',
} as const satisfies VendorTagSchema;

/** Object type of the Shopify tag schema. */
export type ShopifyTagSchema = typeof SHOPIFY_TAGS;

/** Union of logical Shopify tag name keys. */
export type ShopifyTagNames = keyof ShopifyTagSchema;
