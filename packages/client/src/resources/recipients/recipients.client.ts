/**
 * Recipients namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/recipients/*` endpoints which return lightweight lists
 * of segments, tags, and subscribers for use when setting up recipient targeting
 * on campaigns and automations.
 *
 * These are read-only discovery endpoints — for managing subscribers, tags, or
 * segments themselves, use `client.subscribers`, `client.tags`, etc.
 */

import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import type {
  ListRecipientsParams,
  RecipientListResponseWire,
  RecipientSegment,
  RecipientSegmentWire,
  RecipientSubscriber,
  RecipientSubscriberWire,
  RecipientTag,
} from './recipients.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class RecipientsClient extends BaseResource {

  // ── Segments ────────────────────────────────────────────────────────────────

  /**
   * Fetch one page of segments available for recipient targeting.
   *
   * Use the returned segment IDs when setting up campaign recipients.
   * For auto-pagination use {@link iterateSegments}, {@link iterateSegmentsPages},
   * or {@link listAllSegments}.
   *
   * @param params - Optional pagination parameters.
   * @returns Segments on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.recipients.listSegments({ pagination: { pageSize: 50 } });
   * ```
   */
  async listSegments(params?: ListRecipientsParams): Promise<RecipientSegment[]> {
    const qs = buildRecipientQs(params);
    const res = await this.transport.get<RecipientListResponseWire<RecipientSegmentWire>>(
      `/editor/recipients/segments${qs}`
    );

    return (res.data ?? []).map((w) => ({ id: w.id, name: w.name }));
  }

  /**
   * Iterate through all recipient segments page by page.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of segment arrays, one per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.recipients.iterateSegmentsPages()) {
   *   console.log(`Page: ${page.length} segments`);
   * }
   * ```
   */
  async *iterateSegmentsPages(
    params: ListRecipientsParams = {}
  ): AsyncIterable<RecipientSegment[]> {
    const pageSize = params.pagination?.pageSize ?? 15;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const segments = await this.listSegments({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield segments;

      hasMore = segments.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all recipient segments one by one.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of individual {@link RecipientSegment} objects.
   */
  async *iterateSegments(params: ListRecipientsParams = {}): AsyncIterable<RecipientSegment> {
    for await (const page of this.iterateSegmentsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all recipient segments into a single array.
   *
   * @param params - Optional pagination parameters.
   * @returns All segments available for recipient targeting.
   *
   * @example
   * ```typescript
   * const segments = await client.recipients.listAllSegments();
   * const ids = segments.map((s) => s.id);
   * ```
   */
  async listAllSegments(params: ListRecipientsParams = {}): Promise<RecipientSegment[]> {
    const results: RecipientSegment[] = [];

    for await (const segment of this.iterateSegments(params)) {
      results.push(segment);
    }

    return results;
  }

  // ── Tags ─────────────────────────────────────────────────────────────────────

  /**
   * Fetch one page of tags available for recipient targeting.
   *
   * Use the returned tag IDs when setting up campaign recipients via
   * `client.campaigns.setCampaignTags()`.
   * For auto-pagination use {@link iterateTags}, {@link iterateTagsPages},
   * or {@link listAllTags}.
   *
   * @param params - Optional pagination parameters.
   * @returns Tags on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.recipients.listTags({ pagination: { pageSize: 50 } });
   * ```
   */
  async listTags(params?: ListRecipientsParams): Promise<RecipientTag[]> {
    const qs = buildRecipientQs(params);
    const res = await this.transport.get<RecipientListResponseWire<RecipientSegmentWire>>(
      `/editor/recipients/tags${qs}`
    );

    return (res.data ?? []).map((w) => ({ id: w.id, name: w.name }));
  }

  /**
   * Iterate through all recipient tags page by page.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of tag arrays, one per page.
   */
  async *iterateTagsPages(params: ListRecipientsParams = {}): AsyncIterable<RecipientTag[]> {
    const pageSize = params.pagination?.pageSize ?? 15;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const tags = await this.listTags({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield tags;

      hasMore = tags.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all recipient tags one by one.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of individual {@link RecipientTag} objects.
   */
  async *iterateTags(params: ListRecipientsParams = {}): AsyncIterable<RecipientTag> {
    for await (const page of this.iterateTagsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all recipient tags into a single array.
   *
   * @param params - Optional pagination parameters.
   * @returns All tags available for recipient targeting.
   *
   * @example
   * ```typescript
   * const tags = await client.recipients.listAllTags();
   * const tagId = tags.find((t) => t.name === 'VIP')?.id;
   * ```
   */
  async listAllTags(params: ListRecipientsParams = {}): Promise<RecipientTag[]> {
    const results: RecipientTag[] = [];

    for await (const tag of this.iterateTags(params)) {
      results.push(tag);
    }

    return results;
  }

  // ── Subscribers ──────────────────────────────────────────────────────────────

  /**
   * Fetch one page of subscribers available for recipient targeting.
   *
   * Use the returned subscriber IDs when setting up individual-subscriber
   * campaign recipients.
   * For auto-pagination use {@link iterateSubscribers}, {@link iterateSubscribersPages},
   * or {@link listAllSubscribers}.
   *
   * @param params - Optional pagination parameters.
   * @returns Subscribers on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.recipients.listSubscribers({ pagination: { pageSize: 50 } });
   * ```
   */
  async listSubscribers(params?: ListRecipientsParams): Promise<RecipientSubscriber[]> {
    const qs = buildRecipientQs(params);
    const res = await this.transport.get<RecipientListResponseWire<RecipientSubscriberWire>>(
      `/editor/recipients/subscribers${qs}`
    );

    return (res.data ?? []).map(mapSubscriberWireToEntity);
  }

  /**
   * Iterate through all recipient subscribers page by page.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of subscriber arrays, one per page.
   */
  async *iterateSubscribersPages(
    params: ListRecipientsParams = {}
  ): AsyncIterable<RecipientSubscriber[]> {
    const pageSize = params.pagination?.pageSize ?? 15;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const subscribers = await this.listSubscribers({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield subscribers;

      hasMore = subscribers.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all recipient subscribers one by one.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of individual {@link RecipientSubscriber} objects.
   */
  async *iterateSubscribers(
    params: ListRecipientsParams = {}
  ): AsyncIterable<RecipientSubscriber> {
    for await (const page of this.iterateSubscribersPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all recipient subscribers into a single array.
   *
   * @param params - Optional pagination parameters.
   * @returns All subscribers available for recipient targeting.
   */
  async listAllSubscribers(params: ListRecipientsParams = {}): Promise<RecipientSubscriber[]> {
    const results: RecipientSubscriber[] = [];

    for await (const subscriber of this.iterateSubscribers(params)) {
      results.push(subscriber);
    }

    return results;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * @internal
 */
function buildRecipientQs(params?: ListRecipientsParams): string {
  return buildQueryString({
    page: params?.pagination?.page,
    per_page: params?.pagination?.pageSize,
  });
}

/**
 * @internal
 */
function mapSubscriberWireToEntity(w: RecipientSubscriberWire): RecipientSubscriber {
  return {
    id: w.id,
    email: w.email,
    phone: w.phone,
    customIdentifier: w.custom_identifier,
    accountId: w.account_id,
    status: w.status,
    language: w.language,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}
