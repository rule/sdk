/**
 * Public API: schema-grounded factories for composing RCML one element at a
 * time.
 *
 * Each `create<Xxx>Element` returns a single RCML node validated against the
 * canonical schema in `./schema/`. Invalid input throws
 * {@link RcmlElementBuildError} at the call site — consumers never have to
 * wait for a downstream {@link validateEmailTemplate}
 * pass to discover an unknown attribute or a wrong child tag.
 *
 * Two families:
 * - **Element factories** — 28 `create<Xxx>Element` functions, one per RCML
 *   tag in `RcmlTagNamesEnum`. Each returns the appropriate RCML type.
 * - **Content helpers** — inline-node builders (`createTextNode`,
 *   `createPlaceholderNode`, `createLoopValueNode`) plus the doc-wrapping
 *   helpers (`createInlineContent`, `createTextContent`) used to construct
 *   the `content` option of {@link createTextElement}, {@link createHeadingElement},
 *   {@link createButtonElement}.
 */

import { emailRfmToJson } from './email-rfm-to-json.js'
import type {
  RcmlAttributes,
  RcmlBody,
  RcmlBodyChild,
  RcmlBrandStyle,
  RcmlButton,
  RcmlCase,
  RcmlClass,
  RcmlColumn,
  RcmlColumnChild,
  RcmlDivider,
  RcmlDocument,
  RcmlFont,
  RcmlGroup,
  RcmlHead,
  RcmlHeading,
  RcmlImage,
  RcmlLogo,
  RcmlLoop,
  RcmlPlainText,
  RcmlPreview,
  RcmlRaw,
  RcmlSection,
  RcmlSocial,
  RcmlSocialElement,
  RcmlSpacer,
  RcmlSwitch,
  RcmlText,
  RcmlVideo,
  RcmlWrapper,
} from './rcml-types.js'
import type {
  InlineNode,
  Json,
  LoopValueNode,
  PlaceholderNode,
  TextNode,
} from './validate-rcml-json.js'
import { normalizeJson, validateJson } from './validate-rcml-json.js'
import {
  coerceContent,
  normalizeAttrs,
  RcmlElementBuildError,
  RcmlElementBuildErrorCodes,
  throwIfIssues,
  validateAttrs,
  validateChildren,
  type AttrValue,
  type RcmlElementBuildErrorCode,
  type RcmlElementBuildIssue,
} from './builders/index.js'

// ─── Error surface (re-exported @public) ────────────────────────────────────

/**
 * Thrown by every `create<Xxx>Element` factory when supplied options violate
 * the tag's schema (unknown attr, invalid attr value, wrong child tag, too
 * many children, invalid or missing content).
 * @public
 */
export { RcmlElementBuildError }

/**
 * Enumeration of issue codes attached to {@link RcmlElementBuildError.issues}.
 * @public
 */
export { RcmlElementBuildErrorCodes }

/**
 * Union type of {@link RcmlElementBuildErrorCodes} values.
 * @public
 */
export type { RcmlElementBuildErrorCode }

/**
 * One entry in {@link RcmlElementBuildError.issues}.
 * @public
 */
export type { RcmlElementBuildIssue }

// ─── Per-tag attribute types (aliased from ../types.ts where available) ─────

/** Attributes accepted by {@link createTextElement}. @public */
export type TextElementAttrs = NonNullable<RcmlText['attributes']>
/** Attributes accepted by {@link createHeadingElement}. @public */
export type HeadingElementAttrs = NonNullable<RcmlHeading['attributes']>
/** Attributes accepted by {@link createButtonElement}. @public */
export type ButtonElementAttrs = NonNullable<RcmlButton['attributes']>
/** Attributes accepted by {@link createImageElement} (schema expects `src`). @public */
export type ImageElementAttrs = RcmlImage['attributes']
/** Attributes accepted by {@link createLogoElement}. @public */
export type LogoElementAttrs = NonNullable<RcmlLogo['attributes']>
/** Attributes accepted by {@link createVideoElement} (schema expects `src`). @public */
export type VideoElementAttrs = RcmlVideo['attributes']
/** Attributes accepted by {@link createSpacerElement}. @public */
export type SpacerElementAttrs = NonNullable<RcmlSpacer['attributes']>
/** Attributes accepted by {@link createDividerElement}. @public */
export type DividerElementAttrs = NonNullable<RcmlDivider['attributes']>
/** Attributes accepted by {@link createSocialElement}. @public */
export type SocialElementAttrs = NonNullable<RcmlSocial['attributes']>
/** Attributes accepted by {@link createSocialChildElement} (schema expects `name`, `href`). @public */
export type SocialChildElementAttrs = RcmlSocialElement['attributes']
/** Attributes accepted by {@link createSectionElement}. @public */
export type SectionElementAttrs = NonNullable<RcmlSection['attributes']>
/** Attributes accepted by {@link createColumnElement}. @public */
export type ColumnElementAttrs = NonNullable<RcmlColumn['attributes']>
/** Attributes accepted by {@link createBodyElement}. @public */
export type BodyElementAttrs = NonNullable<RcmlBody['attributes']>
/** Attributes accepted by {@link createLoopElement}. @public */
export type LoopElementAttrs = RcmlLoop['attributes']
/** Attributes accepted by {@link createCaseElement}. @public */
export type CaseElementAttrs = RcmlCase['attributes']
/** Attributes accepted by {@link createBrandStyleElement}. @public */
export type BrandStyleElementAttrs = RcmlBrandStyle['attributes']
/** Attributes accepted by {@link createFontElement}. @public */
export type FontElementAttrs = RcmlFont['attributes']
/** Attributes accepted by {@link createClassElement}. @public */
export type ClassElementAttrs = RcmlClass['attributes']

/** Attributes accepted by {@link createWrapperElement}. @public */
export type WrapperElementAttrs = NonNullable<RcmlWrapper['attributes']>

// ─── Option-bag types (@public) ─────────────────────────────────────────────

/** Options accepted by {@link createTextElement}. @public */
export interface TextElementOptions {
  attrs?: TextElementAttrs
  content: string | Json
}
/** Options accepted by {@link createHeadingElement}. @public */
export interface HeadingElementOptions {
  attrs?: HeadingElementAttrs
  content: string | Json
}
/** Options accepted by {@link createButtonElement}. @public */
export interface ButtonElementOptions {
  attrs?: ButtonElementAttrs
  content: string | Json
}
/** Options accepted by {@link createImageElement}. @public */
export interface ImageElementOptions {
  attrs: ImageElementAttrs
}
/** Options accepted by {@link createLogoElement}. @public */
export interface LogoElementOptions {
  attrs?: LogoElementAttrs
}
/** Options accepted by {@link createVideoElement}. @public */
export interface VideoElementOptions {
  attrs: VideoElementAttrs
}
/** Options accepted by {@link createSpacerElement}. @public */
export interface SpacerElementOptions {
  attrs?: SpacerElementAttrs
}
/** Options accepted by {@link createDividerElement}. @public */
export interface DividerElementOptions {
  attrs?: DividerElementAttrs
}
/** Options accepted by {@link createSocialElement}. @public */
export interface SocialElementOptions {
  attrs?: SocialElementAttrs
  children: readonly RcmlSocialElement[]
}
/** Options accepted by {@link createSocialChildElement}. @public */
export interface SocialChildElementOptions {
  attrs: SocialChildElementAttrs
  /** Optional label text rendered next to the icon. */
  content?: string
}
/** Options accepted by {@link createSectionElement}. @public */
export interface SectionElementOptions {
  attrs?: SectionElementAttrs
  children: readonly RcmlColumn[]
}
/** Options accepted by {@link createColumnElement}. @public */
export interface ColumnElementOptions {
  attrs?: ColumnElementAttrs
  children: readonly RcmlColumnChild[]
}
/** Options accepted by {@link createBodyElement}. @public */
export interface BodyElementOptions {
  attrs?: BodyElementAttrs
  children: readonly RcmlBodyChild[]
}
/** Options accepted by {@link createHeadElement}. @public */
export interface HeadElementOptions {
  children: readonly NonNullable<RcmlHead['children']>[number][]
}
/** Options accepted by {@link createLoopElement}. @public */
export interface LoopElementOptions {
  attrs: LoopElementAttrs
  children: readonly RcmlSection[]
}
/** Options accepted by {@link createSwitchElement}. @public */
export interface SwitchElementOptions {
  children: readonly RcmlCase[]
}
/** Options accepted by {@link createCaseElement}. @public */
export interface CaseElementOptions {
  attrs: CaseElementAttrs
  children: readonly [RcmlSection]
}
/** Options accepted by {@link createGroupElement}. @public */
export interface GroupElementOptions {
  children: readonly RcmlColumn[]
}
/** Options accepted by {@link createWrapperElement}. @public */
export interface WrapperElementOptions {
  attrs?: WrapperElementAttrs
  children: readonly (RcmlSection | RcmlSwitch)[]
}
/** Options accepted by {@link createBrandStyleElement}. @public */
export interface BrandStyleElementOptions {
  attrs: BrandStyleElementAttrs
}
/** Options accepted by {@link createFontElement}. @public */
export interface FontElementOptions {
  attrs: FontElementAttrs
}
/** Options accepted by {@link createAttributesElement}. @public */
export interface AttributesElementOptions {
  children: readonly NonNullable<RcmlAttributes['children']>[number][]
}
/** Options accepted by {@link createPreviewElement}. @public */
export interface PreviewElementOptions {
  /** Preheader text rendered verbatim. */
  content?: string
}
/** Options accepted by {@link createClassElement}. @public */
export interface ClassElementOptions {
  attrs: ClassElementAttrs
}
/** Options accepted by {@link createPlainTextElement}. @public */
export interface PlainTextElementOptions {
  /** Plain-text fallback body rendered by mail clients. */
  content: string
}
/** Options accepted by {@link createRawElement}. @public */
export interface RawElementOptions {
  content?: string
}
/** Options accepted by {@link createRcmlDocumentElement}. @public */
export interface RcmlDocumentElementOptions {
  head: RcmlHead
  body: RcmlBody
}

// ─── Shared assembly helpers (internal to this file) ────────────────────────

type AttrMap = Readonly<Record<string, AttrValue | undefined>> | undefined

function collectAttrIssues(tag: Parameters<typeof validateAttrs>[0], attrs: AttrMap): RcmlElementBuildIssue[] {
  return validateAttrs(tag, attrs as Readonly<Record<string, AttrValue | undefined>> | undefined)
}

// ─── Content leaves ─────────────────────────────────────────────────────────

/**
 * Build an `<rc-text>` element.
 *
 * @param options - Attribute map + content (RFM markdown string or pre-built
 *   content `Json` from {@link createInlineContent} / {@link createTextContent}).
 * @returns A typed {@link RcmlText} node.
 * @throws {RcmlElementBuildError} When attrs or content fail validation.
 *
 * @example
 * ```ts
 * createTextElement({ attrs: { align: 'center' }, content: 'Hello **world**' })
 * ```
 * @public
 */
export function createTextElement(options: TextElementOptions): RcmlText {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-text', options.attrs))
  const contentResult = coerceContent(options.content)

  issues.push(...contentResult.issues)
  throwIfIssues('rc-text', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlText['attributes']
  const node: RcmlText = {
    tagName: 'rc-text',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    content: contentResult.json!,
  }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-heading>` element. Semantically a heading rather than body
 * text, but structurally identical to {@link createTextElement} — both carry
 * a ProseMirror content doc and accept the same CSS-style attrs.
 *
 * @param options - Attribute map + content (RFM markdown string or pre-built
 *   content `Json` from {@link createInlineContent} / {@link createTextContent}).
 * @returns A typed {@link RcmlHeading} node.
 * @throws {RcmlElementBuildError} When attrs are unknown / have invalid
 *   values, or content fails to parse / validate.
 *
 * @example
 * ```ts
 * createHeadingElement({
 *   attrs: { align: 'center', color: '#1a1a1a', 'font-size': '28px' },
 *   content: 'Welcome',
 * })
 * ```
 * @public
 */
export function createHeadingElement(options: HeadingElementOptions): RcmlHeading {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-heading', options.attrs))
  const contentResult = coerceContent(options.content)

  issues.push(...contentResult.issues)
  throwIfIssues('rc-heading', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlHeading['attributes']
  const node: RcmlHeading = {
    tagName: 'rc-heading',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    content: contentResult.json!,
  }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-button>` element — a clickable button whose label is a
 * ProseMirror content doc. The schema declares `href` but does not require
 * it syntactically; pass it via `attrs.href` to produce a clickable button.
 *
 * @param options - Attribute map (including `attrs.href` for the link target)
 *   + content (RFM markdown string or pre-built content `Json`).
 * @returns A typed {@link RcmlButton} node.
 * @throws {RcmlElementBuildError} When attrs are unknown / have invalid
 *   values, or content fails to parse / validate.
 *
 * @example
 * ```ts
 * createButtonElement({
 *   attrs: { href: 'https://example.com', 'background-color': '#0066cc' },
 *   content: 'Shop now',
 * })
 * ```
 * @public
 */
export function createButtonElement(options: ButtonElementOptions): RcmlButton {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-button', options.attrs))
  const contentResult = coerceContent(options.content)

  issues.push(...contentResult.issues)
  throwIfIssues('rc-button', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlButton['attributes']
  const node: RcmlButton = {
    tagName: 'rc-button',
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    content: contentResult.json!,
  }

  if (attributes) node.attributes = attributes

  return node
}

// ─── Media / primitive leaves ───────────────────────────────────────────────

/**
 * Build an `<rc-image>` element — a responsive image in the email body.
 * `attrs.src` is expected (the schema validates URL format when provided);
 * an image without `src` renders nothing in the Rule.io editor.
 *
 * @param options - Attribute map. `attrs.src` is the image URL; other attrs
 *   control alignment, sizing, padding, optional link target (`href`), etc.
 * @returns A typed {@link RcmlImage} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createImageElement({
 *   attrs: {
 *     src: 'https://cdn.example.com/hero.png',
 *     alt: 'Summer sale banner',
 *     width: '600px',
 *   },
 * })
 * ```
 * @public
 */
export function createImageElement(options: ImageElementOptions): RcmlImage {
  const issues = collectAttrIssues('rc-image', options.attrs)

  throwIfIssues('rc-image', issues)

  return {
    tagName: 'rc-image',
    attributes: normalizeAttrs(options.attrs) as RcmlImage['attributes'],
  }
}

/**
 * Build an `<rc-logo>` element — semantically identical to `rc-image` but
 * conventionally used to slot the brand logo. `attrs.src` can be provided
 * directly, or the logo can inherit its source via `attrs.rc-class` linking
 * to an `<rc-class>` declared in `<rc-head>`.
 *
 * @param options - Optional attribute map. Omit entirely for a bare
 *   `<rc-logo />` that inherits from the brand-style context.
 * @returns A typed {@link RcmlLogo} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createLogoElement({ attrs: { src: 'https://cdn.example.com/logo.png', width: '96px' } })
 * createLogoElement()  // inherits from brand-style's rc-class
 * ```
 * @public
 */
export function createLogoElement(options: LogoElementOptions = {}): RcmlLogo {
  const issues = collectAttrIssues('rc-logo', options.attrs)

  throwIfIssues('rc-logo', issues)
  const attributes = normalizeAttrs(options.attrs) as RcmlLogo['attributes']
  const node: RcmlLogo = { tagName: 'rc-logo' }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-video>` element — a video thumbnail rendered as an image
 * with a play-button overlay. `attrs.src` is the thumbnail URL;
 * `attrs.button-url` is the video destination (clicking the play button
 * sends the recipient there).
 *
 * @param options - Attribute map. `attrs.src` (thumbnail) is expected;
 *   `attrs.button-url` supplies the play-button link target.
 * @returns A typed {@link RcmlVideo} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createVideoElement({
 *   attrs: {
 *     src: 'https://cdn.example.com/thumb.png',
 *     'button-url': 'https://youtu.be/example',
 *   },
 * })
 * ```
 * @public
 */
export function createVideoElement(options: VideoElementOptions): RcmlVideo {
  const issues = collectAttrIssues('rc-video', options.attrs)

  throwIfIssues('rc-video', issues)

  return {
    tagName: 'rc-video',
    attributes: normalizeAttrs(options.attrs) as RcmlVideo['attributes'],
  }
}

/**
 * Build an `<rc-spacer>` element — a block of vertical whitespace. Height
 * defaults to `32px` when `attrs.height` is omitted.
 *
 * @param options - Optional attribute map. `attrs.height` sets the vertical
 *   gap; padding attrs add additional surrounding space.
 * @returns A typed {@link RcmlSpacer} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createSpacerElement({ attrs: { height: '24px' } })
 * ```
 * @public
 */
export function createSpacerElement(options: SpacerElementOptions = {}): RcmlSpacer {
  const issues = collectAttrIssues('rc-spacer', options.attrs)

  throwIfIssues('rc-spacer', issues)
  const attributes = normalizeAttrs(options.attrs) as RcmlSpacer['attributes']
  const node: RcmlSpacer = { tagName: 'rc-spacer' }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-divider>` element — a horizontal rule. Defaults to a 1px
 * solid black line spanning 100% width when attrs are omitted.
 *
 * @param options - Optional attribute map. `attrs.border-color`,
 *   `attrs.border-style`, `attrs.border-width`, and `attrs.width` control
 *   the rule's appearance.
 * @returns A typed {@link RcmlDivider} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createDividerElement({ attrs: { 'border-color': '#cccccc', 'border-width': '1px' } })
 * ```
 * @public
 */
export function createDividerElement(options: DividerElementOptions = {}): RcmlDivider {
  const issues = collectAttrIssues('rc-divider', options.attrs)

  throwIfIssues('rc-divider', issues)
  const attributes = normalizeAttrs(options.attrs) as RcmlDivider['attributes']
  const node: RcmlDivider = { tagName: 'rc-divider' }

  if (attributes) node.attributes = attributes

  return node
}

// ─── Social ─────────────────────────────────────────────────────────────────

/**
 * Build an `<rc-social>` container — holds one or more
 * `<rc-social-element>` children (each an icon link), laid out horizontally
 * or vertically depending on `attrs.mode`.
 *
 * @param options - `options.children` is the list of icon-link children
 *   (typically produced by {@link createSocialChildElement}); `options.attrs`
 *   controls layout / icon sizing / spacing.
 * @returns A typed {@link RcmlSocial} node.
 * @throws {RcmlElementBuildError} When attrs are invalid, or any child is
 *   not an `<rc-social-element>`.
 *
 * @example
 * ```ts
 * createSocialElement({
 *   attrs: { mode: 'horizontal', align: 'center' },
 *   children: [
 *     createSocialChildElement({ attrs: { name: 'twitter', href: 'https://twitter.com/x' } }),
 *     createSocialChildElement({ attrs: { name: 'facebook', href: 'https://facebook.com/x' } }),
 *   ],
 * })
 * ```
 * @public
 */
export function createSocialElement(options: SocialElementOptions): RcmlSocial {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-social', options.attrs))
  issues.push(...validateChildren('rc-social', options.children))
  throwIfIssues('rc-social', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlSocial['attributes']
  const node: RcmlSocial = {
    tagName: 'rc-social',
    children: [...options.children],
  }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build a single `<rc-social-element>` — one social-network icon link, used
 * as a child of an `<rc-social>` container. `attrs.name` identifies the
 * network (drives the default icon); `attrs.href` is the link target.
 *
 * The factory name is intentionally distinct from the `rc-social` container
 * factory ({@link createSocialElement}) to avoid the repetitive
 * `createSocialElementElement` form the literal schema name would imply.
 *
 * @param options - `options.attrs` carries the network name and link URL;
 *   `options.content` is an optional label rendered next to the icon.
 * @returns A typed {@link RcmlSocialElement} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createSocialChildElement({
 *   attrs: { name: 'instagram', href: 'https://instagram.com/example' },
 *   content: 'Follow us',
 * })
 * ```
 * @public
 */
export function createSocialChildElement(options: SocialChildElementOptions): RcmlSocialElement {
  const issues = collectAttrIssues('rc-social-element', options.attrs)

  throwIfIssues('rc-social-element', issues)
  const node: RcmlSocialElement = {
    tagName: 'rc-social-element',
    attributes: normalizeAttrs(options.attrs) as RcmlSocialElement['attributes'],
  }

  if (options.content !== undefined) node.content = options.content

  return node
}

// ─── Layout containers ──────────────────────────────────────────────────────

/**
 * Build an `<rc-section>` — a row-level container. Accepts 1–20 columns
 * (per the schema's `maxChildCount`). Every direct child of `<rc-body>` is
 * typically a section or a control-flow wrapper (`<rc-loop>` / `<rc-switch>` /
 * `<rc-wrapper>`).
 *
 * @param options - `options.children` is the list of column children;
 *   `options.attrs` controls section-level background / padding / borders.
 * @returns A typed {@link RcmlSection} node.
 * @throws {RcmlElementBuildError} When attrs are invalid, any child is not
 *   an `<rc-column>`, or there are more than 20 children.
 *
 * @example
 * ```ts
 * createSectionElement({
 *   attrs: { 'background-color': '#ffffff', padding: '20px 0' },
 *   children: [createColumnElement({ children: [...] })],
 * })
 * ```
 * @public
 */
export function createSectionElement(options: SectionElementOptions): RcmlSection {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-section', options.attrs))
  issues.push(...validateChildren('rc-section', options.children))
  throwIfIssues('rc-section', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlSection['attributes']
  const node: RcmlSection = {
    tagName: 'rc-section',
    children: [...options.children],
  }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-column>` — a horizontal unit inside an `<rc-section>`.
 * Holds content elements (text, heading, button, image, divider, social,
 * loops, groups); sections and columns themselves are not valid children.
 *
 * @param options - `options.children` is the list of content elements to
 *   stack vertically; `options.attrs` controls column-level padding,
 *   borders, width, vertical alignment.
 * @returns A typed {@link RcmlColumn} node.
 * @throws {RcmlElementBuildError} When attrs are invalid or any child is
 *   disallowed for columns (e.g. a nested `<rc-section>`).
 *
 * @example
 * ```ts
 * createColumnElement({
 *   attrs: { 'vertical-align': 'top', width: '50%' },
 *   children: [
 *     createHeadingElement({ content: 'Welcome' }),
 *     createTextElement({ content: 'Thanks for joining.' }),
 *   ],
 * })
 * ```
 * @public
 */
export function createColumnElement(options: ColumnElementOptions): RcmlColumn {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-column', options.attrs))
  issues.push(...validateChildren('rc-column', options.children))
  throwIfIssues('rc-column', issues)

  const attributes = normalizeAttrs(options.attrs) as RcmlColumn['attributes']
  const node: RcmlColumn = {
    tagName: 'rc-column',
    children: [...options.children],
  }

  if (attributes) node.attributes = attributes

  return node
}

// ─── Control flow ───────────────────────────────────────────────────────────

/**
 * Build an `<rc-switch>` container — evaluates its `<rc-case>` children in
 * order at send time and renders the first matching case's section. Use
 * alongside {@link createCaseElement} for subscriber-segment / tag /
 * custom-field conditional content.
 *
 * @param options - `options.children` is the list of `<rc-case>` branches.
 * @returns A typed {@link RcmlSwitch} node.
 * @throws {RcmlElementBuildError} When any child is not an `<rc-case>`.
 *
 * @example
 * ```ts
 * createSwitchElement({
 *   children: [
 *     createCaseElement({ attrs: { 'case-type': 'default' }, children: [section] }),
 *   ],
 * })
 * ```
 * @public
 */
export function createSwitchElement(options: SwitchElementOptions): RcmlSwitch {
  const issues = validateChildren('rc-switch', options.children)

  throwIfIssues('rc-switch', issues)

  return {
    tagName: 'rc-switch',
    children: [...options.children],
  }
}

/**
 * Build an `<rc-case>` — one branch inside an `<rc-switch>`. Per the schema
 * a case holds exactly one `<rc-section>` child. `attrs.case-type` selects
 * the condition family (`default`, `segment`, `tag`, `custom-field`), and
 * `attrs.case-property` / `case-value` / `case-condition` refine it.
 *
 * @param options - `options.attrs` is the condition descriptor;
 *   `options.children` is a one-element tuple holding the section to render
 *   when the case matches.
 * @returns A typed {@link RcmlCase} node.
 * @throws {RcmlElementBuildError} When attrs are invalid, the child is not
 *   an `<rc-section>`, or more than one child is supplied.
 *
 * @example
 * ```ts
 * createCaseElement({
 *   attrs: { 'case-type': 'segment', 'case-condition': 'eq', 'case-value': 42 },
 *   children: [createSectionElement({ children: [...] })],
 * })
 * ```
 * @public
 */
export function createCaseElement(options: CaseElementOptions): RcmlCase {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-case', options.attrs))
  issues.push(...validateChildren('rc-case', options.children))
  throwIfIssues('rc-case', issues)

  return {
    tagName: 'rc-case',
    attributes: normalizeAttrs(options.attrs) as RcmlCase['attributes'],
    children: [...options.children],
  }
}

/**
 * Build an `<rc-loop>` — iterates its `<rc-section>` children once per
 * entry in a data source (news feed, remote content, custom field, XML
 * document). `attrs.loop-type` chooses the source family and
 * `attrs.loop-value` identifies the specific source (e.g. the custom-field
 * id or the remote URL).
 *
 * @param options - `options.attrs` configures the iteration;
 *   `options.children` is the list of sections rendered per iteration.
 * @returns A typed {@link RcmlLoop} node.
 * @throws {RcmlElementBuildError} When attrs are invalid or any child is
 *   not an `<rc-section>`.
 *
 * @example
 * ```ts
 * createLoopElement({
 *   attrs: { 'loop-type': 'custom-field', 'loop-value': '12345', 'loop-max-iterations': 5 },
 *   children: [createSectionElement({ children: [...] })],
 * })
 * ```
 * @public
 */
export function createLoopElement(options: LoopElementOptions): RcmlLoop {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-loop', options.attrs))
  issues.push(...validateChildren('rc-loop', options.children))
  throwIfIssues('rc-loop', issues)

  return {
    tagName: 'rc-loop',
    attributes: normalizeAttrs(options.attrs) as RcmlLoop['attributes'],
    children: [...options.children],
  }
}

/**
 * Build an `<rc-group>` — a column-only pass-through container used for
 * advanced layout composition (keeps columns adjacent without introducing
 * section-level backgrounds).
 *
 * @param options - `options.children` is the list of `<rc-column>` children.
 * @returns A typed {@link RcmlGroup} node.
 * @throws {RcmlElementBuildError} When any child is not an `<rc-column>`.
 *
 * @example
 * ```ts
 * createGroupElement({
 *   children: [
 *     createColumnElement({ children: [...] }),
 *     createColumnElement({ children: [...] }),
 *   ],
 * })
 * ```
 * @public
 */
export function createGroupElement(options: GroupElementOptions): RcmlGroup {
  const issues = validateChildren('rc-group', options.children)

  throwIfIssues('rc-group', issues)

  return {
    tagName: 'rc-group',
    children: [...options.children],
  }
}

/**
 * Build an `<rc-wrapper>` — groups `<rc-section>` and `<rc-switch>`
 * children under a shared background, padding, and border. Useful for
 * applying visual treatment to a block of sections without repeating it on
 * each one.
 *
 * @param options - `options.children` is the list of wrapped sections /
 *   switches; `options.attrs` controls shared background / padding /
 *   border / full-width behavior.
 * @returns A typed {@link RcmlWrapper} node.
 * @throws {RcmlElementBuildError} When attrs are invalid or any child is
 *   neither an `<rc-section>` nor an `<rc-switch>`.
 *
 * @example
 * ```ts
 * createWrapperElement({
 *   attrs: { 'background-color': '#f3f3f3', padding: '40px 0' },
 *   children: [createSectionElement({ children: [...] })],
 * })
 * ```
 * @public
 */
export function createWrapperElement(options: WrapperElementOptions): RcmlWrapper {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-wrapper', options.attrs))
  issues.push(...validateChildren('rc-wrapper', options.children))
  throwIfIssues('rc-wrapper', issues)
  const attributes = normalizeAttrs(options.attrs) as RcmlWrapper['attributes']
  const node: RcmlWrapper = {
    tagName: 'rc-wrapper',
    children: [...options.children],
  }

  if (attributes) node.attributes = attributes

  return node
}

// ─── Head / metadata ────────────────────────────────────────────────────────

/**
 * Build an `<rc-head>` — the document's metadata container. Holds any
 * mix of `<rc-brand-style>`, `<rc-attributes>` default-override blocks,
 * `<rc-preview>` preheader text, `<rc-class>` named-attribute groups, and
 * `<rc-plain-text>` fallback bodies.
 *
 * @param options - `options.children` is the list of head children. An
 *   empty list is valid (the renderer applies all defaults).
 * @returns A typed {@link RcmlHead} node.
 * @throws {RcmlElementBuildError} When any child is not a valid head child.
 *
 * @example
 * ```ts
 * createHeadElement({
 *   children: [
 *     createBrandStyleElement({ attrs: { id: '99999' } }),
 *     createPreviewElement({ content: 'See inside for 20% off' }),
 *   ],
 * })
 * ```
 * @public
 */
export function createHeadElement(options: HeadElementOptions): RcmlHead {
  const issues = validateChildren('rc-head', options.children)

  throwIfIssues('rc-head', issues)

  return {
    tagName: 'rc-head',
    children: [...options.children],
  }
}

/**
 * Build an `<rc-body>` — the email content root inside the document. Its
 * children are the top-level blocks the recipient sees: sections, loops,
 * switches, wrappers.
 *
 * @param options - `options.children` is the list of top-level blocks;
 *   `options.attrs` controls body-level background color and total width
 *   (defaults to 600px).
 * @returns A typed {@link RcmlBody} node.
 * @throws {RcmlElementBuildError} When attrs are invalid or any child is
 *   not a valid body child.
 *
 * @example
 * ```ts
 * createBodyElement({
 *   attrs: { 'background-color': '#ffffff', width: '600px' },
 *   children: [createSectionElement({ children: [...] })],
 * })
 * ```
 * @public
 */
export function createBodyElement(options: BodyElementOptions): RcmlBody {
  const issues: RcmlElementBuildIssue[] = []

  issues.push(...collectAttrIssues('rc-body', options.attrs))
  issues.push(...validateChildren('rc-body', options.children))
  throwIfIssues('rc-body', issues)
  const attributes = normalizeAttrs(options.attrs) as RcmlBody['attributes']
  const node: RcmlBody = {
    tagName: 'rc-body',
    children: [...options.children],
  }

  if (attributes) node.attributes = attributes

  return node
}

/**
 * Build an `<rc-brand-style>` declaration — references a saved brand style
 * by numeric id. The referenced style supplies default colors, fonts, and
 * logo to the renderer. Intended for editor internal use; the actual
 * attribute inheritance happens through `<rc-attributes>`.
 *
 * @param options - `options.attrs.id` is the numeric brand-style id (as a
 *   positive-number string).
 * @returns A typed {@link RcmlBrandStyle} node.
 * @throws {RcmlElementBuildError} When `attrs.id` is missing or invalid.
 *
 * @example
 * ```ts
 * createBrandStyleElement({ attrs: { id: '99999' } })
 * ```
 * @public
 */
export function createBrandStyleElement(options: BrandStyleElementOptions): RcmlBrandStyle {
  const issues = collectAttrIssues('rc-brand-style', options.attrs)

  throwIfIssues('rc-brand-style', issues)

  return {
    tagName: 'rc-brand-style',
    attributes: normalizeAttrs(options.attrs) as RcmlBrandStyle['attributes'],
  }
}

/**
 * Build an `<rc-font>` — a web-font declaration pointing at a CSS stylesheet
 * that imports the font. Sits inside `<rc-head>` and exposes the font family
 * for use in other head / body attrs.
 *
 * @param options - `options.attrs.name` is the font family identifier;
 *   `options.attrs.href` is the CSS URL.
 * @returns A typed {@link RcmlFont} node.
 * @throws {RcmlElementBuildError} When `attrs.name` / `attrs.href` are
 *   missing or invalid.
 *
 * @example
 * ```ts
 * createFontElement({
 *   attrs: { name: 'Inter', href: 'https://fonts.example.com/inter.css' },
 * })
 * ```
 * @public
 */
export function createFontElement(options: FontElementOptions): RcmlFont {
  const issues = collectAttrIssues('rc-font', options.attrs)

  throwIfIssues('rc-font', issues)

  return {
    tagName: 'rc-font',
    attributes: normalizeAttrs(options.attrs) as RcmlFont['attributes'],
  }
}

/**
 * Build an `<rc-attributes>` container — holds tag-level default attributes
 * that apply across the document. Valid children are the supported style
 * tags (`<rc-body>`, `<rc-section>`, `<rc-button>`, `<rc-heading>`,
 * `<rc-text>`, `<rc-social>`), each carrying attributes that the renderer
 * uses as defaults for matching elements in the body.
 *
 * @param options - `options.children` is the list of style-override declarations.
 * @returns A typed {@link RcmlAttributes} node.
 * @throws {RcmlElementBuildError} When any child is not a valid style-override tag.
 *
 * @example
 * ```ts
 * createAttributesElement({
 *   children: [createBodyElement({ attrs: { 'background-color': '#ffffff' }, children: [] })],
 * })
 * ```
 * @public
 */
export function createAttributesElement(options: AttributesElementOptions): RcmlAttributes {
  const issues = validateChildren('rc-attributes', options.children)

  throwIfIssues('rc-attributes', issues)

  return {
    tagName: 'rc-attributes',
    children: [...options.children],
  }
}

/**
 * Build an `<rc-preview>` — the preheader text that mail clients show next
 * to the subject line in the inbox list.
 *
 * @param options - `options.content` is the preheader string (rendered
 *   verbatim). Omit to leave the preheader empty.
 * @returns A typed {@link RcmlPreview} node.
 *
 * @example
 * ```ts
 * createPreviewElement({ content: 'See inside for 20% off' })
 * ```
 * @public
 */
export function createPreviewElement(options: PreviewElementOptions = {}): RcmlPreview {
  const node: RcmlPreview = { tagName: 'rc-preview' }

  if (options.content !== undefined) node.content = options.content

  return node
}

/**
 * Build an `<rc-class>` — a named group of attributes that body elements
 * reference via their own `rc-class` attribute. Lets you centralise
 * typography (h1/h2/paragraph) and button style in one place.
 *
 * @param options - `options.attrs.name` is the class identifier; other
 *   attrs (`color`, `font-family`, `font-size`, …) are the style payload.
 * @returns A typed {@link RcmlClass} node.
 * @throws {RcmlElementBuildError} When attrs are unknown or have invalid values.
 *
 * @example
 * ```ts
 * createClassElement({
 *   attrs: { name: 'rcml-h1-style', color: '#1a1a1a', 'font-size': '28px', 'font-weight': '700' },
 * })
 * ```
 * @public
 */
export function createClassElement(options: ClassElementOptions): RcmlClass {
  const issues = collectAttrIssues('rc-class', options.attrs)

  throwIfIssues('rc-class', issues)

  return {
    tagName: 'rc-class',
    attributes: normalizeAttrs(options.attrs) as RcmlClass['attributes'],
  }
}

/**
 * Build an `<rc-plain-text>` — the plain-text alternative body that mail
 * clients render when they can't (or won't) display HTML. Sits inside
 * `<rc-head>`.
 *
 * @param options - `options.content` is the plain-text body string.
 * @returns A typed {@link RcmlPlainText} node.
 *
 * @example
 * ```ts
 * createPlainTextElement({ content: 'Hi — see the full offer at example.com/sale.' })
 * ```
 * @public
 */
export function createPlainTextElement(options: PlainTextElementOptions): RcmlPlainText {
  return {
    tagName: 'rc-plain-text',
    content: { type: 'text', text: options.content },
  }
}

/**
 * Build an `<rc-raw>` — an HTML escape hatch whose content is embedded
 * verbatim in the rendered email. Use sparingly; it bypasses the RCML
 * structural / attribute validators.
 *
 * @param options - `options.content` is the raw HTML string. Omit for an
 *   empty node.
 * @returns A typed {@link RcmlRaw} node.
 *
 * @example
 * ```ts
 * createRawElement({ content: '<!--[if mso]><table><tr><td><![endif]-->' })
 * ```
 * @public
 */
export function createRawElement(options: RawElementOptions = {}): RcmlRaw {
  const node: RcmlRaw = { tagName: 'rc-raw' }

  if (options.content !== undefined) node.content = options.content

  return node
}

// ─── Document root ──────────────────────────────────────────────────────────

/**
 * Build the `<rcml>` document root — wraps a pre-built `<rc-head>` + `<rc-body>`
 * pair into the top-level document shape.
 *
 * Name deliberately disambiguated from the legacy `createRCMLDocument` in
 * `../elements.ts`: this factory takes an explicit head + body (no
 * brand-style / sections shorthand).
 *
 * @param options - `options.head` and `options.body` are the two document
 *   children in order. Both must be produced by
 *   {@link createHeadElement} / {@link createBodyElement}.
 * @returns A typed {@link RcmlDocument} node, ready for
 *   {@link rcmlToXml} or
 *   {@link validateEmailTemplate}.
 * @throws {RcmlElementBuildError} When the supplied head/body nodes are
 *   not structurally valid children of `<rcml>`.
 *
 * @example
 * ```ts
 * createRcmlDocumentElement({
 *   head: createHeadElement({ children: [] }),
 *   body: createBodyElement({ children: [createSectionElement({ children: [...] })] }),
 * })
 * ```
 * @public
 */
export function createRcmlDocumentElement(options: RcmlDocumentElementOptions): RcmlDocument {
  const issues = validateChildren('rcml', [options.head, options.body])

  throwIfIssues('rcml', issues)

  return {
    tagName: 'rcml',
    children: [options.head, options.body],
  }
}

// ─── Inline-node / content helpers ──────────────────────────────────────────

/**
 * Create a ProseMirror text node — the simplest inline content fragment.
 *
 * Use these nodes inside {@link createInlineContent} to build the `content`
 * option of {@link createTextElement} / {@link createHeadingElement} /
 * {@link createButtonElement} by hand, interleaving with placeholders and
 * loop values.
 *
 * @param text - The raw text content.
 * @param marks - Optional marks (font styling, links) applied to this run.
 *   Omit (or pass an empty array) for plain unstyled text — the returned
 *   node will have no `marks` field in the former case and will strip the
 *   empty array in the latter.
 * @returns A typed {@link TextNode}.
 *
 * @example
 * ```ts
 * createTextNode('Hello')
 * createTextNode('bold', [{ type: 'font', attrs: { 'font-weight': '700' } }])
 * ```
 * @public
 */
export function createTextNode(text: string, marks?: TextNode['marks']): TextNode {
  const node: TextNode = { type: 'text', text }

  if (marks && marks.length > 0) node.marks = marks

  return node
}

/**
 * Create a placeholder node — a merge-field token that the Rule.io renderer
 * replaces at send time with the subscriber-specific value.
 *
 * @param fieldName - Human-readable display name (e.g. `Subscriber.FirstName`).
 *   Shown in the editor and used as the rendered-time label fallback.
 * @param fieldId - Numeric custom-field id from Rule.io.
 * @param options - Optional overrides:
 *   - `type` — placeholder category (`CustomField` / `Subscriber` / `User` /
 *     `RemoteContent` / `Date`; defaults to `CustomField`).
 *   - `maxLength` — render-time character cap (defaults to `null`, i.e. unlimited).
 *   - `original` — source-token override (defaults to `[<type>:<fieldId>]`).
 * @returns A typed {@link PlaceholderNode}.
 *
 * @example
 * ```ts
 * createPlaceholderNode('Subscriber.FirstName', 169233)
 * createPlaceholderNode('Order.Total', 42, { maxLength: '16' })
 * ```
 * @public
 */
export function createPlaceholderNode(
  fieldName: string,
  fieldId: number,
  options: {
    type?: PlaceholderNode['attrs']['type']
    maxLength?: string | null
    original?: string
  } = {},
): PlaceholderNode {
  const type = options.type ?? 'CustomField'

  return {
    type: 'placeholder',
    attrs: {
      type,
      value: fieldId,
      name: fieldName,
      original: options.original ?? `[${type}:${String(fieldId)}]`,
      'max-length': options.maxLength ?? null,
    },
  }
}

/**
 * Create a loop-value node — references the current iteration's value
 * inside an `<rc-loop>` body. At render time the renderer replaces the
 * token with the per-iteration source value.
 *
 * @param jsonKey - The loop variable name (typically a JSON property key
 *   on the iteration item, e.g. `title`, `price`).
 * @param options - Optional overrides:
 *   - `index` — iteration identifier (defaults to `jsonKey`).
 *   - `original` — source-token override (defaults to `[LoopValue:<jsonKey>]`).
 * @returns A typed {@link LoopValueNode}.
 *
 * @example
 * ```ts
 * // Inside an <rc-loop> that iterates over products:
 * createInlineContent([
 *   createTextNode('Product: '),
 *   createLoopValueNode('title'),
 *   createTextNode(' — '),
 *   createLoopValueNode('price'),
 * ])
 * ```
 * @public
 */
export function createLoopValueNode(
  jsonKey: string,
  options: { index?: string; original?: string } = {},
): LoopValueNode {
  return {
    type: 'loop-value',
    attrs: {
      original: options.original ?? `[LoopValue:${jsonKey}]`,
      value: jsonKey,
      index: options.index ?? jsonKey,
    },
  }
}

/**
 * Wrap a list of inline nodes into a valid content `Json` doc (one
 * paragraph). Designed for hand-built content with mixed text, placeholders,
 * and loop values — the escape hatch when RFM markdown isn't expressive
 * enough.
 *
 * @param nodes - Ordered inline nodes produced by {@link createTextNode} /
 *   {@link createPlaceholderNode} / {@link createLoopValueNode}. Order is
 *   preserved.
 * @returns A normalized + structurally validated {@link Json} content doc,
 *   suitable as the `content` argument to {@link createTextElement} /
 *   {@link createHeadingElement} / {@link createButtonElement}.
 * @throws {JsonParseError} When the assembled doc fails structural validation
 *   (e.g. malformed placeholder attrs).
 *
 * @example
 * ```ts
 * createInlineContent([
 *   createTextNode('Hi '),
 *   createPlaceholderNode('Subscriber.FirstName', 169233),
 *   createTextNode(','),
 * ])
 * ```
 * @public
 */
export function createInlineContent(nodes: readonly InlineNode[]): Json {
  const doc: Json = {
    type: 'doc',
    content: [{ type: 'paragraph', content: [...nodes] }],
  }

  return validateJson(normalizeJson(doc))
}

/**
 * Convert an RFM markdown string into a validated content `Json` doc.
 * Thin wrapper around {@link emailRfmToJson} + {@link normalizeJson} +
 * {@link validateJson} — useful when you want the normalized + validated
 * form up front (e.g. to pass the same content into multiple factories or
 * to inspect the result before assembling the surrounding element).
 *
 * @param rfm - RFM markdown source string.
 * @returns A normalized + structurally validated {@link Json} content doc.
 * @throws `RcmlValidationError` when the input is not valid RFM (bubbled
 *   from {@link emailRfmToJson}).
 * @throws {JsonParseError} When the produced doc fails structural validation.
 *
 * @example
 * ```ts
 * const greeting = createTextContent('Hi :font[world]{font-weight="700"}')
 * createTextElement({ content: greeting })
 * ```
 * @public
 */
export function createTextContent(rfm: string): Json {
  return validateJson(normalizeJson(emailRfmToJson(rfm)))
}
