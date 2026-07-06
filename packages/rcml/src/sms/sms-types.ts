/**
 * Public API: SMS RCML document type.
 *
 * An SMS document is a single leaf node (`rc-sms`) whose `content` field holds
 * the message body as a structured {@link SmsContentJson} document:
 *
 * ```
 * {
 *   tagName: 'rc-sms',
 *   content: { type: 'sms', content: [...] }
 * }
 * ```
 *
 * Construct an {@link SmsDocument} with {@link createSmsDocument}.
 */

import type { SmsContentJson } from './content/json-validator/types.js'

export type { SmsContentJson }

/**
 * Root (and only) node of an SMS RCML document.
 *
 * Pass this type wherever the API accepts an SMS template body. Construct
 * one with {@link createSmsDocument}.
 *
 * @public
 */
export interface SmsDocument {
  /**
   * Document identifier (UUID). Generated automatically by {@link createSmsDocument}
   * and the XML parser. Required by {@link validateSmsDocument} — a missing or
   * malformed value yields `ID_INVALID`. Always construct documents with
   * {@link createSmsDocument}, which fills in a valid UUID. Client methods also
   * auto-inject a UUID before sending, so a hand-assembled document without an
   * `id` will pass the API but will fail local validation until one is added.
   */
  id?: string
  tagName: 'rc-sms'
  /** SMS message body as structured content JSON. */
  content: SmsContentJson
}
