/**
 * Public machine-readable RCML spec.
 *
 * Transforms the internal RCML_SCHEMA_SPEC into a stable public shape that
 * external consumers (MCP servers, doc generators, IDE tooling) can use to
 * understand supported tags, attributes, allowed values, and content rules —
 * without depending on internal validator details.
 *
 * The strict internal spec remains the single source of truth for structure
 * and validation. This module is purely a derived view.
 */

import { RCML_SCHEMA_SPEC, RcmlTagNamesEnum, TAGS_WITH_PM_CONTENT } from './schema/index.js'
import type { RcmlNodeSpec, RcmlTagCategory } from './schema/types.js'
import { RcmlAttributeValidatorsEnum as V } from './validator/attr-validators.js'

export type { RcmlTagCategory }

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** How a tag carries its child content. */
export type RcmlContentSpec =
  | { type: 'leaf' }
  | { type: 'rcml-content' }
  | { type: 'inline-rcml-content' }
  | { type: 'children'; allowedChildren: string[]; maxChildren?: number }

/** Public descriptor for a single attribute. */
export interface RcmlPublicAttrSpec {
  /** Validator type key, e.g. 'color', 'padding', 'px', 'enum'. */
  type: string
  /**
   * `true` when the attribute has no declared default value and should be provided explicitly.
   * Derived from the absence of a `default` in the internal schema — use as authoring guidance
   * rather than a strict validator constraint.
   */
  required: boolean
  /** Default value applied when the attribute is omitted. */
  default?: string | number | boolean | null
  /** Human-readable explanation of what the attribute does. */
  description: string
  /** Representative valid values. */
  examples?: string[]
  /** Allowed values — populated only for enum-type attributes. */
  allowedValues?: string[]
}

/** Public descriptor for a single RCML tag. */
export interface RcmlPublicTagSpec {
  /** Functional grouping for the tag. */
  category: RcmlTagCategory
  /** Human-readable description of what the tag does. */
  description: string
  /** How the tag holds its content (leaf / ProseMirror / children). */
  content: RcmlContentSpec
  /** Allowed attributes keyed by attribute name. */
  attributes: Record<string, RcmlPublicAttrSpec>
}

/** Top-level machine-readable RCML specification exported from @rule/rcml. */
export interface RcmlSpec {
  /** Spec format version — incremented when the shape of this object changes. */
  version: string
  /** All supported RCML tags keyed by tag name. */
  tags: Record<string, RcmlPublicTagSpec>
}

// ---------------------------------------------------------------------------
// Enum allowed-values map
// Replicates the enum membership from attr-validators.ts without importing
// the Zod schemas, keeping the public spec layer free of validator internals.
// ---------------------------------------------------------------------------

const ENUM_ALLOWED_VALUES: Partial<Record<V, string[]>> = {
  [V.Align]: ['left', 'center', 'right'],
  [V.TextAlign]: ['left', 'center', 'right', 'justify'],
  [V.VerticalAlign]: ['top', 'middle', 'bottom'],
  [V.Direction]: ['ltr', 'rtl'],
  [V.BackgroundRepeat]: ['repeat', 'no-repeat'],
  [V.FontStyle]: ['normal', 'italic', 'oblique'],
  [V.FontWeight]: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  [V.FullWidth]: ['full-width', 'false'],
  [V.HideSection]: ['desktop', 'mobile'],
  [V.FluidOnMobile]: ['true', 'false'],
  [V.SocialMode]: ['horizontal', 'vertical'],
  [V.SocialIconColor]: ['brand', 'black', 'white'],
  [V.SocialIconShape]: ['original', 'circle', 'square'],
  [V.TableLayout]: ['auto', 'fixed'],
  [V.Target]: ['_blank', '_self', '_parent', '_top'],
  [V.TextDecoration]: ['none', 'underline', 'overline', 'line-through'],
  [V.TextTransform]: ['capitalize', 'uppercase', 'lowercase'],
  [V.BorderStyle]: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
  [V.CaseType]: ['default', 'segment', 'tag', 'custom-field'],
  [V.CaseCondition]: ['eq', 'ne'],
  [V.LoopType]: ['news-feed', 'remote-content', 'custom-field', 'xml-doc'],
}

// ---------------------------------------------------------------------------
// Transformation
// ---------------------------------------------------------------------------

function buildRcmlSpec(): RcmlSpec {
  const tags: Record<string, RcmlPublicTagSpec> = {}

  for (const [tagName, nodeSpec] of Object.entries(RCML_SCHEMA_SPEC) as [string, RcmlNodeSpec][]) {
    // Content shape
    let content: RcmlContentSpec

    if (nodeSpec.isLeaf) {
      if (tagName === RcmlTagNamesEnum.Button) {
        content = { type: 'inline-rcml-content' }
      } else if (TAGS_WITH_PM_CONTENT.includes(tagName as never)) {
        content = { type: 'rcml-content' }
      } else {
        content = { type: 'leaf' }
      }
    } else {
      const entry: Extract<RcmlContentSpec, { type: 'children' }> = {
        type: 'children',
        allowedChildren: nodeSpec.validChildTypes ? [...nodeSpec.validChildTypes] : [],
      }

      if (typeof nodeSpec.maxChildCount === 'number') {
        entry.maxChildren = nodeSpec.maxChildCount
      }

      content = entry
    }

    // Attributes
    const attributes: Record<string, RcmlPublicAttrSpec> = {}

    for (const [attrName, attrSpec] of Object.entries(nodeSpec.attrs)) {
      const allowedValues = ENUM_ALLOWED_VALUES[attrSpec.validator as V]
      const entry: RcmlPublicAttrSpec = {
        type: attrSpec.validator,
        required: attrSpec.default === undefined,
        description: attrSpec.description ?? '',
      }

      if (attrSpec.default !== undefined) {
        entry.default = attrSpec.default
      }

      if (attrSpec.examples !== undefined && attrSpec.examples.length > 0) {
        entry.examples = attrSpec.examples
      }

      if (allowedValues !== undefined) {
        entry.allowedValues = allowedValues
      }

      attributes[attrName] = entry
    }

    tags[tagName] = {
      category: nodeSpec.category ?? 'content',
      description: nodeSpec.description ?? '',
      content,
      attributes,
    }
  }

  return { version: '0.1.0', tags }
}

/**
 * Machine-readable RCML specification.
 *
 * @example
 * ```ts
 * import { rcmlSpec } from '@rule/rcml'
 *
 * // Enumerate all supported tags
 * Object.keys(rcmlSpec.tags)
 *
 * // Inspect a tag
 * const section = rcmlSpec.tags['rc-section']
 * section.category        // 'layout'
 * section.content         // { type: 'children', allowedChildren: ['rc-column'], maxChildren: 20 }
 * section.attributes['padding'].type          // 'padding'
 * section.attributes['padding'].default       // '20px 0'
 * section.attributes['padding'].required      // false
 * ```
 * @public
 */
export const rcmlSpec: RcmlSpec = buildRcmlSpec()
