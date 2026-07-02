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
 * - `link` nodes → `:link[url]{href="url" track="..." shorten="..."}`
 * - `placeholder` nodes with a resolved value or `max-length` → `::placeholder{...}` directive form
 * - `placeholder` nodes with null value and absent/null `max-length` → compact `[Type:Name]` form
 *
 * @param json - Typed SMS content JSON (`{ type: 'sms', content: [...] }`).
 * @returns SMS RFM string.
 *
 * @example
 * ```ts
 * const json = smsRfmToJson('Account: [Subscriber:email]')
 * const rfm = jsonToSmsRfm(json)
 * // rfm === 'Account: [Subscriber:email]'
 * ```
 * @public
 */
export function jsonToSmsRfm(json: SmsContentJson): string {
  return serializeSmsJson(json)
}
