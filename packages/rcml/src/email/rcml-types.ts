/**
 * Public API: canonical RCML node types, derived entirely from the schema in
 * `./schema/` and the Zod attribute validators in `./validator/`.
 *
 * Every `Rcml<Xxx>` interface in this file is built by the factories in
 * `./create-rcml-element.ts`. Attribute types are derived from Zod schemas
 * via {@link AttrValueOf} + {@link AttrsFor}, so the schema is the single
 * source of truth — there is no parallel hand-maintained type table.
 *
 * Naming distinguishes these types from the legacy `RCML<Xxx>` types in
 * `packages/rcml/src/types.ts`. The `email/` subtree does not reference the
 * legacy module; the legacy types will be replaced by these during the
 * larger rcml refactor.
 */

import type { z } from 'zod'
import { type RCML_SCHEMA_SPEC } from './schema/index.js'
import type { RcmlTagName } from './schema/tag-names.js'
import type {
  RCML_ATTR_VALIDATORS,
  RcmlAttributeValidatorsEnum,
} from './validator/attr-validators.js'
import type { Json } from './validate-rcml-json.js'

// ─── Attribute-value + attr-map derivation ──────────────────────────────────

/**
 * The TypeScript type accepted as input by the Zod validator keyed by `V`.
 * E.g. `AttrValueOf<V.Color>` is `string`, `AttrValueOf<V.Align>` is
 * `'left' | 'center' | 'right'`.
 * @public
 */
export type AttrValueOf<V extends RcmlAttributeValidatorsEnum> = z.input<
  (typeof RCML_ATTR_VALIDATORS)[V]
>

/**
 * The schema's map keys are typed as {@link RcmlTagNamesEnum} members (from
 * the computed-key syntax `[T.Text]: ...`). This helper converts a
 * {@link RcmlTagName} string literal (e.g. `'rc-text'`) to the matching
 * enum-member type so indexing into `typeof RCML_SCHEMA_SPEC` succeeds.
 */
type EnumKeyFor<T extends RcmlTagName> = Extract<
  keyof typeof RCML_SCHEMA_SPEC,
  { [K in keyof typeof RCML_SCHEMA_SPEC]: `${K & string}` extends T ? K : never }[keyof typeof RCML_SCHEMA_SPEC]
>

type SpecAttrs<T extends RcmlTagName> = (typeof RCML_SCHEMA_SPEC)[EnumKeyFor<T>]['attrs']

/**
 * The per-tag attribute map for factory options. Every attribute is optional
 * — the schema has no required marker; cross-attr invariants are the
 * caller's responsibility.
 * @public
 */
export type AttrsFor<T extends RcmlTagName> = {
  -readonly [K in keyof SpecAttrs<T>]?: SpecAttrs<T>[K] extends { validator: infer V }
    ? V extends RcmlAttributeValidatorsEnum
      ? AttrValueOf<V>
      : never
    : never
}

// ─── Root + head ────────────────────────────────────────────────────────────

/**
 * Minimal structural shape of an RCML document root.
 *
 * Lives here so vendor-contract `templateBuilder` return types stay
 * compatible without depending on the full rcml tree. `RcmlDocument`
 * (below) extends this interface; function-return covariance means any
 * function returning `RcmlDocument` also satisfies a position expecting
 * `RCMLDocumentRoot`.
 *
 * @public
 */
export interface RCMLDocumentRoot {
  readonly tagName: 'rcml'
}

/**
 * `<rcml>` document root. Extends {@link RCMLDocumentRoot} so
 * vendor-contract `templateBuilder` return types stay compatible.
 * @public
 */
export interface RcmlDocument extends RCMLDocumentRoot {
  id?: string
  tagName: 'rcml'
  children: [RcmlHead, RcmlBody]
}

/** Valid children of `<rc-head>`. @public */
export type RcmlHeadChild =
  | RcmlBrandStyle
  | RcmlAttributes
  | RcmlPreview
  | RcmlClass
  | RcmlFont
  | RcmlPlainText

/** `<rc-head>` container. @public */
export interface RcmlHead {
  id?: string
  tagName: 'rc-head'
  children: RcmlHeadChild[]
}

/** `<rc-brand-style>` — references a saved brand style by numeric id. @public */
export interface RcmlBrandStyle {
  id?: string
  tagName: 'rc-brand-style'
  attributes: AttrsFor<'rc-brand-style'>
}

/** `<rc-font>` — web-font declaration. @public */
export interface RcmlFont {
  id?: string
  tagName: 'rc-font'
  attributes: AttrsFor<'rc-font'>
}

/**
 * Nodes under `<rc-attributes>` carry only `attributes` — the editor omits
 * `children` and `content` for structural/content tags in this position.
 * `rc-social` keeps `children` required because downstream consumers iterate them.
 * @public
 */
export type RcmlAttributesChild =
  | (Omit<RcmlBody, 'children'> & { children?: RcmlBody['children'] })
  | (Omit<RcmlSection, 'children'> & { children?: RcmlSection['children'] })
  | (Omit<RcmlButton, 'content'> & { content?: RcmlButton['content'] })
  | (Omit<RcmlHeading, 'content'> & { content?: RcmlHeading['content'] })
  | (Omit<RcmlText, 'content'> & { content?: RcmlText['content'] })
  | RcmlSocial
  | RcmlClass

/** `<rc-attributes>` — holds default-attribute overrides and named classes. @public */
export interface RcmlAttributes {
  id?: string
  tagName: 'rc-attributes'
  children: RcmlAttributesChild[]
}

/** `<rc-preview>` — preheader text shown in inbox previews. @public */
export interface RcmlPreview {
  id?: string
  tagName: 'rc-preview'
  content?: string
}

/** `<rc-class>` — a named group of attributes applicable via the `rc-class` attribute. @public */
export interface RcmlClass {
  id?: string
  tagName: 'rc-class'
  attributes: AttrsFor<'rc-class'>
}

/** `<rc-plain-text>` — plain-text fallback body. @public */
export interface RcmlPlainText {
  id?: string
  tagName: 'rc-plain-text'
  content: { type: 'text'; text: string }
}

/** `<rc-raw>` — HTML escape hatch. @public */
export interface RcmlRaw {
  id?: string
  tagName: 'rc-raw'
  content?: { type: 'html'; text: string }
}

// ─── Body / structural ──────────────────────────────────────────────────────

/** Valid children of `<rc-body>`. @public */
export type RcmlBodyChild = RcmlSection | RcmlLoop | RcmlSwitch | RcmlWrapper

/** `<rc-body>` — email content root. @public */
export interface RcmlBody {
  id?: string
  tagName: 'rc-body'
  attributes?: AttrsFor<'rc-body'>
  children: RcmlBodyChild[]
}

/** Valid children of `<rc-section>`. @public */
export type RcmlSectionChild = RcmlColumn | RcmlGroup

/**
 * Structural shape of `<rc-section>`'s children: either a list of columns,
 * or a single group (never both, per the factory-level exclusivity guard
 * enforced by `createSectionElement`).
 * @public
 */
export type RcmlSectionChildren = readonly [RcmlGroup] | readonly RcmlColumn[]

/** `<rc-section>` — row container (up to 20 direct children per the schema). @public */
export interface RcmlSection {
  id?: string
  tagName: 'rc-section'
  attributes?: AttrsFor<'rc-section'>
  children: RcmlSectionChildren
}

/** Valid children of `<rc-column>`. @public */
export type RcmlColumnChild =
  | RcmlText
  | RcmlHeading
  | RcmlButton
  | RcmlImage
  | RcmlLogo
  | RcmlVideo
  | RcmlSpacer
  | RcmlDivider
  | RcmlSocial
  | RcmlLoop
  | RcmlRaw

/** `<rc-column>` — horizontal unit inside a section. @public */
export interface RcmlColumn {
  id?: string
  tagName: 'rc-column'
  attributes?: AttrsFor<'rc-column'>
  children: RcmlColumnChild[]
}

/** Valid children of `<rc-wrapper>`. @public */
export type RcmlWrapperChild = RcmlSection | RcmlSwitch

/** `<rc-wrapper>` — shared background + padding around sections/switches. @public */
export interface RcmlWrapper {
  id?: string
  tagName: 'rc-wrapper'
  attributes?: AttrsFor<'rc-wrapper'>
  children: RcmlWrapperChild[]
}

/** `<rc-group>` — non-responsive wrapper placed directly inside `<rc-section>`; keeps its columns side-by-side on mobile instead of stacking. @public */
export interface RcmlGroup {
  id?: string
  tagName: 'rc-group'
  children: RcmlColumn[]
}

// ─── Control flow ───────────────────────────────────────────────────────────

/** `<rc-switch>` — conditional-case container. @public */
export interface RcmlSwitch {
  id?: string
  tagName: 'rc-switch'
  children: RcmlCase[]
}

/** `<rc-case>` — one branch inside an `<rc-switch>`. @public */
export interface RcmlCase {
  id?: string
  tagName: 'rc-case'
  attributes: AttrsFor<'rc-case'>
  children: [RcmlSection]
}

/** `<rc-loop>` — iterates its sections over a data source. @public */
export interface RcmlLoop {
  id?: string
  tagName: 'rc-loop'
  attributes: AttrsFor<'rc-loop'>
  children: RcmlSection[]
}

// ─── Content leaves (carry a ProseMirror Json doc) ──────────────────────────

/** `<rc-text>` — body text whose content is a ProseMirror content doc. @public */
export interface RcmlText {
  id?: string
  tagName: 'rc-text'
  attributes?: AttrsFor<'rc-text'>
  content: Json
}

/** `<rc-heading>` — heading text whose content is a ProseMirror content doc. @public */
export interface RcmlHeading {
  id?: string
  tagName: 'rc-heading'
  attributes?: AttrsFor<'rc-heading'>
  content: Json
}

/** `<rc-button>` — clickable button whose label is a ProseMirror content doc. @public */
export interface RcmlButton {
  id?: string
  tagName: 'rc-button'
  attributes?: AttrsFor<'rc-button'>
  content: Json
}

// ─── Media / primitive leaves ───────────────────────────────────────────────

/** `<rc-image>` — responsive image. @public */
export interface RcmlImage {
  id?: string
  tagName: 'rc-image'
  attributes: AttrsFor<'rc-image'>
}

/** `<rc-logo>` — logo image (semantically identical to `<rc-image>`). @public */
export interface RcmlLogo {
  id?: string
  tagName: 'rc-logo'
  attributes?: AttrsFor<'rc-logo'>
}

/** `<rc-video>` — video thumbnail with a play-button overlay. @public */
export interface RcmlVideo {
  id?: string
  tagName: 'rc-video'
  attributes: AttrsFor<'rc-video'>
}

/** `<rc-spacer>` — vertical whitespace. @public */
export interface RcmlSpacer {
  id?: string
  tagName: 'rc-spacer'
  attributes?: AttrsFor<'rc-spacer'>
}

/** `<rc-divider>` — horizontal rule. @public */
export interface RcmlDivider {
  id?: string
  tagName: 'rc-divider'
  attributes?: AttrsFor<'rc-divider'>
}

// ─── Social ─────────────────────────────────────────────────────────────────

/** `<rc-social>` container around one or more `<rc-social-element>` children. @public */
export interface RcmlSocial {
  id?: string
  tagName: 'rc-social'
  attributes?: AttrsFor<'rc-social'>
  children: RcmlSocialElement[]
}

/** `<rc-social-element>` — a single social-network icon. @public */
export interface RcmlSocialElement {
  id?: string
  tagName: 'rc-social-element'
  attributes: AttrsFor<'rc-social-element'>
  /** Optional label text rendered next to the icon. */
  content?: string
}
