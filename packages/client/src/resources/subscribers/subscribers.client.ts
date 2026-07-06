/**
 * Subscribers namespace client.
 */

import { RuleApiError, RuleClientError } from '../../errors.js';

import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import type { RuleApiResponse } from '../../shared.types.js';

import type {
  BulkTagsPayload,
  SuppressOptions,
  AddSubscriberTagOptions,
  SubscriberSyncPayload,
  CustomFieldGroupData,
  CustomFieldGroupDataRecord,
  GetSubscriberResponse,
  SubscriberTagsResponse,
  TagRef,
  AddSubscriberTagsOptions,
  CreateSubscriberPayload,
  CreateSubscriberResponse,
  BulkCreateSubscriberEntry,
  BulkCreateSubscriberEntryBody,
  BulkCreateSubscribersBody,
  BulkCreateSubscribersPayload,
  BulkCreateSubscribersResponse,
  BulkCreateSubscribersResult,
  SubscribersListResponse,
  SubscriberListWire,
  ListSubscribersByTagIdsParams,
  ListAllSubscribersByTagIdsParams,
  ListSubscribersByTagIdsResult,
  ListCustomFieldDataParams,
  ListAllCustomFieldDataParams,
  ListCustomFieldDataByGroupParams,
  ListAllCustomFieldDataByGroupParams,
  CustomFieldDataListResult,
  CustomFieldData,
  WriteCustomFieldDataPayload,
  PatchCustomFieldDataPayload,
  CustomFieldDataInput,
  CustomFieldDataWriteResult,
  CustomFieldDataResult,
  SearchCustomFieldDataParams,
  CustomFieldGroupEntry,
  CustomFieldEntry,
  Subscriber,
  SubscriberTag,
  SubscriberIdentifier,
  CustomFieldValueEntryWire,
  CustomFieldDataRecordWire,
  CustomFieldDataListResponseWire,
  CustomFieldDataResponseWire,
} from './subscribers.types.js';

/** @internal */
export type SubscriberIdentifierBy = 'id' | 'email' | 'phone_number' | 'custom_identifier';

interface BuildCustomFieldDataPayloadOptions {
  historical: boolean;
  createIfNotExists: boolean;
}

function buildCustomFieldDataPayload(
  data: CustomFieldDataInput,
  options: BuildCustomFieldDataPayloadOptions
): WriteCustomFieldDataPayload {
  return {
    groups: Object.entries(data).map(([group, values]) => ({
      group,
      historical: options.historical,
      createIfNotExists: options.createIfNotExists,
      values: Object.entries(values).map(([field, value]) => ({
        field,
        value: value instanceof Date ? value.toISOString() : String(value ?? ''),
        createIfNotExists: options.createIfNotExists,
      })),
    })),
  };
}

function mapSubscriberIdentifier(identifier: SubscriberIdentifier): {
  value: string;
  identifiedBy: SubscriberIdentifierBy;
} {
  if ('email' in identifier) return { value: identifier.email, identifiedBy: 'email' };
  if ('phoneNumber' in identifier) return { value: identifier.phoneNumber, identifiedBy: 'phone_number' };
  if ('id' in identifier) return { value: String(identifier.id), identifiedBy: 'id' };

  return { value: identifier.customIdentifier, identifiedBy: 'custom_identifier' };
}

export class SubscribersClient extends BaseResource {
  // ── Create ─────────────────────────────────────────────────────────────────

  /**
   * Create a subscriber via the v3 API.
   *
   * @param payload - Subscriber data (email, phoneNumber, status, etc.).
   * @returns The created subscriber entity.
   *
   * @example
   * ```typescript
   * const sub = await client.subscribers.create({
   *   email: 'customer@example.com',
   *   status: 'ACTIVE',
   *   language: 'sv',
   * });
   * console.log(sub.id);
   * ```
   */
  async create(payload: CreateSubscriberPayload): Promise<Subscriber> {
    const response = await this.transport.post<CreateSubscriberResponse>('/subscribers', {
      body: JSON.stringify(mapCreateRequestToWire(payload)),
    });

    return mapCreateDataToEntity(response.data);
  }

  /**
   * Create up to 1000 subscribers in a single request.
   *
   * Wraps Rule.io's v2 `POST /subscribers` "create multiple" endpoint.
   * Large batches are processed asynchronously by the platform; the
   * synchronous response is an acknowledgement, not the list of created
   * subscribers. Use {@link create} for single-subscriber creation against
   * the v3 endpoint.
   *
   * Top-level fields apply to every subscriber in the batch:
   * - `tags` is applied to every subscriber.
   * - `updateOnDuplicate: true` updates existing subscribers (matched by
   *   email or phone) instead of returning 409.
   * - `syncSubscribers: true` forces automations to fire for every entry
   *   (capped at 100 server-side); `false` disables them.
   *
   * Per-entry fields go on each {@link BulkCreateSubscriberEntry}: `email`,
   * `phoneNumber`, optional `language`, and an array of
   * `{ key, value, type }` custom-field values.
   *
   * @throws {RuleApiError} `400` on invalid field shapes, `409` on
   *   duplicates when `updateOnDuplicate` is not set, `413` if more than
   *   1000 subscribers are submitted in one call.
   *
   * @example
   * ```typescript
   * const result = await client.subscribers.bulkCreateSubscribers({
   *   subscribers: [
   *     { email: 'jane@example.com' },
   *     { email: 'john@example.com', phoneNumber: '+46701234567' },
   *   ],
   *   tags: ['newsletter'],
   *   updateOnDuplicate: true,
   * });
   * console.log(result.subscribersCreated, result.subscribersUpdated);
   * ```
   */
  async bulkCreateSubscribers(
    payload: BulkCreateSubscribersPayload,
  ): Promise<BulkCreateSubscribersResult> {
    const wireBody = mapBulkCreateSubscribersToWire(payload);
    const response = await this.transport.post<BulkCreateSubscribersResponse>(
      '/subscribers',
      { body: JSON.stringify(wireBody), version: 'v2' },
    );

    return {
      success: true,
      ...(response.message !== undefined ? { message: response.message } : {}),
      ...(response.subscribers_created !== undefined
        ? { subscribersCreated: response.subscribers_created }
        : {}),
      ...(response.subscribers_updated !== undefined
        ? { subscribersUpdated: response.subscribers_updated }
        : {}),
      ...(response.subscribers_suppressed !== undefined
        ? { subscribersSuppressed: response.subscribers_suppressed }
        : {}),
    };
  }

  // ── Look up ────────────────────────────────────────────────────────────────

  /**
   * Get subscriber by numeric ID.
   *
   * @returns The subscriber entity, or `null` if not found (HTTP 404).
   */
  getById(id: number): Promise<Subscriber | null> {
    return this._getSubscriber(String(id), 'id');
  }

  /**
   * Get subscriber by email address.
   *
   * @returns The subscriber entity, or `null` if not found (HTTP 404).
   */
  getByEmail(email: string): Promise<Subscriber | null> {
    return this._getSubscriber(email, 'email');
  }

  /**
   * Get subscriber by phone number. The value is URL-encoded automatically
   * (e.g. `+46123456789` → `%2B46123456789`).
   *
   * @returns The subscriber entity, or `null` if not found (HTTP 404).
   */
  getByPhone(phone: string): Promise<Subscriber | null> {
    return this._getSubscriber(phone, 'phone_number');
  }

  /**
   * Get subscriber by custom identifier via the v2 API.
   *
   * @param identifier - The subscriber's custom identifier value.
   * @returns The subscriber entity, or `null` if not found (HTTP 404).
   *
   * @example
   * ```typescript
   * const sub = await client.subscribers.getByCustomIdentifier('ext-user-123');
   * ```
   */
  getByCustomIdentifier(identifier: string): Promise<Subscriber | null> {
    return this._getSubscriber(identifier, 'custom_identifier');
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /** Delete a subscriber by email address. */
  deleteByEmail(email: string): Promise<RuleApiResponse> {
    return this._deleteSubscriber(email, 'email');
  }

  /** Delete a subscriber by numeric Rule.io ID. */
  deleteById(id: number): Promise<RuleApiResponse> {
    return this._deleteSubscriber(id, 'id');
  }

  /** Delete a subscriber by phone number. */
  deleteByPhoneNumber(phone: string): Promise<RuleApiResponse> {
    return this._deleteSubscriber(phone, 'phone_number');
  }

  /** Delete a subscriber by custom identifier. */
  deleteByCustomIdentifier(identifier: string): Promise<RuleApiResponse> {
    return this._deleteSubscriber(identifier, 'custom_identifier');
  }

  // ── Tags ───────────────────────────────────────────────────────────────────

  // Single-tag add/remove (mirrored pair)

  /**
   * Add a single tag to a subscriber via the v3 API.
   *
   * @param subscriber - Who to tag: `{ email }`, `{ id }`, `{ phoneNumber }`, or `{ customIdentifier }`.
   * @param tag - Tag name or numeric ID to add.
   * @param options - Optional settings.
   * @param options.syncSegments - Set to `false` to skip segment membership
   *   recalculation after the tag is added.
   * @returns A success response.
   *
   * @example
   * ```typescript
   * await client.subscribers.addSubscriberTag({ email: 'customer@example.com' }, 'vip');
   * ```
   */
  async addSubscriberTag(
    subscriber: SubscriberIdentifier,
    tag: TagRef,
    options?: AddSubscriberTagOptions,
  ): Promise<RuleApiResponse> {
    return this._addSubscriberTags(subscriber, [tag], {
      syncSegments: options?.syncSegments,
    });
  }

  /**
   * Remove a single tag from a subscriber via the v3 API.
   *
   * @param subscriber - Subscriber identifier (email, phone number, ID, or
   *   custom identifier).
   * @param tag - Tag name or ID to remove.
   * @returns A success response.
   *
   * @remarks **Segment membership is not recalculated after removal.** The V3
   * API does not queue a segment sync, so subscribers may remain in (or be
   * excluded from) tag-based segments until something else triggers a sync.
   * See [Known Issues — Subscribers API](../docs/known-issues-subscribers.md)
   * for the available workaround.
   *
   * @example
   * ```typescript
   * await client.subscribers.removeSubscriberTag({ email: 'customer@example.com' }, 'old-promo');
   * ```
   */
  async removeSubscriberTag(
    subscriber: SubscriberIdentifier,
    tag: TagRef,
  ): Promise<RuleApiResponse> {
    const { value, identifiedBy } = mapSubscriberIdentifier(subscriber);

    await this.transport.fetchRaw(
      'DELETE',
      `/subscribers/${encodeURIComponent(value)}/tags/${encodeURIComponent(String(tag))}?identified_by=${identifiedBy}`
    );

    return { success: true };
  }

  // Automation-aware single-tag methods

  /**
   * Add a tag to a subscriber and trigger its automation once — if the
   * automation has not already been triggered for this subscriber.
   *
   * This is the **idempotent trigger**: safe to call multiple times.
   * If the subscriber already received the automation (or has the tag and the
   * automation is in progress), this call is a no-op — no extra messages are
   * sent and no pending messages are cancelled.
   *
   * | Subscriber state | What happens |
   * |---|---|
   * | Does not have the tag | Tag added; automation triggered from step 1 |
   * | Has the tag; automation not yet sent | Tag already held (no-op); automation triggered |
   * | Has the tag; automation in progress | No-op — pending messages still send on schedule |
   * | Has the tag; automation completed | No-op — automation does NOT re-fire |
   *
   * Use `forceTagAutomation()` to re-fire an already-completed automation.
   * Use `resetTagAutomation()` to cancel pending messages and restart.
   *
   * @param subscriber - Subscriber identifier (email, id, phoneNumber, or customIdentifier).
   * @param tag - Tag name or numeric ID to add.
   * @param options - Optional settings.
   * @param options.syncSegments - Set to `false` to skip segment membership
   *   recalculation after the tag is added.
   * @returns A success response.
   *
   * @example
   * ```typescript
   * // Trigger the welcome sequence for a new subscriber.
   * await client.subscribers.triggerTagAutomation(
   *   { email: 'customer@example.com' },
   *   'onboarding',
   * );
   * ```
   */
  async triggerTagAutomation(
    subscriber: SubscriberIdentifier,
    tag: TagRef,
    options?: AddSubscriberTagOptions,
  ): Promise<RuleApiResponse> {
    return this._addSubscriberTags(subscriber, [tag], {
      automation: 'trigger',
      syncSegments: options?.syncSegments,
    });
  }

  /**
   * Add a tag to a subscriber and unconditionally start a new automation pass —
   * regardless of whether the automation has run before and regardless of any
   * messages currently in the queue from a previous pass.
   *
   * **Pending messages from the current pass are NOT cancelled.** If the
   * subscriber is mid-sequence (e.g. message 1 of 3 was sent), messages 2 and 3
   * will still send on their original schedule, and a fresh pass (messages 1, 2,
   * 3 again) will also start. The subscriber will receive both sets.
   *
   * Use `resetTagAutomation()` to cancel the pending messages before restarting.
   *
   * | Subscriber state | What happens |
   * |---|---|
   * | Does not have the tag | Tag added; automation triggered from step 1 |
   * | Has the tag; automation in progress | Pending messages stay; a second full pass starts |
   * | Has the tag; automation completed | A new full pass starts |
   *
   * @param subscriber - Subscriber identifier (email, id, phoneNumber, or customIdentifier).
   * @param tag - Tag name or numeric ID to add.
   * @param options - Optional settings.
   * @param options.syncSegments - Set to `false` to skip segment membership
   *   recalculation after the tag is added.
   * @returns A success response.
   *
   * @example
   * ```typescript
   * // Re-send a promotional sequence to all subscribers, even those who already received it.
   * await client.subscribers.forceTagAutomation(
   *   { email: 'customer@example.com' },
   *   'promo-spring',
   * );
   * ```
   */
  async forceTagAutomation(
    subscriber: SubscriberIdentifier,
    tag: TagRef,
    options?: AddSubscriberTagOptions,
  ): Promise<RuleApiResponse> {
    return this._addSubscriberTags(subscriber, [tag], {
      automation: 'force',
      syncSegments: options?.syncSegments,
    });
  }

  /**
   * Add a tag to a subscriber, cancel any messages from an in-progress automation
   * pass, and start a fresh pass from step 1.
   *
   * This is the **clean-restart**: pending messages are deleted from the queue
   * before the new pass begins, so the subscriber receives a single complete
   * sequence — not duplicates from overlapping passes.
   *
   * Use `forceTagAutomation()` to start a new pass without cancelling pending messages.
   *
   * | Subscriber state | What happens |
   * |---|---|
   * | Does not have the tag | Tag added; automation triggered from step 1 |
   * | Has the tag; automation in progress | Pending messages cancelled; fresh pass starts from step 1 |
   * | Has the tag; automation completed | A new full pass starts |
   *
   * @param subscriber - Subscriber identifier (email, id, phoneNumber, or customIdentifier).
   * @param tag - Tag name or numeric ID to add.
   * @param options - Optional settings.
   * @param options.syncSegments - Set to `false` to skip segment membership
   *   recalculation after the tag is added.
   * @returns A success response.
   *
   * @example
   * ```typescript
   * // Restart the onboarding flow after a subscriber's plan changed.
   * await client.subscribers.resetTagAutomation(
   *   { email: 'customer@example.com' },
   *   'onboarding',
   * );
   * ```
   */
  async resetTagAutomation(
    subscriber: SubscriberIdentifier,
    tag: TagRef,
    options?: AddSubscriberTagOptions,
  ): Promise<RuleApiResponse> {
    return this._addSubscriberTags(subscriber, [tag], {
      automation: 'reset',
      syncSegments: options?.syncSegments,
    });
  }

  // Multi-tag add/remove (mirrored pair, single subscriber, async)

  /**
   * Add tags to a subscriber via the v3 API.
   *
   * Asynchronous (HTTP 204) — tags are applied in the background by Rule.io.
   *
   * @param subscriber - Who to tag: `{ email }`, `{ id }`, `{ phoneNumber }`, or `{ customIdentifier }`.
   * @param tags - Tag names or numeric IDs to add.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.addSubscriberTags(
   *   { email: 'customer@example.com' },
   *   ['vip', 'returning'],
   * );
   * ```
   */
  async addSubscriberTags(
    subscriber: SubscriberIdentifier,
    tags: TagRef[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const wireBody: Record<string, unknown> = {
      subscribers: [mapSubscriberIdentifierToWire(subscriber)],
      tags,
    };

    if (options.callbackUrl) wireBody.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('POST', '/subscribers/tags', { body: JSON.stringify(wireBody) });

    return { success: true };
  }

  /**
   * Remove tags from a subscriber via the v3 API.
   *
   * Asynchronous (HTTP 204) — tags are removed in the background by Rule.io.
   *
   * @param subscriber - Subscriber identifier (email, phone number, ID, or custom identifier).
   * @param tags - Tag names or numeric IDs to remove.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   * Segment membership is not recalculated after removal — see
   * [Known Issues — Subscribers API](../docs/known-issues-subscribers.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.removeSubscriberTags(
   *   { email: 'customer@example.com' },
   *   ['old-promo'],
   * );
   * ```
   */
  async removeSubscriberTags(
    subscriber: SubscriberIdentifier,
    tags: TagRef[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const wireBody: Record<string, unknown> = {
      subscribers: [mapSubscriberIdentifierToWire(subscriber)],
      tags,
    };

    if (options.callbackUrl) wireBody.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('DELETE', '/subscribers/tags', { body: JSON.stringify(wireBody) });

    return { success: true };
  }

  // Bulk add/remove (mirrored pair, multiple subscribers, async)

  /**
   * Add tags to multiple subscribers in bulk via the v3 API.
   *
   * Asynchronous (HTTP 204) — tags are applied in the background by Rule.io.
   *
   * @param subscribers - Subscribers to tag.
   * @param tags - Tag names or numeric IDs to add.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.bulkAddSubscriberTags(
   *   [{ email: 'a@example.com' }, { email: 'b@example.com' }],
   *   ['newsletter', 'promo-2024'],
   * );
   * ```
   */
  async bulkAddSubscriberTags(
    subscribers: SubscriberIdentifier[],
    tags: TagRef[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const wireBody: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
      tags,
    };

    if (options.callbackUrl) wireBody.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('POST', '/subscribers/tags', { body: JSON.stringify(wireBody) });

    return { success: true };
  }

  /**
   * Remove tags from multiple subscribers in bulk via the v3 API.
   *
   * Asynchronous (HTTP 204) — tags are removed in the background by Rule.io.
   *
   * @param subscribers - Subscribers to remove tags from.
   * @param tags - Tag names or numeric IDs to remove.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.bulkRemoveSubscriberTags(
   *   [{ email: 'a@example.com' }, { email: 'b@example.com' }],
   *   ['old-campaign'],
   * );
   * ```
   */
  async bulkRemoveSubscriberTags(
    subscribers: SubscriberIdentifier[],
    tags: TagRef[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const wireBody: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
      tags,
    };

    if (options.callbackUrl) wireBody.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('DELETE', '/subscribers/tags', { body: JSON.stringify(wireBody) });

    return { success: true };
  }

  /**
   * Get all tags attached to a subscriber.
   *
   * @param subscriber - Subscriber identifier (email, phone, id, or customIdentifier).
   * @returns Array of `{ id, name }` tag objects, or `null` if no subscriber
   *   with that identifier exists (HTTP 404). Returns an empty array when the
   *   subscriber exists but has no tags.
   */
  async getSubscriberTags(subscriber: SubscriberIdentifier): Promise<SubscriberTag[] | null> {
    const { value, identifiedBy } = mapSubscriberIdentifier(subscriber);

    try {
      const response = await this.transport.get<SubscriberTagsResponse>(
        `/subscribers/${encodeURIComponent(value)}/tags?identified_by=${identifiedBy}`,
        { version: 'v2' }
      );

      return response.tags ?? [];
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Get one page of subscribers that have ALL the specified tag IDs (intersection
   * filter). Paginates one page at a time — pass `nextPage` back as `pagination.page`
   * until it returns `null`.
   *
   * Note: filtering is performed client-side. A raw page of `pageSize` subscribers
   * may yield fewer matched results after filtering. Use `iterateSubscribersByTagIds()`
   * to iterate all pages transparently.
   *
   * @param params - `tagIds` (required, non-empty), optional `pagination`.
   * @returns `{ subscribers, matched, scanned, nextPage }` for the page.
   *
   * @example
   * ```typescript
   * let page: number | null = 1;
   * const all: Subscriber[] = [];
   * while (page) {
   *   const res = await client.subscribers.listSubscribersByTagIds({
   *     tagIds: [42, 99],
   *     pagination: { page, pageSize: 500 },
   *   });
   *   all.push(...res.subscribers);
   *   page = res.nextPage;
   * }
   * ```
   */
  async listSubscribersByTagIds(
    params: ListSubscribersByTagIdsParams
  ): Promise<ListSubscribersByTagIdsResult> {
    if (params.tagIds.length === 0) {
      throw new RuleClientError('tagIds must not be empty');
    }

    const qs = buildQueryString({
      page: params.pagination?.page,
      limit: params.pagination?.pageSize,
    });
    const response = await this.transport.get<SubscribersListResponse>(
      `/subscribers${qs}`,
      { version: 'v2' }
    );

    const scanned = response.subscribers ?? [];
    const required = params.tagIds;
    const matched = scanned.filter((sub) => {
      const subTagIds = new Set(sub.tags?.map((t) => t.id) ?? []);

      return required.every((id) => subTagIds.has(id));
    });

    return {
      subscribers: matched.map(mapSubscriberListWireToEntity),
      matched: matched.length,
      scanned: scanned.length,
      nextPage: parseNextPage(response.meta?.next ?? null),
    };
  }

  /**
   * Iterate through pages of subscribers matching all specified tag IDs.
   *
   * Automatically requests additional pages as needed and yields each full
   * page response. `pagination.page` controls the starting page.
   *
   * @param params - `tagIds` (required, non-empty), optional `pagination`.
   *
   * @example
   * ```typescript
   * for await (const page of client.subscribers.iterateSubscribersByTagIdsPages({ tagIds: [42] })) {
   *   console.log(page.subscribers, page.nextPage);
   * }
   * ```
   */
  async *iterateSubscribersByTagIdsPages(
    params: ListSubscribersByTagIdsParams
  ): AsyncIterable<ListSubscribersByTagIdsResult> {
    let page: number | null = params.pagination?.page ?? 1;

    while (page !== null) {
      const result = await this.listSubscribersByTagIds({
        ...params,
        pagination: { ...params.pagination, page },
      });

      yield result;
      page = result.nextPage;
    }
  }

  /**
   * Iterate through all subscribers matching all specified tag IDs.
   *
   * Automatically requests additional pages as needed and yields individual
   * `Subscriber` items one by one. `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the batch size per request.
   *
   * @param params - `tagIds` (required, non-empty), optional `pagination`.
   *
   * @example
   * ```typescript
   * for await (const sub of client.subscribers.iterateSubscribersByTagIds({ tagIds: [42] })) {
   *   console.log(sub.email);
   * }
   * ```
   */
  async *iterateSubscribersByTagIds(
    params: ListSubscribersByTagIdsParams
  ): AsyncIterable<Subscriber> {
    for await (const page of this.iterateSubscribersByTagIdsPages(params)) {
      yield* page.subscribers;
    }
  }

  /**
   * Get all subscribers matching all specified tag IDs as a single array.
   *
   * Prefer `iterateSubscribersByTagIds()` for large datasets.
   *
   * @param params - `tagIds` (required, non-empty), optional `pagination` and `maxItems`.
   *
   * @example
   * ```typescript
   * const subscribers = await client.subscribers.listAllSubscribersByTagIds({
   *   tagIds: [42],
   *   maxItems: 500,
   * });
   * ```
   */
  async listAllSubscribersByTagIds(
    params: ListAllSubscribersByTagIdsParams = { tagIds: [] }
  ): Promise<Subscriber[]> {
    const maxItems = params.maxItems ?? Infinity;
    const subscribers: Subscriber[] = [];

    for await (const sub of this.iterateSubscribersByTagIds(params)) {
      subscribers.push(sub);

      if (subscribers.length >= maxItems) {
        break;
      }
    }

    return subscribers;
  }

  // ── Custom field data ─────────────────────────────────────────────────────

  /**
   * Get one page of custom field data records for a subscriber.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param params - Optional pagination and group filters.
   *
   * @example
   * ```typescript
   * const page = await client.subscribers.listCustomFieldData(subscriberId, {
   *   pagination: { page: 2, pageSize: 20 },
   *   filters: { groupNames: ['Order'] },
   * });
   * ```
   */
  async listCustomFieldData(
    subscriberId: number,
    params?: ListCustomFieldDataParams
  ): Promise<CustomFieldDataListResult> {
    const qs = params
      ? buildQueryString({
          page: params.pagination?.page,
          per_page: params.pagination?.pageSize,
          'groups_id[]': params.filters?.groupIds,
          'groups_name[]': params.filters?.groupNames,
        })
      : '';

    const wire = await this.transport.get<CustomFieldDataListResponseWire>(
      `/custom-field-data/${subscriberId}${qs}`
    );

    return {
      data: wire.data?.map(mapCustomFieldDataRecord) ?? [],
      meta: wire.meta ? { page: wire.meta.page, pageSize: wire.meta.per_page } : undefined,
    };
  }

  /**
   * Iterate through pages of custom field data records for a subscriber.
   *
   * Automatically requests additional pages as needed and yields each full page
   * response. `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of records fetched per request.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param params - Optional pagination and filtering options.
   *
   * @example
   * ```typescript
   * for await (const page of client.subscribers.iterateCustomFieldDataPages(subscriberId)) {
   *   console.log(page.data, page.meta);
   * }
   * ```
   */
  async *iterateCustomFieldDataPages(
    subscriberId: number,
    params: ListCustomFieldDataParams = {}
  ): AsyncIterable<CustomFieldDataListResult> {
    const pageSize = params.pagination?.pageSize ?? 100;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listCustomFieldData(subscriberId, {
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield result;

      hasMore = result.data.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all custom field data records for a subscriber.
   *
   * Automatically requests additional pages as needed and yields individual
   * records one by one. `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of records fetched per request.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param params - Optional pagination and filtering options.
   *
   * @example
   * ```typescript
   * for await (const record of client.subscribers.iterateCustomFieldData(subscriberId)) {
   *   console.log(record.groupName, record.values);
   * }
   * ```
   */
  async *iterateCustomFieldData(
    subscriberId: number,
    params: ListCustomFieldDataParams = {}
  ): AsyncIterable<CustomFieldData> {
    for await (const page of this.iterateCustomFieldDataPages(subscriberId, params)) {
      yield* page.data;
    }
  }

  /**
   * Get all custom field data records for a subscriber as a single array.
   *
   * Prefer `iterateCustomFieldData()` for large datasets.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param params - Optional pagination, filtering options, and max item limit.
   *
   * @example
   * ```typescript
   * const records = await client.subscribers.listAllCustomFieldData(subscriberId, {
   *   filters: { groupNames: ['Order'] },
   *   maxItems: 200,
   * });
   * ```
   */
  async listAllCustomFieldData(
    subscriberId: number,
    params: ListAllCustomFieldDataParams = {}
  ): Promise<CustomFieldData[]> {
    const maxItems = params.maxItems ?? Infinity;
    const records: CustomFieldData[] = [];

    for await (const record of this.iterateCustomFieldData(subscriberId, params)) {
      records.push(record);

      if (records.length >= maxItems) {
        break;
      }
    }

    return records;
  }

  /**
   * Write custom field data using the raw API-shaped payload.
   *
   * This is the advanced method for callers who need full control over
   * group creation, field creation, historical behavior, and values.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param payload - Groups of field data to write.
   */
  async writeCustomFieldData(
    subscriberId: number,
    payload: WriteCustomFieldDataPayload
  ): Promise<CustomFieldDataWriteResult> {
    await this.transport.fetchRaw('POST', `/custom-field-data/${subscriberId}`, {
      body: JSON.stringify({ groups: payload.groups.map(mapCustomFieldGroupEntryToWire) }),
    });

    return { success: true };
  }

  /**
   * Upsert non-historical custom field data for a subscriber.
   *
   * Missing groups and fields are created automatically.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param data - Two-level record of group names → field names → values.
   */
  async upsertCustomFieldData(
    subscriberId: number,
    data: CustomFieldDataInput
  ): Promise<CustomFieldDataWriteResult> {
    return this.writeCustomFieldData(
      subscriberId,
      buildCustomFieldDataPayload(data, { historical: false, createIfNotExists: true })
    );
  }

  /**
   * Update existing non-historical custom field data for a subscriber.
   *
   * Missing groups and fields are ignored.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param data - Two-level record of group names → field names → values.
   */
  async updateCustomFieldData(
    subscriberId: number,
    data: CustomFieldDataInput
  ): Promise<CustomFieldDataWriteResult> {
    return this.writeCustomFieldData(
      subscriberId,
      buildCustomFieldDataPayload(data, { historical: false, createIfNotExists: false })
    );
  }

  /**
   * Upsert historical custom field data for a subscriber.
   *
   * Missing historical groups and fields are created automatically.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param data - Two-level record of group names → field names → values.
   */
  async upsertHistoricalCustomFieldData(
    subscriberId: number,
    data: CustomFieldDataInput
  ): Promise<CustomFieldDataWriteResult> {
    return this.writeCustomFieldData(
      subscriberId,
      buildCustomFieldDataPayload(data, { historical: true, createIfNotExists: true })
    );
  }

  /**
   * Update existing historical custom field data for a subscriber.
   *
   * Missing historical groups and fields are ignored.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param data - Two-level record of group names → field names → values.
   */
  async updateHistoricalCustomFieldData(
    subscriberId: number,
    data: CustomFieldDataInput
  ): Promise<CustomFieldDataWriteResult> {
    return this.writeCustomFieldData(
      subscriberId,
      buildCustomFieldDataPayload(data, { historical: true, createIfNotExists: false })
    );
  }

  /**
   * Update field values in an existing custom field data record.
   *
   * Locates the record by `dataId` or by group + field + value lookup.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param payload - Identifier of the record to update and new field values.
   */
  async patchCustomFieldData(
    subscriberId: number,
    payload: PatchCustomFieldDataPayload
  ): Promise<CustomFieldDataWriteResult> {
    const wireBody = {
      identifier: {
        ...(payload.identifier.dataId !== undefined ? { data_id: payload.identifier.dataId } : {}),
        ...(payload.identifier.group !== undefined ? { group: payload.identifier.group } : {}),
        ...(payload.identifier.field !== undefined ? { field: payload.identifier.field } : {}),
        ...(payload.identifier.value !== undefined ? { value: payload.identifier.value } : {}),
      },
      values: payload.values.map(v => ({
        field: v.field,
        ...(v.createIfNotExists !== undefined ? { create_if_not_exists: v.createIfNotExists } : {}),
        value: v.value,
      })),
    };

    await this.transport.fetchRaw('PUT', `/custom-field-data/${subscriberId}`, {
      body: JSON.stringify(wireBody),
    });

    return { success: true };
  }

  /**
   * Get one page of custom field data records for a subscriber filtered by group.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param group - Group ID (number) or group name (string).
   * @param params - Optional pagination and field filters.
   *
   * @example
   * ```typescript
   * const page = await client.subscribers.listCustomFieldDataByGroup(subscriberId, 'Order', {
   *   pagination: { pageSize: 50 },
   *   filters: { fields: ['OrderRef', 'Total'] },
   * });
   * ```
   */
  async listCustomFieldDataByGroup(
    subscriberId: number,
    group: number | string,
    params?: ListCustomFieldDataByGroupParams
  ): Promise<CustomFieldDataListResult> {
    const qs = params
      ? buildQueryString({
          page: params.pagination?.page,
          per_page: params.pagination?.pageSize,
          'fields[]': params.filters?.fields,
        })
      : '';

    const wire = await this.transport.get<CustomFieldDataListResponseWire>(
      `/custom-field-data/${subscriberId}/group/${encodeURIComponent(String(group))}${qs}`
    );

    return {
      data: wire.data?.map(mapCustomFieldDataRecord) ?? [],
      meta: wire.meta ? { page: wire.meta.page, pageSize: wire.meta.per_page } : undefined,
    };
  }

  /**
   * Iterate through pages of custom field data records for a subscriber filtered by group.
   *
   * Automatically requests additional pages as needed and yields each full page
   * response. `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of records fetched per request.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param group - Group ID (number) or group name (string).
   * @param params - Optional pagination and filtering options.
   */
  async *iterateCustomFieldDataByGroupPages(
    subscriberId: number,
    group: number | string,
    params: ListCustomFieldDataByGroupParams = {}
  ): AsyncIterable<CustomFieldDataListResult> {
    const pageSize = params.pagination?.pageSize ?? 100;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const result = await this.listCustomFieldDataByGroup(subscriberId, group, {
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield result;

      hasMore = result.data.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all custom field data records for a subscriber filtered by group.
   *
   * Automatically requests additional pages as needed and yields individual
   * records one by one. `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of records fetched per request.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param group - Group ID (number) or group name (string).
   * @param params - Optional pagination and filtering options.
   */
  async *iterateCustomFieldDataByGroup(
    subscriberId: number,
    group: number | string,
    params: ListCustomFieldDataByGroupParams = {}
  ): AsyncIterable<CustomFieldData> {
    for await (const page of this.iterateCustomFieldDataByGroupPages(subscriberId, group, params)) {
      yield* page.data;
    }
  }

  /**
   * Get all custom field data records for a subscriber filtered by group as a single array.
   *
   * Prefer `iterateCustomFieldDataByGroup()` for large datasets.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param group - Group ID (number) or group name (string).
   * @param params - Optional pagination, filtering options, and max item limit.
   */
  async listAllCustomFieldDataByGroup(
    subscriberId: number,
    group: number | string,
    params: ListAllCustomFieldDataByGroupParams = {}
  ): Promise<CustomFieldData[]> {
    const maxItems = params.maxItems ?? Infinity;
    const records: CustomFieldData[] = [];

    for await (const record of this.iterateCustomFieldDataByGroup(subscriberId, group, params)) {
      records.push(record);

      if (records.length >= maxItems) {
        break;
      }
    }

    return records;
  }

  /**
   * Delete all custom field data for a subscriber in a specific group.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param group - Group ID (number) or group name (string).
   */
  deleteCustomFieldDataByGroup(
    subscriberId: number,
    group: number | string
  ): Promise<RuleApiResponse> {
    return this.transport.delete<RuleApiResponse>(
      `/custom-field-data/${subscriberId}/group/${encodeURIComponent(String(group))}`
    );
  }

  /**
   * Find a single custom field data record for a subscriber.
   *
   * @param subscriberId - The subscriber's numeric ID.
   * @param params - Lookup parameters (`dataId`, `group`, `field`, `value`).
   * @returns A single matching record, or `null` if not found (HTTP 404).
   */
  async findCustomFieldData(
    subscriberId: number,
    params: SearchCustomFieldDataParams
  ): Promise<CustomFieldDataResult | null> {
    const qs = buildQueryString({
      data_id: params.dataId,
      group: params.group,
      field: params.field,
      value: params.value,
    });

    try {
      const wire = await this.transport.get<CustomFieldDataResponseWire>(
        `/custom-field-data/${subscriberId}/search${qs}`
      );

      return {
        success: wire.success,
        data: wire.data ? mapCustomFieldDataRecord(wire.data) : undefined,
      };
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  // ── Block / Unblock ───────────────────────────────────────────────────────

  /**
   * Block multiple subscribers via the v3 API.
   *
   * Asynchronous (HTTP 204) — Rule.io processes the block in the background.
   *
   * @param subscribers - Array of subscriber identifiers to block.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.block([
   *   { email: 'spam@example.com' },
   *   { id: 456 },
   * ]);
   * ```
   */
  async block(
    subscribers: SubscriberIdentifier[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const payload: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
    };

    if (options.callbackUrl) payload.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('POST', '/subscribers/block', {
      body: JSON.stringify(payload),
    });

    return { success: true };
  }

  /**
   * Unblock multiple subscribers via the v3 API.
   *
   * Asynchronous (HTTP 204) — Rule.io processes the unblock in the background.
   *
   * @param subscribers - Array of subscriber identifiers to unblock.
   * @param options - Optional settings.
   * @param options.callbackUrl - URL Rule.io will POST to when the operation completes.
   * @returns A success response indicating the request was accepted.
   *
   * @remarks Asynchronous — see [Asynchronous Operations](../docs/async-operations.md).
   *
   * @example
   * ```typescript
   * await client.subscribers.unblock([
   *   { email: 'restored@example.com' },
   *   { phoneNumber: '+46701234567' },
   * ]);
   * ```
   */
  async unblock(
    subscribers: SubscriberIdentifier[],
    options: { callbackUrl?: string } = {},
  ): Promise<RuleApiResponse> {
    const payload: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
    };

    if (options.callbackUrl) payload.callback_url = options.callbackUrl;
    await this.transport.fetchRaw('POST', '/subscribers/unblock', {
      body: JSON.stringify(payload),
    });

    return { success: true };
  }

  // ── Suppressions ─────────────────────────────────────────────────────────

  /**
   * Suppress multiple subscribers from receiving marketing sendouts.
   *
   * Prevents the listed subscribers from receiving Rule.io marketing emails
   * and/or SMS. Pass `messageTypes` to limit the suppression to specific
   * channels; omit it to suppress all channels. Already-suppressed
   * subscribers are silently skipped (idempotent).
   *
   * Processed **asynchronously** — see {@link SuppressOptions.callbackUrl}
   * to receive a notification when complete. Maximum 1000 subscribers per
   * request.
   *
   * @param subscribers - Subscriber identifiers to suppress (max 1000).
   * @param messageTypes - Channels to suppress. Omit to suppress all channels.
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * // Suppress all channels
   * await client.subscribers.suppressSubscribers([
   *   { email: 'opted-out@example.com' },
   *   { email: 'complaint@example.com' },
   * ]);
   *
   * // Suppress email channel only
   * await client.subscribers.suppressSubscribers(
   *   [{ email: 'no-email@example.com' }],
   *   ['email'],
   * );
   * ```
   */
  async suppressSubscribers(
    subscribers: SubscriberIdentifier[],
    messageTypes?: ('email' | 'text_message')[],
    opts: SuppressOptions = {}
  ): Promise<void> {
    if (!subscribers.length) throw new RuleClientError('subscribers array must not be empty');
    if (subscribers.length > 1000) throw new RuleClientError('subscribers array must not exceed 1000 items');

    const payload: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
    };

    if (messageTypes?.length) payload.message_types = messageTypes;
    if (opts.callbackUrl) payload.callback_url = opts.callbackUrl;

    await this.transport.fetchRaw('POST', '/suppressions/', { body: JSON.stringify(payload) });
  }

  /**
   * Suppress a single subscriber from receiving marketing sendouts.
   *
   * @param subscriber - Subscriber identifier.
   * @param messageTypes - Channels to suppress. Omit to suppress all channels.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.suppressSubscriber({ email: 'opted-out@example.com' });
   * ```
   */
  suppressSubscriber(
    subscriber: SubscriberIdentifier,
    messageTypes?: ('email' | 'text_message')[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.suppressSubscribers([subscriber], messageTypes, opts);
  }

  /**
   * Suppress multiple subscribers from receiving marketing emails only.
   *
   * @param subscribers - Subscriber identifiers to suppress (max 1000).
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * await client.subscribers.suppressEmailsForSubscribers([
   *   { email: 'opted-out@example.com' },
   * ]);
   * ```
   */
  suppressEmailsForSubscribers(
    subscribers: SubscriberIdentifier[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.suppressSubscribers(subscribers, ['email'], opts);
  }

  /**
   * Suppress a single subscriber from receiving marketing emails only.
   *
   * @param subscriber - Subscriber identifier.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.suppressEmailsForSubscriber({ email: 'no-email@example.com' });
   * ```
   */
  suppressEmailsForSubscriber(
    subscriber: SubscriberIdentifier,
    opts?: SuppressOptions
  ): Promise<void> {
    return this.suppressSubscribers([subscriber], ['email'], opts);
  }

  /**
   * Suppress multiple subscribers from receiving marketing SMS only.
   *
   * @param subscribers - Subscriber identifiers to suppress (max 1000).
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * await client.subscribers.suppressSmsForSubscribers([
   *   { phoneNumber: '+46701234567' },
   * ]);
   * ```
   */
  suppressSmsForSubscribers(
    subscribers: SubscriberIdentifier[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.suppressSubscribers(subscribers, ['text_message'], opts);
  }

  /**
   * Suppress a single subscriber from receiving marketing SMS only.
   *
   * @param subscriber - Subscriber identifier.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.suppressSmsForSubscriber({ phoneNumber: '+46701234567' });
   * ```
   */
  suppressSmsForSubscriber(
    subscriber: SubscriberIdentifier,
    opts?: SuppressOptions
  ): Promise<void> {
    return this.suppressSubscribers([subscriber], ['text_message'], opts);
  }

  /**
   * Remove suppressions from multiple subscribers so they can receive
   * marketing sendouts again.
   *
   * Pass `messageTypes` to remove suppressions for specific channels only;
   * omit it to remove all channel suppressions for each subscriber. Maximum
   * 1000 subscribers per request.
   *
   * @param subscribers - Subscriber identifiers to unsuppress (max 1000).
   * @param messageTypes - Channels to unsuppress. Omit to unsuppress all channels.
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * // Remove all suppressions
   * await client.subscribers.unsuppressSubscribers([
   *   { email: 'resubscribed@example.com' },
   * ]);
   *
   * // Remove email suppression only
   * await client.subscribers.unsuppressSubscribers(
   *   [{ email: 'resubscribed@example.com' }],
   *   ['email'],
   * );
   * ```
   */
  async unsuppressSubscribers(
    subscribers: SubscriberIdentifier[],
    messageTypes?: ('email' | 'text_message')[],
    opts: SuppressOptions = {}
  ): Promise<void> {
    if (!subscribers.length) throw new RuleClientError('subscribers array must not be empty');
    if (subscribers.length > 1000) throw new RuleClientError('subscribers array must not exceed 1000 items');

    const payload: Record<string, unknown> = {
      subscribers: subscribers.map(mapSubscriberIdentifierToWire),
    };

    if (messageTypes?.length) payload.message_types = messageTypes;
    if (opts.callbackUrl) payload.callback_url = opts.callbackUrl;

    await this.transport.fetchRaw('DELETE', '/suppressions/', { body: JSON.stringify(payload) });
  }

  /**
   * Remove suppressions from a single subscriber.
   *
   * @param subscriber - Subscriber identifier.
   * @param messageTypes - Channels to unsuppress. Omit to unsuppress all channels.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.unsuppressSubscriber({ email: 'resubscribed@example.com' });
   * ```
   */
  unsuppressSubscriber(
    subscriber: SubscriberIdentifier,
    messageTypes?: ('email' | 'text_message')[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.unsuppressSubscribers([subscriber], messageTypes, opts);
  }

  /**
   * Remove email suppressions from multiple subscribers.
   *
   * @param subscribers - Subscriber identifiers (max 1000).
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * await client.subscribers.unsuppressEmailsForSubscribers([
   *   { email: 'resubscribed@example.com' },
   * ]);
   * ```
   */
  unsuppressEmailsForSubscribers(
    subscribers: SubscriberIdentifier[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.unsuppressSubscribers(subscribers, ['email'], opts);
  }

  /**
   * Remove email suppressions from a single subscriber.
   *
   * @param subscriber - Subscriber identifier.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.unsuppressEmailsForSubscriber({ email: 'resubscribed@example.com' });
   * ```
   */
  unsuppressEmailsForSubscriber(
    subscriber: SubscriberIdentifier,
    opts?: SuppressOptions
  ): Promise<void> {
    return this.unsuppressSubscribers([subscriber], ['email'], opts);
  }

  /**
   * Remove SMS suppressions from multiple subscribers.
   *
   * @param subscribers - Subscriber identifiers (max 1000).
   * @param opts - Optional `callbackUrl` for async notification.
   * @throws `RuleClientError` if the array is empty or exceeds 1000 items.
   *
   * @example
   * ```typescript
   * await client.subscribers.unsuppressSmsForSubscribers([
   *   { phoneNumber: '+46701234567' },
   * ]);
   * ```
   */
  unsuppressSmsForSubscribers(
    subscribers: SubscriberIdentifier[],
    opts?: SuppressOptions
  ): Promise<void> {
    return this.unsuppressSubscribers(subscribers, ['text_message'], opts);
  }

  /**
   * Remove SMS suppressions from a single subscriber.
   *
   * @param subscriber - Subscriber identifier.
   * @param opts - Optional `callbackUrl` for async notification.
   *
   * @example
   * ```typescript
   * await client.subscribers.unsuppressSmsForSubscriber({ phoneNumber: '+46701234567' });
   * ```
   */
  unsuppressSmsForSubscriber(
    subscriber: SubscriberIdentifier,
    opts?: SuppressOptions
  ): Promise<void> {
    return this.unsuppressSubscribers([subscriber], ['text_message'], opts);
  }

  /** @deprecated Use `client.subscribers.bulkAddSubscriberTags()` instead. */
  async bulkAddTags(payload: BulkTagsPayload): Promise<RuleApiResponse> {
    return this.bulkAddSubscriberTags(payload.subscribers, payload.tags);
  }

  /** @deprecated Use `client.subscribers.bulkRemoveSubscriberTags()` instead. */
  async bulkRemoveTags(payload: BulkTagsPayload): Promise<RuleApiResponse> {
    return this.bulkRemoveSubscriberTags(payload.subscribers, payload.tags);
  }

  // ── Sync (upsert with fields and tags) ────────────────────────────────────

  /**
   * Create or update a subscriber, writing custom field data and assigning
   * tags in a single logical operation.
   *
   * Internally makes up to three requests:
   * 1. `POST /subscribers` — create subscriber (or fetch numeric id if they
   *    already exist).
   * 2. `POST /custom-field-data/{id}` — write field values (skipped when
   *    both `fields` and `historicalFields` are empty). Regular and historical
   *    groups are combined into a single request.
   * 3. `PUT /subscribers/{identifier}/tags` — assign tags (skipped when
   *    `tags` is empty).
   *
   * Requests 2 and 3 are issued in parallel once the subscriber id is known.
   *
   * @param payload - Subscriber data including identity fields, custom fields
   *   (organised by group), and tags. Group names and field keys must not be
   *   empty or contain dots.
   *   - `customFieldData` — regular groups; existing values are overwritten on each sync.
   *   - `historicalCustomFieldData` — historical groups; a new entry is appended on each
   *     sync, preserving history.
   * @returns The resolved subscriber entity (id is always populated).
   * @throws {RuleClientError} If any group name or field key is empty or
   *   contains a dot.
   *
   * @example
   * ```typescript
   * const sub = await client.subscribers.sync({
   *   subscriber: { email: 'customer@example.com' },
   *   customFieldData: {
   *     Profile: { MemberTier: 'Gold', City: 'Stockholm' },
   *   },
   *   historicalCustomFieldData: {
   *     Purchases: { OrderRef: 'ORD-456', Total: '149.00' },
   *   },
   *   tags: ['OrderCompleted', 'Newsletter'],
   * });
   * console.log(sub.id);
   * ```
   */
  async sync(payload: SubscriberSyncPayload): Promise<Subscriber> {
    this._validateSyncFields(payload.customFieldData);
    this._validateSyncFields(payload.historicalCustomFieldData);

    const entity = await this._ensureSubscriber(payload.subscriber);

    await Promise.all([
      this._writeSyncFields(entity.id, payload.customFieldData, payload.historicalCustomFieldData),
      this._applyTags(entity.id, payload.subscriber, payload.tags),
    ]);

    return entity;
  }

  // ── Private internals ─────────────────────────────────────────────────────

  /** @internal */
  private _validateSyncFields(fields: CustomFieldGroupDataRecord | undefined): void {
    if (!fields) return;

    for (const group of Object.keys(fields)) {
      const trimmedGroup = group.trim();

      if (!trimmedGroup) {
        throw new RuleClientError('Field group names must not be empty');
      }

      if (trimmedGroup.includes('.')) {
        throw new RuleClientError(`Field group "${trimmedGroup}" must not contain dots`);
      }

      // TypeScript 5.x collapses nested index-signature types in Object.entries inference;
      // cast to bypass that and access the correct shape.
      const groupFields = fields[group] as CustomFieldGroupData;

      for (const field of Object.keys(groupFields)) {
        if (field.includes('.')) {
          throw new RuleClientError(
            `Field key "${field}" in group "${trimmedGroup}" must not contain dots`
          );
        }
      }
    }
  }

  /** @internal */
  private async _ensureSubscriber(payload: CreateSubscriberPayload): Promise<Subscriber> {
    let entity: Subscriber | undefined;
    let apiError: RuleApiError | undefined;

    try {
      const created = await this.transport.post<CreateSubscriberResponse>('/subscribers', {
        body: JSON.stringify(mapCreateRequestToWire(payload)),
      });

      entity = mapCreateDataToEntity(created.data);
    } catch (error) {
      if (!(error instanceof RuleApiError)) throw error;
      apiError = error;
    }

    if (entity !== undefined) return entity;

    // POST /v3/subscribers fails when the subscriber already exists.
    // The exact status code is undocumented; fall back to v2 GET by each available identifier.
    if (apiError) {
      if (payload.email) {
        const existing = await this.getByEmail(payload.email);

        if (existing) return existing;
      }

      if (payload.phoneNumber) {
        const existing = await this.getByPhone(payload.phoneNumber);

        if (existing) return existing;
      }

      if (payload.customIdentifier) {
        const existing = await this.getByCustomIdentifier(payload.customIdentifier);

        if (existing) return existing;
      }
    }

    throw apiError ?? new RuleApiError('v3 POST /subscribers returned no entity', 0);
  }

  /** @internal */
  private async _writeSyncFields(
    subscriberId: number,
    fields: CustomFieldGroupDataRecord | undefined,
    historicalFields: CustomFieldGroupDataRecord | undefined,
  ): Promise<void> {
    const groups: CustomFieldGroupEntry[] = [];

    for (const [source, historical] of [[fields, false], [historicalFields, true]] as const) {
      if (!source) continue;

      for (const groupName of Object.keys(source)) {
        const groupFields = source[groupName] as CustomFieldGroupData;
        const values: CustomFieldGroupEntry['values'] = [];

        for (const fieldName of Object.keys(groupFields)) {
          const rawValue = groupFields[fieldName];

          if (rawValue !== undefined && String(rawValue) !== '') {
            values.push({ field: fieldName, value: String(rawValue) });
          }
        }

        if (values.length > 0) {
          groups.push(historical
            ? { group: groupName.trim(), historical: true, values }
            : { group: groupName.trim(), values }
          );
        }
      }
    }

    if (groups.length > 0) {
      await this.writeCustomFieldData(subscriberId, { groups });
    }
  }

  /** @internal */
  private async _applyTags(
    subscriberId: number,
    payload: CreateSubscriberPayload,
    tags: string[] | undefined
  ): Promise<void> {
    if (!tags?.length) return;

    const subscriber: SubscriberIdentifier = payload.email
      ? { email: payload.email }
      : payload.phoneNumber
        ? { phoneNumber: payload.phoneNumber }
        : payload.customIdentifier
          ? { customIdentifier: payload.customIdentifier }
          : { id: subscriberId };

    await this._addSubscriberTags(subscriber, tags);
  }

  /** @internal */
  private async _getSubscriber(
    identifier: string,
    identifiedBy: SubscriberIdentifierBy,
  ): Promise<Subscriber | null> {
    try {
      const response = await this.transport.get<GetSubscriberResponse>(
        `/subscribers/${encodeURIComponent(identifier)}?identified_by=${identifiedBy}`,
        { version: 'v2' }
      );

      return mapGetSubscriberToEntity(response.subscriber);
    } catch (error) {
      if (error instanceof RuleApiError && error.isNotFound()) return null;

      throw error;
    }
  }

  /** @internal */
  private async _addSubscriberTags(
    subscriber: SubscriberIdentifier,
    tags: TagRef[],
    options: AddSubscriberTagsOptions = {},
  ): Promise<RuleApiResponse> {
    const { value, identifiedBy } = mapSubscriberIdentifier(subscriber);

    const wireBody: Record<string, unknown> = { tags };

    if (options.automation !== undefined) {
      wireBody.automation = options.automation === 'trigger' ? 'send' : options.automation;
    }

    if (options.syncSegments === false) {
      wireBody.sync_subscriber = false;
    }

    await this.transport.fetchRaw(
      'PUT',
      `/subscribers/${encodeURIComponent(value)}/tags?identified_by=${identifiedBy}`,
      { body: JSON.stringify(wireBody), version: 'v3' },
    );

    return { success: true };
  }

  /** @internal */
  private async _deleteSubscriber(
    subscriber: string | number,
    identifiedBy: SubscriberIdentifierBy
  ): Promise<RuleApiResponse> {
    await this.transport.fetchRaw(
      'DELETE',
      `/subscribers/${encodeURIComponent(subscriber)}?identified_by=${identifiedBy}`
    );

    return { success: true };
  }
}

// ── Module-level helpers ───────────────────────────────────────────────────

/** @internal */
function parseNextPage(nextUrl: string | null): number | null {
  if (!nextUrl) return null;

  try {
    const pageStr = new URL(nextUrl).searchParams.get('page');

    if (!pageStr) return null;
    const page = Number.parseInt(pageStr, 10);

    return Number.isFinite(page) && page > 0 ? page : null;
  } catch {
    return null;
  }
}

/** @internal */
function mapCreateDataToEntity(data: CreateSubscriberResponse['data']): Subscriber {
  return {
    id: data.id,
    email: data.email,
    phone: data.phone,
    customIdentifier: data.custom_identifier ?? null,
    status: data.status,
    language: data.language,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/** @internal */
function mapGetSubscriberToEntity(sub: GetSubscriberResponse['subscriber']): Subscriber {
  return {
    id: sub.id,
    email: sub.email ?? null,
    phone: sub.phone_number ?? null,
    customIdentifier: sub.custom_identifier ?? null,
    language: sub.language,
    optedIn: sub.opted_in,
    tags: sub.tags,
    syncAtSegments: sub.syncAtSegments,
    createdAt: sub.created_at,
    updatedAt: sub.updated_at,
  };
}

/** @internal */
function mapSubscriberListWireToEntity(record: SubscriberListWire): Subscriber {
  return {
    id: record.id,
    email: record.email,
    phone: record.phone_number,
    customIdentifier: record.custom_identifier ?? null,
    language: record.language,
    optedIn: record.opted_in,
    suppressed: record.suppressed,
    tags: record.tags ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/** @internal */
function mapCustomFieldValueEntry(w: CustomFieldValueEntryWire) {
  return {
    fieldId: w.field_id,
    fieldName: w.field_name,
    fieldType: w.field_type,
    fieldValue: w.field_value,
  };
}

/** @internal */
function mapCustomFieldDataRecord(w: CustomFieldDataRecordWire) {
  return {
    id: w.id,
    groupId: w.group_id,
    groupName: w.group_name,
    historical: w.historical,
    createdAt: w.created_at,
    values: w.values.map(mapCustomFieldValueEntry),
  };
}

/** @internal */
function mapCreateRequestToWire(payload: CreateSubscriberPayload): object {
  return {
    ...(payload.email !== undefined ? { email: payload.email } : {}),
    ...(payload.phoneNumber !== undefined ? { phone_number: payload.phoneNumber } : {}),
    ...(payload.customIdentifier !== undefined ? { custom_identifier: payload.customIdentifier } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.language !== undefined ? { language: payload.language } : {}),
  };
}

/** @internal */
function mapBulkCreateSubscribersToWire(
  payload: BulkCreateSubscribersPayload,
): BulkCreateSubscribersBody {
  return {
    subscribers: payload.subscribers.map(mapBulkCreateEntryToWire),
    ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    ...(payload.updateOnDuplicate !== undefined
      ? { update_on_duplicate: payload.updateOnDuplicate }
      : {}),
    ...(payload.automation !== undefined ? { automation: payload.automation } : {}),
    ...(payload.syncSubscribers !== undefined
      ? { sync_subscribers: payload.syncSubscribers }
      : {}),
    ...(payload.language !== undefined ? { language: payload.language } : {}),
    ...(payload.requireOptIn !== undefined ? { require_opt_in: payload.requireOptIn } : {}),
  };
}

/** @internal */
function mapBulkCreateEntryToWire(
  entry: BulkCreateSubscriberEntry,
): BulkCreateSubscriberEntryBody {
  return {
    ...(entry.email !== undefined ? { email: entry.email } : {}),
    ...(entry.phoneNumber !== undefined ? { phone_number: entry.phoneNumber } : {}),
    ...(entry.language !== undefined ? { language: entry.language } : {}),
    ...(entry.fields !== undefined && entry.fields.length > 0
      ? {
          fields: entry.fields.map((f) => ({
            key: f.key,
            value: f.value,
            ...(f.type !== undefined ? { type: f.type } : {}),
          })),
        }
      : {}),
  };
}

/** @internal */
function mapSubscriberIdentifierToWire(id: SubscriberIdentifier): object {
  if ('email' in id) return { email: id.email };
  if ('phoneNumber' in id) return { phone_number: id.phoneNumber };
  if ('id' in id) return { id: id.id };

  return { custom_identifier: id.customIdentifier };
}

/** @internal */
function mapCustomFieldEntryToWire(entry: CustomFieldEntry): object {
  return {
    field: entry.field,
    ...(entry.createIfNotExists !== undefined ? { create_if_not_exists: entry.createIfNotExists } : {}),
    value: entry.value,
  };
}

/** @internal */
function mapCustomFieldGroupEntryToWire(entry: CustomFieldGroupEntry): object {
  return {
    group: entry.group,
    ...(entry.createIfNotExists !== undefined ? { create_if_not_exists: entry.createIfNotExists } : {}),
    ...(entry.historical !== undefined ? { historical: entry.historical } : {}),
    values: entry.values.map(mapCustomFieldEntryToWire),
  };
}
