/**
 * Public machine-readable Email RFM spec.
 *
 * Describes the two Email RFM content flavors (`rcml-content` and
 * `inline-rcml-content`) at two levels:
 *
 *  - **flavors** — which markdown constructs (block nodes, inline nodes,
 *    marks) each flavor permits.
 *  - **nodes / marks** — the JSON document shape: every node and mark type
 *    with its attributes and which flavors include it.
 *
 * The flavor entries are keyed by the same strings used in `rcmlSpec`'s
 * `content.type` field so consumers can cross-reference:
 *
 * ```ts
 * const tag   = rcmlSpec.tags['rc-text']         // content.type === 'rcml-content'
 * const flavor = emailRfmSpec.flavors['rcml-content']  // describes what markdown is valid here
 * ```
 */

import { emailRfmConfig, emailInlineRfmConfig } from './content/flavors/index.js'
import type { FlavorConfig } from './content/flavors/types.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Per-attribute descriptor inside an RFM node or mark spec. */
export interface EmailRfmAttrSpec {
  /** Broad value type, e.g. 'string', 'enum', 'boolean'. */
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

/** Describes one JSON node type (paragraph, bullet-list, font, …). */
export interface EmailRfmNodeSpec {
  /** Human-readable description. */
  description: string
  /** Which content flavors include this node type. */
  flavors: string[]
  /** Allowed attributes on this node's `attrs` object, if any. */
  attrs?: Record<string, EmailRfmAttrSpec>
  /** Prose description of what the `content` array may hold. */
  contentDescription?: string
}

/** Describes one mark type (font, link). */
export interface EmailRfmMarkSpec {
  /** Human-readable description. */
  description: string
  /** Which content flavors allow this mark. */
  flavors: string[]
  /** Allowed attributes on the mark's `attrs` object. */
  attrs: Record<string, EmailRfmAttrSpec>
}

/** Describes one RFM flavor at the markdown-syntax level. */
export interface EmailRfmFlavorSpec {
  /** Human-readable description. */
  description: string
  /** When `true`, the document must contain exactly one paragraph. */
  singleParagraph: boolean
  /** JSON node types that may appear directly in `doc.content`. */
  blockNodes: string[]
  /** JSON node/mark types available as inline content inside paragraphs. */
  inlineNodes: string[]
  /** Mark types that may be applied to text nodes. */
  marks: string[]
}

/** Top-level machine-readable RFM specification exported from @rule/rcml. */
export interface EmailRfmSpec {
  /** Spec format version. */
  version: string
  /** Flavors keyed by their `RcmlContentSpec.type` string. */
  flavors: Record<string, EmailRfmFlavorSpec>
  /** All JSON node types (both block and inline). */
  nodes: Record<string, EmailRfmNodeSpec>
  /** All JSON mark types. */
  marks: Record<string, EmailRfmMarkSpec>
}

// ---------------------------------------------------------------------------
// Node & mark metadata
// Hardcoded here — these are stable grammar constructs, not derived from
// the Zod schemas which are internal and not part of the public spec layer.
// ---------------------------------------------------------------------------

const NODE_META: Record<string, Omit<EmailRfmNodeSpec, 'flavors'>> = {
  doc: {
    description:
      'Root document node. Its `content` array holds one or more block nodes. In `inline-rcml-content` exactly one paragraph is allowed.',
    contentDescription: 'One or more block nodes. For inline-rcml-content: exactly one paragraph.',
  },
  paragraph: {
    description: 'A paragraph of inline content. The fundamental block unit in all flavors.',
    contentDescription: 'Zero or more inline nodes (text, hardbreak, placeholder, loop-value).',
  },
  'bullet-list': {
    description: 'An unordered (bullet) list. Only available in rcml-content.',
    attrs: {
      spread: {
        type: 'boolean',
        required: true,
        description: 'When true, list items are rendered with paragraph spacing between them (loose list).',
        examples: [],
      },
    },
    contentDescription: 'One or more list-item nodes.',
  },
  'ordered-list': {
    description: 'An ordered (numbered) list. Only available in rcml-content.',
    attrs: {
      order: {
        type: 'number',
        required: true,
        description: 'The starting number for the list.',
        examples: ['1'],
      },
      spread: {
        type: 'boolean',
        required: true,
        description: 'When true, list items are rendered with paragraph spacing between them.',
        examples: [],
      },
    },
    contentDescription: 'One or more list-item nodes.',
  },
  'list-item': {
    description: 'A single item inside a bullet-list or ordered-list. Only available in rcml-content.',
    attrs: {
      label: {
        type: 'string',
        required: true,
        description: 'Rendered bullet or number label (e.g. "•", "1.").',
        examples: ['•', '1.'],
      },
      'list-type': {
        type: 'enum',
        required: true,
        description: 'Whether this item belongs to a bullet or ordered list.',
        allowedValues: ['bullet', 'ordered'],
        examples: ['bullet', 'ordered'],
      },
      spread: {
        type: 'enum',
        required: true,
        description: 'Stringified boolean — whether this item uses loose spacing.',
        allowedValues: ['true', 'false'],
        examples: ['false'],
      },
    },
    contentDescription: 'One or more block nodes (typically paragraphs).',
  },
  align: {
    description:
      'A container that applies a horizontal alignment to its block children. Only available in rcml-content.',
    attrs: {
      value: {
        type: 'enum',
        required: true,
        description: 'The alignment direction.',
        allowedValues: ['left', 'center', 'right'],
        examples: ['center'],
      },
    },
    contentDescription: 'One or more block nodes.',
  },
  hardbreak: {
    description:
      'A hard line break rendered as <br>. Can be inline (inside a paragraph) or block-level. Only available in rcml-content.',
    attrs: {
      isInline: {
        type: 'boolean',
        required: true,
        description: 'When true the break is inline inside a paragraph; when false it is a standalone block-level break.',
        examples: [],
      },
    },
  },
  text: {
    description: 'A plain text run. May carry marks (font, link). Available in both flavors.',
    attrs: {
      text: {
        type: 'string',
        required: true,
        description: 'The text content. Must not be empty.',
        examples: ['Hello, world!'],
      },
    },
    contentDescription: 'No children — text is a leaf node. Marks are applied via the `marks` array.',
  },
  placeholder: {
    description:
      'A dynamic subscriber or system value inserted at render time (e.g. first name, custom field). Available in both flavors.',
    attrs: {
      type: {
        type: 'enum',
        required: true,
        description:
          'The backend token category. Each value corresponds to a token type in `placeholderSpec.tokens` — consult that spec for the exact syntax, parameters, and examples.',
        allowedValues: ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'],
        examples: ['Subscriber', 'CustomField'],
      },
      value: {
        type: 'string | number | null',
        required: true,
        description: 'Resolved value shown in preview mode. Set to `null` when not yet resolved.',
        examples: ['Jane', '42'],
      },
      name: {
        type: 'string',
        required: true,
        description: 'Human-readable display name shown in the editor. Not interpreted by the renderer.',
        examples: ['First name', 'Order total'],
      },
      original: {
        type: 'string',
        required: true,
        description:
          'The backend token string substituted by the renderer at send time. Must conform to the syntax for the given `type` — see `placeholderSpec.tokens[type]` for the exact pattern.',
        examples: ['[Subscriber:email]', '[CustomField:Order.Total]', '[Date:now::Y-m-d]'],
      },
      'max-length': {
        type: 'string | null',
        required: true,
        description: 'Maximum character length for the resolved value, or `null` when no limit is set.',
        examples: ['20'],
      },
    },
  },
  'loop-value': {
    description:
      'A reference to a loop variable declared by an enclosing rc-loop. Renders the named field from the current iteration item. Available in both flavors.',
    attrs: {
      original: {
        type: 'string',
        required: true,
        description:
          'The `[LoopValue:<key>.<index>]` token string. See `placeholderSpec.tokens[\'LoopValue\']` for the full syntax.',
        examples: ['[LoopValue:title.1]', '[LoopValue:price.1]'],
      },
      value: {
        type: 'string',
        required: true,
        description:
          'The `key` component of the token — the property name from the loop data item (e.g. an Open Graph tag name for news-feed sources, or a JSON property name for remote-content and custom-field sources).',
        examples: ['title', 'price'],
      },
      index: {
        type: 'string',
        required: true,
        description:
          'The `index` component of the token — a 1-based position counting all column slots across all sections of the loop block.',
        examples: ['1', '2'],
      },
    },
  },
}

const MARK_META: Record<string, Omit<EmailRfmMarkSpec, 'flavors'>> = {
  font: {
    description:
      'Applies inline typographic styling (font family, size, weight, colour, decoration, etc.) to a text run. At least one attribute must be set. Available in both flavors.',
    attrs: {
      'font-family': {
        type: 'string',
        required: false,
        description: 'CSS font-family value.',
        examples: ['Inter, sans-serif'],
      },
      'font-size': {
        type: 'string',
        required: false,
        description: 'CSS font-size value.',
        examples: ['14px', '1.2em'],
      },
      'line-height': {
        type: 'string',
        required: false,
        description: 'CSS line-height value.',
        examples: ['1.5', '24px'],
      },
      'letter-spacing': {
        type: 'string',
        required: false,
        description: 'CSS letter-spacing value.',
        examples: ['0.05em', '-0.5px'],
      },
      'font-style': {
        type: 'enum',
        required: false,
        description: 'CSS font-style keyword.',
        allowedValues: ['normal', 'italic'],
        examples: ['italic'],
      },
      'font-weight': {
        type: 'string',
        required: false,
        description: 'CSS font-weight value.',
        examples: ['700', 'bold'],
      },
      'text-decoration': {
        type: 'enum',
        required: false,
        description: 'CSS text-decoration keyword.',
        allowedValues: ['none', 'underline', 'line-through'],
        examples: ['underline'],
      },
      color: {
        type: 'string',
        required: false,
        description: 'CSS color value.',
        examples: ['#ff0000', '#333333'],
      },
    },
  },
  link: {
    description:
      'Wraps a text run in an anchor link. All three attributes must be present. Available in both flavors.',
    attrs: {
      href: {
        type: 'string',
        required: true,
        description:
          'Destination URL. Use `[Link:<type>]` tokens for system-managed links (e.g. `[Link:Unsubscribe]`, `[Link:WebBrowser]`) — see `placeholderSpec.tokens[\'Link\']` for all types. May also contain `[CustomField:...]`, `[Subscriber:...]`, or `[User:...]` tokens for per-recipient URLs.',
        examples: ['https://example.com/offer', '[Link:Unsubscribe]'],
      },
      target: {
        type: 'enum | null',
        required: true,
        description: 'HTML anchor target. Use `"_blank"` to open in a new tab; `null` uses the default browser behaviour.',
        allowedValues: ['_blank'],
        examples: ['_blank'],
      },
      'no-tracked': {
        type: 'enum',
        required: true,
        description: "Whether click tracking is disabled. `'true'` disables tracking; `'false'` enables it.",
        allowedValues: ['true', 'false'],
        examples: ['false'],
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Flavor derivation
// Maps internal FlavorConfig (MDAST names) to public JSON node type names.
// ---------------------------------------------------------------------------

function buildFlavorSpec(config: FlavorConfig, description: string): EmailRfmFlavorSpec {
  const blockNodes: string[] = ['paragraph']

  if (config.allowedBlockNodes.has('list')) {
    blockNodes.push('bullet-list', 'ordered-list')
  }

  if (config.allowedContainerDirectives.has('align')) {
    blockNodes.push('align')
  }

  const inlineNodes: string[] = ['text']

  if (config.allowedBlockNodes.has('break')) {
    inlineNodes.push('hardbreak')
  }

  for (const name of config.allowedLeafDirectives.keys()) {
    inlineNodes.push(name)
  }

  const marks = [...config.allowedTextDirectives.keys()]

  return {
    description,
    singleParagraph: config.singleParagraph ?? false,
    blockNodes,
    inlineNodes,
    marks,
  }
}

function buildEmailRfmSpec(): EmailRfmSpec {
  const flavorMap = {
    'rcml-content': buildFlavorSpec(
      emailRfmConfig,
      'Full Email RFM content flavor used by rc-text and rc-heading. Supports paragraphs, bullet/ordered lists, alignment blocks, hard breaks, inline marks (:font, :link), and dynamic directives (::placeholder, ::loop-value).',
    ),
    'inline-rcml-content': buildFlavorSpec(
      emailInlineRfmConfig,
      'Email Inline RFM content flavor used by rc-button labels. Restricted to a single paragraph — no lists, no hard breaks, no :::align blocks. Supports the same inline marks and directives as rcml-content.',
    ),
  }

  const allFlavorNames = Object.keys(flavorMap)

  const nodes: Record<string, EmailRfmNodeSpec> = {}

  for (const [name, meta] of Object.entries(NODE_META)) {
    let flavors: string[]

    if (name === 'doc') {
      flavors = allFlavorNames
    } else {
      flavors = allFlavorNames.filter((f) => {
        const spec = flavorMap[f as keyof typeof flavorMap]

        return spec.blockNodes.includes(name) || spec.inlineNodes.includes(name)
      })
    }

    nodes[name] = { ...meta, flavors }
  }

  const marks: Record<string, EmailRfmMarkSpec> = {}

  for (const [name, meta] of Object.entries(MARK_META)) {
    const flavors = allFlavorNames.filter((f) => {
      const spec = flavorMap[f as keyof typeof flavorMap]

      return spec.marks.includes(name)
    })

    marks[name] = { ...meta, flavors }
  }

  return { version: '0.1.0', flavors: flavorMap, nodes, marks }
}

/**
 * Machine-readable Email RFM specification.
 *
 * @example
 * ```ts
 * import { emailRfmSpec } from '@rule/rcml'
 *
 * // Which block nodes are valid inside an rc-text?
 * emailRfmSpec.flavors['rcml-content'].blockNodes
 * // → ['paragraph', 'bullet-list', 'ordered-list', 'align']
 *
 * // Cross-reference with rcmlSpec:
 * const tag = rcmlSpec.tags['rc-button']    // content.type === 'inline-rcml-content'
 * const flavor = emailRfmSpec.flavors[tag.content.type]
 * flavor.singleParagraph  // true
 *
 * // Attribute schema for the font mark:
 * emailRfmSpec.marks['font'].attrs['font-weight']
 * // → { type: 'string', required: false, description: '…' }
 * ```
 * @public
 */
export const emailRfmSpec: EmailRfmSpec = buildEmailRfmSpec()
