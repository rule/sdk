/**
 * Public API: SMS content JSON validation and typed node tree model.
 */

import { getSmsValidator, toSmsValidationErrors } from './content/json-validator/validate.js'
import type {
  SmsContentJson,
  SmsContentSafeParseResult,
  SmsContentValidationError,
  SmsLinkNode,
  SmsMessageNode,
  SmsPlaceholderNode,
  SmsPlaceholderType,
  SmsTopLevelNode,
} from './content/json-validator/types.js'

// ─── Type re-exports ─────────────────────────────────────────────────────────

/** The root shape of an SMS content JSON document (`{ type: 'sms', content: [...] }`). @public */
export type { SmsContentJson }

/** One entry from {@link SmsContentParseError.errors} / a failed {@link SmsContentSafeParseResult}. @public */
export type { SmsContentValidationError }

/** Discriminated-union result type of {@link safeParseSmsJson}. @public */
export type { SmsContentSafeParseResult }

/** Category of an SMS placeholder atom. @public */
export type { SmsPlaceholderType }

/** SMS message text node. @public */
export type { SmsMessageNode }

/** SMS hyperlink node. @public */
export type { SmsLinkNode }

/** SMS placeholder node. @public */
export type { SmsPlaceholderNode }

/** Union of all top-level SMS content node types. @public */
export type { SmsTopLevelNode }

// ─── Error class ─────────────────────────────────────────────────────────────

/**
 * Thrown by {@link validateSmsJson} when the input fails JSON Schema validation.
 *
 * @public
 */
export class SmsContentParseError extends Error {
  /** Structured list of every schema violation found in the input. */
  readonly errors: SmsContentValidationError[]

  constructor(errors: SmsContentValidationError[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'}: ${e.message}`)
      .join('\n')
    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`SMS content JSON validation failed:\n${summary}${suffix}`)
    this.name = 'SmsContentParseError'
    this.errors = errors
  }
}

// ─── Validators ──────────────────────────────────────────────────────────────

/**
 * Validate raw input as SMS content JSON.
 *
 * @param input - The value to validate (typically a parsed JSON object).
 * @returns The input cast to {@link SmsContentJson} when valid.
 * @throws {SmsContentParseError} When the input does not conform to the SMS content JSON schema.
 * @public
 */
export function validateSmsJson(input: unknown): SmsContentJson {
  const validate = getSmsValidator()
  const valid = validate(input)

  if (!valid) {
    throw new SmsContentParseError(toSmsValidationErrors(validate.errors))
  }

  return input as SmsContentJson
}

/**
 * Non-throwing variant of {@link validateSmsJson}.
 *
 * @param input - The value to validate.
 * @returns `{ success: true, data }` when valid, or `{ success: false, errors }` when invalid.
 * @public
 */
export function safeParseSmsJson(input: unknown): SmsContentSafeParseResult<SmsContentJson> {
  const validate = getSmsValidator()
  const valid = validate(input)

  if (!valid) {
    return {
      success: false,
      errors: toSmsValidationErrors(validate.errors),
    }
  }

  return { success: true, data: input as SmsContentJson }
}
