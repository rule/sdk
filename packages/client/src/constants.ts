/**
 * Rule.io SDK Constants
 */

/**
 * Default API base URLs
 */
export const RULE_API_V2_BASE_URL = 'https://app.rule.io/api/v2';
export const RULE_API_V3_BASE_URL = 'https://app.rule.io/api/v3';

/**
 * Common Rule.io tags for e-commerce and hospitality.
 *
 * @deprecated Prefer vendor-specific tags instead (e.g., `SHOPIFY_TAGS`, `BOOKZEN_TAGS`).
 * These generic tags are kept for backward compatibility.
 *
 * @example
 * ```typescript
 * // Prefer vendor-specific tags:
 * import { SHOPIFY_TAGS } from '@rule/sdk';
 * await client.syncSubscriber({
 *   email: 'customer@example.com',
 *   tags: [SHOPIFY_TAGS.orderCompleted],
 * });
 * ```
 */
export const RuleTags = {
  // Order lifecycle — matches Shopify preset tags
  CART_IN_PROGRESS: 'CartInProgress',
  ORDER_SHIPPED: 'OrderShipped',
  ORDER_COMPLETED: 'OrderCompleted',
  NEWSLETTER: 'Newsletter',

  // Hospitality-specific
  ACCOMMODATION: 'accommodation',
  RESTAURANT: 'restaurant',
  EXPERIENCE: 'experience',

  // Customer segmentation
  RETURNING_CUSTOMER: 'returning-customer',
  NEW_CUSTOMER: 'new-customer',
} as const;

export type RuleTag = (typeof RuleTags)[keyof typeof RuleTags];
