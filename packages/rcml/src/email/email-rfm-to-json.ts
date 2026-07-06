/**
 * Public API: Email RFM markdown → RCML content JSON conversion.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. The
 * parse/transform/convert pipeline lives under `./content/`.
 */

import { convert } from './content/converter/convert.js'
import { parseEmailInlineRfm, parseEmailRfm } from './content/parser/parse.js'
import { transform } from './content/transformer/transform.js'
import type { Json } from './validate-rcml-json.js'

/**
 * Convert a full Email RFM markdown string into an RCML content JSON document.
 *
 * Runs the full pipeline: parse → validate → transform → convert. Throws
 * `RcmlValidationError` if the input contains syntax not allowed by the
 * Email RFM flavor. The returned {@link Json} can be stored, sent to a Milkdown
 * editor running the Email RFM preset, or further validated with
 * {@link validateJsonSemantics}.
 *
 * @param input - Email RFM markdown source string.
 * @returns Typed RCML document JSON (`{ type: 'doc', content: [...] }`).
 * @throws `RcmlValidationError` when the input is not valid Email RFM.
 *
 * @example
 * ```ts
 * const doc = emailRfmToJson('Hello :font[world]{font-weight="bold"}')
 * // { type: 'doc', content: [{ type: 'paragraph', content: [...] }] }
 * ```
 * @public
 */
export function emailRfmToJson(input: string): Json {
  const { ast } = parseEmailRfm(input)
  const ir = transform(ast)

  return convert(ir).toJSON() as Json
}

/**
 * Convert an Email Inline RFM markdown string into an RCML content JSON document.
 *
 * Email Inline RFM forbids block-level lists, `:::align`, and hard breaks. Throws
 * `RcmlValidationError` if the input violates these restrictions.
 *
 * @param input - Email Inline RFM markdown source string.
 * @returns Typed RCML document JSON (`{ type: 'doc', content: [...] }`).
 * @throws `RcmlValidationError` when the input is not valid Email Inline RFM.
 *
 * @example
 * ```ts
 * const doc = emailInlineRfmToJson(':font[Click here]{font-weight="bold"}')
 * // { type: 'doc', content: [{ type: 'paragraph', content: [...] }] }
 * ```
 * @public
 */
export function emailInlineRfmToJson(input: string): Json {
  const { ast } = parseEmailInlineRfm(input)
  const ir = transform(ast)

  return convert(ir).toJSON() as Json
}
