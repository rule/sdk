/**
 * Template types for the `@rule/client` templates namespace.
 *
 * A template holds the RCML email body. It belongs to a message via a
 * dynamic set:
 *
 * ```
 * Message
 *   └── Dynamic Set
 *         └── Template  (RCML document)
 * ```
 *
 * Templates are message-type-scoped (`email` or `text_message`) but are
 * otherwise reusable — you can attach the same template to multiple messages
 * by creating additional dynamic sets.
 */

import type { RcmlDocument, SmsDocument } from '@rule/rcml';

import type { PagePaginationParams, RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Entity ────────────────────────────────────────────────────────────────────

/**
 * A template entity as returned by the API.
 *
 * The wire format stores the RCML body in a field called `template`; the
 * SDK renames it to `content` to avoid shadowing the outer type name and to
 * match the semantic ("this is the content of the template").
 */
export interface Template {
  /** Template ID. */
  id: number;
  /** Human-readable template name shown in the Rule.io UI. */
  name: string;
  /**
   * The template body document.
   *
   * For email templates this is an `RcmlDocument`; for SMS templates this is
   * an `SmsDocument`. Mapped from the wire's `template` field. Optional
   * because the API may omit the template body in some list responses.
   *
   * The type is the union `RcmlDocument | SmsDocument`. `messageType` is
   * typed as a plain `string` rather than a discriminator, so TypeScript
   * does not narrow `content` automatically — callers that need a
   * specific shape should narrow manually:
   *
   * ```typescript
   * if (template.messageType === 'email') {
   *   const rcml = template.content as RcmlDocument | undefined;
   * } else if (template.messageType === 'text_message') {
   *   const sms = template.content as SmsDocument | undefined;
   * }
   * ```
   */
  content?: RcmlDocument | SmsDocument;
  /**
   * Message type this template was created for.
   *
   * `'email'` for email templates, `'text_message'` for SMS templates.
   * Typed as `string` (not a literal union) so adding a new server-side
   * value does not break consumers; narrow `content` manually based on
   * the value you care about.
   */
  messageType: string;
  /** ISO 8601 timestamp of when the template was created. */
  createdAt: string;
  /** ISO 8601 timestamp of when the template was last updated. */
  updatedAt: string;
}

/**
 * An email template (messageType = `'email'`).
 *
 * Structurally identical to `Template`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const template: EmailTemplate =
 *   await client.templates.createEmailTemplate({ ... });
 * ```
 */
export type EmailTemplate = Template;

/**
 * An SMS template (messageType = `'text_message'`).
 *
 * Structurally identical to `Template`; the named alias makes method
 * signatures and variable declarations self-documenting at the call site.
 *
 * @example
 * ```typescript
 * const template: SmsTemplate =
 *   await client.templates.createSmsTemplate({ ... });
 * ```
 */
export type SmsTemplate = Template;

// ── Create payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `TemplatesClient.createEmailTemplate`.
 *
 * The message type is fixed to `'email'` by the method — do not include it
 * here. The `name` defaults to `"Template - <timestamp>"` server-side if
 * omitted, but providing a meaningful name is strongly recommended to avoid
 * collisions when multiple templates are created in the same second.
 *
 * @example
 * ```typescript
 * import { buildRcmlDocument } from '@rule/rcml';
 *
 * const template = await client.templates.createEmailTemplate({
 *   name: 'Welcome email — v1',
 *   content: buildRcmlDocument({ ... }),
 * });
 * ```
 */
export interface CreateEmailTemplatePayload {
  /**
   * Human-readable name for the template.
   *
   * Must be unique within the account. Append a timestamp (e.g.
   * `${name} - ${Date.now()}`) when creating programmatically to avoid
   * conflicts.
   */
  name: string;
  /** The RCML document defining the email template body. */
  content: RcmlDocument;
}

/**
 * Payload for `TemplatesClient.createSmsTemplate`.
 *
 * The message type is fixed to `'text_message'` by the method. Construct the
 * `content` document with `createSmsDocument` from `@rule/rcml`.
 *
 * @example
 * ```typescript
 * import { createSmsDocument } from '@rule/rcml';
 *
 * const template = await client.templates.createSmsTemplate({
 *   name: 'Order shipped SMS',
 *   content: createSmsDocument({ content: 'Your order has shipped!' }),
 * });
 * ```
 */
export interface CreateSmsTemplatePayload {
  /**
   * Human-readable name for the template.
   *
   * When omitted the API assigns a default name automatically.
   */
  name?: string;
  /** The SMS document defining the template body. */
  content: SmsDocument;
}

// ── Update payloads ───────────────────────────────────────────────────────────

/**
 * Payload for `TemplatesClient.updateEmailTemplate`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.templates.updateEmailTemplate(templateId, {
 *   name: 'Welcome email — v2',
 *   content: updatedRcmlDocument,
 * });
 * ```
 */
export interface UpdateEmailTemplatePayload {
  /** New name for the template. */
  name?: string;
  /** New RCML document body. */
  content?: RcmlDocument;
}

/**
 * Payload for `TemplatesClient.updateSmsTemplate`.
 *
 * All fields are optional — only the fields you include are changed.
 *
 * @example
 * ```typescript
 * import { createSmsDocument } from '@rule/rcml';
 *
 * await client.templates.updateSmsTemplate(templateId, {
 *   content: createSmsDocument({ content: 'Your order has shipped — updated!' }),
 * });
 * ```
 */
export interface UpdateSmsTemplatePayload {
  /** New name for the template. */
  name?: string;
  /** New SMS document body. */
  content?: SmsDocument;
}

// ── List params ───────────────────────────────────────────────────────────────

/**
 * Parameters for `TemplatesClient.listTemplates` and the auto-pagination
 * helpers (`TemplatesClient.iterateTemplates`,
 * `TemplatesClient.iterateTemplatesPages`,
 * `TemplatesClient.listAllTemplates`).
 *
 * The API supports up to 100 templates per page (`pageSize` ≤ 100, default 15).
 *
 * @example
 * ```typescript
 * const page = await client.templates.listTemplates({ pagination: { page: 1, pageSize: 50 } });
 * ```
 */
export interface ListTemplatesParams {
  pagination?: PagePaginationParams;
}

// ── Render params ─────────────────────────────────────────────────────────────

/**
 * Parameters for `TemplatesClient.render`.
 *
 * @example
 * ```typescript
 * // Render without subscriber context (merge tags shown as placeholders)
 * const html = await client.templates.render(templateId);
 *
 * // Render with a subscriber's data substituted into merge tags
 * const personalized = await client.templates.render(templateId, { subscriberId: 42 });
 * ```
 */
export interface RenderTemplateParams {
  /**
   * Subscriber ID to use for merge tag substitution.
   *
   * When provided, the rendered output replaces merge tag placeholders
   * (e.g. `\{\{Booking.FirstName\}\}`) with the subscriber's actual field values.
   * Omit to render with placeholder text instead.
   */
  subscriberId?: number;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format template entity from the v3 `/editor/template` endpoint.
 * @internal
 */
export interface TemplateWire {
  id: number;
  name: string;
  message_type: string;
  /** The template body document. Mapped to `content` on the public `Template` entity. */
  template?: RcmlDocument | SmsDocument;
  created_at: string;
  updated_at: string;
}

/**
 * Wire body for POST `/editor/template`.
 *
 * Note: `message_id` is NOT sent here — templates are linked to messages via
 * dynamic sets, not directly. The API `TemplateRequest` schema contains only
 * `name`, `message_type`, and `template`.
 * @internal
 */
export interface CreateTemplateBody {
  name?: string;
  message_type: 'email' | 'text_message';
  template: RcmlDocument | SmsDocument;
}

/**
 * Wire body for PUT `/editor/template/:id`.
 * @internal
 */
export interface UpdateTemplateBody {
  name?: string;
  message_type?: 'email' | 'text_message';
  template?: RcmlDocument | SmsDocument;
}

/**
 * Wire response from GET/POST `/editor/template` (single template).
 * @internal
 */
export interface TemplateResponse extends RuleApiResponse {
  data: TemplateWire;
}

/**
 * Wire response from GET `/editor/template` (list).
 * @internal
 */
export interface TemplateListResponse extends RuleApiResponse {
  data: TemplateWire[];
}
