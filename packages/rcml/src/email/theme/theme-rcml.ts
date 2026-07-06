/**
 * Internal per-field helpers used by the public
 * {@link import('../apply-theme.js').applyTheme}. Everything exported here
 * is `@internal` except {@link EmailThemeApplyError}, which is re-exported
 * from the public file so callers can `instanceof`-check thrown errors.
 *
 * Each helper takes the narrowest shape it needs — a colour hex, a logo
 * URL, a font-style object — and mutates its passed-in children array in
 * place. The public orchestrator picks which helpers to run based on
 * which fields its caller provided.
 */

import { randomUUID } from 'node:crypto'

import { sanitizeUrl } from '@braintree/sanitize-url'

import type {
  RcmlAttributes,
  RcmlAttributesChild,
  RcmlBody,
  RcmlBrandStyle,
  RcmlButton,
  RcmlClass,
  RcmlFont,
  RcmlHead,
  RcmlHeadChild,
  RcmlSection,
  RcmlSocial,
  RcmlSocialElement,
} from '../rcml-types.js'
import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
  EmailThemeImageType,
} from '../theme-types.js'
import type {
  EmailThemeColor,
  EmailThemeFont,
  EmailThemeFontStyle,
  EmailThemeImage,
  EmailThemeSocialLink,
  EmailThemeSocialLinkType,
} from '../theme-types.js'
import { DEFAULT_FONT_STYLES_MAP } from '../theme-defaults.js'

/**
 * Error thrown when a URL (logo src, social href, font href) provided to
 * {@link applyTheme} fails safety validation.
 *
 * @public
 */
export class EmailThemeApplyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EmailThemeApplyError'
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Shared types (internal)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Loose child-union for `<rc-attributes>`. The canonical schema does not
 * currently include `rc-class` / `rc-social` under `<rc-attributes>`, but
 * the Rule.io renderer tolerates it (see `packages/client/src/brand-template.ts`
 * for the same idiom). We keep casting at array boundaries rather than
 * widening the canonical union.
 *
 * @internal
 */
export type AnyAttrChild = RcmlAttributesChild | RcmlClass

type BgNode = RcmlBody | RcmlSection | RcmlButton

// ──────────────────────────────────────────────────────────────────────────
// Class-name maps (theme type ↔ rcml class name)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Colour-type → `<rc-class>` name. Only `Secondary` maps to a class —
 * the other three types live directly as `background-color` attributes
 * on `<rc-body>`, `<rc-section>`, and `<rc-button>` nodes.
 *
 * @internal
 */
export const CLASS_NAMES_BY_COLOR_TYPE_MAP: Partial<Record<EmailThemeColorType, string>> = {
  [EmailThemeColorType.Secondary]: 'rcml-brand-color',
}

/**
 * Image-type → rcml class names. `main` is the class the renderer
 * applies; `initial` is the seed class used by the editor before the
 * main class is resolved.
 *
 * @internal
 */
export const CLASS_NAMES_BY_IMAGE_TYPE_MAP: Record<
  EmailThemeImageType,
  { initial: string; main: string }
> = {
  [EmailThemeImageType.Logo]: {
    initial: 'rc-initial-logo',
    main: 'rcml-logo-style',
  },
}

/**
 * Font-style-type → `<rc-class>` name. Every font-style slot
 * materialises as one `rcml-{type}-style` class.
 *
 * @internal
 */
export const CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP: Record<EmailThemeFontStyleType, string> = {
  [EmailThemeFontStyleType.Paragraph]: 'rcml-p-style',
  [EmailThemeFontStyleType.H1]: 'rcml-h1-style',
  [EmailThemeFontStyleType.H2]: 'rcml-h2-style',
  [EmailThemeFontStyleType.H3]: 'rcml-h3-style',
  [EmailThemeFontStyleType.H4]: 'rcml-h4-style',
  [EmailThemeFontStyleType.ButtonLabel]: 'rcml-label-style',
}

/** Reverse lookup: rcml class name → {@link EmailThemeColorType}. @internal */
export const COLOR_TYPE_BY_CLASS_NAME_MAP: Record<string, EmailThemeColorType> =
  Object.fromEntries(
    Object.entries(CLASS_NAMES_BY_COLOR_TYPE_MAP).map(
      ([type, name]) => [name, type as EmailThemeColorType] as const
    )
  )

/** Reverse lookup: rcml main class name → {@link EmailThemeImageType}. @internal */
export const IMAGE_TYPE_BY_CLASS_NAME_MAP: Record<string, EmailThemeImageType> =
  Object.fromEntries(
    Object.entries(CLASS_NAMES_BY_IMAGE_TYPE_MAP).map(
      ([type, names]) => [names.main, type as EmailThemeImageType] as const
    )
  )

/** Reverse lookup: rcml class name → {@link EmailThemeFontStyleType}. @internal */
export const FONT_STYLE_TYPE_BY_CLASS_NAME_MAP: Record<string, EmailThemeFontStyleType> =
  Object.fromEntries(
    Object.entries(CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP).map(
      ([type, name]) => [name, type as EmailThemeFontStyleType] as const
    )
  )

/**
 * Concrete rcml attributes emitted for a font-style class node.
 *
 * @internal
 */
export interface FontStyleAttributes {
  'font-family': string
  'font-size': string
  color: string
  'line-height': string
  'letter-spacing': string
  'font-weight': string
  'font-style': string
  'text-decoration': string
}

/**
 * Utility that bridges {@link EmailThemeFontStyle} values and the flat
 * kebab-case attribute objects rcml serialises into `<rc-class>` nodes.
 * Also exposes static helpers for resolving rcml class names given a
 * theme type enum value.
 *
 * @internal
 */
export class EmailThemeRcmlMapper {
  /**
   * Look up the rcml class name for a colour slot.
   *
   * @param colorType - The theme colour slot.
   * @returns         The `<rc-class>` name, or `undefined` when the slot
   *                  has no dedicated class (Body/Primary/Background live
   *                  on default-attribute nodes instead).
   */
  static resolveColorClassName(colorType: EmailThemeColorType): string | undefined {
    return CLASS_NAMES_BY_COLOR_TYPE_MAP[colorType]
  }

  /**
   * Look up the rcml class name for an image slot.
   *
   * @param imageType - The theme image slot (currently only `Logo`).
   * @param isInitial - Pass `true` to get the seed class name used before
   *                    the main class is applied; default `false`
   *                    returns the main class name.
   * @returns         The requested class name, or `undefined` when the
   *                  slot has no class of that kind.
   */
  static resolveImageClassName(
    imageType: EmailThemeImageType,
    isInitial = false
  ): string {
    return isInitial
      ? CLASS_NAMES_BY_IMAGE_TYPE_MAP[imageType].initial
      : CLASS_NAMES_BY_IMAGE_TYPE_MAP[imageType].main
  }

  /**
   * Look up the rcml class name for a font-style slot.
   *
   * @param fontStyleType - The theme font-style slot.
   * @returns             The `rcml-{type}-style` class name.
   */
  static resolveFontStyleClassName(fontStyleType: EmailThemeFontStyleType): string {
    return CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP[fontStyleType]
  }

  /**
   * Serialise an {@link EmailThemeFontStyle} into the flat, kebab-case
   * attribute object that rcml's `<rc-class>` node expects. Note that the
   * result drops the `type` field — the caller is responsible for pairing
   * the attributes with the right class `name`.
   *
   * @param fontStyle - Theme font-style to serialise.
   * @returns         A {@link FontStyleAttributes} attribute bag ready
   *                  to write onto an `<rc-class>` node.
   */
  static fontStyleToAttributes(fontStyle: EmailThemeFontStyle): FontStyleAttributes {
    return {
      'font-family': createFontFamilyAttribute(fontStyle.fontFamily, fontStyle.fallbackFontFamily),
      'font-size': fontStyle.fontSize,
      color: fontStyle.color,
      'line-height': fontStyle.lineHeight,
      'letter-spacing': fontStyle.letterSpacing,
      'font-weight': fontStyle.fontWeight,
      'font-style': fontStyle.fontStyle,
      'text-decoration': fontStyle.textDecoration,
    }
  }

  /**
   * Deserialise a {@link FontStyleAttributes} bag back into an
   * {@link EmailThemeFontStyle}. The `type` must be supplied by the
   * caller (the attribute bag does not carry it). The `font-family`
   * attribute is split into its main + fallback parts via
   * {@link parseFontFamilyAttribute}; unparseable values become empty
   * strings.
   *
   * @param type       - The font-style slot to stamp onto the result.
   * @param attributes - The attribute bag to decode.
   * @returns          An {@link EmailThemeFontStyle} with all nine
   *                   fields populated.
   */
  static attributesToFontStyle(
    type: EmailThemeFontStyleType,
    attributes: FontStyleAttributes
  ): EmailThemeFontStyle {
    const { mainFontFamily, fallbackFontFamily } = parseFontFamilyAttribute(
      attributes['font-family']
    )

    return {
      type,
      fontFamily: mainFontFamily,
      fallbackFontFamily,
      fontSize: attributes['font-size'],
      color: attributes.color,
      lineHeight: attributes['line-height'],
      letterSpacing: attributes['letter-spacing'],
      fontWeight: attributes['font-weight'],
      fontStyle: attributes['font-style'],
      textDecoration: attributes['text-decoration'],
    }
  }
}

/**
 * Parse a `'FontFamily', sans-serif` attribute string back into its two
 * components. Accepts exactly the shape produced by
 * {@link createFontFamilyAttribute}; anything else — unquoted input,
 * missing comma, extra whitespace — yields empty strings so round-
 * tripping an unknown value is lossy but never throws.
 *
 * @param fontFamilyAttr - The raw `font-family` attribute value.
 * @returns              An object with `mainFontFamily` (the single-
 *                       quoted name) and `fallbackFontFamily` (the
 *                       generic family after the comma). Both default
 *                       to `''` on parse failure.
 *
 * @internal
 */
export function parseFontFamilyAttribute(fontFamilyAttr: string): {
  mainFontFamily: string
  fallbackFontFamily: string
} {
  const match = /^'([^']+)',\s*(.+)$/.exec(fontFamilyAttr)

  if (!match) return { mainFontFamily: '', fallbackFontFamily: '' }

  const [, mainFontFamily, fallbackFontFamily] = match as unknown as [
    string,
    string,
    string,
  ]

  return { mainFontFamily, fallbackFontFamily }
}

/**
 * Build a rcml-compatible `font-family` attribute string.
 *
 * @param fontFamily         - The main display family (quoted in the
 *                              result, e.g. `'Merriweather'`).
 * @param fallbackFontFamily - The CSS generic fallback after the comma
 *                              (e.g. `sans-serif`, `serif`).
 * @returns                  A string in the shape
 *                              `'FontFamily', fallback`.
 *
 * @internal
 */
export function createFontFamilyAttribute(fontFamily: string, fallbackFontFamily: string): string {
  return `'${fontFamily}', ${fallbackFontFamily}`
}

// ──────────────────────────────────────────────────────────────────────────
// Head-level helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Deep-clone an `<rc-head>` via a JSON round-trip so every downstream
 * mutation the caller performs touches our own copy. Safe for the POJO
 * shapes rcml uses; `undefined` values and non-JSON types are not
 * preserved.
 *
 * @param head - The original head. Not mutated.
 * @returns    An independent copy of `head`.
 *
 * @internal
 */
export function cloneHead(head: RcmlHead): RcmlHead {
  return JSON.parse(JSON.stringify(head)) as RcmlHead
}

/**
 * Return the `<rc-attributes>` child of an `<rc-head>`, inserting a
 * freshly-minted empty node immediately after any existing
 * `<rc-brand-style>` when none is present. Mutates `children` only in
 * the "insert" case.
 *
 * @param children - The head's children array (mutated when an
 *                   `<rc-attributes>` node has to be created).
 * @returns        The existing or newly-created `<rc-attributes>` node.
 *
 * @internal
 */
export function findOrCreateAttributes(children: RcmlHeadChild[]): RcmlAttributes {
  const existing = children.find(
    (c): c is RcmlAttributes => c.tagName === 'rc-attributes'
  )

  if (existing) return existing

  const created: RcmlAttributes = { id: newId(), tagName: 'rc-attributes', children: [] }
  const brandIdx = children.findIndex((c) => c.tagName === 'rc-brand-style')
  const insertAt = brandIdx >= 0 ? brandIdx + 1 : 0

  children.splice(insertAt, 0, created)

  return created
}

/**
 * Upsert an `<rc-brand-style id="…">` element at the top of `<rc-head>`:
 * when one already exists its `id` attribute is updated in place
 * (preserving the node's `id`), otherwise a new element is prepended.
 * Mutates `children`.
 *
 * @param children     - The head's children array (mutated).
 * @param brandStyleId - Numeric id to write onto the node.
 *
 * @internal
 */
export function upsertBrandStyleInHead(
  children: RcmlHeadChild[],
  brandStyleId: number
): void {
  const existing = children.find(
    (c): c is RcmlBrandStyle => c.tagName === 'rc-brand-style'
  )

  if (existing) {
    existing.attributes = { ...existing.attributes, id: brandStyleId }

    return
  }

  children.unshift({
    id: newId(),
    tagName: 'rc-brand-style',
    attributes: { id: brandStyleId },
  })
}

// ──────────────────────────────────────────────────────────────────────────
// rc-attributes background-colour helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Upsert the `<rc-body>` default-attribute node inside `<rc-attributes>`
 * so its `background-color` is `colorHex`. When the node is missing it
 * is appended; when present it is updated in place (preserving its
 * `id`). Mutates `children`.
 *
 * @param children - `rc-attributes` children (mutated).
 * @param colorHex - Hex colour to write.
 *
 * @internal
 */
export function upsertBodyBackgroundColor(
  children: AnyAttrChild[],
  colorHex: string
): void {
  upsertBackgroundColorNode(children, 'rc-body', colorHex)
}

/**
 * Upsert the `<rc-section>` default-attribute node. Same semantics as
 * {@link upsertBodyBackgroundColor}.
 *
 * @param children - `rc-attributes` children (mutated).
 * @param colorHex - Hex colour to write.
 *
 * @internal
 */
export function upsertSectionBackgroundColor(
  children: AnyAttrChild[],
  colorHex: string
): void {
  upsertBackgroundColorNode(children, 'rc-section', colorHex)
}

/**
 * Upsert the `<rc-button>` default-attribute node. Same semantics as
 * {@link upsertBodyBackgroundColor}.
 *
 * @param children - `rc-attributes` children (mutated).
 * @param colorHex - Hex colour to write.
 *
 * @internal
 */
export function upsertButtonBackgroundColor(
  children: AnyAttrChild[],
  colorHex: string
): void {
  upsertBackgroundColorNode(children, 'rc-button', colorHex)
}

/**
 * Core upsert routine for the three background-colour default nodes.
 * Update-in-place when a matching node exists, append-when-missing.
 */
function upsertBackgroundColorNode(
  children: AnyAttrChild[],
  tagName: BgNode['tagName'],
  colorHex: string
): void {
  const idx = children.findIndex((c) => c.tagName === tagName)
  const existing = idx >= 0 ? (children[idx] as BgNode) : undefined

  if (existing) {
    existing.attributes = {
      ...(existing.attributes ?? {}),
      'background-color': colorHex,
    } as BgNode['attributes']

    return
  }

  children.push(buildBgNode(tagName, colorHex))
}

/**
 * Construct a fresh attribute-default node for one of the three tags
 * `upsertBackgroundColorNode` cares about. These nodes live inside
 * `<rc-attributes>` and carry only attributes — the `*-attr` override
 * schema does not require `children` or `content` here.
 */
function buildBgNode(tagName: BgNode['tagName'], colorHex: string): BgNode {
  return {
    id: newId(),
    tagName,
    attributes: { 'background-color': colorHex },
  } as unknown as BgNode
}

// ──────────────────────────────────────────────────────────────────────────
// rc-class helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Upsert the `rcml-logo-style` `<rc-class>` entry so the logo image's
 * `src` is `logoUrl`. The URL is run through {@link sanitizeUrl}; a
 * `javascript:` or otherwise unsafe URL throws
 * {@link EmailThemeApplyError}. Mutates `children`.
 *
 * @param children - `rc-attributes` children (mutated).
 * @param logoUrl  - The logo image URL.
 *
 * @throws {@link EmailThemeApplyError} when `logoUrl` fails URL
 * sanitisation.
 *
 * @internal
 */
export function upsertLogoClass(
  children: AnyAttrChild[],
  logoUrl: string
): void {
  const className = EmailThemeRcmlMapper.resolveImageClassName(EmailThemeImageType.Logo)
  const safeUrl = ensureSafeUrl(logoUrl, 'logo image')

  upsertClassNode(children, className, { name: className, src: safeUrl })
}

/** Default width applied to logo body nodes that carry no explicit width. */
const LOGO_DEFAULT_WIDTH = '96px'

/** Loose node shape used when walking the body tree. */
type LooseNode = {
  tagName: string
  attributes?: Record<string, unknown>
  children?: LooseNode[]
}

function referencesLogoClass(rcClass: string, mainClass: string, initialClass: string): boolean {
  const classes = rcClass.split(/\s+/)

  return classes.includes(mainClass) || classes.includes(initialClass)
}

/**
 * Maps tag name to the default `rc-class` name for nodes that have no
 * existing `rc-class` attribute.
 *
 * @internal
 */
const DEFAULT_RC_CLASS_BY_TAG: Partial<Record<string, string>> = {
  'rc-heading': CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP[EmailThemeFontStyleType.H1],
  'rc-text': CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP[EmailThemeFontStyleType.Paragraph],
  'rc-button': CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP[EmailThemeFontStyleType.ButtonLabel],
  'rc-logo': CLASS_NAMES_BY_IMAGE_TYPE_MAP[EmailThemeImageType.Logo].main,
}

/**
 * Deep-clone the body and apply two classes of defaults in a single pass:
 *
 * 1. For `rc-heading`, `rc-text`, `rc-button`, and `rc-logo` nodes with no
 *    `rc-class` attribute, set the theme default class (`rcml-h1-style`,
 *    `rcml-p-style`, `rcml-label-style`, `rcml-logo-style` respectively).
 *
 * 2. For `rc-logo` nodes that reference the logo class (main or initial
 *    seed), propagate `logoUrl` as `src` and ensure a `width` default of
 *    `'96px'` when unset. This only runs when `logoUrl` is provided.
 *
 * Nodes that already carry an `rc-class` attribute are left untouched by
 * step 1. Step 2 applies regardless of whether step 1 just set the class.
 *
 * @param body    - The body node. Not mutated.
 * @param logoUrl - Logo image URL. When provided, logo `src` is patched.
 * @returns       A new body with defaults applied.
 *
 * @internal
 */
export function applyBodyDefaults(body: RcmlBody, logoUrl?: string): RcmlBody {
  const cloned = JSON.parse(JSON.stringify(body)) as RcmlBody

  patchBodyDefaults(cloned.children as unknown as LooseNode[], logoUrl)

  return cloned
}

function patchBodyDefaults(nodes: LooseNode[], logoUrl: string | undefined): void {
  for (const node of nodes) {
    // Step 1 — add default rc-class to unstyled content nodes
    const defaultClass = DEFAULT_RC_CLASS_BY_TAG[node.tagName]

    if (defaultClass) {
      const existing = node.attributes?.['rc-class']

      if (!existing || (typeof existing === 'string' && existing.trim() === '')) {
        node.attributes = { ...(node.attributes ?? {}), 'rc-class': defaultClass }
      }
    }

    // Step 2 — patch rc-logo src/width (rc-class is guaranteed present after step 1)
    if (node.tagName === 'rc-logo' && logoUrl !== undefined) {
      const rcClass = node.attributes?.['rc-class']
      const { main: mainClass, initial: initialClass } =
        CLASS_NAMES_BY_IMAGE_TYPE_MAP[EmailThemeImageType.Logo]

      if (typeof rcClass === 'string' && referencesLogoClass(rcClass, mainClass, initialClass)) {
        const attrs = node.attributes ?? {}

        node.attributes = {
          ...attrs,
          src: logoUrl,
          ...(typeof attrs['width'] !== 'string' ? { width: LOGO_DEFAULT_WIDTH } : {}),
        }
      }
    }

    if (node.children) {
      patchBodyDefaults(node.children, logoUrl)
    }
  }
}

/**
 * Upsert the `rcml-brand-color` `<rc-class>` entry so its
 * `background-color` is `colorHex`. Mutates `children`.
 *
 * @param children - `rc-attributes` children (mutated).
 * @param colorHex - Hex colour to write.
 *
 * @internal
 */
export function upsertBrandColorClass(
  children: AnyAttrChild[],
  colorHex: string
): void {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const className = EmailThemeRcmlMapper.resolveColorClassName(EmailThemeColorType.Secondary)!

  upsertClassNode(children, className, { name: className, 'background-color': colorHex })
}

/**
 * Upsert the `rcml-{type}-style` `<rc-class>` for a font-style slot.
 * Writes every font-style attribute (font-family, font-size, colour,
 * line-height, letter-spacing, font-weight, font-style, text-decoration)
 * onto the class, overwriting anything previously there. Mutates
 * `children`.
 *
 * @param children  - `rc-attributes` children (mutated).
 * @param fontStyle - Fully-populated font-style whose fields become the
 *                    class's attributes.
 * @param type      - Slot type, used to resolve the `rcml-{type}-style`
 *                    class name.
 *
 * @internal
 */
export function upsertFontStyleClass(
  children: AnyAttrChild[],
  fontStyle: EmailThemeFontStyle,
  type: EmailThemeFontStyleType
): void {
  const className = EmailThemeRcmlMapper.resolveFontStyleClassName(type)

  upsertClassNode(children, className, {
    name: className,
    ...EmailThemeRcmlMapper.fontStyleToAttributes(fontStyle),
  })
}

/**
 * Core upsert routine for `<rc-class>` nodes identified by their `name`
 * attribute. Replaces attributes in place when a class with the same
 * `name` is present (preserving the existing node `id`), otherwise
 * appends a fresh class node. Mutates `children`.
 */
function upsertClassNode(
  children: AnyAttrChild[],
  className: string,
  attrs: Record<string, string>
): void {
  const idx = children.findIndex(
    (c) => c.tagName === 'rc-class' && (c as RcmlClass).attributes.name === className
  )
  const existing = idx >= 0 ? (children[idx] as RcmlClass) : undefined

  if (existing) {
    existing.attributes = { ...attrs } as RcmlClass['attributes']

    return
  }

  children.push({
    id: newId(),
    tagName: 'rc-class',
    attributes: { ...attrs },
  } as unknown as RcmlClass)
}

// ──────────────────────────────────────────────────────────────────────────
// rc-social
// ──────────────────────────────────────────────────────────────────────────

/**
 * Overlay-only upsert of the `<rc-social>` block. For each provided
 * link, either update the matching `<rc-social-element>` in place
 * (preserving its node `id`) or append a new element. Links already
 * present in the doc that are *not* in the overlay are left alone —
 * this never removes orphans. Pre-existing duplicates (two elements
 * with the same `name`) are deduped, first-wins.
 *
 * The `<rc-social>` container itself is created when missing. Every
 * URL is run through {@link sanitizeUrl}; an unsafe URL throws
 * {@link EmailThemeApplyError}. A no-op when `themeLinks` is empty.
 * Mutates `children`.
 *
 * @param children   - `rc-attributes` children (mutated).
 * @param themeLinks - Links to overlay into the social block.
 *
 * @throws {@link EmailThemeApplyError} when any link URL fails URL
 * sanitisation.
 *
 * @internal
 */
export function upsertSocialOverlay(
  children: AnyAttrChild[],
  themeLinks: readonly EmailThemeSocialLink[]
): void {
  if (themeLinks.length === 0) return

  const safeLinks: EmailThemeSocialLink[] = themeLinks.map((link) => ({
    type: link.type,
    url: ensureSafeUrl(link.url, `social link ${link.type}`),
  }))

  const idx = children.findIndex((c) => c.tagName === 'rc-social')
  const existing = idx >= 0 ? (children[idx] as RcmlSocial) : undefined

  if (!existing) {
    children.push({
      id: newId(),
      tagName: 'rc-social',
      children: safeLinks.map((link) => buildSocialElement(link)),
    })

    return
  }

  const elements = existing.children as RcmlSocialElement[]
  const byName = new Map<string, RcmlSocialElement>()

  for (const el of elements.slice()) {
    const name = el.attributes.name as string | undefined

    if (typeof name !== 'string') continue

    if (byName.has(name)) {
      elements.splice(elements.indexOf(el), 1)
    } else {
      byName.set(name, el)
    }
  }

  for (const link of safeLinks) {
    const existingEl = byName.get(link.type)

    if (existingEl) {
      if ((existingEl.attributes.href as string | undefined) !== link.url) {
        existingEl.attributes = {
          ...existingEl.attributes,
          name: link.type,
          href: link.url,
        } as RcmlSocialElement['attributes']
      }
    } else {
      const newElement = buildSocialElement(link)

      elements.push(newElement)
      byName.set(link.type, newElement)
    }
  }
}

/** Construct a fresh `<rc-social-element>` with a new UUID. */
function buildSocialElement(link: EmailThemeSocialLink): RcmlSocialElement {
  return {
    id: newId(),
    tagName: 'rc-social-element',
    attributes: { name: link.type, href: link.url } as RcmlSocialElement['attributes'],
  }
}

// ──────────────────────────────────────────────────────────────────────────
// rc-font (direct children of rc-head)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Overlay-only upsert of `<rc-font>` elements directly under
 * `<rc-head>`. For each provided font that has a URL: update the
 * matching existing `<rc-font>` (looked up by `fontFamily`, ignoring
 * surrounding single-quotes) in place, or append a new element.
 * Existing `<rc-font>` elements whose family isn't in the provided list
 * are left alone — this never removes orphans. Fonts without a URL are
 * skipped (system fonts need no `<rc-font>` registration).
 *
 * Every URL is run through {@link sanitizeUrl}; an unsafe URL throws
 * {@link EmailThemeApplyError}. Returns a new array (the input is not
 * mutated at the array level; `next.slice()` copies the top level).
 *
 * @param children - The head's current children. Not mutated at the
 *                   array level; individual matched `<rc-font>` nodes
 *                   *are* mutated in place to preserve their `id`.
 * @param fonts    - Fonts to overlay onto the head.
 * @returns        The new children array — the existing non-`rc-font`
 *                 elements, kept `rc-font` elements, and any appended
 *                 new ones.
 *
 * @throws {@link EmailThemeApplyError} when any font URL fails URL
 * sanitisation.
 *
 * @internal
 */
export function overlayFontsInHead(
  children: RcmlHeadChild[],
  fonts: readonly EmailThemeFont[]
): RcmlHeadChild[] {
  const urlFonts = fonts.filter((f) => f.url !== undefined && f.url !== '')

  if (urlFonts.length === 0) return children

  const next = children.slice()
  const indexByFamily = new Map<string, number>()

  for (let i = 0; i < next.length; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const child = next[i]!

    if ((child as { tagName: string }).tagName !== 'rc-font') continue

    const fontNode = child as unknown as RcmlFont
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const name = (fontNode.attributes?.name as string | undefined) ?? ''
    const family = unwrapSingleQuotes(name)

    if (!indexByFamily.has(family)) {
      indexByFamily.set(family, i)
    }
  }

  for (const font of urlFonts) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const safeHref = ensureSafeUrl(font.url!, `font ${font.fontFamily}`)
    const existingIdx = indexByFamily.get(font.fontFamily)

    if (existingIdx !== undefined) {
      const existing = next[existingIdx] as unknown as RcmlFont

      existing.attributes = {
        ...existing.attributes,
        name: wrapSingleQuotes(font.fontFamily),
        href: safeHref,
      } as RcmlFont['attributes']
    } else {
      const fontNode: RcmlFont = {
        id: newId(),
        tagName: 'rc-font',
        attributes: {
          name: wrapSingleQuotes(font.fontFamily),
          href: safeHref,
        } as RcmlFont['attributes'],
      }

      next.push(fontNode as unknown as RcmlHeadChild)
      indexByFamily.set(font.fontFamily, next.length - 1)
    }
  }

  return next
}

// ──────────────────────────────────────────────────────────────────────────
// Extractors — read theme fields out of rcml structure
// ──────────────────────────────────────────────────────────────────────────

/**
 * Locate the `<rc-attributes>` child of an `<rc-head>`. Does not create
 * one — unlike {@link findOrCreateAttributes}, this is a pure read.
 *
 * @param head - The head to inspect.
 * @returns    The `<rc-attributes>` node if present, otherwise
 *             `undefined`.
 *
 * @internal
 */
export function findAttributesInHead(head: RcmlHead): RcmlAttributes | undefined {
  return head.children.find(
    (c): c is RcmlAttributes => c.tagName === 'rc-attributes'
  )
}

/**
 * Read the `id` attribute off a head's `<rc-brand-style>` element.
 *
 * @param head - The head to inspect.
 * @returns    The numeric brand-style id when the element exists and
 *             its `id` is a `number`; `undefined` otherwise (node
 *             missing, or id is a non-numeric value).
 *
 * @internal
 */
export function extractBrandStyleIdFromHead(head: RcmlHead): number | undefined {
  const node = head.children.find(
    (c): c is RcmlBrandStyle => c.tagName === 'rc-brand-style'
  )

  if (!node) return undefined

  const id = node.attributes.id

  return typeof id === 'number' ? id : undefined
}

/**
 * Recover the theme colour palette by scanning an `<rc-attributes>`
 * node's children. Mapping:
 *
 * - `<rc-body @background-color>` → `Background`
 * - `<rc-section @background-color>` → `Body`
 * - `<rc-button @background-color>` → `Primary`
 * - `<rc-class name="rcml-brand-color" @background-color>` → `Secondary`
 *
 * Nodes that don't match one of the four patterns are ignored. Slots
 * whose source node is absent from `attrChildren` are simply missing
 * from the returned map (it is a `Partial<Record<…>>`).
 *
 * @param attrChildren - `<rc-attributes>`'s children.
 * @returns            A map of the colour slots found in the doc.
 *
 * @internal
 */
export function extractColorsFromAttributes(
  attrChildren: readonly AnyAttrChild[]
): Partial<Record<EmailThemeColorType, EmailThemeColor>> {
  const out: Partial<Record<EmailThemeColorType, EmailThemeColor>> = {}

  for (const child of attrChildren) {
    const bg = readBackgroundColor(child)
    const mapped = mapBgNodeToColorType(child.tagName)

    if (bg && mapped) {
      out[mapped] = { type: mapped, hex: bg }
      continue
    }

    if (child.tagName === 'rc-class') {
      const className = readClassName(child as RcmlClass)
      const colourType = className !== undefined
        ? COLOR_TYPE_BY_CLASS_NAME_MAP[className]
        : undefined

      if (colourType) {
        const hex = (child as RcmlClass).attributes['background-color'] as
          | string
          | undefined

        if (typeof hex === 'string') {
          out[colourType] = { type: colourType, hex }
        }
      }
    }
  }

  return out
}

/**
 * Recover the theme's image slots by scanning an `<rc-attributes>`
 * node's children. Currently only the logo slot is recognised —
 * `<rc-class name="rcml-logo-style" @src>` produces the `Logo` entry
 * whose `url` is the `src` attribute. A class with an empty or missing
 * `src` is skipped.
 *
 * @param attrChildren - `<rc-attributes>`'s children.
 * @returns            A map of image slots found in the doc (empty
 *                     when no logo class is present).
 *
 * @internal
 */
export function extractImagesFromAttributes(
  attrChildren: readonly AnyAttrChild[]
): Partial<Record<EmailThemeImageType, EmailThemeImage>> {
  const out: Partial<Record<EmailThemeImageType, EmailThemeImage>> = {}

  for (const child of attrChildren) {
    if (child.tagName !== 'rc-class') continue

    const className = readClassName(child as RcmlClass)
    const imageType = className !== undefined
      ? IMAGE_TYPE_BY_CLASS_NAME_MAP[className]
      : undefined

    if (!imageType) continue

    const src = (child as RcmlClass).attributes.src as string | undefined

    if (typeof src === 'string' && src !== '') {
      out[imageType] = { type: imageType, url: src }
    }
  }

  return out
}

/**
 * Recover theme font-styles by scanning an `<rc-attributes>` node's
 * children. A `<rc-class name="rcml-{type}-style" …>` whose class name
 * matches one of the six font-style slots is decoded into an
 * {@link EmailThemeFontStyle}. Any font-style attribute the class
 * omits falls back to the default for that slot, so a partial class
 * still yields a complete font-style. Classes with unknown names are
 * ignored.
 *
 * @param attrChildren - `<rc-attributes>`'s children.
 * @returns            A map of the font-style slots found in the doc.
 *
 * @internal
 */
export function extractFontStylesFromAttributes(
  attrChildren: readonly AnyAttrChild[]
): Partial<Record<EmailThemeFontStyleType, EmailThemeFontStyle>> {
  const out: Partial<Record<EmailThemeFontStyleType, EmailThemeFontStyle>> = {}

  for (const child of attrChildren) {
    if (child.tagName !== 'rc-class') continue

    const className = readClassName(child as RcmlClass)
    const type = className !== undefined
      ? FONT_STYLE_TYPE_BY_CLASS_NAME_MAP[className]
      : undefined

    if (!type) continue

    const fromNode = readFontStyleAttributes(child as RcmlClass)
    const defaults = DEFAULT_FONT_STYLES_MAP[type]
    // Merge: defaults fill any missing fields; node values overlay.
    const merged: FontStyleAttributes = {
      'font-family': fromNode['font-family']
        ?? createFontFamilyAttribute(defaults.fontFamily, defaults.fallbackFontFamily),
      'font-size': fromNode['font-size'] ?? defaults.fontSize,
      color: fromNode.color ?? defaults.color,
      'line-height': fromNode['line-height'] ?? defaults.lineHeight,
      'letter-spacing': fromNode['letter-spacing'] ?? defaults.letterSpacing,
      'font-weight': fromNode['font-weight'] ?? defaults.fontWeight,
      'font-style': fromNode['font-style'] ?? defaults.fontStyle,
      'text-decoration': fromNode['text-decoration'] ?? defaults.textDecoration,
    }

    out[type] = EmailThemeRcmlMapper.attributesToFontStyle(type, merged)
  }

  return out
}

/**
 * Recover the theme's social-link map by walking the `<rc-social>`
 * block's children. Each `<rc-social-element @name @href>` whose `name`
 * is one of the six {@link EmailThemeSocialLinkType} values becomes a
 * link entry; unknown names and entries with a missing `name` or `href`
 * are skipped. When multiple elements share a name the first wins —
 * mirrors the dedup behaviour in {@link upsertSocialOverlay}.
 *
 * @param attrChildren - `<rc-attributes>`'s children.
 * @returns            A map of the social-link slots found in the doc
 *                     (empty when no `<rc-social>` block is present).
 *
 * @internal
 */
export function extractLinksFromAttributes(
  attrChildren: readonly AnyAttrChild[]
): Partial<Record<EmailThemeSocialLinkType, EmailThemeSocialLink>> {
  const out: Partial<Record<EmailThemeSocialLinkType, EmailThemeSocialLink>> = {}
  const social = attrChildren.find(
    (c): c is RcmlSocial => c.tagName === 'rc-social'
  )

  if (!social) return out

  for (const element of social.children as RcmlSocialElement[]) {
    const name = element.attributes.name as string | undefined
    const href = element.attributes.href as string | undefined

    if (typeof name !== 'string' || typeof href !== 'string') continue

    if (!isKnownSocialLinkType(name)) continue

    if (out[name] !== undefined) continue // first wins — mirrors dedup in apply

    out[name] = { type: name, url: href }
  }

  return out
}

/**
 * Read the head's `<rc-font>` children into an ordered list of
 * {@link EmailThemeFont} entries. Single-quoted family names on the
 * `name` attribute are unwrapped; entries with a blank or missing
 * `name` are skipped. An entry whose `href` is missing or empty comes
 * back without a `url` field (system font).
 *
 * @param head - The head to inspect.
 * @returns    The list of fonts in document order.
 *
 * @internal
 */
export function extractFontsFromHead(head: RcmlHead): EmailThemeFont[] {
  const out: EmailThemeFont[] = []

  for (const child of head.children) {
    if ((child as { tagName: string }).tagName !== 'rc-font') continue

    const fontNode = child as unknown as RcmlFont
    const name = fontNode.attributes.name as string | undefined
    const href = fontNode.attributes.href as string | undefined

    if (typeof name !== 'string' || name === '') continue

    const family = unwrapSingleQuotes(name)

    out.push(typeof href === 'string' && href !== ''
      ? { fontFamily: family, url: href }
      : { fontFamily: family })
  }

  return out
}

/**
 * Reverse the `mapBgNode…` direction: given a background-colour node's
 * tag, return the theme colour slot that drives it. Returns `undefined`
 * for any other tag.
 */
function mapBgNodeToColorType(tagName: string): EmailThemeColorType | undefined {
  switch (tagName) {
    case 'rc-body': return EmailThemeColorType.Background
    case 'rc-section': return EmailThemeColorType.Body
    case 'rc-button': return EmailThemeColorType.Primary
    default: return undefined
  }
}

/**
 * Extract the `background-color` attribute off a child that might be
 * `<rc-body>`, `<rc-section>`, or `<rc-button>`. Returns `undefined`
 * when the child is a different tag or the attribute is missing/empty.
 */
function readBackgroundColor(child: AnyAttrChild): string | undefined {
  if (
    child.tagName !== 'rc-body' &&
    child.tagName !== 'rc-section' &&
    child.tagName !== 'rc-button'
  ) {
    return undefined
  }

  const value = (child as BgNode).attributes?.['background-color'] as string | undefined

  return typeof value === 'string' && value !== '' ? value : undefined
}

/**
 * Read an `<rc-class>`'s `name` attribute. Returns `undefined` when the
 * attribute is missing or not a string.
 */
function readClassName(cls: RcmlClass): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const name = cls.attributes?.name as string | undefined

  return typeof name === 'string' ? name : undefined
}

/**
 * Pull the eight font-style-shaped attributes off an `<rc-class>` node.
 * Each field is returned only when present and of type `string`; missing
 * or wrong-typed fields come back as `undefined` so the caller can
 * default-fill them.
 */
function readFontStyleAttributes(cls: RcmlClass): Partial<FontStyleAttributes> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const a = (cls.attributes ?? {}) as Record<string, unknown>
  const take = (key: keyof FontStyleAttributes): string | undefined =>
    typeof a[key] === 'string' ? (a[key] as string) : undefined

  return {
    'font-family': take('font-family'),
    'font-size': take('font-size'),
    color: take('color'),
    'line-height': take('line-height'),
    'letter-spacing': take('letter-spacing'),
    'font-weight': take('font-weight'),
    'font-style': take('font-style'),
    'text-decoration': take('text-decoration'),
  }
}

const KNOWN_SOCIAL_LINK_TYPES: ReadonlySet<EmailThemeSocialLinkType> = new Set([
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'x',
  'website',
])

/** Type guard: is `name` one of the six known social-link types? */
function isKnownSocialLinkType(name: string): name is EmailThemeSocialLinkType {
  return KNOWN_SOCIAL_LINK_TYPES.has(name as EmailThemeSocialLinkType)
}

// ──────────────────────────────────────────────────────────────────────────
// Private helpers
// ──────────────────────────────────────────────────────────────────────────

/** Generate a fresh UUIDv4 for newly-inserted rcml nodes. */
function newId(): string {
  return randomUUID()
}

/**
 * Sanitise a URL that came from an outside source (brand style, theme
 * patch). Delegates to `sanitizeUrl` from `@braintree/sanitize-url`.
 * An unsafe or rejected URL triggers {@link EmailThemeApplyError} with
 * `context` in the message so the caller can see which slot failed.
 *
 * @param url     - The URL to sanitise.
 * @param context - Short label for the slot this URL belongs to (e.g.
 *                  `'logo image'`, `'social link facebook'`). Shows up
 *                  in the thrown error message.
 * @returns       The sanitised URL string.
 *
 * @throws {@link EmailThemeApplyError} when `url` fails sanitisation.
 */
function ensureSafeUrl(url: string, context: string): string {
  const safe = sanitizeUrl(url)

  if (!safe || safe === 'about:blank') {
    throw new EmailThemeApplyError(`applyTheme: invalid or unsafe URL for ${context}`)
  }

  return safe
}

/** Wrap `value` in single quotes if it isn't already quoted. */
function wrapSingleQuotes(value: string): string {
  return value.startsWith("'") && value.endsWith("'") ? value : `'${value}'`
}

/** Strip leading/trailing single quotes from `value` if both are present. */
function unwrapSingleQuotes(value: string): string {
  return value.startsWith("'") && value.endsWith("'") ? value.slice(1, -1) : value
}
