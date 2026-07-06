import { type Schema, type Node, type Mark } from 'prosemirror-model'
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
  IrFont,
  IrLink,
} from '../transformer/types.js'
import { rcmlSchema } from './schema.js'

/**
 * Convert a validated IR document into a real ProseMirror `Node`.
 *
 * The returned node's `.toJSON()` output exactly matches `doc.toJSON()` from the
 * Milkdown editor running the RFM preset, as documented in `ai-context/SCHEMA.md`.
 *
 * @param ir     - Typed IR produced by `transform()`
 * @param schema - Defaults to `rcmlSchema`; pass a custom schema only for testing
 * @returns      A ProseMirror document Node — call `.toJSON()` for serializable JSON
 *
 * @internal — Stage 3 of the pipeline; use {@link emailRfmToJson} or {@link emailInlineRfmToJson} instead.
 *
 * @example
 * ```ts
 * import { parseEmailRfm } from '../parser/parse.js'
 * import { transform } from '../transformer/transform.js'
 * import { convert } from './convert.js'
 *
 * const { ast } = parseEmailRfm(input)
 * const ir      = transform(ast)
 * const doc     = convert(ir)
 * const json    = doc.toJSON()   // matches editor's doc.toJSON()
 * ```
 */
export function convert(ir: IrDoc, schema: Schema = rcmlSchema): Node {
  return schema.node('doc', null, ir.children.map((b) => convertBlock(b, schema)))
}

// ─── Block converter ──────────────────────────────────────────────────────────

/**
 * Dispatch an IR block node to its specific converter.
 * Inline atoms at block level are wrapped in a synthetic paragraph.
 * @internal
 */
function convertBlock(node: IrBlock, schema: Schema): Node {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node, schema)

    case 'bulletList':
      return convertBulletList(node, schema)

    case 'orderedList':
      return convertOrderedList(node, schema)

    case 'align':
      return convertAlign(node, schema)

    // Inline atoms at block level — wrap in a synthetic paragraph
    case 'placeholder':
      return schema.node('paragraph', null, [convertPlaceholder(node, schema)])

    case 'loopValue':
      return schema.node('paragraph', null, [convertLoopValue(node, schema)])

    default:
      throw new Error(`Unexpected IR block type "${(node as { type: string }).type}"`)
  }
}

/** @internal */
function convertParagraph(node: IrParagraph, schema: Schema): Node {
  return schema.node('paragraph', null, flattenInline(node.children, schema, []))
}

/** @internal */
function convertBulletList(node: IrBulletList, schema: Schema): Node {
  return schema.node('bullet-list', null, node.children.map((item) => convertListItem(item, schema)))
}

/** @internal */
function convertOrderedList(node: IrOrderedList, schema: Schema): Node {
  return schema.node('ordered-list', null, node.children.map((item) => convertListItem(item, schema)))
}

/** @internal */
function convertListItem(node: IrListItem, schema: Schema): Node {
  return schema.node('list-item', null, node.children.map((b) => convertBlock(b, schema)))
}

/** @internal */
function convertAlign(node: IrAlign, schema: Schema): Node {
  return schema.node('align', { value: node.value }, node.children.map((b) => convertBlock(b, schema)))
}

// ─── Inline atom converters ───────────────────────────────────────────────────

/** @internal */
function convertPlaceholder(node: IrPlaceholder, schema: Schema): Node {
  return schema.node('placeholder', {
    type: node.attrs.type,
    value: node.attrs.value,
    name: node.attrs.name,
    original: node.attrs.original,
    'max-length': node.attrs.maxLength ?? null,
  })
}

/** @internal */
function convertLoopValue(node: IrLoopValue, schema: Schema): Node {
  return schema.node('loop-value', {
    original: node.original,
    value: node.value,
    index: node.index,
  })
}

// ─── Inline flattening ────────────────────────────────────────────────────────

/**
 * Flatten the IR inline tree into ProseMirror text nodes with accumulated marks.
 *
 * `IrFont` and `IrLink` are wrapping nodes in IR but **marks** in ProseMirror.
 * This function descends into them, accumulating marks, and emits a PM text node
 * only at each `IrText` leaf. `IrHardBreak` emits a `hardbreak` node.
 */
function flattenInline(nodes: IrInline[], schema: Schema, inherited: readonly Mark[]): Node[] {
  const result: Node[] = []

  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        if (node.value.length > 0) {
          result.push(schema.text(node.value, inherited.length > 0 ? [...inherited] : undefined))
        }

        break
      }

      case 'hardBreak':
        result.push(schema.node('hardbreak'))
        break

      case 'placeholder':
        result.push(convertPlaceholder(node, schema))
        break

      case 'loopValue':
        result.push(convertLoopValue(node, schema))
        break

      case 'font': {
        const mark = schema.mark('font', fontMarkAttrs(node))
        const nested = flattenInline(node.children, schema, [...inherited, mark])

        result.push(...nested)
        break
      }

      case 'link': {
        const mark = schema.mark('link', linkMarkAttrs(node))
        const nested = flattenInline(node.children, schema, [...inherited, mark])

        result.push(...nested)
        break
      }

      default:
        throw new Error(`Unexpected IR inline type "${(node as { type: string }).type}"`)
    }
  }

  return result
}

// ─── Mark attr builders ───────────────────────────────────────────────────────

/**
 * Map `IrFont` camelCase attrs to the hyphenated CSS attribute names expected by
 * the `font` ProseMirror mark schema.
 * @internal
 */
function fontMarkAttrs(node: IrFont): Record<string, string | null> {
  const a = node.attrs

  return {
    'font-family': a.fontFamily ?? null,
    'font-size': a.fontSize ?? null,
    'line-height': a.lineHeight ?? null,
    'letter-spacing': a.letterSpacing ?? null,
    'font-style': a.fontStyle ?? null,
    'font-weight': a.fontWeight ?? null,
    'text-decoration': a.textDecoration ?? null,
    color: a.color ?? null,
  }
}

/**
 * Map `IrLink` fields to the hyphenated attribute names expected by the `link`
 * ProseMirror mark schema.
 * @internal
 */
function linkMarkAttrs(node: IrLink): Record<string, string | null> {
  return {
    href: node.href,
    target: node.target ?? null,
    'no-tracked': node.noTracked !== undefined ? String(node.noTracked) : 'false',
  }
}
