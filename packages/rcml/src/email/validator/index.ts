/**
 * Internal barrel for `packages/rcml/src/email/validator/`.
 *
 * Re-exports only the symbols that cross the folder boundary. The rest of
 * the folder (private helpers, Zod schema constants, the generated JSON
 * Schema, `toIssue`, `buildAttrsSchema`, …) is module-local.
 *
 * Note: `RcmlAttributeValidatorsEnum` is intentionally *not* re-exported
 * here — `schema/specs.ts` and `schema/types.ts` import it directly from
 * `./attr-validators.js` to avoid a module cycle
 * (barrel → ajv-validate → json-schema → schema/specs.ts → barrel).
 */

export { validateStructure } from './ajv-validate.js'
export { validateAttrValues } from './attr-value-validate.js'
export { validateColumnWidths } from './column-width-validate.js'
export { validateContent } from './content-validate.js'
