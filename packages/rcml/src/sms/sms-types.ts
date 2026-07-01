/**
 * Public API: SMS RCML document type.
 *
 * An SMS document is a single leaf node (`rc-sms`) whose `content` field holds
 * the message body as a structured {@link SmsContentJson} document. The node
 * shape follows the `RcmlAstLeafNode` convention used by the Rule.io editor:
 *
 * ```
 * {
 *   tagName: 'rc-sms',
 *   attributes: {},
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
 * Conforms to the `RcmlAstLeafNode` shape used by the Rule.io SMS editor.
 * Pass this type wherever the API accepts an SMS template body. Construct
 * one with {@link createSmsDocument}.
 *
 * @public
 */
export interface SmsDocument {
  /** Optional node ID (UUID). */
  id?: string
  tagName: 'rc-sms'
  /** Always empty — the `rc-sms` node declares no attributes. */
  attributes: Record<string, never>
  /** SMS message body as structured content JSON. */
  content: SmsContentJson
}
