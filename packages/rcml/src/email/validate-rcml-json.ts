/**
 * Public API: RCML content JSON validation (structural + semantic) and the
 * typed node/mark tree model.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. The
 * AJV validator and visitor helpers live under `./content/json-validator/`.
 */

import type { FlavorConfig } from './content/flavors/types.js'
import { normalizeBlock, visitBlocks } from './content/json-validator/json-semantic-validator.js'
import type {
  SemanticIssue,
  SemanticValidationResult,
} from './content/json-validator/json-semantic-validator.js'
import type {
  AlignNode,
  BlockNode,
  BulletListNode,
  FontMark,
  HardbreakNode,
  InlineNode,
  Json,
  JsonValidationError,
  LinkMark,
  ListItemNode,
  LoopValueNode,
  Mark,
  OrderedListNode,
  ParagraphNode,
  PlaceholderNode,
  SafeParseResult,
  TextNode,
} from './content/json-validator/types.js'
import { getValidator, toValidationErrors } from './content/json-validator/validate.js'

// ─── Type re-exports ─────────────────────────────────────────────────────────

/**
 * The root shape of an RCML content JSON document (`{ type: 'doc', content: [...] }`).
 * @public
 */
export type { Json }

/**
 * One entry from {@link JsonParseError.errors} / a failed {@link SafeParseResult}.
 * @public
 */
export type { JsonValidationError }

/**
 * Discriminated-union result type of {@link safeParseJson}.
 * @public
 */
export type { SafeParseResult }

/**
 * Semantic-validation issue produced by {@link validateJsonSemantics}.
 * @public
 */
export type { SemanticIssue }

/**
 * Discriminated-union result type of {@link validateJsonSemantics}.
 * @public
 */
export type { SemanticValidationResult }

/**
 * Restricts the set of node / mark types accepted by {@link validateJson} and
 * {@link safeParseJson}. Pre-built flavors: `emailRfmConfig`, `emailInlineRfmConfig`
 * (exported from `./content/flavors/index.js`).
 * @public
 */
export type { FlavorConfig }

/** RCML block-level node. @public */
export type { BlockNode }
/** RCML inline node. @public */
export type { InlineNode }
/** RCML inline mark (font / link). @public */
export type { Mark }
/** Text inline node. @public */
export type { TextNode }
/** Hard line-break inline node. @public */
export type { HardbreakNode }
/** Placeholder inline node (merge fields). @public */
export type { PlaceholderNode }
/** Loop-value inline node. @public */
export type { LoopValueNode }
/** Paragraph block node. @public */
export type { ParagraphNode }
/** Bullet-list block node. @public */
export type { BulletListNode }
/** Ordered-list block node. @public */
export type { OrderedListNode }
/** List-item block node. @public */
export type { ListItemNode }
/** Align container block node. @public */
export type { AlignNode }
/** Font inline mark. @public */
export type { FontMark }
/** Link inline mark. @public */
export type { LinkMark }


// ─── Error class ─────────────────────────────────────────────────────────────

/**
 * Thrown by {@link validateJson} when the input fails JSON Schema validation.
 *
 * The `.errors` array contains one entry per schema violation, each with a
 * JSON Pointer `path` and a human-readable `message`.
 *
 * @public
 */
export class JsonParseError extends Error {
  /** Structured list of every schema violation found in the input. */
  readonly errors: JsonValidationError[]

  constructor(errors: JsonValidationError[]) {
    const summary = errors
      .slice(0, 5)
      .map((e) => `  ${e.path || '(root)'}: ${e.message}`)
      .join('\n')
    const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

    super(`RCML content JSON validation failed:\n${summary}${suffix}`)
    this.name = 'JsonParseError'
    this.errors = errors
  }
}

// ─── JSON Schema validation ──────────────────────────────────────────────────

/**
 * Validate raw input as RCML content JSON.
 *
 * When `config` is provided, only the node / mark types permitted by that
 * `FlavorConfig` are accepted. Without `config`, the superset schema is used.
 *
 * @param input - The value to validate (typically a parsed JSON object).
 * @param config - Optional flavor config restricting allowed node/mark types.
 * @returns The input cast to {@link Json} when valid.
 * @throws {JsonParseError} When the input does not conform to the RCML JSON schema.
 *
 * @example
 * ```ts
 * const doc = validateJson(JSON.parse(raw))
 * // doc is typed as Json
 * ```
 * @public
 */
export function validateJson(input: unknown, config?: FlavorConfig): Json {
  const validate = getValidator(config)
  const valid = validate(input)

  if (!valid) {
    const errors = toValidationErrors(validate.errors)

    throw new JsonParseError(errors)
  }

  return input as Json
}

/**
 * Non-throwing variant of {@link validateJson}.
 *
 * @param input - The value to validate.
 * @param config - Optional flavor config restricting allowed node/mark types.
 * @returns `{ success: true, data }` when valid, or `{ success: false, errors }` when invalid.
 *
 * @example
 * ```ts
 * const result = safeParseJson(JSON.parse(raw))
 * if (result.success) {
 *   // result.data is typed as Json
 * } else {
 *   console.error(result.errors)
 * }
 * ```
 * @public
 */
export function safeParseJson(input: unknown, config?: FlavorConfig): SafeParseResult<Json> {
  const validate = getValidator(config)
  const valid = validate(input)

  if (!valid) {
    return {
      success: false,
      errors: toValidationErrors(validate.errors),
    }
  }

  return { success: true, data: input as Json }
}

// ─── Semantic validation ─────────────────────────────────────────────────────

/**
 * Second-stage semantic validator for RCML content JSON.
 *
 * Runs after {@link validateJson} succeeds. Checks invariants that JSON
 * Schema cannot express: duplicate marks, empty text nodes, adjacent
 * mergeable text nodes, and marks with no active attributes.
 *
 * @param json - A structurally valid RCML document.
 * @returns `{ success: true }` when no issues are found, or
 *   `{ success: false, issues }` when at least one issue exists (including warnings).
 * @public
 */
export function validateJsonSemantics(json: Json): SemanticValidationResult {
  const issues: SemanticIssue[] = []

  visitBlocks(json.content, '/content', issues)

  if (issues.length === 0) return { success: true }

  return { success: false, issues }
}

/**
 * Throwing wrapper around {@link validateJsonSemantics}.
 *
 * Throws only on **error**-severity issues — warnings are silently ignored.
 * Useful in pipelines where warnings are acceptable but structural errors
 * must be hard-rejected.
 *
 * @param json - A structurally valid RCML document.
 * @throws {Error} When the document contains any error-severity semantic issues.
 * @public
 */
export function assertJsonSemantics(json: Json): void {
  const result = validateJsonSemantics(json)

  if (result.success) return

  const errors = result.issues.filter((i) => i.severity === 'error')

  if (errors.length === 0) return

  const summary = errors
    .slice(0, 5)
    .map((e) => `  ${e.path || '(root)'} [${e.code}]: ${e.message}`)
    .join('\n')
  const suffix = errors.length > 5 ? `\n  ...and ${errors.length - 5} more` : ''

  throw new Error(`RCML JSON semantic validation failed:\n${summary}${suffix}`)
}

/**
 * Normalize RCML content JSON to canonical form.
 *
 * - Removes `marks: []` (empty marks arrays should be omitted).
 * - Removes empty text nodes (`text: ""`).
 * - Merges adjacent text nodes that share identical mark sets.
 *
 * @param json - A structurally valid RCML document.
 * @returns A new `Json` object in canonical form. The input is not mutated.
 * @public
 */
export function normalizeJson(json: Json): Json {
  return {
    ...json,
    content: json.content.map(normalizeBlock),
  }
}
