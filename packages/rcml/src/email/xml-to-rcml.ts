/**
 * Public API: RCML XML → `RcmlDocument` JSON-AST conversion.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. All
 * implementation details live in `./xml/parse-helpers.ts`.
 *
 * Text inside `<rc-text>`, `<rc-heading>`, and `<rc-button>` is treated as
 * RFM markdown and converted to a `Json` — the embedded
 * `content` field then matches the shape expected by downstream consumers.
 */

import type { RcmlDocument } from './rcml-types.js'
import { convertXmlToRcml } from './xml/index.js'

// ─── Error codes ─────────────────────────────────────────────────────────────

/**
 * Machine-readable error codes emitted by {@link xmlToRcml} and
 * {@link safeXmlToRcml}.
 *
 * @public
 */
export const RcmlXmlErrorCodes = {
  XML_PARSE_ERROR: 'XML_PARSE_ERROR',
  ROOT_INVALID: 'ROOT_INVALID',
  EMAIL_RFM_PARSE_ERROR: 'EMAIL_RFM_PARSE_ERROR',
  EMAIL_RFM_SERIALIZE_ERROR: 'EMAIL_RFM_SERIALIZE_ERROR',
  UNKNOWN_TAG: 'UNKNOWN_TAG',
} as const

/**
 * Union of every value in {@link RcmlXmlErrorCodes}.
 *
 * @public
 */
export type RcmlXmlErrorCode = (typeof RcmlXmlErrorCodes)[keyof typeof RcmlXmlErrorCodes]

// ─── Issue shape ─────────────────────────────────────────────────────────────

/**
 * A single XML → JSON conversion failure.
 *
 * @public
 */
export type RcmlXmlParseIssue = {
  /** JSON Pointer into the resulting RcmlDocument. Empty string means root. */
  path: string
  /** Machine-readable code from {@link RcmlXmlErrorCodes}. */
  code: RcmlXmlErrorCode
  /** Human-readable description. */
  message: string
}

/**
 * Error thrown by {@link xmlToRcml} when parsing or conversion fails.
 *
 * The `.errors` array contains every detected issue; `.message` is a short
 * summary (first five issues + `"...and N more"`).
 *
 * @public
 */
export class RcmlXmlParseError extends Error {
  /** Every issue found during XML → JSON conversion. */
  readonly errors: RcmlXmlParseIssue[]

  constructor(errors: RcmlXmlParseIssue[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'} [${e.code}]: ${e.message}`)
      .join('\n')
    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`RCML XML parse failed:\n${summary}${suffix}`)
    this.name = 'RcmlXmlParseError'
    this.errors = errors
  }
}

// ─── Result type ─────────────────────────────────────────────────────────────

/**
 * Discriminated-union result of {@link safeXmlToRcml}.
 *
 * @public
 */
export type SafeXmlToRcmlResult =
  | { success: true; data: RcmlDocument }
  | { success: false; errors: RcmlXmlParseIssue[] }

// ─── Public conversion functions ─────────────────────────────────────────────

/**
 * Parse an RCML XML string into an `RcmlDocument`.
 *
 * @param xml - The RCML XML string to parse.
 * @returns The parsed document.
 * @throws {RcmlXmlParseError} On any failure (malformed XML, invalid RFM
 *   body inside a text element, missing root).
 * @public
 */
export function xmlToRcml(xml: string): RcmlDocument {
  const result = safeXmlToRcml(xml)

  if (!result.success) {
    throw new RcmlXmlParseError(result.errors)
  }

  return result.data
}

/**
 * Non-throwing variant of {@link xmlToRcml}.
 *
 * @param xml - The RCML XML string to parse.
 * @returns `{ success: true, data }` when parsing succeeds, or
 *   `{ success: false, errors }` with the full issue list otherwise.
 * @public
 */
export function safeXmlToRcml(xml: string): SafeXmlToRcmlResult {
  return convertXmlToRcml(xml)
}
