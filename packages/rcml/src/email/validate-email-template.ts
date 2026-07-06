/**
 * Public API: RCML email-template validator.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. All
 * heavy lifting is delegated to the internal helpers under `./validator/`.
 *
 * The validator merges four passes into one unified issue list:
 *   1. AJV structural check (see `./validator/ajv-validate.ts`).
 *   2. Zod per-attribute value check (see `./validator/attr-value-validate.ts`).
 *   3. ProseMirror content delegation (see `./validator/content-validate.ts`).
 *   4. Cross-element column-width check (see `./validator/column-width-validate.ts`).
 *
 * Input may be either an `RcmlDocument` JSON AST or an RCML XML string; XML
 * is parsed first via {@link safeXmlToRcml}.
 */

import type { RcmlDocument } from './rcml-types.js'
import {
  validateAttrValues,
  validateColumnWidths,
  validateContent,
  validateStructure,
} from './validator/index.js'
import { RcmlXmlErrorCodes, safeXmlToRcml } from './xml-to-rcml.js'

// ─── Error codes ─────────────────────────────────────────────────────────────

/**
 * Machine-readable error codes emitted by {@link validateEmailTemplate} and
 * {@link safeValidateEmailTemplate}. LLMs and UI layers can branch on these.
 *
 * @public
 */
export const EmailTemplateErrorCodes = {
  XML_PARSE_ERROR: 'XML_PARSE_ERROR',
  ROOT_INVALID: 'ROOT_INVALID',
  TAG_UNKNOWN: 'TAG_UNKNOWN',
  TAG_MISSING: 'TAG_MISSING',
  CHILD_INVALID: 'CHILD_INVALID',
  CHILD_TOO_MANY: 'CHILD_TOO_MANY',
  CHILD_COUNT_INVALID: 'CHILD_COUNT_INVALID',
  ATTR_UNKNOWN: 'ATTR_UNKNOWN',
  ATTR_REQUIRED_MISSING: 'ATTR_REQUIRED_MISSING',
  ATTR_INVALID_VALUE: 'ATTR_INVALID_VALUE',
  CONTENT_INVALID: 'CONTENT_INVALID',
  LEAF_HAS_CHILDREN: 'LEAF_HAS_CHILDREN',
  SCHEMA_VIOLATION: 'SCHEMA_VIOLATION',
} as const

/**
 * Union of every value in {@link EmailTemplateErrorCodes}.
 *
 * @public
 */
export type EmailTemplateErrorCode =
  (typeof EmailTemplateErrorCodes)[keyof typeof EmailTemplateErrorCodes]

// ─── Issue shape ─────────────────────────────────────────────────────────────

/**
 * A single validation failure produced by the email-template validator.
 *
 * @public
 */
export type EmailTemplateValidationIssue = {
  /**
   * JSON Pointer into the RcmlDocument (e.g.
   * `/children/1/children/0/attributes/width`). Empty string means the
   * root of the document.
   */
  path: string
  /** Machine-readable code from {@link EmailTemplateErrorCodes}. */
  code: EmailTemplateErrorCode
  /** Human-readable description. */
  message: string
}

/**
 * Error thrown by {@link validateEmailTemplate} when validation fails.
 *
 * The `.errors` array contains every detected issue in the same shape as the
 * `errors` field of a failed {@link SafeValidateResult}. The `.message` is a
 * short summary (first five issues + `"...and N more"`).
 *
 * @public
 */
export class EmailTemplateValidationError extends Error {
  /** Every issue found during validation. */
  readonly errors: EmailTemplateValidationIssue[]

  constructor(errors: EmailTemplateValidationIssue[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'} [${e.code}]: ${e.message}`)
      .join('\n')

    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`RCML email template validation failed:\n${summary}${suffix}`)
    this.name = 'EmailTemplateValidationError'
    this.errors = errors
  }
}

// ─── Result type ─────────────────────────────────────────────────────────────

/**
 * Discriminated-union result of {@link safeValidateEmailTemplate}.
 *
 * @public
 */
export type SafeValidateResult =
  | { success: true; data: RcmlDocument }
  | { success: false; errors: EmailTemplateValidationIssue[] }

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate an AI-generated RCML email template against the RCML schema.
 *
 * Accepts either an `RcmlDocument` JSON AST or an RCML XML string. XML is
 * parsed first; the resulting tree is then validated structurally,
 * attribute-wise, and for embedded ProseMirror content. LLMs should feed the
 * structured `errors` list on the thrown error back into their next
 * iteration.
 *
 * @param input - JSON AST or RCML XML string.
 * @returns The validated document narrowed to `RcmlDocument`.
 * @throws {EmailTemplateValidationError} When one or more issues are found.
 * @public
 */
export function validateEmailTemplate(input: RcmlDocument | string): RcmlDocument {
  const result = safeValidateEmailTemplate(input)

  if (!result.success) {
    throw new EmailTemplateValidationError(result.errors)
  }

  return result.data
}

/**
 * Non-throwing variant of {@link validateEmailTemplate}.
 *
 * @param input - JSON AST or RCML XML string.
 * @returns `{ success: true, data }` when the input is valid, or
 *   `{ success: false, errors }` with the full issue list otherwise.
 * @public
 */
export function safeValidateEmailTemplate(input: RcmlDocument | string): SafeValidateResult {
  let json: unknown
  const issues: EmailTemplateValidationIssue[] = []

  if (typeof input === 'string') {
    const parsed = safeXmlToRcml(input)

    if (!parsed.success) {
      return {
        success: false,
        errors: parsed.errors.map((e) => ({
          path: e.path,
          code:
            e.code === RcmlXmlErrorCodes.EMAIL_RFM_PARSE_ERROR
              ? EmailTemplateErrorCodes.CONTENT_INVALID
              : e.code === RcmlXmlErrorCodes.ROOT_INVALID
                ? EmailTemplateErrorCodes.ROOT_INVALID
                : EmailTemplateErrorCodes.XML_PARSE_ERROR,
          message: e.message,
        })),
      }
    }

    json = parsed.data
  } else {
    json = input
  }

  issues.push(...validateStructure(json))
  issues.push(...validateAttrValues(json))
  issues.push(...validateContent(json))
  issues.push(...validateColumnWidths(json))

  if (issues.length > 0) {
    return { success: false, errors: issues }
  }

  return { success: true, data: json as RcmlDocument }
}
