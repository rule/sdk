import type { Root, RootContent, PhrasingContent, Paragraph, List, ListItem } from 'mdast'
import type { TextDirective, ContainerDirective, LeafDirective } from 'mdast-util-directive'
import { ATOM_TOKEN_DELIMITER, ATOM_TOKEN_SEPARATOR, COLON_ESCAPE } from '../parser/preprocess.js'
import type {
  IrDoc,
  IrBlock,
  IrInline,
  IrParagraph,
  IrBulletList,
  IrOrderedList,
  IrListItem,
  IrAlign,
  IrPlaceholder,
  IrLoopValue,
  IrText,
  IrFont,
  IrLink,
  FontAttrs,
  PlaceholderAttrs,
} from './types.js'

/**
 * Transform a validated MDAST Root node into the typed Intermediate
 * Representation (IR) used by the converter (Stage 3).
 *
 * The AST **must** have been validated by `validate(ast, config)` before
 * calling this function. Unrecognised node types will throw an Error.
 *
 * @param ast - Validated MDAST Root produced by `parse()`
 * @returns The root IR document node
 *
 * @internal — Stage 2 of the pipeline; use {@link emailRfmToJson} or {@link emailInlineRfmToJson} instead.
 *
 * @example
 * ```ts
 * import { parseEmailRfm } from '../parser/parse.js'
 * import { transform } from './transform.js'
 *
 * const { ast } = parseEmailRfm('Hello :font[world]{font-weight="bold"}')
 * const ir = transform(ast)
 * ```
 */
export function transform(ast: Root): IrDoc {
  return {
    type: 'doc',
    children: transformBlocks(ast.children),
  }
}

// ─── Block transformer ────────────────────────────────────────────────────────

/** @internal */
function transformBlocks(children: RootContent[]): IrBlock[] {
  return children.map(transformBlock)
}

/** @internal */
function transformBlock(node: RootContent): IrBlock {
  switch (node.type) {
    case 'paragraph':
      return transformParagraph(node)

    case 'list':
      return transformList(node)

    case 'leafDirective':
      return transformLeafDirective(node)

    case 'containerDirective':
      return transformContainerDirective(node)

    default:
      throw new Error(
        `Unexpected block node type "${node.type}". Run validate() before transform().`,
      )
  }
}

/** @internal */
function transformParagraph(node: Paragraph): IrParagraph {
  return {
    type: 'paragraph',
    children: node.children.flatMap(expandAndTransformInlineNode),
  }
}

/** @internal */
function transformList(node: List): IrBulletList | IrOrderedList {
  const children = node.children.map(transformListItem)

  if (node.ordered) {
    return { type: 'orderedList', children }
  }

  return { type: 'bulletList', children }
}

/** @internal */
function transformListItem(node: ListItem): IrListItem {
  return {
    type: 'listItem',
    children: (node.children as unknown as RootContent[]).map(transformBlock),
  }
}

// ─── Leaf directive transformer ───────────────────────────────────────────────

/** Handles block-level `::name{attrs}` leaf directives (inline atoms at line start). */
function transformLeafDirective(node: LeafDirective): IrPlaceholder | IrLoopValue {
  const raw = (node.attributes ?? {}) as Record<string, string>

  switch (node.name) {
    case 'placeholder':
      return buildPlaceholderIr(raw)

    case 'loop-value':
      return {
        type: 'loopValue',
        original: raw['original'] ?? '',
        value: raw['value'] ?? '',
        index: raw['index'] ?? '',
        children: [],
      }

    default:
      throw new Error(
        `Unknown leaf directive "::${node.name}". Run validate() before transform().`,
      )
  }
}

// ─── Container directive transformer ─────────────────────────────────────────

/** @internal */
function transformContainerDirective(node: ContainerDirective): IrBlock {
  switch (node.name) {
    case 'align':
      return transformAlign(node)

    case 'placeholder':
      return transformPlaceholder(node)

    case 'loop-value':
      return transformLoopValue(node)

    default:
      throw new Error(
        `Unknown container directive ":::${node.name}". Run validate() before transform().`,
      )
  }
}


/** @internal */
function transformAlign(node: ContainerDirective): IrAlign {
  const value = (node.attributes?.value ?? 'left') as IrAlign['value']

  return {
    type: 'align',
    value,
    children: (node.children as unknown as RootContent[]).map(transformBlock),
  }
}

/** @internal */
function transformPlaceholder(node: ContainerDirective): IrPlaceholder {
  return buildPlaceholderIr((node.attributes ?? {}) as Record<string, string>)
}

/** @internal */
function transformLoopValue(node: ContainerDirective): IrLoopValue {
  const raw = (node.attributes ?? {}) as Record<string, string>

  return {
    type: 'loopValue',
    original: raw['original'] ?? '',
    value: raw['value'] ?? '',
    index: raw['index'] ?? '',
    children: (node.children as unknown as RootContent[]).map(transformBlock),
  }
}

// ─── PUA token expansion ──────────────────────────────────────────────────────

/**
 * Expand a phrasing content node, splitting text nodes that contain PUA
 * inline-atom tokens into a sequence of IrText and IrInline atom nodes.
 */
function expandAndTransformInlineNode(node: PhrasingContent): IrInline[] {
  const asText = node as unknown as { type: string; value: string }

  if (asText.type === 'text' && asText.value.includes(ATOM_TOKEN_DELIMITER)) {
    return expandTokenizedText(asText.value)
  }

  return [transformInline(node)]
}

/**
 * Split a text string that contains `\uE000name\uE001attrs\uE000` tokens
 * into an array of IrText and IrInline atom nodes.
 */
function expandTokenizedText(text: string): IrInline[] {
  const result: IrInline[] = []
  const parts = text.split(ATOM_TOKEN_DELIMITER)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? ''

    if (i % 2 === 0) {
      // Plain text segment
      if (part.length > 0) {
        result.push({ type: 'text', value: part })
      }
    } else {
      // Token segment: "name\uE001rawAttrs"
      const sepIdx = part.indexOf(ATOM_TOKEN_SEPARATOR)
      const name = sepIdx >= 0 ? part.slice(0, sepIdx) : part
      const attrsStr = sepIdx >= 0 ? part.slice(sepIdx + 1) : ''

      result.push(transformAtomToken(name, attrsStr))
    }
  }

  return result
}

/**
 * Reconstruct an inline atom IR node from a PUA token's name and serialised attribute string.
 * @internal
 */
function transformAtomToken(name: string, attrsStr: string): IrPlaceholder | IrLoopValue {
  const raw = parseTokenAttrs(attrsStr)

  switch (name) {
    case 'placeholder':
      return buildPlaceholderIr(raw)

    case 'loop-value':
      return {
        type: 'loopValue',
        original: raw['original'] ?? '',
        value: raw['value'] ?? '',
        index: raw['index'] ?? '',
        children: [],
      }

    default:
      throw new Error(`Unknown inline atom token name "${name}"`)
  }
}

/** Parse a raw directive attrs string (e.g. `key="val" key2="val2"`) into a map. */
function parseTokenAttrs(attrsStr: string): Record<string, string | undefined> {
  // Restore colons that were escaped during preprocessing to avoid remark-directive
  // misidentifying `:name` sequences inside attr values as text directives.
  const decoded = attrsStr.replace(new RegExp(COLON_ESCAPE, 'g'), ':')
  const result: Record<string, string | undefined> = {}
  const re = /([\w-]+)=(?:"([^"]*)"|(\S+))/g
  let m: RegExpExecArray | null

  while ((m = re.exec(decoded)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    result[m[1] as string] = m[2] !== undefined ? m[2] : m[3]
  }

  return result
}

// ─── Inline transformer ───────────────────────────────────────────────────────

/** @internal */
function transformInline(node: PhrasingContent): IrInline {
  const type = node.type as string

  switch (type) {
    case 'text':
      return transformText(node as unknown as IrText)

    case 'break':
      return { type: 'hardBreak' }

    case 'textDirective':
      return transformTextDirective(node as unknown as TextDirective)

    default:
      throw new Error(
        `Unexpected inline node type "${type}". Run validate() before transform().`,
      )
  }
}

/** @internal */
function transformText(node: IrText): IrText {
  return { type: 'text', value: node.value }
}

// ─── Text directive transformer ───────────────────────────────────────────────

/** @internal */
function transformTextDirective(node: TextDirective): IrFont | IrLink {
  switch (node.name) {
    case 'font':
      return transformFont(node)

    case 'link':
      return transformLink(node)

    default:
      throw new Error(
        `Unknown text directive ":${node.name}". Run validate() before transform().`,
      )
  }
}

/** @internal */
function transformFont(node: TextDirective): IrFont {
  const raw = node.attributes ?? {}
  const attrs: FontAttrs = {}

  if (raw['font-family'] != null) attrs.fontFamily = raw['font-family']
  if (raw['font-size'] != null) attrs.fontSize = raw['font-size']
  if (raw['line-height'] != null) attrs.lineHeight = raw['line-height']
  if (raw['letter-spacing'] != null) attrs.letterSpacing = raw['letter-spacing']
  if (raw['font-style'] != null) attrs.fontStyle = raw['font-style'] as 'normal' | 'italic'
  if (raw['font-weight'] != null) attrs.fontWeight = raw['font-weight']
  if (raw['text-decoration'] != null) attrs.textDecoration = raw['text-decoration'] as 'none' | 'underline' | 'line-through'
  if (raw['color'] != null) attrs.color = raw['color']

  return {
    type: 'font',
    attrs,
    children: node.children.map(transformInline),
  }
}

/** @internal */
function transformLink(node: TextDirective): IrLink {
  const raw = node.attributes ?? {}
  const link: IrLink = {
    type: 'link',
    href: raw['href'] ?? '',
    children: node.children.map(transformInline),
  }

  if (raw['target'] === '_blank') {
    link.target = '_blank'
  }

  if (raw['no-tracked'] !== undefined && raw['no-tracked'] !== null) {
    link.noTracked = raw['no-tracked'] === 'true'
  }

  return link
}

// ─── Shared IR builders ───────────────────────────────────────────────────────

/**
 * Build an `IrPlaceholder` from a raw key→value directive attribute map.
 * @internal
 */
function buildPlaceholderIr(raw: Record<string, string | undefined>): IrPlaceholder {
  const attrs: PlaceholderAttrs = {
    type: raw['type'] as PlaceholderAttrs['type'],
    value: coerceAttrValue(raw['value']),
    name: raw['name'] ?? '',
    original: raw['original'] ?? '',
  }

  if (raw['max-length'] !== undefined) {
    attrs.maxLength = raw['max-length']
  }

  return { type: 'placeholder', attrs }
}

// ─── Attr value coercion ──────────────────────────────────────────────────────

/**
 * Coerce a directive attribute value the same way the Milkdown editor does:
 * - Missing attribute → `null`
 * - Numeric string (e.g. `"11"`) → number (`11`)
 * - Everything else → string as-is
 */
function coerceAttrValue(raw: string | undefined): string | number | null {
  if (raw === undefined) return null

  const n = Number(raw)

  if (raw.trim() !== '' && !Number.isNaN(n)) return n

  return raw
}
