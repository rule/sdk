/**
 * Public API: RCML content JSON → Email RFM markdown conversion.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. The
 * block/inline/mark serializers live under `./content/serializer/`.
 */

import { serializeBlock } from './content/serializer/block.js'
import type { Json } from './validate-rcml-json.js'

/**
 * Convert an RCML content JSON document back to an Email RFM markdown string.
 *
 * Reverse of {@link emailRfmToJson}: the output is a valid Email RFM markdown string
 * that, when passed back through `emailRfmToJson`, produces a JSON document equal
 * to the input.
 *
 * If the input JSON was originally produced by {@link emailInlineRfmToJson}, the
 * output will also be valid Email Inline RFM (it will only contain
 * Email Inline RFM-compatible constructs). In that case prefer the semantically
 * explicit {@link jsonToEmailInlineRfm} alias.
 *
 * @param json - Typed RCML document JSON (`{ type: 'doc', content: [...] }`).
 * @returns Email RFM markdown string.
 *
 * @example
 * ```ts
 * const json = emailRfmToJson('Hello :font[world]{font-weight="bold"}')
 * const md = jsonToEmailRfm(json)
 * // md === 'Hello :font[world]{font-weight="bold"}'
 * ```
 * @public
 */
export function jsonToEmailRfm(json: Json): string {
  return json.content.map(serializeBlock).join('\n\n')
}

/**
 * Convert an RCML content JSON document back to an Email Inline RFM markdown string.
 *
 * Reverse of {@link emailInlineRfmToJson}. Semantically equivalent to
 * {@link jsonToEmailRfm} — use this name when the JSON was produced by
 * `emailInlineRfmToJson` to keep the intent clear at call sites.
 *
 * @param json - Typed RCML document JSON (`{ type: 'doc', content: [...] }`).
 * @returns Email Inline RFM markdown string.
 *
 * @example
 * ```ts
 * const json = emailInlineRfmToJson(':font[Click here]{font-weight="bold"}')
 * const md = jsonToEmailInlineRfm(json)
 * // md === ':font[Click here]{font-weight="bold"}'
 * ```
 * @public
 */
export function jsonToEmailInlineRfm(json: Json): string {
  return json.content.map(serializeBlock).join('\n\n')
}
