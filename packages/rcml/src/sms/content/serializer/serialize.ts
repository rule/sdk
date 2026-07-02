/**
 * Internal: SmsContentJson → SMS RFM (SMS Rule Flavor Markdown) string conversion.
 *
 * - `message` nodes → verbatim text (embedded `\n` preserved as-is).
 * - `link` nodes → `:link[url]{track="..." shorten="..."}` directive.
 * - `placeholder` nodes → `::placeholder{...}` directive (always).
 * - Nodes are concatenated with no separator — whitespace and newlines live in `message` text.
 *
 * @internal
 */

import type { SmsContentJson, SmsLinkNode, SmsPlaceholderNode } from '../json-validator/types.js'

// ─── Individual node serializers ──────────────────────────────────────────────

function serializeLinkNode(node: SmsLinkNode): string {
  const { text, attrs } = node

  return `:link[${text}]{track="${String(attrs.track)}" shorten="${String(attrs.shorten)}"}`
}

function escapeAttrValue(v: string | number): string {
  return String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function serializePlaceholderNode(node: SmsPlaceholderNode): string {
  const { type, original, name, value } = node.attrs
  const maxLen = node.attrs['max-length']
  const parts = [`type="${escapeAttrValue(type)}"`, `original="${escapeAttrValue(original)}"`, `name="${escapeAttrValue(name)}"`]

  if (value !== null) parts.push(`value="${escapeAttrValue(value)}"`)
  if (maxLen != null && maxLen !== null) parts.push(`max-length="${escapeAttrValue(maxLen)}"`)

  return `::placeholder{${parts.join(' ')}}`
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Serialize an {@link SmsContentJson} document back to an SMS RFM string.
 *
 * @internal — called by the public `jsonToSmsRfm` wrapper.
 */
export function serializeSmsJson(json: SmsContentJson): string {
  const parts: string[] = []
  const nodes = json.content

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!
    const next = nodes[i + 1]

    // Detect the canonical two-node unsubscribe footer and emit ::unsubscribe.
    // Match only the exact pair produced by createUnsubscribeNodes / ::unsubscribe parser:
    //   message { text: '[Subscriber:unsubscribe_text]', attrs: { 'is-unsubscribe': true } }
    //   placeholder { attrs: { type: 'Link', 'is-unsubscribe': true } }
    if (
      node.type === 'message' &&
      node.text === '[Subscriber:unsubscribe_text]' &&
      node.attrs?.['is-unsubscribe'] === true &&
      next?.type === 'placeholder' &&
      next.attrs.type === 'Link' &&
      next.attrs['is-unsubscribe'] === true
    ) {
      parts.push('::unsubscribe')
      i++ // skip the placeholder node
      continue
    }

    switch (node.type) {
      case 'message':
        parts.push(node.text)
        break
      case 'link':
        parts.push(serializeLinkNode(node))
        break
      case 'placeholder':
        parts.push(serializePlaceholderNode(node))
        break
    }
  }

  return parts.join('')
}
