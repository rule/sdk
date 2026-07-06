/**
 * Public API: XML string → SmsDocument conversion.
 */

import type { SmsDocument } from './sms-types.js'
import { convertXmlToSms } from './xml/index.js'

// ─── Error codes ─────────────────────────────────────────────────────────────

/**
 * Machine-readable error codes emitted by {@link xmlToSms} and {@link safeXmlToSms}.
 *
 * @public
 */
export const SmsXmlErrorCodes = {
  XML_PARSE_ERROR: 'XML_PARSE_ERROR',
  ROOT_INVALID: 'ROOT_INVALID',
  SMS_RFM_PARSE_ERROR: 'SMS_RFM_PARSE_ERROR',
} as const

export type SmsXmlErrorCode = (typeof SmsXmlErrorCodes)[keyof typeof SmsXmlErrorCodes]

// ─── Issue shape ─────────────────────────────────────────────────────────────

/**
 * A single XML → SmsDocument conversion failure.
 *
 * @public
 */
export type SmsXmlParseIssue = {
  path: string
  code: SmsXmlErrorCode
  message: string
}

/**
 * Error thrown by {@link xmlToSms} when parsing or conversion fails.
 *
 * @public
 */
export class SmsXmlParseError extends Error {
  readonly errors: SmsXmlParseIssue[]

  constructor(errors: SmsXmlParseIssue[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'} [${e.code}]: ${e.message}`)
      .join('\n')
    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`SMS XML parse failed:\n${summary}${suffix}`)
    this.name = 'SmsXmlParseError'
    this.errors = errors
  }
}

// ─── Result type ─────────────────────────────────────────────────────────────

/**
 * Discriminated-union result of {@link safeXmlToSms}.
 *
 * @public
 */
export type SafeXmlToSmsResult =
  | { success: true; data: SmsDocument }
  | { success: false; errors: SmsXmlParseIssue[] }

// ─── Public functions ─────────────────────────────────────────────────────────

/**
 * Parse an XML string into an {@link SmsDocument}.
 *
 * @param xml - An XML string containing a single `<rc-sms>` root element.
 * @returns The parsed document.
 * @throws {SmsXmlParseError} On malformed XML, wrong root tag, or invalid SMS RFM body.
 * @public
 */
export function xmlToSms(xml: string): SmsDocument {
  const result = safeXmlToSms(xml)

  if (!result.success) {
    throw new SmsXmlParseError(result.errors)
  }

  return result.data
}

/**
 * Non-throwing variant of {@link xmlToSms}.
 *
 * @param xml - An XML string containing a single `<rc-sms>` root element.
 * @returns `{ success: true, data }` when parsing succeeds, or `{ success: false, errors }` otherwise.
 * @public
 */
export function safeXmlToSms(xml: string): SafeXmlToSmsResult {
  return convertXmlToSms(xml)
}
