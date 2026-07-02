/**
 * Internal: XML string → SmsDocument conversion.
 *
 * Expects a single `<rc-sms>` root element. Text content inside the element
 * is treated as SMS RFM and parsed via `smsRfmToJson`.
 *
 * @internal
 */

import { XMLParser, XMLValidator } from 'fast-xml-parser'
import type { SmsDocument } from '../sms-types.js'
import { smsRfmToJson } from '../sms-rfm-to-json.js'
import type { SmsXmlParseIssue } from '../xml-to-sms.js'

type PreservedNode = Record<string, unknown>

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
 * Parse an XML string into an {@link SmsDocument}.
 * @internal
 */
export function convertXmlToSms(
  xml: string,
): { success: true; data: SmsDocument } | { success: false; errors: SmsXmlParseIssue[] } {
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
      errors: [{ path: '', code: 'ROOT_INVALID', message: 'Expected a root element.' }],
    }
  }

  const tagKeys = Object.keys(rootNode).filter((k) => k !== ':@')

  if (tagKeys.length !== 1 || tagKeys[0] !== 'rc-sms') {
    return {
      success: false,
      errors: [
        {
          path: '',
          code: 'ROOT_INVALID',
          message: `Expected root tag <rc-sms>, got <${tagKeys[0] ?? '(none)'}>`,
        },
      ],
    }
  }

  const rawAttributes = rootNode[':@'] as Record<string, unknown> | undefined
  const rawChildren = rootNode['rc-sms']

  const id = typeof rawAttributes?.['id'] === 'string' ? rawAttributes['id'] : undefined
  const textResult = extractText(rawChildren)

  if (typeof textResult !== 'string') {
    return {
      success: false,
      errors: [{ path: '/content', code: 'ROOT_INVALID', message: textResult.error }],
    }
  }

  const rfmText = textResult

  let content

  try {
    content = smsRfmToJson(rfmText)
  } catch (err) {
    return {
      success: false,
      errors: [
        {
          path: '/content',
          code: 'SMS_RFM_PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Invalid SMS RFM content.',
        },
      ],
    }
  }

  const doc: SmsDocument = { tagName: 'rc-sms', content }

  if (id !== undefined) {
    doc.id = id
  }

  return { success: true, data: doc }
}

/**
 * Walk the preserveOrder XML child array, concatenating all `#text` node values.
 * Returns an error descriptor if any element child is present — `<rc-sms>` is a leaf.
 * @internal
 */
function extractText(raw: unknown): string | { error: string } {
  if (!Array.isArray(raw)) return ''
  let out = ''

  for (const entry of raw as PreservedNode[]) {
    if (typeof entry !== 'object') continue

    if ('#text' in entry) {
      const t = entry['#text']

      if (typeof t === 'string') out += t
      else if (typeof t === 'number' || typeof t === 'boolean') out += String(t)
    } else {
      const elementTag = Object.keys(entry).find((k) => k !== ':@')

      return {
        error: `<rc-sms> is a leaf element and must contain only text, but found child element <${elementTag ?? '(unknown)'}>`,
      }
    }
  }

  return out
}
