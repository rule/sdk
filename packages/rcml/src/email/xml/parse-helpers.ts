/**
 * Internal: XML → `RcmlDocument` JSON AST conversion helpers.
 *
 * All the heavy lifting for `../xml-to-rcml.ts` lives here — the public file
 * only defines the error surface and the two public functions that orchestrate
 * via {@link convertXmlToRcml}.
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser'
import type { RcmlDocument } from '../rcml-types.js'
import { emailInlineRfmToJson, emailRfmToJson } from '../email-rfm-to-json.js'
import { RCML_SCHEMA_SPEC, RcmlTagNamesEnum, type RcmlTagName } from '../schema/index.js'
import type { RcmlXmlParseIssue } from '../xml-to-rcml.js'

/**
 * One entry in fast-xml-parser's `preserveOrder` output — an object with a
 * single tag key (e.g. `'rc-body'`) whose value is the child list, plus an
 * optional `':@'` key holding the element's attributes. Text nodes appear
 * as `{ '#text': string }`.
 */
type PreservedNode = Record<string, unknown>

/**
 * Cached fast-xml-parser instance configured for RCML.
 *
 * `preserveOrder` keeps child ordering exactly as in the source document,
 * which matters because the JSON AST treats `children` as an ordered array.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: false,
  preserveOrder: true,
  processEntities: true,
})

/**
 * Parse an RCML XML string into an `RcmlDocument`.
 *
 * Runs every stage (XML validation, XML parsing, root detection, tree
 * conversion) and collapses them into the discriminated result returned by
 * `safeXmlToRcml`.
 *
 * @param xml - The RCML XML string to parse.
 * @returns `{ success: true, data }` on success, or `{ success: false, errors }`
 *   with the full issue list otherwise.
 */
export function convertXmlToRcml(
  xml: string,
):
  | { success: true; data: RcmlDocument }
  | { success: false; errors: RcmlXmlParseIssue[] } {
  const validationResult = XMLValidator.validate(xml)

  if (validationResult !== true) {
    return {
      success: false,
      errors: [
        {
          path: '',
          code: 'XML_PARSE_ERROR',
          message: validationResult.err.msg,
        },
      ],
    }
  }

  let raw: unknown

  try {
    raw = parser.parse(xml)
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          path: '',
          code: 'XML_PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Malformed XML.',
        },
      ],
    }
  }

  const roots = Array.isArray(raw) ? (raw as PreservedNode[]) : []
  const rootNode = roots.find((n) => !('#text' in n))

  if (!rootNode) {
    return {
      success: false,
      errors: [
        {
          path: '',
          code: 'ROOT_INVALID',
          message: 'Expected a root RCML element.',
        },
      ],
    }
  }

  const issues: RcmlXmlParseIssue[] = []
  const converted = convertNode(rootNode, '', issues)

  if (converted === null) {
    issues.push({
      path: '',
      code: 'ROOT_INVALID',
      message: 'Could not convert the XML root to an RCML document.',
    })

    return { success: false, errors: issues }
  }

  if (issues.length > 0) {
    return { success: false, errors: issues }
  }

  return { success: true, data: converted as unknown as RcmlDocument }
}

/**
 * Convert one `preserveOrder` entry produced by `fast-xml-parser` into an
 * RCML AST node `{ tagName, attributes?, children? | content? }`.
 *
 * Appends to `issues` on recoverable problems (invalid RFM body in a text
 * element) and returns a best-effort node. Returns `null` when the entry
 * cannot be mapped at all (no tag key, multiple tag keys, stray text).
 *
 * @param entry - One `preserveOrder` entry from the parser.
 * @param path - Current JSON Pointer path, used for issue reporting.
 * @param issues - Mutable issue list; each problem is appended here.
 */
function convertNode(
  entry: PreservedNode,
  path: string,
  issues: RcmlXmlParseIssue[],
): Record<string, unknown> | null {
  const rawAttributes = entry[':@'] as Record<string, unknown> | undefined

  const tagKeys = Object.keys(entry).filter((k) => k !== ':@')

  if (tagKeys.length !== 1) return null
  const tagName = tagKeys[0] as string
  const rawChildren = entry[tagName]

  const node: Record<string, unknown> = { tagName }

  // `id` lives at the top level on the JSON AST, not inside `attributes`.
  // Lift it out of the XML attribute bag so round-trips stay symmetric.
  if (rawAttributes) {
    const { id, ...rest } = rawAttributes

    if (typeof id === 'string') {
      node['id'] = id
    }

    if (Object.keys(rest).length > 0) {
      node['attributes'] = rest
    }
  }

  if (
    tagName === RcmlTagNamesEnum.Text ||
    tagName === RcmlTagNamesEnum.Heading ||
    tagName === RcmlTagNamesEnum.Button
  ) {
    const rfmBody = extractText(rawChildren)

    // Empty text body ⇒ skip the RFM parser entirely (it throws on empty input).
    // The canonical empty ProseMirror doc mirrors what `json-to-rfm.ts` emits
    // for an empty document, so round-trip is preserved.
    if (rfmBody === '') {
      node['content'] = { type: 'doc', content: [] }

      return node
    }

    try {
      const pmDoc =
        tagName === RcmlTagNamesEnum.Button ? emailInlineRfmToJson(rfmBody) : emailRfmToJson(rfmBody)

      node['content'] = pmDoc
    } catch (err) {
      issues.push({
        path: `${path}/content`,
        code: 'EMAIL_RFM_PARSE_ERROR',
        message: err instanceof Error ? err.message : 'Invalid RFM content.',
      })
      node['content'] = { type: 'doc', content: [] }
    }

    return node
  }

  const schema = RCML_SCHEMA_SPEC[tagName as RcmlTagName]

  if (!schema) {
    issues.push({ path, code: 'UNKNOWN_TAG', message: `Unknown RCML tag: <${tagName}>` })

    return node
  }

  const isLeaf = schema.isLeaf === true

  if (!isLeaf && Array.isArray(rawChildren)) {
    const children: unknown[] = []
    let childIdx = 0

    for (const raw of rawChildren as PreservedNode[]) {
      if (typeof raw !== 'object') continue
      // Skip stray text between structural children (whitespace from pretty-printed XML).
      if ('#text' in raw && Object.keys(raw).length === 1) continue

      const converted = convertNode(raw, `${path}/children/${childIdx}`, issues)

      if (converted !== null) {
        children.push(converted)
        childIdx++
      }
    }

    node['children'] = children
  }

  return node
}

/**
 * Join every `#text` fragment from a `preserveOrder` child array into one
 * string. Used for pulling the RFM body out of `<rc-text>` / `<rc-heading>` /
 * `<rc-button>` elements.
 */
function extractText(raw: unknown): string {
  if (!Array.isArray(raw)) return ''
  let out = ''

  for (const entry of raw as PreservedNode[]) {
    if (typeof entry === 'object' && '#text' in entry) {
      const t = entry['#text']

      if (typeof t === 'string') out += t
      else if (typeof t === 'number' || typeof t === 'boolean') out += String(t)
    }
  }

  return out
}
