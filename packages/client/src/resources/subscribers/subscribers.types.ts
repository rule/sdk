/**
 * Subscriber types for the `@rule/client` subscribers namespace.
 */

import type { RuleApiResponse, PagePaginationParams } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Subscriber entities and identifiers ──────────────────────────────────────

/**
 * A tag attached to a subscriber, as returned by `getTags()` and embedded
 * inside `Subscriber`.
 */
export interface SubscriberTag {
  id: number;
  name: string;
}

/**
 * Unified subscriber entity returned by all lookup and create methods.
 *
 * The `phone` field is canonical — the raw Rule.io API uses `phone` in v3
 * responses and `phone_number` in v2 responses. The SDK always normalises to
 * `phone` so consumers never need to track which API version was called.
 */
export interface Subscriber {
  id: number;
  email: string | null;
  /** Canonical phone field — normalised from `phone` (v3) or `phone_number` (v2). */
  phone: string | null;
  customIdentifier: string | null;
  status?: string;
  language?: string;
  optedIn?: boolean;
  suppressed?: boolean;
  tags?: SubscriberTag[];
  syncAtSegments?: SubscriberSegment[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Discriminated union for subscriber identification in bulk operations.
 *
 * Exactly one field must be present — the constraint is enforced at the type
 * level so the API cannot receive zero or two identifiers.
 *
 * @example
 * ```typescript
 * const identifiers: SubscriberIdentifier[] = [
 *   { email: 'alice@example.com' },
 *   { id: 42 },
 * ];
 * ```
 */
export type SubscriberIdentifier =
  | { email: string }
  | { phoneNumber: string }
  | { id: number }
  | { customIdentifier: string };

export interface SubscriberSegment {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  syncAt?: string;
}

/** Params for `listSubscribersByTagIds`. */
export interface ListSubscribersByTagIdsParams {
  /** Tag IDs the subscriber must ALL have (intersection). Must be non-empty. */
  tagIds: number[];
  pagination?: PagePaginationParams;
}

/** Params for `listAllSubscribersByTagIds`. */
export interface ListAllSubscribersByTagIdsParams extends ListSubscribersByTagIdsParams {
  /** Maximum number of subscribers to collect before stopping. Prevents unbounded memory usage. */
  maxItems?: number;
}

/** Result shape for `listSubscribersByTagIds`. One page at a time — caller
 * drives pagination by passing `nextPage` back until it returns null. */
export interface ListSubscribersByTagIdsResult {
  /** Subscribers on this page that matched all required tagIds. */
  subscribers: Subscriber[];
  /** Count of subscribers that matched (equals `subscribers.length`). */
  matched: number;
  /** Count of subscribers scanned on this page before filtering. */
  scanned: number;
  /** Page number to request next. Null when exhausted. */
  nextPage: number | null;
}

// ── Subscriber request bodies ─────────────────────────────────────────────────

export interface SubscriberSyncPayload {
  subscriber: CreateSubscriberPayload;
  /** Regular custom field groups — existing values are overwritten on each sync. */
  customFieldData?: CustomFieldGroupDataRecord;
  /** Historical custom field groups — a new entry is appended on each sync, preserving history. */
  historicalCustomFieldData?: CustomFieldGroupDataRecord;
  tags?: string[];
}

/** Payload for creating a subscriber. */
export interface CreateSubscriberPayload {
  email?: string | null;
  phoneNumber?: string | null;
  customIdentifier?: string;
  status?: 'ACTIVE' | 'BLOCKED' | 'PENDING';
  language?: string;
}

/** Tag reference for `addSubscriberTags` — a tag name (string) or numeric ID. */
export type TagRef = string | number;

/** Controls tag automation behaviour in `addSubscriberTags`. */
export type TagAutomationMode = 'trigger' | 'force' | 'reset';

/** Options for `addSubscriberTags`. */
export interface AddSubscriberTagsOptions {
  /**
   * Controls tag automations after the tags are added.
   *
   * - `'trigger'` — fire if not yet triggered for this subscriber
   * - `'force'`   — re-fire unconditionally; subscriber removed from tag-related segments
   * - `'reset'`   — clear previous automation history for these tags, then re-fire fresh
   *
   * When omitted, no tag automations fire.
   *
   * Note: providing any value automatically unblocks a blocked subscriber.
   */
  automation?: TagAutomationMode;

  /**
   * Whether Rule.io should recalculate segment membership after the tag
   * change. Defaults to `true`.
   *
   * Set to `false` to skip the recalculation.
   */
  syncSegments?: boolean;
}

/** Options for single-tag add methods. */
export interface AddSubscriberTagOptions {
  /**
   * Whether Rule.io should recalculate segment membership after the tag
   * operation. Defaults to `true`.
   *
   * Set to `false` to skip the recalculation. You might do this if your
   * Rule.io account has autosync configured (so the sync would be redundant),
   * or for any other reason you want to manage segment membership separately
   * from this tag operation.
   */
  syncSegments?: boolean;
}

/** Payload for bulk tag operations (add/remove tags for multiple subscribers). */
export interface BulkTagsPayload {
  subscribers: SubscriberIdentifier[];
  tags: (string | number)[];
}

// ── Bulk subscriber create ────────────────────────────────────────────────────

/**
 * One custom-field value attached to a {@link BulkCreateSubscriberEntry}.
 *
 * The `key` follows `Group.Field` notation. The `value` shape depends on
 * `type` — a string for `'text'`, `'date'`, `'datetime'`, `'time'`, and
 * `'json'`; a string array for `'multiple'`.
 */
export interface BulkCreateSubscriberField {
  /** Custom field identifier in `'Group.Field'` form, e.g. `'Order.Total'`. */
  key: string;
  /**
   * Field value. Types align with `type`:
   * - `'text'` / `'date'` / `'datetime'` / `'time'` / `'json'` — string.
   * - `'multiple'` — string array.
   * - Numbers are accepted by the API for numeric custom fields.
   */
  value: string | number | string[];
  /** Defaults to `'text'` server-side when omitted. */
  type?: 'text' | 'date' | 'datetime' | 'time' | 'multiple' | 'json';
}

/**
 * One element of {@link BulkCreateSubscribersPayload.subscribers}.
 *
 * Provide at minimum an `email` or `phoneNumber`. Both may be supplied —
 * Rule.io matches on either when `updateOnDuplicate` is set. Per-subscriber
 * custom field values go on `fields` as an array of
 * {@link BulkCreateSubscriberField} entries.
 */
export interface BulkCreateSubscriberEntry {
  email?: string | null;
  phoneNumber?: string | null;
  /**
   * Per-subscriber language override. ISO 639-1 (e.g. `'en'`, `'sv'`).
   * Falls back to the batch-level `language` on
   * {@link BulkCreateSubscribersPayload} when omitted.
   */
  language?: string;
  /** Custom-field values for this subscriber. */
  fields?: BulkCreateSubscriberField[];
}

/**
 * Automation handling on existing subscribers matched in a bulk create:
 * `false` (default) leaves them alone, `'reset'` and `'force'` are
 * documented automation triggers — see the Rule.io API documentation for
 * exact semantics.
 */
export type BulkCreateAutomationMode = false | 'reset' | 'force';

/**
 * Payload for `SubscribersClient.bulkCreateSubscribers`.
 *
 * Wraps the v2 `POST /subscribers` "create multiple" endpoint. Top-level
 * fields apply to every subscriber in the batch; per-entry fields are set
 * on each {@link BulkCreateSubscriberEntry}.
 */
export interface BulkCreateSubscribersPayload {
  /** Up to 1000 entries per call. The API rejects larger batches with 413. */
  subscribers: BulkCreateSubscriberEntry[];
  /**
   * Tags applied to every subscriber in the batch. Numeric IDs and string
   * names may be mixed. Tags consisting only of digits are interpreted as
   * IDs.
   */
  tags?: (string | number)[];
  /**
   * If `true`, existing subscribers (matched by email or phone) are
   * updated rather than rejected with 409. Defaults to `false`.
   */
  updateOnDuplicate?: boolean;
  /**
   * Automation handling for matched subscribers. See
   * {@link BulkCreateAutomationMode}.
   */
  automation?: BulkCreateAutomationMode;
  /**
   * Controls automation firing for the whole batch. `true` fires
   * automations for every subscriber (capped server-side at 100). `false`
   * disables automations for the batch. If omitted, automations fire only
   * when the batch has fewer than 20 subscribers.
   */
  syncSubscribers?: boolean;
  /** Default language applied to subscribers that omit `language`. */
  language?: string;
  /**
   * If `true`, run the opt-in flow rather than creating subscribers
   * directly.
   */
  requireOptIn?: boolean;
}

/**
 * Return value of `SubscribersClient.bulkCreateSubscribers`.
 *
 * The v2 endpoint processes large batches asynchronously, so the
 * synchronous response is an acknowledgement rather than the list of
 * created subscribers. Numeric counters are populated when the API
 * includes them in the response.
 */
export interface BulkCreateSubscribersResult {
  success: true;
  /** Optional success message echoed by the API. */
  message?: string;
  /** Number of subscribers created when reported by the API. */
  subscribersCreated?: number;
  /** Number of subscribers updated when reported by the API. */
  subscribersUpdated?: number;
  /** Number of suppressed addresses skipped, when reported. */
  subscribersSuppressed?: number;
}

/**
 * Options shared by all suppression and unsuppression methods.
 */
export interface SuppressOptions {
  /**
   * Webhook URL Rule.io will call when async processing completes.
   *
   * See the Asynchronous Operations guide in the documentation for details.
   */
  callbackUrl?: string;
}

// ── Custom field data ─────────────────────────────────────────────────────────

/** Raw value that can be stored in a custom field. */
export type CustomFieldDataValue =
  | string
  | string[]
  | Record<string, unknown>
  | Record<string, unknown>[];

/** One field's value entry in a custom field data API response. */
export interface CustomFieldValueEntry {
  fieldId: number;
  fieldName: string;
  fieldType: 'text' | 'datetime' | 'date' | 'time' | 'multiple' | 'json';
  fieldValue: CustomFieldDataValue;
}

/** One group of custom field data for a subscriber, as returned by the API. */
export interface CustomFieldData {
  id: number;
  groupId?: number;
  groupName?: string;
  historical?: boolean;
  createdAt?: string;
  values: CustomFieldValueEntry[];
}

/** Result from custom field data list endpoints. */
export interface CustomFieldDataListResult {
  data: CustomFieldData[];
  meta?: { page: number; pageSize: number };
}

/** Result from single-record custom field data endpoints. */
export interface CustomFieldDataResult extends RuleApiResponse {
  data?: CustomFieldData;
}

/** Filters for `listCustomFieldData`. */
export interface CustomFieldDataFilters {
  /** Filter records by custom field group IDs. Maps to `groups_id[]`. */
  groupIds?: number[];
  /** Filter records by custom field group names. Maps to `groups_name[]`. */
  groupNames?: string[];
}

/** Filters for `listCustomFieldDataByGroup`. */
export interface CustomFieldDataByGroupFilters {
  /** Narrow results to specific field names. Maps to `fields[]`. */
  fields?: string[];
}

/** Params for `listCustomFieldData`. */
export interface ListCustomFieldDataParams {
  pagination?: PagePaginationParams;
  filters?: CustomFieldDataFilters;
}

/** Params for `listAllCustomFieldData`. */
export interface ListAllCustomFieldDataParams extends ListCustomFieldDataParams {
  /** Maximum number of records to collect before stopping. Prevents unbounded memory usage. */
  maxItems?: number;
}

/** Params for `listCustomFieldDataByGroup`. */
export interface ListCustomFieldDataByGroupParams {
  pagination?: PagePaginationParams;
  filters?: CustomFieldDataByGroupFilters;
}

/** Params for `listAllCustomFieldDataByGroup`. */
export interface ListAllCustomFieldDataByGroupParams extends ListCustomFieldDataByGroupParams {
  /** Maximum number of records to collect before stopping. Prevents unbounded memory usage. */
  maxItems?: number;
}

/** Params for `searchCustomFieldData`. */
export interface SearchCustomFieldDataParams {
  dataId?: number;
  group?: number | string;
  field?: number | string;
  value?: string;
}

/** One field entry in a custom field data create/update payload. */
export interface CustomFieldEntry {
  field: number | string;
  createIfNotExists?: boolean;
  value: CustomFieldDataValue;
}

/** One group entry in a custom field data create payload. */
export interface CustomFieldGroupEntry {
  group: number | string;
  createIfNotExists?: boolean;
  historical?: boolean;
  values: CustomFieldEntry[];
}

/** Payload for `writeCustomFieldData`. */
export interface WriteCustomFieldDataPayload {
  groups: CustomFieldGroupEntry[];
}

/** Input for the ergonomic custom field data write helpers. */
export type CustomFieldValue = string | number | boolean | null | Date;

/** Ergonomic write input: a two-level record of group names → field names → values. */
export type CustomFieldDataInput = Record<string, Record<string, CustomFieldValue>>;

/** Return type for custom field data write methods. */
export type CustomFieldDataWriteResult = RuleApiResponse;

/** Payload for `patchCustomFieldData`. */
export interface PatchCustomFieldDataPayload {
  identifier: {
    dataId?: number;
    group?: number | string;
    field?: number | string;
    value?: string;
  };
  values: Array<{
    field: number | string;
    createIfNotExists?: boolean;
    value: CustomFieldDataValue;
  }>;
}

/**
 * One custom field group: a map of field names to their values.
 *
 * Keys are bare field names (e.g., `'OrderRef'`, `'FirstName'`).
 * Field names must not be empty or contain dots.
 *
 * @example
 * ```typescript
 * { OrderRef: 'ORD-9921', Total: '149.00' }
 * ```
 */
export interface CustomFieldGroupData {
  [field: string]: string | number | undefined;
}

/**
 * Custom field data to sync to Rule.io, organised by group name.
 *
 * Top-level keys are group names (e.g., `'Order'`, `'Profile'`).
 * Group names must not be empty or contain dots.
 *
 * @example
 * ```typescript
 * {
 *   Profile: { FirstName: 'Jane', Language: 'sv' },
 *   Order:   { OrderRef: 'ORD-9921', Total: '149.00' },
 * }
 * ```
 */
export interface CustomFieldGroupDataRecord {
  [group: string]: CustomFieldGroupData;
}

// ── Internal wire-format types ────────────────────────────────────────────────
// These mirror the API wire format and are used only inside the transport layer.
// They are not part of the public SDK surface.

// ── Subscriber wire types ─────────────────────────────────────────────────────

/** @internal */
export interface GetSubscriberResponse extends RuleApiResponse {
  subscriber: {
    id: number;
    email: string;
    phone_number?: string;
    custom_identifier?: string | null;
    language?: string;
    opted_in?: boolean;
    created_at?: string;
    updated_at?: string;
    tags?: Array<{ id: number; name: string }>;
    suppressed?: unknown[];
    syncAtSegments?: SubscriberSegment[];
  };
}

/** @internal */
export interface SubscriberFieldsResponse extends RuleApiResponse {
  groups?: Array<{
    name: string;
    fields: Array<{ name: string; value: string | null }>;
  }>;
}

/** @internal */
export interface SubscriberTagsResponse extends RuleApiResponse {
  tags?: Array<{ id: number; name: string }>;
}

/**
 * Subscriber shape returned by the v2 list endpoint.
 * @internal
 */
export interface SubscriberListWire {
  id: number;
  email: string | null;
  phone_number: string | null;
  custom_identifier?: string | null;
  language: string;
  opted_in: boolean;
  suppressed: boolean;
  created_at: string;
  updated_at: string;
  tags?: Array<{ id: number; name: string }> | null;
}

/** @internal */
export interface SubscribersListResponse extends RuleApiResponse {
  subscribers?: SubscriberListWire[];
  meta?: { next?: string | null };
}

/** @internal */
export interface CreateSubscriberResponse {
  data: {
    id: number;
    email: string | null;
    phone: string | null;
    has_next_item?: boolean;
    custom_identifier?: string | null;
    account_id?: number;
    created_at?: string;
    updated_at?: string;
    status?: string;
    language?: string;
  };
}

/** @internal */
export interface BulkCreateSubscriberFieldBody {
  key: string;
  value: string | number | string[];
  type?: string;
}

/** @internal */
export interface BulkCreateSubscriberEntryBody {
  email?: string | null;
  phone_number?: string | null;
  language?: string;
  fields?: BulkCreateSubscriberFieldBody[];
}

/** @internal */
export interface BulkCreateSubscribersBody {
  subscribers: BulkCreateSubscriberEntryBody[];
  tags?: (string | number)[];
  update_on_duplicate?: boolean;
  automation?: false | 'reset' | 'force';
  sync_subscribers?: boolean;
  language?: string;
  require_opt_in?: boolean;
}

/** @internal */
export interface BulkCreateSubscribersResponse extends RuleApiResponse {
  message?: string;
  subscribers_created?: number;
  subscribers_updated?: number;
  subscribers_suppressed?: number;
}

/**
 * v3 subscriber entity shape (wire format).
 * @internal
 */
export interface SubscriberV3Wire {
  id: number;
  email?: string | null;
  phone?: string | null;
  custom_identifier?: string | null;
  status?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Custom field data wire types ──────────────────────────────────────────────

/** @internal */
export interface CustomFieldValueEntryWire {
  field_id: number;
  field_name: string;
  field_type: 'text' | 'datetime' | 'date' | 'time' | 'multiple' | 'json';
  field_value: CustomFieldDataValue;
}

/** @internal */
export interface CustomFieldDataRecordWire {
  id: number;
  group_id?: number;
  group_name?: string;
  historical?: boolean;
  created_at?: string;
  values: CustomFieldValueEntryWire[];
}

/** @internal */
export interface CustomFieldDataListResponseWire extends RuleApiResponse {
  data?: CustomFieldDataRecordWire[];
  meta?: { page: number; per_page: number };
}

/** @internal */
export interface CustomFieldDataResponseWire extends RuleApiResponse {
  data?: CustomFieldDataRecordWire;
}
