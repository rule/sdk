/**
 * Recipients types for the `@rule/client` recipients namespace.
 *
 * These endpoints return lightweight lists of segments, tags, and subscribers
 * for use when setting up campaign or automation recipient targeting. They are
 * distinct from the main subscriber and tag management endpoints.
 */

import type { PagePaginationParams, RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

/**
 * A segment available for campaign recipient targeting.
 *
 * Use segment IDs from this endpoint when calling
 * `client.campaigns.updateEmailCampaign()` or creating automations.
 */
export interface RecipientSegment {
  id: number;
  name: string;
}

/**
 * A tag available for campaign recipient targeting.
 *
 * Use tag IDs from this endpoint when calling
 * `client.campaigns.setCampaignTags()` or `updateEmailCampaign()`.
 */
export interface RecipientTag {
  id: number;
  name: string;
}

/**
 * A subscriber as returned by the recipient targeting endpoint.
 *
 * This is intentionally distinct from the main `Subscriber` entity — the
 * recipients endpoint returns a lightweight shape optimised for targeting
 * lookups rather than full subscriber management.
 */
export interface RecipientSubscriber {
  id: number;
  email?: string | null;
  /** Phone number. */
  phone?: string | null;
  customIdentifier?: string | null;
  accountId?: number;
  status?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Parameters for all recipient listing methods.
 *
 * The API defaults to 15 items per page.
 */
export interface ListRecipientsParams {
  pagination?: PagePaginationParams;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format segment/tag from the v3 recipients endpoints.
 * @internal
 */
export interface RecipientSegmentWire {
  id: number;
  name: string;
  has_next_item?: boolean;
}

/**
 * Wire-format subscriber from the v3 `/editor/recipients/subscribers` endpoint.
 * @internal
 */
export interface RecipientSubscriberWire {
  id: number;
  email?: string | null;
  phone?: string | null;
  has_next_item?: boolean;
  custom_identifier?: string | null;
  account_id?: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  language?: string;
}

/**
 * Wire response wrapper for all recipients list endpoints.
 * @internal
 */
export interface RecipientListResponseWire<T> extends RuleApiResponse {
  data?: T[];
}
