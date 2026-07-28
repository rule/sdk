/**
 * Internal: generator that turns the ported NodeSpec map into a JSON Schema
 * 2020-12 document AJV can compile.
 *
 * Emits one `$defs/<tag>` per known RCML tag. Child unions are expressed via
 * `$ref`s — JSON Schema handles recursion (e.g. `rc-wrapper → rc-section →
 * rc-column → rc-wrapper → …`) without extra cycle-detection logic.
 *
 * Attribute VALUES get loose constraints here (just `type: 'string'` /
 * `'number'` / `'boolean'` / `enum` when the Zod schema is a plain enum).
 * Rich per-attribute format checks live in `./attr-value-validate.ts`,
 * which owns the Zod schemas that don't cleanly round-trip to JSON Schema.
 *
 * For `rc-text` / `rc-heading` / `rc-button`, the `content` property is
 * permissive here; `./content-validate.ts` re-validates it properly.
 */

import { RCML_SCHEMA_SPEC, RcmlTagNamesEnum, TAGS_WITH_PM_CONTENT } from '../schema/index.js'
import type { RcmlNodeSpec, RcmlTagName } from '../schema/index.js'
import { RcmlAttributeValidatorsEnum } from './attr-validators.js'

/** Permissive view of an arbitrary JSON Schema fragment. */
type JsonSchema = Record<string, unknown>

/**
 * Coarse per-validator JSON Schema hints. Covers the "cheap" validators
 * (enums, plain string/number/bool). Complex ones (padding, border,
 * background-*) are left to {@link DEFAULT_ATTR_SCHEMA} and caught at runtime
 * by `./attr-value-validate.ts` via the matching Zod schema.
 */
const JSON_SCHEMA_BY_VALIDATOR: Partial<Record<RcmlAttributeValidatorsEnum, JsonSchema>> = {
  [RcmlAttributeValidatorsEnum.Boolean]: { type: 'boolean' },
  [RcmlAttributeValidatorsEnum.CaseActive]: { type: 'boolean' },
  [RcmlAttributeValidatorsEnum.CaseProperty]: { type: 'number' },
  [RcmlAttributeValidatorsEnum.CaseValue]: { type: ['string', 'number'] },
  [RcmlAttributeValidatorsEnum.LoopValue]: { type: ['string', 'number'] },
  [RcmlAttributeValidatorsEnum.Align]: { enum: ['left', 'center', 'right'] },
  [RcmlAttributeValidatorsEnum.TextAlign]: { enum: ['left', 'center', 'right', 'justify'] },
  [RcmlAttributeValidatorsEnum.VerticalAlign]: { enum: ['top', 'middle', 'bottom'] },
  [RcmlAttributeValidatorsEnum.Direction]: { enum: ['ltr', 'rtl'] },
  [RcmlAttributeValidatorsEnum.BackgroundRepeat]: { enum: ['repeat', 'no-repeat'] },
  [RcmlAttributeValidatorsEnum.FontStyle]: { enum: ['normal', 'italic', 'oblique'] },
  [RcmlAttributeValidatorsEnum.FontWeight]: {
    enum: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  },
  [RcmlAttributeValidatorsEnum.FullWidth]: { enum: ['full-width', 'false'] },
  [RcmlAttributeValidatorsEnum.HideSection]: { enum: ['desktop', 'mobile'] },
  [RcmlAttributeValidatorsEnum.FluidOnMobile]: { enum: ['true', 'false'] },
  [RcmlAttributeValidatorsEnum.SocialMode]: { enum: ['horizontal', 'vertical'] },
  [RcmlAttributeValidatorsEnum.SocialIconColor]: { enum: ['brand', 'black', 'white'] },
  [RcmlAttributeValidatorsEnum.SocialIconShape]: { enum: ['original', 'circle', 'square'] },
  [RcmlAttributeValidatorsEnum.TableLayout]: { enum: ['auto', 'fixed'] },
  [RcmlAttributeValidatorsEnum.Target]: { enum: ['_blank', '_self', '_parent', '_top'] },
  [RcmlAttributeValidatorsEnum.TextDecoration]: {
    enum: ['none', 'underline', 'overline', 'line-through'],
  },
  [RcmlAttributeValidatorsEnum.TextTransform]: {
    enum: ['capitalize', 'uppercase', 'lowercase'],
  },
  [RcmlAttributeValidatorsEnum.BorderStyle]: {
    enum: ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
  },
  [RcmlAttributeValidatorsEnum.CaseType]: {
    enum: ['default', 'segment', 'tag', 'custom-field'],
  },
  [RcmlAttributeValidatorsEnum.CaseCondition]: { enum: ['eq', 'ne'] },
  [RcmlAttributeValidatorsEnum.LoopType]: {
    enum: ['news-feed', 'remote-content', 'custom-field', 'xml-doc'],
  },
  [RcmlAttributeValidatorsEnum.PositiveNumber]: { type: ['string', 'number'] },
  [RcmlAttributeValidatorsEnum.LoopMaxIterations]: { type: ['string', 'number'] },
}

/** Fallback attribute schema for validators without a cheap JSON Schema hint. */
const DEFAULT_ATTR_SCHEMA: JsonSchema = { type: 'string' }

/** Suffix appended to `$defs` keys for attribute-override schema variants. */
const ATTR_OVERRIDE_SUFFIX = '-attr'

/**
 * Build the `attributes` object schema for one RCML tag by mapping each
 * allowed attribute to a loose JSON Schema constraint based on its Zod
 * validator. `additionalProperties: false` rejects unknown attrs.
 */
function buildAttrsSchema(spec: RcmlNodeSpec): JsonSchema {
  const properties: Record<string, JsonSchema> = {}

  for (const [name, attr] of Object.entries(spec.attrs)) {
    properties[name] = JSON_SCHEMA_BY_VALIDATOR[attr.validator] ?? DEFAULT_ATTR_SCHEMA
  }

  return {
    type: 'object',
    properties,
    additionalProperties: false,
  }
}

/**
 * Build the `children` array schema for one non-leaf tag. Uses `$ref` to
 * reference each allowed child tag by name, and applies `maxItems` when the
 * NodeSpec caps the child count.
 *
 * When `useAttrOverride` is true (only for `rc-attributes`), child refs point
 * to the `*-attr` override schemas so that attribute-default nodes don't need
 * `children` / `content`.
 */
function buildChildrenSchema(spec: RcmlNodeSpec, useAttrOverride = false): JsonSchema {
  const childTypes = spec.validChildTypes ?? []
  const refFor = (t: string): string => (useAttrOverride ? `${t}${ATTR_OVERRIDE_SUFFIX}` : t)
  const items: JsonSchema =
    childTypes.length === 0
      ? { type: 'object', not: { type: 'object' } } // empty children only
      : childTypes.length === 1 && childTypes[0]
        ? { $ref: `#/$defs/${refFor(childTypes[0])}` }
        : {
            type: 'object',
            discriminator: { propertyName: 'tagName' },
            oneOf: childTypes.map((t) => ({ $ref: `#/$defs/${refFor(t)}` })),
          }

  const schema: JsonSchema = {
    type: 'array',
    items,
  }

  if (typeof spec.maxChildCount === 'number') {
    schema['maxItems'] = spec.maxChildCount
  }

  return schema
}

/**
 * Build the `children` array schema specifically for `rc-section`.
 *
 * `rc-section` has exclusive child shapes:
 *   - a list of `rc-column[]` (0–maxChildCount), OR
 *   - a single-item array containing one `rc-group`
 *
 * Mixed arrays like `[rc-column, rc-group]` and multi-group arrays are
 * rejected by `createSectionElement` at build time; this schema mirrors
 * that contract so `safeValidateEmailTemplate` rejects them too. The
 * factory-level cardinality rules and the JSON Schema now agree.
 *
 * The generic `buildChildrenSchema` treats children as an array with
 * per-item discriminated union — enough for tags whose children shape
 * is uniform (e.g. rc-column, rc-body), but not expressive enough for
 * rc-section's exclusivity.
 */
function buildSectionChildrenSchema(spec: RcmlNodeSpec): JsonSchema {
  const maxItems = spec.maxChildCount

  const columnsShape: JsonSchema = {
    type: 'array',
    items: { $ref: `#/$defs/${RcmlTagNamesEnum.Column}` },
    ...(typeof maxItems === 'number' ? { maxItems } : {}),
  }

  const groupShape: JsonSchema = {
    type: 'array',
    minItems: 1,
    maxItems: 1,
    items: { $ref: `#/$defs/${RcmlTagNamesEnum.Group}` },
  }

  return {
    oneOf: [columnsShape, groupShape],
  }
}

/**
 * Non-ProseMirror content schemas for tags that carry a `content` property
 * with a plain string or a structured-but-non-PM object.
 *
 * Each entry:
 *  - `schema`   — the JSON Schema that validates the `content` value.
 *  - `required` — whether the property must be present (mirrors the
 *                 TypeScript type: required for `rc-plain-text`, optional for
 *                 `rc-preview` and `rc-raw`).
 */
const TAGS_WITH_SIMPLE_CONTENT: Partial<
  Record<RcmlTagName, { schema: JsonSchema; required: boolean }>
> = {
  [RcmlTagNamesEnum.Preview]: {
    schema: { type: 'string' },
    required: false,
  },
  [RcmlTagNamesEnum.PlainText]: {
    schema: {
      type: 'object',
      properties: {
        type: { const: 'text' },
        text: { type: 'string' },
      },
      required: ['type', 'text'],
      additionalProperties: false,
    },
    required: true,
  },
  [RcmlTagNamesEnum.Raw]: {
    schema: { type: 'string' },
    required: false,
  },
}

/**
 * Build the complete JSON Schema for one RCML tag — its `tagName` const,
 * `attributes` bag, optional `children` array or `content` ProseMirror doc.
 * `additionalProperties: false` rejects anything else.
 */
function buildTagSchema(tagName: RcmlTagName, spec: RcmlNodeSpec): JsonSchema {
  const properties: Record<string, JsonSchema> = {
    id: { type: 'string' },
    tagName: { const: tagName },
    attributes: buildAttrsSchema(spec),
  }

  const required: string[] = ['tagName']

  if (!spec.isLeaf) {
    // rc-attributes children are attribute-default nodes; reference the
    // permissive *-attr override schemas so editor-generated nodes that lack
    // children/content still pass.
    const isAttrParent = tagName === RcmlTagNamesEnum.Attributes
    // rc-section has exclusive child shapes (columns[] OR [group]); the
    // generic per-item union isn't expressive enough to reject mixed
    // arrays, so use the specialised schema builder here.
    const isSection = tagName === RcmlTagNamesEnum.Section

    properties['children'] = isSection
      ? buildSectionChildrenSchema(spec)
      : buildChildrenSchema(spec, isAttrParent)
    required.push('children')
  }

  if (TAGS_WITH_PM_CONTENT.includes(tagName)) {
    properties['content'] = {} // accept-anything; validated by content-validate.ts
    required.push('content')
  }

  const simpleContent = TAGS_WITH_SIMPLE_CONTENT[tagName]

  if (simpleContent !== undefined) {
    properties['content'] = simpleContent.schema
    if (simpleContent.required) required.push('content')
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  }
}

/**
 * Build an "attribute-override" schema variant for one RCML tag. Used for
 * nodes that appear as attribute-default children of `<rc-attributes>`.
 * These nodes carry only `attributes`; `children` and `content` are allowed
 * but NOT required, so editor-generated RCML that omits them still validates.
 */
function buildAttrOverrideTagSchema(tagName: RcmlTagName, spec: RcmlNodeSpec): JsonSchema {
  const properties: Record<string, JsonSchema> = {
    id: { type: 'string' },
    tagName: { const: tagName },
    attributes: buildAttrsSchema(spec),
  }

  const required: string[] = ['tagName']

  if (!spec.isLeaf) {
    properties['children'] = buildChildrenSchema(spec)

    // rc-social children are always required — downstream consumers iterate them
    // (e.g. link extraction, social overlay logic). Only structural/content tags
    // (rc-body, rc-section, rc-text, rc-heading, rc-button) legitimately omit
    // children/content in attribute-default position.
    if (tagName === RcmlTagNamesEnum.Social) {
      required.push('children')
    }
  }

  if (TAGS_WITH_PM_CONTENT.includes(tagName)) {
    properties['content'] = {}
  }

  return {
    type: 'object',
    properties,
    required,
    additionalProperties: false,
  }
}

/**
 * Complete JSON Schema 2020-12 describing an RcmlDocument (rooted at `rcml`).
 * AJV can compile this once at startup and validate any input against it.
 */
export const RCML_JSON_SCHEMA: JsonSchema = (() => {
  const $defs: Record<string, JsonSchema> = {}

  for (const tagName of Object.values(RcmlTagNamesEnum)) {
    const spec = RCML_SCHEMA_SPEC[tagName]

    $defs[tagName] = buildTagSchema(tagName, spec)
  }

  // Generate attribute-override schemas (key = `${tagName}-attr`) for every
  // tag that can appear as an attribute-default child of <rc-attributes>.
  // These are identical to the regular schemas except that `children` and
  // `content` are not required, matching the shape the editor emits.
  const attrChildTypes = RCML_SCHEMA_SPEC[RcmlTagNamesEnum.Attributes].validChildTypes ?? []

  for (const tagName of attrChildTypes) {
    const spec = RCML_SCHEMA_SPEC[tagName as RcmlTagName]

    $defs[`${tagName}${ATTR_OVERRIDE_SUFFIX}`] = buildAttrOverrideTagSchema(
      tagName as RcmlTagName,
      spec,
    )
  }

  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'rcml-email-template',
    $ref: `#/$defs/${RcmlTagNamesEnum.Rcml}`,
    $defs,
  }
})()
