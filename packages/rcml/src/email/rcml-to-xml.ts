/**
 * Public API: `RcmlDocument` JSON AST → RCML XML string conversion.
 *
 * This file contains **only public exports**. Every symbol here is part of
 * the `@rule/rcml` contract and is marked `@public` in its JSDoc. All
 * implementation details live in `./xml/serialize-helpers.ts`.
 */

import type { RcmlDocument } from './rcml-types.js'
import { serializeRcmlToXml } from './xml/index.js'

// ─── Options type ────────────────────────────────────────────────────────────

/**
 * Options for {@link rcmlToXml}.
 *
 * @public
 */
export type RcmlToXmlOptions = {
  /** Pretty-print the output with newlines + indentation. Default `true`. */
  pretty?: boolean
  /** Indent unit when `pretty` is true. Default two spaces. */
  indent?: string
}

// ─── Public conversion function ──────────────────────────────────────────────

/**
 * Serialize an `RcmlDocument` JSON AST to an RCML XML string.
 *
 * Useful for exporting a template to a human-readable form (e.g. for
 * debugging or sharing) and for JSON → XML → JSON round-trips. Combine with
 * {@link xmlToRcml} for the reverse direction.
 *
 * @param doc - The document (or any sub-tree node) to serialize.
 * @param options - Formatting options; see {@link RcmlToXmlOptions}.
 * @returns An XML string representing the document.
 *
 * @example
 * ```ts
 * rcmlToXml({ tagName: 'rcml', children: [...] })
 * // => '<rcml>\n  <rc-head></rc-head>\n  ...'
 * ```
 * @public
 */
export function rcmlToXml(doc: RcmlDocument, options: RcmlToXmlOptions = {}): string {
  return serializeRcmlToXml(doc, options)
}
