/**
 * Public API: SmsDocument → XML string conversion.
 */

import type { SmsDocument } from './sms-types.js'
import { serializeSmsToXml } from './xml/index.js'

/**
 * Options for {@link smsToXml}.
 *
 * @public
 */
export type SmsToXmlOptions = {
  /** Pretty-print the output with newlines + indentation. Default `true`. */
  pretty?: boolean
  /** Indent unit when `pretty` is true. Default two spaces. */
  indent?: string
}

/**
 * Serialize an {@link SmsDocument} to an XML string.
 *
 * The output is a single `<rc-sms>` element whose text content is the
 * SMS RFM representation of the document's content. Combine with
 * {@link xmlToSms} for the reverse direction.
 *
 * @param doc - The SMS document to serialize.
 * @param options - Formatting options.
 * @returns An XML string.
 *
 * @example
 * ```ts
 * const xml = smsToXml(createSmsDocument({ content: 'Account: [Subscriber:email]' }))
 * // '<rc-sms>Account: [Subscriber:email]</rc-sms>'
 * ```
 * @public
 */
export function smsToXml(doc: SmsDocument, options: SmsToXmlOptions = {}): string {
  return serializeSmsToXml(doc, options)
}
