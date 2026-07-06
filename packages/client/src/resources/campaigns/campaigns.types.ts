/**
 * Campaign types for the `@rule/client` campaigns namespace.
 *
 * A campaign is a one-time or scheduled email blast sent to a defined set of
 * recipients. The lifecycle is:
 *
 * ```
 * create()  →  update() (name, recipients)  →  schedule() (send now or later)
 * ```
 *
 * Use `CampaignsClient.copy` to duplicate an existing campaign when the
 * structure stays the same but the content changes (e.g. recurring newsletters).
 */

import type { RcmlDocument, SmsDocument } from '@rule/rcml';

import type { PagePaginationParams, RuleApiResponse } from '../../shared.types.js';
import type {
  CreateEmailCampaignMessagePayload,
  CreateSmsCampaignMessagePayload,
} from '../messages/messages.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Supporting types ──────────────────────────────────────────────────────────

/**
 * Status/type descriptor object returned by the API for campaign `status`,
 * `messageType`, and `sendoutType` fields.
 *
 * The API encodes these fields as objects rather than bare enums so consumers
 * get both a machine-readable code and a human-readable label.
 */
export interface CampaignStatus {
  /** Numeric code (e.g. `1` for draft, `4` for scheduled). */
  value: number;
  /** Machine-readable key (e.g. `'draft'`, `'scheduled'`, `'email'`). */
  key: string;
  /** Human-readable description. */
  description: string;
}

/**
 * Sendout type for a campaign.
 *
 * - `'marketing'` — standard marketing email (default)
 * - `'transactional'` — triggered transactional email (order confirmations, receipts, etc.)
 */
export type CampaignSendoutType = 'marketing' | 'transactional';

/**
 * Message type for a campaign.
 *
 * - `'email'` — email campaign
 * - `'text_message'` — SMS campaign
 */
export type CampaignMessageType = 'email' | 'text_message';

/**
 * A tag used as a campaign recipient filter.
 *
 * Set `negative: true` to exclude subscribers with this tag from the send.
 */
export interface CampaignRecipientTag {
  /** Tag ID. */
  id: number;
  /** Tag name (informational — not sent to the API on create/update). */
  name?: string;
  /**
   * Whether to exclude (`true`) or include (`false`) subscribers with this
   * tag.
   */
  negative: boolean;
}

/**
 * A segment used as a campaign recipient filter.
 *
 * Set `negative: true` to exclude subscribers in this segment.
 */
export interface CampaignRecipientSegment {
  /** Segment ID. */
  id: number;
  /** Segment name (informational — not sent to the API on create/update). */
  name?: string;
  /**
   * Whether to exclude (`true`) or include (`false`) subscribers in this
   * segment.
   */
  negative: boolean;
}

// ── Entity ────────────────────────────────────────────────────────────────────

/**
 * A campaign entity as returned by the API.
 *
 * Properties use camelCase; the wire format is normalised by the SDK.
 */
export interface Campaign {
  /**
   * Campaign ID.
   *
   * Optional because the API may omit it in partial responses.
   */
  id?: number;
  /** Campaign name shown in the Rule.io UI. */
  name: string;
  /**
   * Current campaign status.
   *
   * Common keys: `'draft'`, `'scheduled'`, `'sending'`, `'sent'`, `'paused'`.
   */
  status: CampaignStatus;
  /**
   * Message type: `1` = email, `2` = text message.
   *
   * Returned as a status descriptor object by the API.
   */
  messageType: CampaignStatus;
  /**
   * Sendout type: `1` = marketing, `2` = transactional.
   *
   * Returned as a status descriptor object by the API.
   */
  sendoutType: CampaignStatus;
  /** Total number of recipients. */
  numberOfRecipients?: number | null;
  /** Number of emails successfully sent. */
  totalSent?: number | null;
  /** Recipient targeting configuration. */
  recipients: CampaignRecipients;
  /** ISO 8601 timestamp of when the campaign was created. */
  createdAt: string;
  /** ISO 8601 timestamp of when the campaign was last updated. */
  updatedAt: string;
}

/**
 * Recipient targeting configuration embedded in a `Campaign`.
 */
export interface CampaignRecipients {
  /** Tag-based recipient filters. */
  tags?: CampaignRecipientTag[];
  /** Segment-based recipient filters. */
  segments?: CampaignRecipientSegment[];
  /** Individual subscriber recipients. */
  subscribers?: CampaignRecipientSubscriber[];
}

/**
 * An individual subscriber targeted by a campaign.
 */
export interface CampaignRecipientSubscriber {
  id: number;
  email?: string;
  /** Phone number of the subscriber. */
  phoneNumber?: string;
}

// ── Create payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `CampaignsClient.createEmailCampaign`.
 *
 * The message type is fixed to `'email'` by the method — do not include it
 * here. A campaign starts with no name and no recipients; add those with
 * `CampaignsClient.update` before scheduling.
 *
 * @example
 * ```typescript
 * const campaign = await client.campaigns.createEmailCampaign({
 *   sendoutType: 'marketing',
 * });
 * ```
 */
export interface CreateEmailCampaignPayload {
  /** Campaign name. Defaults to a generated name if omitted. */
  name?: string;
  /**
   * Sendout type.
   *
   * `'marketing'` = standard marketing email (default).
   * `'transactional'` = triggered transactional email.
   */
  sendoutType?: CampaignSendoutType;
  /** Initial tag recipient filters. */
  tags?: CampaignRecipientTag[];
  /** Initial segment recipient filters. */
  segments?: CampaignRecipientSegment[];
  /** Initial individual subscriber IDs. */
  subscribers?: number[];
}

/**
 * Payload for `CampaignsClient.createSmsCampaign`.
 *
 * The message type is fixed to `'text_message'` by the method — do not
 * include it here. A campaign starts with no name and no recipients; add
 * those with `CampaignsClient.updateSmsCampaign` before scheduling.
 *
 * @example
 * ```typescript
 * const campaign = await client.campaigns.createSmsCampaign({
 *   name: 'Flash sale SMS',
 * });
 * ```
 */
export type CreateSmsCampaignPayload = CreateEmailCampaignPayload;

// ── Set payloads ──────────────────────────────────────────────────────────────

/**
 * Payload for `CampaignsClient.setEmailCampaign` (full replacement).
 *
 * All five fields are required — the API replaces the entire campaign body.
 * Omitted fields revert to API defaults, not the previous values.
 *
 * The message type is fixed to `'email'` by the method. If the campaign does
 * not yet exist the SDK falls back to a create using `createEmailCampaign()`
 * semantics.
 *
 * @example
 * ```typescript
 * await client.campaigns.setEmailCampaign(campaignId, {
 *   name: 'Spring Newsletter',
 *   sendoutType: 'marketing',
 *   tags: [{ id: 42, negative: false }],
 *   segments: [],
 *   subscribers: [],
 * });
 * ```
 */
export interface SetEmailCampaignPayload {
  /** Campaign name. Required. */
  name: string;
  /**
   * Sendout type. Required.
   *
   * `'marketing'` = standard marketing email.
   * `'transactional'` = triggered transactional email.
   */
  sendoutType: CampaignSendoutType;
  /** Tag recipient filters. Pass an empty array to clear all tag filters. */
  tags: CampaignRecipientTag[];
  /** Segment recipient filters. Pass an empty array to clear all segment filters. */
  segments: CampaignRecipientSegment[];
  /** Individual subscriber IDs. Pass an empty array to clear all. */
  subscribers: number[];
}

/**
 * Payload for `CampaignsClient.setSmsCampaign` (full replacement).
 *
 * All five fields are required — the API replaces the entire campaign body.
 * The message type is fixed to `'text_message'` by the method.
 *
 * @example
 * ```typescript
 * await client.campaigns.setSmsCampaign(campaignId, {
 *   name: 'Flash sale SMS',
 *   sendoutType: 'marketing',
 *   tags: [{ id: 42, negative: false }],
 *   segments: [],
 *   subscribers: [],
 * });
 * ```
 */
export type SetSmsCampaignPayload = SetEmailCampaignPayload;

// ── Update payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `CampaignsClient.updateEmailCampaign` (partial update via
 * read-modify-write).
 *
 * All fields are optional — only the fields you include are changed.
 * The client fetches the existing record, merges your changes over it, and
 * writes the complete merged body back to the API.
 *
 * @example
 * ```typescript
 * // Change only the name
 * await client.campaigns.updateEmailCampaign(campaignId, { name: 'Spring Newsletter 2025' });
 *
 * // Set recipients
 * await client.campaigns.updateEmailCampaign(campaignId, {
 *   tags: [{ id: 42, negative: false }],
 *   segments: [],
 * });
 * ```
 */
export interface UpdateEmailCampaignPayload {
  /** New campaign name. */
  name?: string;
  /**
   * New sendout type.
   *
   * `'marketing'` = standard marketing email.
   * `'transactional'` = triggered transactional email.
   */
  sendoutType?: CampaignSendoutType;
  /** New tag recipient filters. Replaces all existing tag filters. */
  tags?: CampaignRecipientTag[];
  /** New segment recipient filters. Replaces all existing segment filters. */
  segments?: CampaignRecipientSegment[];
  /** New individual subscriber IDs. Replaces all existing subscriber targets. */
  subscribers?: number[];
}

/**
 * Payload for `CampaignsClient.updateSmsCampaign` (partial update via
 * read-modify-write).
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.campaigns.updateSmsCampaign(campaignId, {
 *   name: 'Flash sale SMS — updated',
 *   tags: [{ id: 42, negative: false }],
 * });
 * ```
 */
export type UpdateSmsCampaignPayload = UpdateEmailCampaignPayload;

// ── List params ───────────────────────────────────────────────────────────────

/**
 * Parameters for `CampaignsClient.listCampaigns` and the auto-pagination
 * helpers (`CampaignsClient.iterateCampaigns`,
 * `CampaignsClient.iterateCampaignsPages`,
 * `CampaignsClient.listAllCampaigns`).
 *
 * @example
 * ```typescript
 * // List email campaigns, page 2
 * const page = await client.campaigns.listCampaigns({
 *   filters: { messageType: 'email' },
 *   pagination: { page: 2, pageSize: 20 },
 * });
 * ```
 */
export interface ListCampaignsParams {
  pagination?: PagePaginationParams;
  filters?: {
    /**
     * Filter by message type.
     *
     * `'email'` = email campaigns, `'text_message'` = SMS campaigns.
     */
    messageType?: CampaignMessageType;
  };
}

// ── Schedule payload ──────────────────────────────────────────────────────────

/**
 * Payload for `CampaignsClient.schedule`.
 *
 * Valid combinations:
 * - `{ type: 'now' }` — send immediately
 * - `{ type: 'schedule', datetime: '2025-06-15T10:00:00+02:00' }` — schedule for later
 * - `{ type: null }` — cancel a previously scheduled send (moves back to draft)
 *
 * @example
 * ```typescript
 * // Send now
 * await client.campaigns.schedule(campaignId, { type: 'now' });
 *
 * // Schedule for a specific time
 * await client.campaigns.schedule(campaignId, {
 *   type: 'schedule',
 *   datetime: '2025-09-15T09:00:00+02:00',
 * });
 *
 * // Cancel scheduled send
 * await client.campaigns.schedule(campaignId, { type: null });
 * ```
 */
export interface ScheduleCampaignPayload {
  /** Schedule type. `null` cancels an existing scheduled send. */
  type?: 'now' | 'schedule' | null;
  /**
   * Target send datetime for `type: 'schedule'`.
   *
   * ISO 8601 date-time string (e.g. `'2025-09-15T09:00:00+02:00'`).
   */
  datetime?: string;
}

// ── Default campaign creation result ─────────────────────────────────────────

/**
 * Result from `CampaignsClient.createDefaultEmailCampaign` or
 * `CampaignsClient.createDefaultSmsCampaign`.
 *
 * Contains the IDs of all resources created during the campaign setup
 * sequence: campaign → message → template → dynamic set.
 *
 * @example
 * ```typescript
 * const result = await client.campaigns.createDefaultEmailCampaign({
 *   brandStyleId: 42,
 * });
 * console.log(result.campaignId, result.messageId, result.templateId, result.dynamicSetId);
 * ```
 */
export interface CreateDefaultCampaignResult {
  /** The created campaign ID. */
  campaignId: number;
  /** The created message ID. */
  messageId: number;
  /** The created template ID. */
  templateId: number;
  /** The created dynamic set ID linking the message to the template. */
  dynamicSetId: number;
}

/**
 * Options for `CampaignsClient.createDefaultEmailCampaign`.
 *
 * Creates a complete email campaign with all its dependencies in one call:
 * campaign → message → template (built from brand style) → dynamic set.
 *
 * @example
 * ```typescript
 * const result = await client.campaigns.createDefaultEmailCampaign({
 *   brandStyleId: 42,
 * });
 * ```
 */
export interface CreateDefaultEmailCampaignParams {
  /**
   * Brand style ID used to build the default email template.
   *
   * The SDK fetches the brand style and auto-generates an editor-compatible
   * RCML template with a logo, placeholder content section, and footer.
   * Not fetched when `template.content` is provided.
   */
  brandStyleId: number;
  /**
   * Initial campaign name. Defaults to a generated name when omitted.
   */
  name?: string;
  /** Sendout type. Defaults to `'marketing'`. */
  sendoutType?: CampaignSendoutType;
  /**
   * Optional overrides for the auto-created email message.
   *
   * Any field provided here replaces the default. `subject` defaults to the
   * campaign name when omitted.
   */
  message?: Partial<CreateEmailCampaignMessagePayload>;
  /**
   * Optional overrides for the auto-created email template.
   *
   * Provide `content` to supply a custom RCML document — this skips the brand
   * style fetch entirely. Provide `name` to override the auto-generated
   * template name.
   */
  template?: {
    /** Template name. Defaults to `'Campaign ${id} template'`. */
    name?: string;
    /**
     * Custom RCML document. When omitted the SDK auto-generates a branded
     * template from `brandStyleId`.
     */
    content?: RcmlDocument;
  };
}

/**
 * Options for `CampaignsClient.createDefaultSmsCampaign`.
 *
 * Creates a complete SMS campaign with all its dependencies in one call:
 * campaign → message → template → dynamic set.
 *
 * @example
 * ```typescript
 * const result = await client.campaigns.createDefaultSmsCampaign();
 * ```
 */
export interface CreateDefaultSmsCampaignParams {
  /**
   * Initial campaign name. Defaults to a generated name when omitted.
   */
  name?: string;
  /** Sendout type. Defaults to `'marketing'`. */
  sendoutType?: CampaignSendoutType;
  /**
   * Optional overrides for the auto-created SMS message.
   *
   * Currently supports `utmCampaign` and `utmTerm`. When omitted the message
   * is created with no UTM parameters.
   */
  message?: Partial<CreateSmsCampaignMessagePayload>;
  /**
   * Optional overrides for the auto-created SMS template.
   *
   * Provide `name` to override the auto-generated template name. Provide
   * `content` to supply a custom SMS document.
   */
  template?: {
    /** Template name. When omitted the API assigns a default name automatically. */
    name?: string;
    /**
     * Custom SMS document. When omitted the SDK wraps the resolved SMS body
     * text in a default SMS document.
     */
    content?: SmsDocument;
  };
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format campaign entity from the v3 `/editor/campaign` endpoint.
 * @internal
 */
export interface CampaignWire {
  id?: number;
  name: string;
  status?: CampaignStatus;
  message_type?: CampaignStatus;
  sendout_type?: CampaignStatus;
  number_of_recipients?: number | null;
  total_sent?: number | null;
  recipients?: {
    tags?: CampaignRecipientTag[];
    segments?: CampaignRecipientSegment[];
    subscribers?: Array<{ id: number; email?: string; phone_number?: string }>;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Wire body for POST `/editor/campaign`.
 * @internal
 */
export interface CreateCampaignBody {
  name?: string;
  /** String enum as required by the API: `"1"` = email, `"2"` = text_message. */
  message_type: '1' | '2';
  /** String enum as required by the API: `"1"` = marketing, `"2"` = transactional. */
  sendout_type?: '1' | '2';
  tags?: CampaignRecipientTag[];
  segments?: CampaignRecipientSegment[];
  subscribers?: number[];
}

/**
 * Wire body for PUT `/editor/campaign/:id`.
 *
 * All five fields are required by the API. Optionally includes `message_type`
 * when the PUT falls back to a POST (upsert create path).
 * @internal
 */
export interface UpdateCampaignBody {
  name: string;
  /** String enum as required by the API: `"1"` = marketing, `"2"` = transactional. */
  sendout_type: '1' | '2';
  tags: CampaignRecipientTag[];
  segments: CampaignRecipientSegment[];
  subscribers: number[];
  /** String enum — only included on upsert-create path. */
  message_type?: '1' | '2';
}

/**
 * Wire response from GET/POST `/editor/campaign` (single campaign).
 * @internal
 */
export interface CampaignResponse extends RuleApiResponse {
  data: CampaignWire;
}

/**
 * Wire response from GET `/editor/campaign` (list).
 * @internal
 */
export interface CampaignListResponse extends RuleApiResponse {
  data: CampaignWire[];
}
