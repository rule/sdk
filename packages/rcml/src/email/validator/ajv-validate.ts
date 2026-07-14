/**
 * Internal: AJV-based structural validation for the email-template validator.
 *
 * Compiles the generated RCML JSON Schema once, caches the validator, and
 * translates AJV errors into `EmailTemplateValidationIssue` entries that
 * share the shape used by `./attr-value-validate.ts` and
 * `../validate-rcml-json.ts`.
 *
 * Attribute VALUE errors produced by AJV here (e.g. an enum mismatch on
 * `direction: 'diagonal'`) are reported as `ATTR_INVALID_VALUE`. Richer
 * value checks (padding shorthand, border, etc.) happen downstream via Zod
 * in `./attr-value-validate.ts` — those produce the same code.
 */

import { Ajv2020 } from 'ajv/dist/2020.js'
import type { ErrorObject, ValidateFunction } from 'ajv'
import { RCML_JSON_SCHEMA } from './json-schema.js'
import { EmailTemplateErrorCodes, type EmailTemplateValidationIssue } from '../validate-email-template.js'

let cachedValidator: ValidateFunction | null = null

/**
 * Return a lazily-initialised AJV validator compiled against
 * {@link RCML_JSON_SCHEMA}. Cached across calls so the compile cost is
 * paid only once per process.
 */
function getValidator(): ValidateFunction {
  if (cachedValidator) return cachedValidator

  const ajv = new Ajv2020({
    strict: true,
    strictTypes: false,
    allErrors: true,
    allowUnionTypes: true,
    discriminator: true,
  })

  cachedValidator = ajv.compile(RCML_JSON_SCHEMA)

  return cachedValidator
}

/**
 * Run the cached AJV validator against an input value and return a list of
 * email-template validation issues — empty when the input passes.
 *
 * @param input - Arbitrary value to validate against the RCML JSON schema.
 * @returns An `EmailTemplateValidationIssue[]` (empty on success).
 */
export function validateStructure(input: unknown): EmailTemplateValidationIssue[] {
  const validate = getValidator()

  if (validate(input)) return []

  return (validate.errors ?? []).map(toIssue)
}

/**
 * Map one AJV {@link ErrorObject} onto an {@link EmailTemplateValidationIssue}
 * with a specific code and a human-readable message.
 */
function toIssue(err: ErrorObject): EmailTemplateValidationIssue {
  const path = err.instancePath || ''

  switch (err.keyword) {
    case 'additionalProperties': {
      const extra = (err.params as { additionalProperty?: string }).additionalProperty

      if (path.endsWith('/attributes') || path.endsWith('/attributes/')) {
        return {
          path: `${path}/${extra ?? ''}`,
          code: EmailTemplateErrorCodes.ATTR_UNKNOWN,
          message: `Unknown attribute "${extra ?? ''}".`,
        }
      }

      return {
        path,
        code: EmailTemplateErrorCodes.SCHEMA_VIOLATION,
        message: `Unexpected property "${extra ?? ''}".`,
      }
    }

    case 'required': {
      const missing = (err.params as { missingProperty?: string }).missingProperty

      if (missing === 'tagName') {
        return {
          path,
          code: EmailTemplateErrorCodes.TAG_MISSING,
          message: 'Node is missing required "tagName" property.',
        }
      }

      if (missing === 'children') {
        return {
          path,
          code: EmailTemplateErrorCodes.CHILD_INVALID,
          message: 'Node is missing required "children" property.',
        }
      }

      return {
        path: `${path}/${missing ?? ''}`,
        code: EmailTemplateErrorCodes.ATTR_REQUIRED_MISSING,
        message: `Missing required property "${missing ?? ''}".`,
      }
    }

    case 'const': {
      const expected = (err.params as { allowedValue?: unknown }).allowedValue

      if (path.endsWith('/tagName')) {
        return {
          path,
          code: EmailTemplateErrorCodes.TAG_UNKNOWN,
          message: `Expected tagName "${String(expected)}".`,
        }
      }

      return { path, code: EmailTemplateErrorCodes.SCHEMA_VIOLATION, message: err.message ?? 'Invalid value.' }
    }

    case 'enum': {
      if (path.endsWith('/tagName')) {
        return {
          path,
          code: EmailTemplateErrorCodes.TAG_UNKNOWN,
          message: err.message ?? 'Unknown tagName.',
        }
      }

      return {
        path,
        code: EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
        message: err.message ?? 'Value is not in the allowed set.',
      }
    }

    case 'oneOf': {
      return {
        path,
        code: EmailTemplateErrorCodes.CHILD_INVALID,
        message: 'Child does not match any allowed tag for this parent.',
      }
    }

    case 'discriminator': {
      return {
        path,
        code: EmailTemplateErrorCodes.CHILD_INVALID,
        message: err.message ?? 'Child tagName does not match any allowed tag for this parent.',
      }
    }

    case 'maxItems': {
      return {
        path,
        code: EmailTemplateErrorCodes.CHILD_TOO_MANY,
        message: err.message ?? 'Too many children.',
      }
    }

    case 'minItems': {
      return {
        path,
        code: EmailTemplateErrorCodes.CHILD_COUNT_INVALID,
        message: err.message ?? 'Too few children.',
      }
    }

    case 'type': {
      return {
        path,
        code: EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
        message: err.message ?? 'Value has the wrong type.',
      }
    }

    default:
      return {
        path,
        code: EmailTemplateErrorCodes.SCHEMA_VIOLATION,
        message: err.message ?? 'Schema violation.',
      }
  }
}
