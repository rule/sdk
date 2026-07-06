/**
 * Internal: coerce the `content` option of a PM-content factory into a
 * normalized, validated content `Json` doc.
 *
 * Accepts two input forms:
 * - `string` — treated as RFM markdown, routed through {@link emailRfmToJson}.
 * - `Json` — a pre-built content doc (e.g. from {@link createInlineContent}).
 *
 * In both cases the result is passed through {@link normalizeJson} and
 * {@link validateJson} so factories always hand back a canonical doc the AJV
 * validator accepts. Failures are surfaced as {@link RcmlElementBuildIssue}s
 * with code `CONTENT_INVALID`.
 */

import {
  JsonParseError,
  normalizeJson,
  validateJson,
  type Json,
} from '../validate-rcml-json.js'
import { emailRfmToJson } from '../email-rfm-to-json.js'
import { RcmlElementBuildErrorCodes, type RcmlElementBuildIssue } from './errors.js'

export type ContentInput = string | Json

export interface ContentCoerceResult {
  readonly json?: Json
  readonly issues: readonly RcmlElementBuildIssue[]
}

/**
 * Convert `input` into a normalized + validated content `Json` doc.
 * Returns either a valid `json` or a list of `issues` — never both.
 */
export function coerceContent(input: ContentInput): ContentCoerceResult {
  let doc: Json

  try {
    doc = typeof input === 'string' ? emailRfmToJson(input) : input
  } catch (err) {
    return {
      issues: [
        {
          code: RcmlElementBuildErrorCodes.CONTENT_INVALID,
          path: 'content',
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    }
  }

  let normalized: Json

  try {
    normalized = normalizeJson(doc)
  } catch (err) {
    return {
      issues: [
        {
          code: RcmlElementBuildErrorCodes.CONTENT_INVALID,
          path: 'content',
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    }
  }

  try {
    return { json: validateJson(normalized), issues: [] }
  } catch (err) {
    if (err instanceof JsonParseError) {
      return {
        issues: err.errors.map((e) => ({
          code: RcmlElementBuildErrorCodes.CONTENT_INVALID,
          path: `content${e.path}`,
          message: e.message,
        })),
      }
    }

    return {
      issues: [
        {
          code: RcmlElementBuildErrorCodes.CONTENT_INVALID,
          path: 'content',
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    }
  }
}
