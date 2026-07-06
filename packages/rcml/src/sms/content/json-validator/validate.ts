import { Ajv2020 } from 'ajv/dist/2020.js'
import type { ErrorObject, ValidateFunction } from 'ajv'
import { smsContentJsonSchema } from './json-schema.js'
import type { SmsContentValidationError } from './types.js'

// ─── Compiler ─────────────────────────────────────────────────────────────────

const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true })
const compiledValidate = ajv.compile(smsContentJsonSchema)

/**
 * Return the pre-compiled AJV ValidateFunction for SMS content JSON.
 * @internal
 */
export function getSmsValidator(): ValidateFunction {
  return compiledValidate
}

/**
 * Map AJV ErrorObjects to the public {@link SmsContentValidationError} shape.
 * @internal
 */
export function toSmsValidationErrors(
  ajvErrors: ErrorObject[] | null | undefined,
): SmsContentValidationError[] {
  return (ajvErrors ?? []).map((err) => ({
    path: err.instancePath,
    message: err.message ?? 'Unknown error',
  }))
}
