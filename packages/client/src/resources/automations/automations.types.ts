/**
 * Automation types for the `@rule/client` automations namespace.
 *
 * An automation is a trigger-based email that fires automatically when a
 * subscriber enters a tag or a segment. Unlike campaigns (one-time sends),
 * automations fire per subscriber as each one meets the trigger condition.
 *
 * The underlying Rule.io API endpoint is `/editor/automail`; the SDK exposes
 * it under "Automation" terminology.
 */

import type { PagePaginationParams, RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Supporting types ──────────────────────────────────────────────────────────

/**
 * Sendout type for automations.
 *
 * - `'marketing'` — standard marketing email (default)
 * - `'transactional'` — triggered transactional email (order confirmations, etc.)
 */
export type AutomationSendoutType = 'marketing' | 'transactional';

/**
 * Trigger configuration for an automation.
 *
 * The `type` field must be **uppercase** (`'TAG'` or `'SEGMENT'`). The API
 * error messages may suggest lowercase, but uppercase is required.
 */
export interface AutomationTrigger {
  /**
   * Trigger type. Must be uppercase.
   *
   * `'TAG'` fires when a subscriber is assigned the tag.
   * `'SEGMENT'` fires when a subscriber enters the segment.
   */
  type: 'TAG' | 'SEGMENT';
  /** ID of the tag or segment that triggers this automation. */
  id: number;
  /** Name of the tag or segment (informational — not sent to the API). */
  name?: string;
}

// ── Entity ────────────────────────────────────────────────────────────────────

/**
 * An automation entity as returned by the API.
 *
 * Properties use camelCase; the wire format is normalised by the SDK.
 */
export interface Automation {
  /**
   * Automation ID.
   *
   * Optional because the API may omit it in partial responses.
   */
  id?: number;
  /** Human-readable automation name. */
  name: string;
  /** Optional description. */
  description?: string;
  /**
   * Whether the automation is active.
   *
   * Inactive automations are paused — they do not fire even when the trigger
   * condition is met.
   */
  active?: boolean;
  /**
   * The trigger that activates this automation.
   *
   * `null` means the automation has no trigger (disabled or default state).
   */
  trigger?: AutomationTrigger | null;
  /**
   * Sendout type: `'marketing'` or `'transactional'`.
   *
   * Mapped from the API's numeric status descriptor object.
   */
  sendoutType?: AutomationSendoutType;
  /** ISO 8601 timestamp of when the automation was created. */
  createdAt?: string;
  /** ISO 8601 timestamp of when the automation was last updated. */
  updatedAt?: string;
}

// ── Create payload ────────────────────────────────────────────────────────────

/**
 * Payload for `AutomationsClient.createEmailAutomation`.
 *
 * At minimum, provide a `name`. You can set the trigger at creation time or
 * add it later with `AutomationsClient.updateAutomation`.
 *
 * @example
 * ```typescript
 * const automation = await client.automations.createEmailAutomation({
 *   name: 'Welcome email',
 *   trigger: { type: 'TAG', id: tagId },
 *   sendoutType: 'marketing',
 * });
 * ```
 */
export interface CreateEmailAutomationPayload {
  /** Automation name. Required. */
  name: string;
  /** Optional description. */
  description?: string;
  /**
   * Trigger that activates this automation.
   *
   * Can be added later via `AutomationsClient.updateAutomation`.
   * `type` must be uppercase.
   */
  trigger?: AutomationTrigger;
  /**
   * Sendout type.
   *
   * `'marketing'` = standard marketing email (default).
   * `'transactional'` = triggered transactional email.
   */
  sendoutType?: AutomationSendoutType;
}

/**
 * Payload for `AutomationsClient.createSmsAutomation`.
 *
 * The message type is fixed to `'text_message'` by the method.
 *
 * @example
 * ```typescript
 * const automation = await client.automations.createSmsAutomation({
 *   name: 'Order shipped SMS',
 *   trigger: { type: 'TAG', id: tagId },
 *   sendoutType: 'transactional',
 * });
 * ```
 */
export type CreateSmsAutomationPayload = CreateEmailAutomationPayload;

// ── Set payloads ──────────────────────────────────────────────────────────────

/**
 * Payload for `AutomationsClient.setEmailAutomation` (full replacement).
 *
 * All four fields are required — the API replaces the entire automation body.
 * Omitted fields revert to API defaults, not the previous values.
 *
 * The message type is fixed to `'email'` by the method. If the automation
 * does not yet exist it is created as an email automation.
 *
 * @example
 * ```typescript
 * await client.automations.setEmailAutomation(automationId, {
 *   name: 'Welcome email',
 *   active: true,
 *   trigger: { type: 'TAG', id: tagId },
 *   sendoutType: 'transactional',
 * });
 * ```
 */
export interface SetEmailAutomationPayload {
  /** Automation name. Required. */
  name: string;
  /**
   * Whether the automation is active. Required.
   *
   * Pass `false` to create/replace as paused.
   */
  active: boolean;
  /**
   * Trigger configuration. Required.
   *
   * `type` must be uppercase (`'TAG'` or `'SEGMENT'`).
   */
  trigger: AutomationTrigger;
  /**
   * Sendout type. Required.
   *
   * `'marketing'` = standard marketing email.
   * `'transactional'` = triggered transactional email.
   */
  sendoutType: AutomationSendoutType;
}

/**
 * Payload for `AutomationsClient.setSmsAutomation` (full replacement).
 *
 * All four fields are required — the API replaces the entire automation body.
 * The message type is fixed to `'text_message'` by the method.
 *
 * @example
 * ```typescript
 * await client.automations.setSmsAutomation(automationId, {
 *   name: 'Order shipped SMS',
 *   active: true,
 *   trigger: { type: 'TAG', id: tagId },
 *   sendoutType: 'transactional',
 * });
 * ```
 */
export type SetSmsAutomationPayload = SetEmailAutomationPayload;

// ── Update payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `AutomationsClient.updateEmailAutomation`.
 *
 * All fields are optional — only the fields you include are changed.
 * The client fetches the existing record, merges your changes over it, and
 * writes the complete merged body back to the API.
 *
 * @example
 * ```typescript
 * // Pause an automation
 * await client.automations.updateEmailAutomation(automationId, { active: false });
 *
 * // Change the trigger
 * await client.automations.updateEmailAutomation(automationId, {
 *   trigger: { type: 'SEGMENT', id: segmentId },
 * });
 * ```
 */
export interface UpdateEmailAutomationPayload {
  /** New name. */
  name?: string;
  /**
   * New active state.
   *
   * `false` pauses the automation without deleting it.
   */
  active?: boolean;
  /**
   * New trigger configuration.
   *
   * `type` must be uppercase.
   */
  trigger?: AutomationTrigger;
  /**
   * New sendout type.
   *
   * `'marketing'` = standard marketing email.
   * `'transactional'` = triggered transactional email.
   */
  sendoutType?: AutomationSendoutType;
}

/**
 * Payload for `AutomationsClient.updateSmsAutomation`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.automations.updateSmsAutomation(automationId, { active: false });
 * ```
 */
export type UpdateSmsAutomationPayload = UpdateEmailAutomationPayload;

// ── List params ───────────────────────────────────────────────────────────────

/**
 * Parameters for `AutomationsClient.listAutomations` and the
 * auto-pagination helpers (`AutomationsClient.iterateAutomations`,
 * `AutomationsClient.iterateAutomationsPages`,
 * `AutomationsClient.listAllAutomations`).
 *
 * @example
 * ```typescript
 * // List active email automations
 * const page = await client.automations.listAutomations({
 *   filters: { active: true, messageType: 'email' },
 *   pagination: { page: 1, pageSize: 20 },
 * });
 * ```
 */
export interface ListAutomationsParams {
  pagination?: PagePaginationParams;
  filters?: {
    /** Filter to only active or only inactive automations. */
    active?: boolean;
    /**
     * Filter by message type.
     *
     * `'email'` = email automations, `'text_message'` = SMS automations.
     */
    messageType?: 'email' | 'text_message';
    /** Full-text search by automation name. */
    query?: string;
  };
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format trigger object.
 * @internal
 */
export interface AutomationTriggerWire {
  type: 'TAG' | 'SEGMENT';
  id: number;
  name?: string;
}

/**
 * Wire-format automation entity from the v3 `/editor/automail` endpoint.
 * @internal
 */
export interface AutomationWire {
  id?: number;
  name: string;
  description?: string;
  active?: boolean;
  trigger?: AutomationTriggerWire | null;
  sendout_type?: {
    value: number;
    key: string;
    description: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Wire body for POST `/editor/automail`.
 * @internal
 */
export interface CreateAutomationBody {
  name: string;
  description?: string;
  trigger?: AutomationTriggerWire;
  sendout_type?: number;
  /** `1` = email, `2` = SMS. Omit to default to email. */
  message_type?: 1 | 2;
}

/**
 * Wire body for PUT `/editor/automail/:id`.
 *
 * All four fields are required by the API for a complete PUT.
 * @internal
 */
export interface UpdateAutomationBody {
  name: string;
  active: boolean;
  trigger: AutomationTriggerWire;
  sendout_type: number;
}

/**
 * Wire response from GET/POST `/editor/automail` (single automation).
 * @internal
 */
export interface AutomationResponse extends RuleApiResponse {
  data?: AutomationWire;
}

/**
 * Wire response from GET `/editor/automail` (list).
 * @internal
 */
export interface AutomationListResponse extends RuleApiResponse {
  data?: AutomationWire[];
}
