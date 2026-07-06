/**
 * Dynamic-set types for the `@rule/client` dynamic-sets namespace.
 *
 * A dynamic set connects a template to a message. It sits in the middle of
 * the email chain:
 *
 * ```
 * Message
 *   └── Dynamic Set  ← links message to template
 *         └── Template  (RCML document)
 * ```
 *
 * A message can have multiple dynamic sets — one per trigger (tag or segment).
 * Only one dynamic set per trigger can be active at a time; activating a second
 * one with the same trigger automatically deactivates the first.
 *
 * A "Default" dynamic set (no trigger) is the fallback sent to all subscribers
 * not matched by any trigger-specific variant.
 */

import type { RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Supporting types ──────────────────────────────────────────────────────────

/**
 * Sender override on a dynamic set.
 *
 * When present, overrides the sender settings from the parent message for
 * this dynamic set's audience.
 */
export interface DynamicSetSender {
  /** Sender email address. */
  email?: string | null;
  /** Sender phone number (e.g. `'+380501235487'`). */
  phone?: string | null;
  /** Sender display name. */
  name?: string | null;
}

/**
 * Trigger that activates a dynamic set for a specific tag or segment.
 *
 * Only one active dynamic set per trigger is allowed. Creating a second active
 * dynamic set with the same trigger automatically deactivates the first.
 */
export interface DynamicSetTrigger {
  /** Tag or segment ID that activates this dynamic set. */
  id: number;
  /**
   * Trigger type.
   *
   * Must be uppercase: `'TAG'` or `'SEGMENT'`.
   */
  type: 'TAG' | 'SEGMENT';
}

// ── Entity ────────────────────────────────────────────────────────────────────

/**
 * A dynamic set entity as returned by the API.
 *
 * Dynamic sets are returned with camelCase fields; the SDK normalises from the
 * wire's snake_case format.
 */
export interface DynamicSet {
  /** Dynamic set ID. */
  id: number;
  /**
   * Internal name for the dynamic set.
   *
   * Defaults to the trigger name (or `'Default'` for trigger-less sets) unless
   * explicitly provided at creation time.
   */
  name: string;
  /**
   * ID of the template attached to this dynamic set.
   *
   * `null` when no template has been attached yet.
   */
  templateId?: number | null;
  /**
   * Email subject override for this dynamic set.
   *
   * When present, overrides the subject from the parent message.
   */
  subject?: string | null;
  /**
   * Preheader override for this dynamic set.
   *
   * When present, overrides the preheader from the parent message.
   */
  preHeader?: string | null;
  /** UTM campaign parameter override. */
  utmCampaign?: string | null;
  /** UTM term parameter override. */
  utmTerm?: string | null;
  /** Sender override for this dynamic set's audience. */
  sender?: DynamicSetSender;
  /**
   * Trigger that activates this dynamic set.
   *
   * `null` for the "Default" dynamic set, which is the fallback for
   * subscribers not matched by any trigger-specific variant.
   */
  trigger?: DynamicSetTrigger | null;
  /**
   * Whether this dynamic set is active.
   *
   * Only one active dynamic set per trigger is allowed. Setting `active: true`
   * on a dynamic set with a duplicate trigger deactivates the existing one.
   */
  active: boolean;
  /** Position (ordering) within the message's dynamic set list. Minimum 1. */
  position: number;
  /** ISO 8601 timestamp of when the dynamic set was created. */
  createdAt: string;
  /** ISO 8601 timestamp of when the dynamic set was last updated. */
  updatedAt: string;
}

// ── Create payload ────────────────────────────────────────────────────────────

/**
 * Payload for `DynamicSetsClient.create`.
 *
 * At minimum, provide `messageId` to attach the dynamic set to a message.
 * Provide `templateId` to immediately link a template. Omit `trigger` to
 * create a "Default" dynamic set (the fallback for all subscribers).
 *
 * @example
 * ```typescript
 * const ds = await client.dynamicSets.create({
 *   messageId,
 *   templateId,
 * });
 * ```
 */
export interface CreateDynamicSetPayload {
  /** ID of the message this dynamic set belongs to. Required. */
  messageId: number;
  /**
   * ID of the template to attach.
   *
   * Can be set later via `DynamicSetsClient.update`.
   */
  templateId?: number | null;
  /** Name for the dynamic set. Defaults to the trigger name or `'Default'`. */
  name?: string;
  /** Subject override. */
  subject?: string | null;
  /** Preheader override. */
  preHeader?: string | null;
  /** UTM campaign override. */
  utmCampaign?: string | null;
  /** UTM term override. */
  utmTerm?: string | null;
  /** Sender override. */
  sender?: DynamicSetSender;
  /**
   * Trigger for this dynamic set.
   *
   * Omit to create a "Default" dynamic set.
   */
  trigger?: DynamicSetTrigger | null;
  /** Whether this dynamic set should be active immediately. Defaults to `true`. */
  active?: boolean;
}

// ── Update payload ────────────────────────────────────────────────────────────

/**
 * Payload for `DynamicSetsClient.update`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * // Swap in a different template
 * await client.dynamicSets.update(dynamicSetId, { templateId: newTemplateId });
 *
 * // Change the trigger
 * await client.dynamicSets.update(dynamicSetId, {
 *   trigger: { type: 'TAG', id: tagId },
 * });
 * ```
 */
export interface UpdateDynamicSetPayload {
  /** New template to attach. */
  templateId?: number | null;
  /** New name. */
  name?: string;
  /** New subject override. */
  subject?: string | null;
  /** New preheader override. */
  preHeader?: string | null;
  /** New UTM campaign override. */
  utmCampaign?: string | null;
  /** New UTM term override. */
  utmTerm?: string | null;
  /** New sender override. */
  sender?: DynamicSetSender;
  /** New trigger. Pass `null` to convert to a "Default" dynamic set. */
  trigger?: DynamicSetTrigger | null;
  /** Change the active state. */
  active?: boolean;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format sender object.
 * @internal
 */
export interface DynamicSetSenderWire {
  email?: string | null;
  phone_number?: string | null;
  name?: string | null;
}

/**
 * Wire-format trigger object.
 * @internal
 */
export interface DynamicSetTriggerWire {
  id: number;
  type: 'TAG' | 'SEGMENT';
}

/**
 * Wire-format dynamic set entity from the v3 `/editor/dynamic-set` endpoint.
 * @internal
 */
export interface DynamicSetWire {
  id: number;
  name: string;
  template_id?: number | null;
  subject?: string | null;
  pre_header?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  sender?: DynamicSetSenderWire;
  trigger?: DynamicSetTriggerWire | null;
  active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

/**
 * Wire body for POST `/editor/dynamic-set`.
 * @internal
 */
export interface CreateDynamicSetBody {
  message_id: number;
  template_id?: number | null;
  name?: string;
  subject?: string | null;
  pre_header?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  sender?: DynamicSetSenderWire;
  trigger?: DynamicSetTriggerWire | null;
  active?: boolean;
}

/**
 * Wire body for PUT `/editor/dynamic-set/:id`.
 * @internal
 */
export interface UpdateDynamicSetBody {
  template_id?: number | null;
  name?: string;
  subject?: string | null;
  pre_header?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  sender?: DynamicSetSenderWire;
  trigger?: DynamicSetTriggerWire | null;
  active?: boolean;
}

/**
 * Wire response from GET/POST `/editor/dynamic-set` (single entity).
 * @internal
 */
export interface DynamicSetResponse extends RuleApiResponse {
  data: DynamicSetWire;
}

/**
 * Wire response from GET `/editor/dynamic-set?message_id=` (list).
 * @internal
 */
export interface DynamicSetListResponse extends RuleApiResponse {
  data: DynamicSetWire[];
}
