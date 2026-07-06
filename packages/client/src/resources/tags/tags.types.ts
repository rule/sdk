/**
 * Tag types for the `@rule/client` tags namespace.
 *
 * Tags wrap the v2 `/tags` API — there is no v3 equivalent.
 *
 * Note: The `RuleTag` symbol exported from `@rule/client` refers to
 * deprecated well-known tag string literals, not this entity type.
 */

import type { PagePaginationParams } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

/**
 * A tag entity as returned by the v2 `/tags` API.
 *
 * `createdAt` and `updatedAt` are only present in list responses — the
 * single-tag endpoint omits them.
 */
export interface Tag {
  /** Tag ID. */
  id: number;
  /** Tag name. */
  name: string;
  /** Optional tag description. */
  description?: string;
  /**
   * ISO 8601 timestamp of when the tag was created.
   *
   * Present in list responses. Absent in single-tag responses.
   */
  createdAt?: string;
  /**
   * ISO 8601 timestamp of when the tag was last updated.
   *
   * Present in list responses. Absent in single-tag responses.
   */
  updatedAt?: string;
}

/**
 * A tag with an optional subscriber count.
 *
 * Returned by `TagsClient.getById` and `TagsClient.getByName`
 * when `withCount: true` is requested.
 */
export interface TagDetail extends Tag {
  /**
   * Number of subscribers currently associated with this tag.
   *
   * Only present when the method was called with `withCount: true`.
   */
  recipientCount?: number;
}

/**
 * Parameters for `TagsClient.listTags` and the auto-pagination helpers
 * (`TagsClient.iterateTags`, `TagsClient.iterateTagsPages`,
 * `TagsClient.listAllTags`).
 *
 * The API supports up to 100 tags per page (`pageSize` ≤ 100, default 100).
 *
 * @example
 * ```typescript
 * const page = await client.tags.listTags({ pagination: { page: 1, pageSize: 20 } });
 * ```
 */
export interface ListTagsParams {
  pagination?: PagePaginationParams;
}

/**
 * Payload for `TagsClient.updateById` and `TagsClient.updateByName`.
 *
 * Both fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * // Rename a tag
 * await client.tags.updateById(tagId, { name: 'VIP Customers' });
 *
 * // Update description
 * await client.tags.updateByName('newsletter', { description: 'Monthly newsletter subscribers' });
 * ```
 */
export interface UpdateTagPayload {
  /** New tag name. */
  name?: string;
  /** New tag description. */
  description?: string;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format tag entity from the v2 `/tags` list endpoint.
 * @internal
 */
export interface TagWire {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Wire-format tag entity from the v2 `/tags/{identifier}` endpoint.
 * @internal
 */
export interface TagDetailWire extends TagWire {
  recipient_count?: number;
}

/**
 * Wire response from GET `/tags`.
 * @internal
 */
export interface TagsListWire {
  tags?: TagWire[];
  meta?: {
    next?: string;
  };
}
