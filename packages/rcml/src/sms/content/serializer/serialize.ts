/**
 * Internal: SmsContentJson → SMS RFM (SMS Rule Flavor Markdown) string conversion.
 *
 * - `message` nodes → verbatim text (embedded `\n` preserved as-is).
 * - `link` nodes → `:link[url]{href="url" track="..." shorten="..."}` directive.
 * - `placeholder` nodes with a resolved value or max-length → `::placeholder{...}` directive.
 * - `placeholder` nodes with null value and no max-length → compact `[Type:Name]` via `original`.
 * - Nodes are concatenated with no separator — whitespace and newlines live in `message` text.
 *
 * @internal
 */

import type { SmsContentJson, SmsLinkNode, SmsPlaceholderNode } from '../json-validator/types.js'

// ─── Individual node serializers ──────────────────────────────────────────────

function serializeLinkNode(node: SmsLinkNode): string {
  const { text, attrs } = node

  return `:link[${text}]{href="${text}" track="${String(attrs.track)}" shorten="${String(attrs.shorten)}"}`
}

function serializePlaceholderNode(node: SmsPlaceholderNode): string {
  const { type, original, name, value } = node.attrs
  const maxLen = node.attrs['max-length']

  if (value !== null || (maxLen != null && maxLen !== null)) {
    const parts = [`type="${type}"`, `original="${original}"`, `name="${name}"`]

    if (value !== null) parts.push(`value="${value}"`)
    if (maxLen != null && maxLen !== null) parts.push(`max-length="${maxLen}"`)

    return `::placeholder{${parts.join(' ')}}`
  }

  return original
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Serialize an {@link SmsContentJson} document back to an SMS RFM string.
 *
 * @internal — called by the public `jsonToSmsRfm` wrapper.
 */
export function serializeSmsJson(json: SmsContentJson): string {
  return json.content
    .map((node) => {
      switch (node.type) {
        case 'message':
          return node.text
        case 'link':
          return serializeLinkNode(node)
        case 'placeholder':
          return serializePlaceholderNode(node)
        default:
          return ''
      }
    })
    .join('')
}
