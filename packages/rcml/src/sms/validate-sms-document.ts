/**
 * Public API: SMS document validator.
 *
 * Runs two passes:
 *   1. Structural check — tagName.
 *   2. Content JSON validation — `content` field against the SMS content schema.
 */

import type { SmsDocument } from './sms-types.js'
import { validateSmsStructure } from './validator/index.js'
import { SmsContentParseError, validateSmsJson } from './validate-sms-json.js'
import { SmsDocumentBuildErrorCodes } from './builders/errors.js'

// ─── Error codes ─────────────────────────────────────────────────────────────

/**
 * Machine-readable error codes emitted by {@link validateSmsDocument} and
 * {@link safeValidateSmsDocument}.
 *
 * @public
 */
export const SmsDocumentErrorCodes = {
  STRUCTURE_INVALID: 'STRUCTURE_INVALID',
  CONTENT_REQUIRED: 'CONTENT_REQUIRED',
  CONTENT_INVALID: 'CONTENT_INVALID',
} as const

export type SmsDocumentErrorCode =
  (typeof SmsDocumentErrorCodes)[keyof typeof SmsDocumentErrorCodes]

// ─── Issue shape ─────────────────────────────────────────────────────────────

/**
 * A single validation failure produced by the SMS document validator.
 *
 * @public
 */
export type SmsDocumentValidationIssue = {
  /** JSON Pointer into the SmsDocument. Empty string means the root. */
  path: string
  /** Machine-readable code from {@link SmsDocumentErrorCodes}. */
  code: SmsDocumentErrorCode
  /** Human-readable description. */
  message: string
}

/**
 * Error thrown by {@link validateSmsDocument} when validation fails.
 *
 * @public
 */
export class SmsDocumentValidationError extends Error {
  readonly errors: SmsDocumentValidationIssue[]

  constructor(errors: SmsDocumentValidationIssue[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'} [${e.code}]: ${e.message}`)
      .join('\n')
    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`SMS document validation failed:\n${summary}${suffix}`)
    this.name = 'SmsDocumentValidationError'
    this.errors = errors
  }
}

// ─── Result type ─────────────────────────────────────────────────────────────

/**
 * Discriminated-union result of {@link safeValidateSmsDocument}.
 *
 * @public
 */
export type SafeValidateSmsResult =
  | { success: true; data: SmsDocument }
  | { success: false; errors: SmsDocumentValidationIssue[] }

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate an SMS document against the SMS schema.
 *
 * @param input - The {@link SmsDocument} to validate.
 * @returns The validated document.
 * @throws {SmsDocumentValidationError} When one or more issues are found.
 * @public
 */
export function validateSmsDocument(input: SmsDocument): SmsDocument {
  const result = safeValidateSmsDocument(input)

  if (!result.success) {
    throw new SmsDocumentValidationError(result.errors)
  }

  return result.data
}

/**
 * Non-throwing variant of {@link validateSmsDocument}.
 *
 * @param input - The {@link SmsDocument} to validate.
 * @returns `{ success: true, data }` when valid, or `{ success: false, errors }` otherwise.
 * @public
 */
export function safeValidateSmsDocument(input: SmsDocument): SafeValidateSmsResult {
  const issues: SmsDocumentValidationIssue[] = []

  // Pass 1: structural check
  const structureIssues = validateSmsStructure(input)

  for (const issue of structureIssues) {
    issues.push({
      path: issue.path,
      code:
        issue.code === SmsDocumentBuildErrorCodes.CONTENT_REQUIRED
          ? SmsDocumentErrorCodes.CONTENT_REQUIRED
          : SmsDocumentErrorCodes.STRUCTURE_INVALID,
      message: issue.message,
    })
  }

  // Pass 2: content JSON validation (only when structure passed content check)
  const hasContentIssue = structureIssues.some(
    (i) => i.code === SmsDocumentBuildErrorCodes.CONTENT_REQUIRED,
  )

  if (!hasContentIssue && input.content !== undefined) {
    try {
      validateSmsJson(input.content)
    } catch (err) {
      if (err instanceof SmsContentParseError) {
        for (const e of err.errors) {
          issues.push({
            path: `content${e.path}`,
            code: SmsDocumentErrorCodes.CONTENT_INVALID,
            message: e.message,
          })
        }
      } else {
        issues.push({
          path: 'content',
          code: SmsDocumentErrorCodes.CONTENT_INVALID,
          message: err instanceof Error ? err.message : 'Invalid content.',
        })
      }
    }
  }

  if (issues.length > 0) {
    return { success: false, errors: issues }
  }

  return { success: true, data: input }
}
