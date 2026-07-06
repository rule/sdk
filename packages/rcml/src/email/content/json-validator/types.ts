// ─── Mark types ───────────────────────────────────────────────────────────────

/**
 * A `font` mark that applies typographic styling to a text node.
 * All attributes are optional — only include the attrs you want to set.
 * `null` is treated identically to omission: the serializer filters it out and the attribute
 * is not emitted. (The RFM-to-JSON converter always emits all eight keys, setting unset ones
 * to `null`; sparse editor-produced marks simply omit them instead.)
 * At least one attribute must be present (a bare `font` mark with no attrs has no effect).
 */
export type FontMark = {
  type: 'font'
  attrs: {
    /** CSS font-family value, e.g. `"Arial, sans-serif"`. */
    'font-family'?: string | null
    /** CSS font-size value, e.g. `"14px"`. */
    'font-size'?: string | null
    /** CSS line-height value, e.g. `"1.5"`. */
    'line-height'?: string | null
    /** CSS letter-spacing value, e.g. `"0.05em"`. */
    'letter-spacing'?: string | null
    /** CSS font-style. Only `"normal"` and `"italic"` are supported. */
    'font-style'?: 'normal' | 'italic' | null
    /** CSS font-weight value, e.g. `"bold"` or `"700"`. */
    'font-weight'?: string | null
    /** CSS text-decoration shorthand. */
    'text-decoration'?: 'none' | 'underline' | 'line-through' | null
    /** CSS color value, e.g. `"#ff0000"` or `"rgb(255,0,0)"`. */
    color?: string | null
  }
}

/**
 * A `link` mark that wraps text in a hyperlink.
 */
export type LinkMark = {
  type: 'link'
  attrs: {
    /** The link destination URL. */
    href: string
    /** When `"_blank"`, the link opens in a new tab. `null` uses the default target. */
    target: '_blank' | null
    /** Whether click tracking is disabled. `"true"` disables tracking. */
    'no-tracked': 'true' | 'false'
  }
}

/** Union of all mark types that can be applied to a {@link TextNode}. */
export type Mark = FontMark | LinkMark

// ─── Inline node types ────────────────────────────────────────────────────────

/**
 * A leaf text node carrying an optional set of marks (styling/links).
 * `marks` should be omitted (not `[]`) when no marks are applied.
 */
export type TextNode = {
  type: 'text'
  /** The raw text content. Must be a non-empty string. */
  text: string
  /** Marks applied to this text. Omit rather than setting to `[]`. */
  marks?: Mark[]
}

/**
 * An inline or block hard line-break node.
 * When `isInline` is `true`, the break appears inside a paragraph inline flow.
 */
export type HardbreakNode = {
  type: 'hardbreak'
  attrs: { isInline: boolean }
}

/**
 * A dynamic placeholder atom that will be replaced at render time.
 */
export type PlaceholderNode = {
  type: 'placeholder'
  attrs: {
    /** Category of the placeholder. */
    type: 'CustomField' | 'Subscriber' | 'User' | 'RemoteContent' | 'Date'
    /** The resolved value at generation time, or `null` if unavailable. */
    value: string | number | null
    /** Human-readable display name for the placeholder. */
    name: string
    /** Original source token as it appeared in the RFM source. */
    original: string
    /** Optional maximum character length for the rendered value. */
    'max-length': string | null
  }
}

/**
 * A loop-variable reference atom. Replaced with the current loop iteration value.
 */
export type LoopValueNode = {
  type: 'loop-value'
  attrs: {
    /** Original source token as it appeared in the RFM source. */
    original: string
    /** The loop variable name. */
    value: string
    /** The loop variable index identifier. */
    index: string
  }
}

/** Union of all inline node types that can appear inside a {@link ParagraphNode}. */
export type InlineNode =
  | TextNode
  | HardbreakNode
  | PlaceholderNode
  | LoopValueNode

// ─── Block node types ─────────────────────────────────────────────────────────

/**
 * A paragraph block node. `content` is omitted for empty paragraphs.
 */
export type ParagraphNode = {
  type: 'paragraph'
  /** Inline children. Omitted when the paragraph is empty. */
  content?: InlineNode[]
}

/**
 * A list item block node. Can contain nested block nodes.
 */
export type ListItemNode = {
  type: 'list-item'
  attrs: {
    /** The item label (e.g. bullet character or number string). */
    label: string
    /** The parent list type: `"bullet"` or `"ordered"`. */
    'list-type': string
    /** Whether the item has loose spacing (`"true"` / `"false"`). */
    spread: string
  }
  content: BlockNode[]
}

/**
 * An unordered (bullet) list block node.
 */
export type BulletListNode = {
  type: 'bullet-list'
  attrs: {
    /** Whether the list uses loose (paragraph) spacing between items. */
    spread: boolean
  }
  content: ListItemNode[]
}

/**
 * An ordered (numbered) list block node.
 */
export type OrderedListNode = {
  type: 'ordered-list'
  attrs: {
    /** The starting number for the list. Defaults to `1`. */
    order: number
    /** Whether the list uses loose (paragraph) spacing between items. */
    spread: boolean
  }
  content: ListItemNode[]
}

/**
 * A text-alignment container block node.
 */
export type AlignNode = {
  type: 'align'
  attrs: {
    /** The alignment direction applied to child blocks. */
    value: 'left' | 'center' | 'right'
  }
  content: BlockNode[]
}

/** Union of all top-level block node types that can appear in a document. */
export type BlockNode = ParagraphNode | BulletListNode | OrderedListNode | AlignNode

// ─── Root document type ───────────────────────────────────────────────────────

/**
 * The root RCML document type. This is the shape returned by {@link emailRfmToJson}
 * and {@link emailInlineRfmToJson}, and accepted by {@link validateJson}.
 */
export type Json = {
  type: 'doc'
  content: BlockNode[]
}

// ─── Validator result types ───────────────────────────────────────────────────

/**
 * A single JSON Schema validation error, including a JSON Pointer path and a
 * human-readable message.
 */
export type JsonValidationError = {
  /** JSON Pointer path to the offending value (e.g. `/content/0/type`). Empty string means root. */
  path: string
  /** Human-readable description of the validation failure. */
  message: string
}

/**
 * The result of a non-throwing parse/validation operation.
 * On success, `data` is the validated value. On failure, `errors` lists all issues found.
 */
export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: JsonValidationError[] }
