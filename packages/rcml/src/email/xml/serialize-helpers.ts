/**
 * Internal: `RcmlDocument` JSON AST → RCML XML string conversion helpers.
 *
 * All the heavy lifting for `../rcml-to-xml.ts` lives here — the public file
 * only defines the options type and the `rcmlToXml` function that
 * orchestrates via {@link serializeRcmlToXml}.
 */

import { XMLBuilder } from 'fast-xml-parser'
import type { RcmlDocument } from '../rcml-types.js'
import { jsonToEmailInlineRfm, jsonToEmailRfm } from '../json-to-email-rfm.js'
import type { RcmlToXmlOptions } from '../rcml-to-xml.js'
import { RcmlTagNamesEnum } from '../schema/index.js'
import type { Json } from '../validate-rcml-json.js'

/**
 * Structural view of an RCML AST node — a superset that matches every node
 * in the public `RcmlDocument` union. Every field is optional so the
 * recursive walker can be defensive without having to narrow on specific
 * discriminants.
 */
type RcmlNodeLike = {
  id?: string
  tagName?: string
  attributes?: Record<string, unknown>
  children?: unknown[]
  content?: unknown
}

/**
 * One entry in fast-xml-parser's `preserveOrder` input — an object with a
 * single tag key holding the child list, plus an optional `':@'` key with
 * the element's attributes. Mirror of `PreservedNode` in `./parse-helpers.ts`.
 */
type PreservedEntry = Record<string, unknown>

/**
 * Serialize an RCML JSON AST to an XML string.
 *
 * Builds the `preserveOrder: true` intermediate shape expected by
 * `fast-xml-parser`'s `XMLBuilder` and runs the builder once. The `pretty`
 * option controls whether the output gains newlines + indentation.
 *
 * @param doc - The document to serialize.
 * @param options - Formatting options (defaults handled by the public wrapper).
 * @returns An XML string.
 */
export function serializeRcmlToXml(doc: RcmlDocument, options: RcmlToXmlOptions): string {
  const pretty = options.pretty ?? true
  const indent = options.indent ?? '  '

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    preserveOrder: true,
    format: pretty,
    indentBy: indent,
    suppressEmptyNode: false,
    processEntities: true,
  })

  const entry = toPreservedEntry(doc as unknown as RcmlNodeLike)
  const xml = builder.build([entry]) as string

  // fast-xml-parser's pretty output brackets the document with stray
  // newlines — strip them so the result is stable across round-trips.
  return pretty ? xml.trim() : xml
}

/**
 * Recursively convert a JSON AST node into the `preserveOrder` entry shape
 * that `fast-xml-parser`'s `XMLBuilder` consumes. Lifts `id` into the XML
 * attribute bag and serializes text-element `content` back to RFM markdown.
 */
function toPreservedEntry(node: RcmlNodeLike): PreservedEntry {
  const tagName = typeof node.tagName === 'string' ? node.tagName : ''
  const entry: PreservedEntry = {}

  // Lift `id` into the XML attribute bag so round-trip preserves it.
  const mergedAttrs: Record<string, unknown> = {}

  if (typeof node.id === 'string') mergedAttrs['id'] = node.id

  if (node.attributes && typeof node.attributes === 'object') {
    for (const [key, value] of Object.entries(node.attributes)) {
      mergedAttrs[key] = normalizeAttrValue(value)
    }
  }

  if (Object.keys(mergedAttrs).length > 0) {
    entry[':@'] = mergedAttrs
  }

  if (
    tagName === RcmlTagNamesEnum.Text ||
    tagName === RcmlTagNamesEnum.Heading ||
    tagName === RcmlTagNamesEnum.Button
  ) {
    const content = node.content as Json | undefined
    const rfm =
      tagName === RcmlTagNamesEnum.Button
        ? jsonToEmailInlineRfm(content ?? emptyDoc())
        : jsonToEmailRfm(content ?? emptyDoc())

    entry[tagName] = rfm === '' ? [] : [{ '#text': rfm }]

    return entry
  }

  if (Array.isArray(node.children)) {
    entry[tagName] = node.children.map((child) =>
      toPreservedEntry(child as RcmlNodeLike),
    )
  } else {
    entry[tagName] = []
  }

  return entry
}

/** Empty ProseMirror document used as fallback when a text element lacks `content`. */
function emptyDoc(): Json {
  return { type: 'doc', content: [] } as unknown as Json
}

/** Coerce an attribute value to a string that `XMLBuilder` can emit. */
function normalizeAttrValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  return ''
}
