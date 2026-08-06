/**
 * Message types for the `@rule/client` messages namespace.
 *
 * The Rule.io API models an email as three connected layers:
 *
 * ```
 * Dispatcher (campaign or automation)
 *   └── Message  (subject, sender)
 *         └── Dynamic Set
 *               └── Template  (RCML email body)
 * ```
 *
 * A message belongs to exactly one dispatcher. The message type (`1` = email,
 * `2` = SMS) and dispatcher type together determine which fields are
 * meaningful. Use the type-and-dispatcher-specific payload interfaces rather
 * than the generic `Message` base type when creating or updating messages.
 */

import type { RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Base entity ───────────────────────────────────────────────────────────────

/**
 * Dispatcher reference embedded in a message response.
 *
 * Identifies which campaign or automation the message belongs to.
 */
export interface MessageDispatcher {
  /** Dispatcher ID. */
  id: number;
  /**
   * Dispatcher type code.
   *
   * `1` = campaign. Additional values may be added as the API evolves.
   */
  type: number;
}

/**
 * A message entity as returned by the API.
 *
 * This is the base return type for all message methods. For dispatcher- and
 * message-type-specific call sites, prefer the named aliases
 * (`EmailCampaignMessage`, `EmailAutomationMessage`) which make
 * the method signature self-documenting.
 *
 * Properties use camelCase; the wire format is normalised by the SDK.
 */
export interface Message {
  /**
   * Message ID.
   *
   * Optional because the API may omit it in partial responses.
   */
  id?: number;
  /** Email subject line shown to recipients. */
  subject: string;
  /** Short preview text displayed in inbox previews (the preheader). */
  preheader?: string | null;
  /** Display name of the sender (e.g. `"Jane from Acme"`). */
  fromName?: string | null;
  /** Sending email address (e.g. `"jane@acme.com"`). */
  fromEmail?: string | null;
  /** UTM campaign parameter appended to tracked links in the email. */
  utmCampaign?: string | null;
  /** UTM term parameter appended to tracked links in the email. */
  utmTerm?: string | null;
  /**
   * Message type code.
   *
   * `1` = email, `2` = SMS. Present in responses from the v3 API.
   */
  messageType?: number;
  /**
   * Dispatcher this message belongs to.
   *
   * Present in responses from the v3 API.
   */
  dispatcher?: MessageDispatcher;
  /** ISO 8601 timestamp of when the message was created. */
  createdAt?: string;
  /** ISO 8601 timestamp of when the message was last updated. */
  updatedAt?: string;
  /**
   * Automail delivery state, present only on automation messages.
   *
   * A discriminated union on `type`: `"delay"` carries a `delayInSeconds`
   * value; `"custom"` indicates segment-driven delivery configured in the
   * Rule.io UI and does not carry a delay. Campaign messages omit this field.
   */
  automailSetting?: AutomailSettingRead;
}

/**
 * A message belonging to an email campaign.
 *
 * Structurally identical to `Message`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const message: EmailCampaignMessage =
 *   await client.messages.createEmailCampaignMessage(campaignId, { ... });
 * ```
 */
export type EmailCampaignMessage = Message;

/**
 * A message belonging to an email automation.
 *
 * Structurally identical to `Message`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const message: EmailAutomationMessage =
 *   await client.messages.createEmailAutomationMessage(automationId, { ... });
 * ```
 */
export type EmailAutomationMessage = Message;

/**
 * A message belonging to an SMS campaign.
 *
 * Structurally identical to `Message`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const message: SmsCampaignMessage =
 *   await client.messages.createSmsCampaignMessage(campaignId, { ... });
 * ```
 */
export type SmsCampaignMessage = Message;

/**
 * A message belonging to an SMS automation.
 *
 * Structurally identical to `Message`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const message: SmsAutomationMessage =
 *   await client.messages.createSmsAutomationMessage(automationId, { ... });
 * ```
 */
export type SmsAutomationMessage = Message;

// ── Supporting types ──────────────────────────────────────────────────────────

/**
 * Automail delivery settings attached to an automation message.
 *
 * Controls when the automation fires relative to its trigger event.
 */
export interface AutomailSetting {
  /**
   * Whether this automation message is active.
   *
   * Set to `false` to pause the automation without deleting it.
   */
  active: boolean;
  /**
   * Delay between the trigger event and the send, expressed in seconds.
   *
   * Pass `"0"` for immediate delivery. The API only supports simple delays
   * via the API; custom delay logic requires the Rule.io UI.
   *
   * The SDK accepts a string to avoid precision loss on large values and
   * converts to an integer before sending to the API.
   */
  delayInSeconds: string;
}

/**
 * Automail delivery state as returned by the API on automation messages.
 *
 * Discriminated union on `type`. `AutomailSetting` (used for write payloads)
 * is the flat shape the API accepts on create/update; on read, the API
 * projects it into this union depending on how the automation is configured.
 *
 * - `"delay"` — trigger-relative delay in seconds. Carries `delayInSeconds`
 *   (`"0"` for immediate delivery).
 * - `"custom"` — segment-driven delivery configured in the Rule.io UI.
 *   Carries no delay because timing is determined by segment membership.
 */
export type AutomailSettingRead =
  | {
      /** Trigger-relative delay. */
      type: 'delay';
      /** Whether this automation message is active. */
      active: boolean;
      /**
       * Delay between the trigger event and the send, expressed in seconds.
       *
       * `"0"` means the message is sent as soon as the trigger fires. Returned
       * as a string to match the SDK's write-side `AutomailSetting` shape.
       */
      delayInSeconds: string;
    }
  | {
      /** Segment-driven delivery configured in the Rule.io UI. */
      type: 'custom';
      /** Whether this automation message is active. */
      active: boolean;
    };

// ── Create payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `MessagesClient.createEmailCampaignMessage`.
 *
 * Provides the subject, sender details, and optional tracking parameters for
 * an email message attached to a campaign. The campaign ID is passed as a
 * separate argument.
 *
 * All fields except `subject` are optional — the API uses account-level
 * defaults when omitted.
 *
 * @example
 * ```typescript
 * await client.messages.createEmailCampaignMessage(campaignId, {
 *   subject: 'Your order is on its way',
 *   fromName: 'Jane from Acme',
 *   fromEmail: 'jane@acme.com',
 * });
 * ```
 */
export interface CreateEmailCampaignMessagePayload {
  /** Email subject line shown to recipients. Required. */
  subject: string;
  /** Short preview text shown in inbox previews. */
  preheader?: string | null;
  /** Display name of the sender (e.g. `"Jane from Acme"`). */
  fromName?: string | null;
  /** From address (e.g. `"jane@acme.com"`). */
  fromEmail?: string | null;
  /** UTM campaign parameter appended to tracked links. */
  utmCampaign?: string | null;
  /** UTM term parameter appended to tracked links. */
  utmTerm?: string | null;
}

/**
 * Payload for `MessagesClient.createEmailAutomationMessage`.
 *
 * Extends the campaign message payload with `automailSetting` which controls
 * when the automation fires and whether it is active. The automation ID is
 * passed as a separate argument.
 *
 * All fields except `subject` are optional — the API uses account-level
 * defaults when omitted.
 *
 * @example
 * ```typescript
 * await client.messages.createEmailAutomationMessage(automationId, {
 *   subject: 'Welcome to Acme!',
 *   fromName: 'Jane from Acme',
 *   fromEmail: 'jane@acme.com',
 *   automailSetting: { active: true, delayInSeconds: '0' },
 * });
 * ```
 */
export interface CreateEmailAutomationMessagePayload {
  /** Email subject line shown to recipients. Required. */
  subject: string;
  /** Short preview text shown in inbox previews. */
  preheader?: string | null;
  /** Display name of the sender (e.g. `"Jane from Acme"`). */
  fromName?: string | null;
  /** From address (e.g. `"jane@acme.com"`). */
  fromEmail?: string | null;
  /** UTM campaign parameter appended to tracked links. */
  utmCampaign?: string | null;
  /** UTM term parameter appended to tracked links. */
  utmTerm?: string | null;
  /**
   * Automail delivery settings for this message.
   *
   * Omitting this field leaves the setting unchanged on update, or uses the
   * API default (active, no delay) on create.
   */
  automailSetting?: AutomailSetting;
}

/**
 * Payload for `MessagesClient.createSmsCampaignMessage`.
 *
 * SMS messages do not have sender, preheader, or from-email fields. All fields
 * are optional — the API applies account-level defaults when omitted.
 *
 * @example
 * ```typescript
 * await client.messages.createSmsCampaignMessage(campaignId, {
 *   utmCampaign: 'spring-sale',
 * });
 * ```
 */
export interface CreateSmsCampaignMessagePayload {
  /** UTM campaign parameter appended to tracked links. */
  utmCampaign?: string | null;
  /** UTM term parameter appended to tracked links. */
  utmTerm?: string | null;
}

/**
 * Payload for `MessagesClient.createSmsAutomationMessage`.
 *
 * SMS messages do not have sender, preheader, or from-email fields. All fields
 * are optional — the API applies account-level defaults when omitted.
 *
 * @example
 * ```typescript
 * await client.messages.createSmsAutomationMessage(automationId, {
 *   utmCampaign: 'welcome-flow',
 *   automailSetting: { active: true, delayInSeconds: '0' },
 * });
 * ```
 */
export interface CreateSmsAutomationMessagePayload {
  /** UTM campaign parameter appended to tracked links. */
  utmCampaign?: string | null;
  /** UTM term parameter appended to tracked links. */
  utmTerm?: string | null;
  /**
   * Automail delivery settings for this message.
   *
   * Omitting this field leaves the setting unchanged on update, or uses the
   * API default (active, no delay) on create.
   */
  automailSetting?: AutomailSetting;
}

// ── Update payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `MessagesClient.updateEmailCampaignMessage`.
 *
 * All fields are optional — only the fields you include are changed. Campaign
 * messages do not have automail delivery settings; use
 * `UpdateEmailAutomationMessagePayload` for automation messages.
 *
 * @example
 * ```typescript
 * await client.messages.updateEmailCampaignMessage(messageId, {
 *   subject: 'Updated: Your order is on its way',
 * });
 * ```
 */
export interface UpdateEmailCampaignMessagePayload {
  /** New subject line. */
  subject?: string;
  /** New preheader text. Pass `null` to clear. */
  preheader?: string | null;
  /** New sender display name. Pass `null` to clear. */
  fromName?: string | null;
  /** New from address. Pass `null` to clear. */
  fromEmail?: string | null;
  /** New UTM campaign parameter. Pass `null` to clear. */
  utmCampaign?: string | null;
  /** New UTM term parameter. Pass `null` to clear. */
  utmTerm?: string | null;
}

/**
 * Payload for `MessagesClient.updateEmailAutomationMessage`.
 *
 * All fields are optional — only the fields you include are changed.
 * Automation messages additionally support updating the automail delivery
 * settings via `automailSetting`. Use `UpdateEmailCampaignMessagePayload`
 * for campaign messages.
 *
 * @example
 * ```typescript
 * await client.messages.updateEmailAutomationMessage(messageId, {
 *   subject: 'Welcome — updated copy',
 *   automailSetting: { active: true, delayInSeconds: '3600' },
 * });
 * ```
 */
export interface UpdateEmailAutomationMessagePayload {
  /** New subject line. */
  subject?: string;
  /** New preheader text. Pass `null` to clear. */
  preheader?: string | null;
  /** New sender display name. Pass `null` to clear. */
  fromName?: string | null;
  /** New from address. Pass `null` to clear. */
  fromEmail?: string | null;
  /** New UTM campaign parameter. Pass `null` to clear. */
  utmCampaign?: string | null;
  /** New UTM term parameter. Pass `null` to clear. */
  utmTerm?: string | null;
  /** New automail delivery settings. Omit to leave unchanged. */
  automailSetting?: AutomailSetting;
}

/**
 * Payload for `MessagesClient.updateSmsCampaignMessage`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.messages.updateSmsCampaignMessage(messageId, {
 *   utmCampaign: 'spring-sale',
 * });
 * ```
 */
export interface UpdateSmsCampaignMessagePayload {
  /** New UTM campaign parameter. Pass `null` to clear. */
  utmCampaign?: string | null;
  /** New UTM term parameter. Pass `null` to clear. */
  utmTerm?: string | null;
}

/**
 * Payload for `MessagesClient.updateSmsAutomationMessage`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.messages.updateSmsAutomationMessage(messageId, {
 *   automailSetting: { active: true, delayInSeconds: '3600' },
 * });
 * ```
 */
export interface UpdateSmsAutomationMessagePayload {
  /** New UTM campaign parameter. Pass `null` to clear. */
  utmCampaign?: string | null;
  /** New UTM term parameter. Pass `null` to clear. */
  utmTerm?: string | null;
  /** New automail delivery settings. Omit to leave unchanged. */
  automailSetting?: AutomailSetting;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format sender object used in both request bodies and response entities.
 * @internal
 */
export interface MessageSenderWire {
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
}

/**
 * Wire-format message entity from the v3 `/editor/message` endpoint.
 * @internal
 */
export interface MessageWire {
  id?: number;
  type?: number;
  subject: string;
  pre_header?: string | null;
  sender?: MessageSenderWire;
  utm_campaign?: string | null;
  utm_term?: string | null;
  dispatcher?: { id: number; type: number };
  created_at?: string;
  updated_at?: string;
  /** Present only on automation messages; omitted for campaigns. */
  automail_setting?: AutomailSettingReadWire;
}

/**
 * Wire-format automail setting accepted by create/update request bodies.
 *
 * `delay_in_seconds` is an integer on the wire (the SDK public API uses a
 * string; the mapper converts with `parseInt`). This is the flat shape the
 * v3 API expects on write; on read the API returns a discriminated union,
 * modelled separately by `AutomailSettingReadWire`.
 * @internal
 */
export interface AutomailSettingWriteWire {
  active: boolean;
  delay_in_seconds: number;
}

/**
 * Wire-format automail setting returned by GET `/editor/message/:id`.
 *
 * Discriminated union on `type`. For `"delay"` the response carries an
 * integer `delay` (seconds since the trigger, `0` for immediate delivery).
 * For `"custom"` the delay field is absent because delivery is driven by a
 * segment configured in the Rule.io UI.
 * @internal
 */
export type AutomailSettingReadWire =
  | { type: 'delay'; active: boolean; delay: number }
  | { type: 'custom'; active: boolean };

/**
 * Wire body for POST `/editor/message`.
 * @internal
 */
export interface CreateMessageBody {
  dispatcher: { id: number; type: 'campaign' | 'automail' };
  /** `1` = email, `2` = SMS. */
  type: 1 | 2;
  /** Required for email; omitted for SMS (the API sets a default). */
  subject?: string;
  pre_header?: string | null;
  sender?: MessageSenderWire;
  utm_campaign?: string | null;
  utm_term?: string | null;
  automail_setting?: AutomailSettingWriteWire;
}

/**
 * Wire body for PUT `/editor/message/:id`.
 * @internal
 */
export interface UpdateMessageBody {
  subject?: string;
  pre_header?: string | null;
  sender?: MessageSenderWire;
  utm_campaign?: string | null;
  utm_term?: string | null;
  automail_setting?: AutomailSettingWriteWire;
}

/**
 * Wire response from GET/POST `/editor/message`.
 * @internal
 */
export interface MessageResponse extends RuleApiResponse {
  data: MessageWire;
}

/**
 * Wire response from GET `/editor/message?id=&dispatcher_type=`.
 * @internal
 */
export interface MessageListResponse extends RuleApiResponse {
  data: MessageWire[];
}
