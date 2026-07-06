/**
 * Public API: SMS content JSON → SMS RFM string conversion.
 */

import { serializeSmsJson } from './content/serializer/serialize.js'
import type { SmsContentJson } from './content/json-validator/types.js'

/**
 * Convert an {@link SmsContentJson} document back to an SMS RFM string.
 *
 * Reverse of {@link smsRfmToJson}. Serialization rules:
 * - `message` nodes → text verbatim (embedded `\n` stays as-is)
 * - `link` nodes → `:link[url]{track="..." shorten="..."}`
 * - `placeholder` nodes → `::placeholder{type="..." original="..." name="..." ...}` directive form
 * - the two-node unsubscribe footer (`is-unsubscribe: true` on both) → `::unsubscribe`
 *
 * @param json - Typed SMS content JSON (`{ type: 'sms', content: [...] }`).
 * @returns SMS RFM string.
 *
 * @example
 * ```ts
 * const json = smsRfmToJson('Account: [Subscriber:email]')
 * const rfm = jsonToSmsRfm(json)
 * // rfm === 'Account: ::placeholder{type="Subscriber" original="[Subscriber:email]" name="email"}'
 * ```
 * @public
 */
export function jsonToSmsRfm(json: SmsContentJson): string {
  return serializeSmsJson(json)
}
