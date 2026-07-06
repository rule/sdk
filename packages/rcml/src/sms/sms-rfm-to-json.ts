/**
 * Public API: SMS RFM string → SMS content JSON conversion.
 */

import { parseSmsRfm } from './content/parser/parse.js'
import type { SmsContentJson } from './content/json-validator/types.js'

/**
 * Convert an SMS RFM string into an {@link SmsContentJson} document.
 *
 * SMS RFM uses markdown-directive syntax:
 * - `:link[url]{track="true|false" shorten="true|false"}` → top-level `link` node
 * - `::placeholder{type="..." original="..." name="..." value="..." max-length="..."}` → `placeholder` node
 * - `[Type:Name]` shorthand (e.g. `[Subscriber:email]`) — backward-compatible alias for `::placeholder{...}`
 * - Plain text (including embedded `\n`) → `message` node
 *
 * Throws `RcmlValidationError` if the input contains unsupported constructs.
 *
 * @param input - SMS RFM source string.
 * @returns Typed SMS content JSON (`{ type: 'sms', content: [...] }`).
 *
 * @example
 * ```ts
 * // Shorthand placeholder
 * const json = smsRfmToJson('Account: [Subscriber:email]\nYour order has shipped.')
 * // { type: 'sms', content: [
 * //   { type: 'message', text: 'Account: ' },
 * //   { type: 'placeholder', attrs: { type: 'Subscriber', original: '[Subscriber:email]',
 * //       name: 'email', value: null } },
 * //   { type: 'message', text: '\nYour order has shipped.' },
 * // ] }
 *
 * // Link directive
 * const json2 = smsRfmToJson(':link[https://example.com]{track="true" shorten="true"}')
 * // { type: 'sms', content: [
 * //   { type: 'link', text: 'https://example.com', attrs: { track: true, shorten: true } },
 * // ] }
 * ```
 * @public
 */
export function smsRfmToJson(input: string): SmsContentJson {
  return parseSmsRfm(input)
}
