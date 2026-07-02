/**
 * Public machine-readable SMS RFM (SMS Rule Flavor Markdown) spec.
 *
 * Describes the `sms-rfm-content` flavor at two levels:
 *
 *  - **flavors** — which constructs the flavor permits (top-level node types).
 *  - **nodes** — the JSON document shape: every node type with its attributes.
 *
 * The flavor key `'sms-rfm-content'` matches the `content.type` field in
 * {@link SmsPublicTagSpec} so consumers can cross-reference:
 *
 * ```ts
 * const tag    = smsSpec.tags['rc-sms']              // content.type === 'sms-rfm-content'
 * const flavor = smsRfmSpec.flavors['sms-rfm-content'] // describes the valid content
 * ```
 *
 * For the backend placeholder tokens that are valid in SMS, cross-reference
 * with {@link smsPlaceholderSpec}.
 */

// ─── Public types ─────────────────────────────────────────────────────────────

/** Per-attribute descriptor inside an SMS RFM node spec. @public */
export interface SmsRfmAttrSpec {
  /** Broad value type, e.g. `'string'`, `'boolean'`, `'enum'`. */
  type: string
  /** `true` when the attribute must be present. */
  required: boolean
  /** Human-readable description. */
  description: string
  /** Representative valid values. */
  examples?: string[]
  /** Exhaustive list of allowed values for enum attributes. */
  allowedValues?: string[]
}

/** Describes one JSON node type. @public */
export interface SmsRfmNodeSpec {
  /** Human-readable description. */
  description: string
  /** Allowed attributes on this node's `attrs` object, if any. */
  attrs?: Record<string, SmsRfmAttrSpec>
}

/**
 * Describes one mark type.
 * @deprecated SMS links are now represented as `link` nodes, not marks.
 * This type is kept for API compatibility.
 * @public
 */
export interface SmsRfmMarkSpec {
  /** Human-readable description. */
  description: string
  /** Allowed attributes on the mark's `attrs` object. */
  attrs: Record<string, SmsRfmAttrSpec>
}

/** Describes the SMS RFM content flavor. @public */
export interface SmsRfmFlavorSpec {
  /** Human-readable description. */
  description: string
  /** Top-level JSON node types that may appear in `sms.content`. */
  topLevelNodes: string[]
  /**
   * @deprecated Use `topLevelNodes` instead. Always `[]` in the new model.
   */
  blockNodes: string[]
  /**
   * @deprecated Use `topLevelNodes` instead. Always `[]` in the new model.
   */
  inlineNodes: string[]
  /**
   * @deprecated SMS links are now `link` nodes, not marks. Always `[]`.
   */
  marks: string[]
}

/**
 * Top-level machine-readable SMS RFM specification exported from `@rule/rcml`.
 *
 * @public
 */
export interface SmsRfmSpec {
  /** Spec format version. */
  version: string
  /** Flavors keyed by their content type string. SMS has one: `'sms-rfm-content'`. */
  flavors: Record<string, SmsRfmFlavorSpec>
  /** All JSON node types (sms, message, link, placeholder). */
  nodes: Record<string, SmsRfmNodeSpec>
  /**
   * @deprecated SMS links are now `link` nodes. Always `{}`.
   */
  marks: Record<string, SmsRfmMarkSpec>
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

const NODE_META: Record<string, SmsRfmNodeSpec> = {
  sms: {
    description: 'Root document node. Its `content` array holds the flat sequence of top-level nodes.',
  },
  unsubscribe: {
    description:
      'Unsubscribe footer directive. Written as `::unsubscribe` in SMS RFM / XML. ' +
      'When parsed, it expands into two adjacent JSON nodes: a `message` node with the ' +
      'localised stop-word text (`[Subscriber:unsubscribe_text]`) and a `placeholder` node ' +
      'for `[Link:Unsubscribe]`, both carrying `attrs: { "is-unsubscribe": true }`. ' +
      'When serialising JSON back to RFM, these two nodes are collapsed back to `::unsubscribe`.',
  },
  message: {
    description:
      'A text segment in the message body. `text` may contain `\\n` characters for line breaks ' +
      'and paragraph boundaries.',
    attrs: {
      text: {
        type: 'string',
        required: true,
        description: 'The text content. May contain `\\n` characters.',
        examples: ['Hello, world!', 'Your order has shipped.\n'],
      },
    },
  },
  link: {
    description:
      'A hyperlink. The URL is used as both the destination and the visible text in the message body. ' +
      'In SMS RFM, links are written as `:link[url]{track="true|false" shorten="true|false"}`.',
    attrs: {
      text: {
        type: 'string',
        required: true,
        description: 'The URL, also used as the visible link text.',
        examples: ['https://example.com/offer', 'https://track.example.com/abc123'],
      },
      track: {
        type: 'boolean',
        required: true,
        description: 'When `true`, click-through tracking is enabled for this link.',
        examples: ['true', 'false'],
      },
      shorten: {
        type: 'boolean',
        required: true,
        description: 'When `true`, the URL is shortened before sending.',
        examples: ['true', 'false'],
      },
    },
  },
  placeholder: {
    description:
      'A dynamic value inserted at render time (e.g. subscriber first name, custom field value). ' +
      'In SMS RFM, placeholders can be written as the `[Type:Name]` shorthand (e.g. `[Subscriber:email]`) ' +
      'or as the full `::placeholder{type="..." original="..." name="..." value="..."}` directive. ' +
      'See `smsPlaceholderSpec` for the token syntax and parameters for each `type`.',
    attrs: {
      type: {
        type: 'enum',
        required: true,
        description:
          'The backend token category. Each value corresponds to a token in `smsPlaceholderSpec.tokens`.',
        allowedValues: ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date', 'Link'],
        examples: ['Subscriber', 'CustomField', 'Link'],
      },
      original: {
        type: 'string',
        required: true,
        description:
          'The backend token string substituted by the renderer at send time. Must conform to the syntax for the given `type` — see `smsPlaceholderSpec.tokens[type]` for the exact pattern.',
        examples: ['[Subscriber:email]', '[CustomField:Order.Total]', '[Link:Unsubscribe]'],
      },
      name: {
        type: 'string',
        required: true,
        description: 'Human-readable display name shown in the editor. Not interpreted by the renderer.',
        examples: ['First name', 'Order total'],
      },
      value: {
        type: 'string | number | null',
        required: true,
        description: 'Resolved value shown in preview mode. Set to `null` when not yet resolved.',
        examples: ['Jane', '42', null as unknown as string],
      },
      'max-length': {
        type: 'string | null',
        required: false,
        description: 'Maximum character length for the resolved value, or omitted/`null` when no limit.',
        examples: ['20', null as unknown as string],
      },
    },
  },
}

// ─── Builder ──────────────────────────────────────────────────────────────────

function buildSmsRfmSpec(): SmsRfmSpec {
  const flavor: SmsRfmFlavorSpec = {
    description:
      'SMS RFM (SMS Rule Flavor Markdown) content flavor. Uses markdown-directive syntax. ' +
      'The content model is a flat sequence of top-level nodes: `message` (text), `link` (hyperlinks), ' +
      'and `placeholder` (dynamic values). ' +
      'Links are written as `:link[url]{track="true|false" shorten="true|false"}`. ' +
      'Placeholders accept either the `::placeholder{...}` directive form or the compact `[Type:Name]` shorthand. ' +
      'The required unsubscribe footer is expressed as `::unsubscribe` — it expands to the two-node ' +
      'stop-word + link pair with `is-unsubscribe` markers.',
    topLevelNodes: ['message', 'link', 'placeholder'],
    blockNodes: [],
    inlineNodes: [],
    marks: [],
  }

  return {
    version: '0.2.0',
    flavors: { 'sms-rfm-content': flavor },
    nodes: NODE_META,
    marks: {},
  }
}

/**
 * Machine-readable SMS RFM specification.
 *
 * @example
 * ```ts
 * import { smsRfmSpec, smsPlaceholderSpec } from '@rule/rcml'
 *
 * // Which node types are valid at the top level?
 * smsRfmSpec.flavors['sms-rfm-content'].topLevelNodes
 * // → ['message', 'link', 'placeholder']
 *
 * // Attribute schema for the link node:
 * smsRfmSpec.nodes['link'].attrs?.['track']
 * // → { type: 'boolean', required: true, description: '...' }
 *
 * // Which placeholder types are allowed?
 * smsRfmSpec.nodes['placeholder'].attrs?.['type'].allowedValues
 * // → ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date', 'Link']
 *
 * // Cross-reference token syntax:
 * smsPlaceholderSpec.tokens['Link'].examples
 * // → ['[Link:Unsubscribe]', '[Link:WebBrowser]', '[Link:Optin]']
 * ```
 * @public
 */
export const smsRfmSpec: SmsRfmSpec = buildSmsRfmSpec()
