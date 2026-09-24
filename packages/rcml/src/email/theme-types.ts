/**
 * Public type definitions for the email-theme abstraction.
 *
 * Defines the typed theme rcml documents carry, independent of the Rule.io
 * brand-style API shape. The `applyTheme` / factory runtime is also in this
 * package.
 *
 * @public
 */

/**
 * Numeric id of a saved brand style in the Rule.io account. Appears on
 * `<rc-brand-style id="…">` and round-trips through `applyTheme` /
 * `getTheme`.
 *
 * @public
 */
export type EmailThemeBrandStyleId = number

/**
 * Four semantic colour slots a theme controls. Mapping to rcml:
 * - `Body`       → `rc-section` background-color in rc-attributes.
 * - `Primary`    → `rc-button` background-color in rc-attributes.
 * - `Secondary`  → `rc-class name="rcml-brand-color"` background-color.
 * - `Background` → `rc-body` background-color in rc-attributes.
 *
 * @public
 */
export enum EmailThemeColorType {
  Body = 'body',
  Primary = 'primary',
  Secondary = 'secondary',
  Background = 'background',
}

/**
 * One entry in a theme's colour palette — a slot `type` paired with
 * the hex value that fills it.
 *
 * @public
 */
export interface EmailThemeColor {
  /** Which of the four theme slots this entry fills. */
  type: EmailThemeColorType
  /** CSS hex colour including the leading `#`, e.g. `'#F3F3F3'`. */
  hex: string
}

/**
 * Image slots a theme controls. Currently only the brand logo; the enum
 * exists so future image roles can be added without breaking the shape
 * of {@link EmailTheme.images}.
 *
 * @public
 */
export enum EmailThemeImageType {
  Logo = 'logo',
}

/**
 * One entry in the theme's image map — a slot `type` paired with the
 * URL the renderer should load.
 *
 * @public
 */
export interface EmailThemeImage {
  /** Which of the image slots this entry fills. */
  type: EmailThemeImageType
  /** Absolute `http:` / `https:` URL. Other schemes are rejected by applyTheme. */
  url: string
}

/**
 * The six social-link slots the theme supports. Matches the rcml
 * `<rc-social-element name="…">` naming for five of the six — `'website'`
 * is this theme API's slot key, written to RCML as `name="web"` (the value
 * Rule's RCML schema and frontend actually use for that slot).
 *
 * @public
 */
export type EmailThemeSocialLinkType =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'x'
  | 'website'

/**
 * One entry in the theme's social-link map — a slot `type` paired with
 * the `href` rendered on the matching `<rc-social-element>`.
 *
 * @public
 */
export interface EmailThemeSocialLink {
  /** Which of the six social slots this entry fills. */
  type: EmailThemeSocialLinkType
  /** Absolute `http:` / `https:` URL. Other schemes are rejected by applyTheme. */
  url: string
}

/**
 * Six style slots for text rendered inside rcml content nodes. Each slot
 * materialises as an `<rc-class name="rcml-{type}-style" …>` entry under
 * `<rc-attributes>`.
 *
 * @public
 */
export enum EmailThemeFontStyleType {
  Paragraph = 'p',
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  ButtonLabel = 'label',
}

/**
 * Fully-populated font-style for one of the six slots. Fields carry CSS
 * values verbatim (`'16px'`, `'120%'`, `'700'`, `'normal'`, `'none'`,
 * etc.) — the renderer writes them onto the corresponding
 * `<rc-class name="rcml-{type}-style">` attributes without further
 * interpretation.
 *
 * @public
 */
export interface EmailThemeFontStyle {
  /** Which of the six font-style slots this entry fills. */
  type: EmailThemeFontStyleType
  /** Main display family, e.g. `'Helvetica'`, `'Merriweather'`. */
  fontFamily: string
  /** CSS generic fallback, e.g. `'sans-serif'`, `'serif'`. */
  fallbackFontFamily: string
  /** CSS font-size, e.g. `'16px'`. */
  fontSize: string
  /** CSS hex colour including the leading `#`. */
  color: string
  /** CSS line-height, e.g. `'120%'`. */
  lineHeight: string
  /** CSS letter-spacing, e.g. `'0em'`. */
  letterSpacing: string
  /** CSS font-weight as a string, e.g. `'400'`, `'700'`. */
  fontWeight: string
  /** CSS font-style, e.g. `'normal'`, `'italic'`. */
  fontStyle: string
  /** CSS text-decoration, e.g. `'none'`, `'underline'`. */
  textDecoration: string
}

/**
 * A web-font registration. Materialises as an `<rc-font name="…" href="…">`
 * child of `<rc-head>`. System fonts have no URL and therefore no `rc-font`.
 *
 * @public
 */
export interface EmailThemeFont {
  fontFamily: string
  /** Omit for system fonts that don't need a web-font registration. */
  url?: string
}

/**
 * The typed theme object carried by rcml documents.
 *
 * All fields are `readonly` to signal intent — the public API treats
 * themes as immutable; the factory (`createEmailTheme`) and the
 * applier (`applyTheme`) both return fresh themes / documents
 * rather than mutating the input.
 *
 * The sub-slotted fields (`colors`, `links`, `images`, `fontStyles`)
 * use `Partial<Record<Type, Entry>>` shapes so callers can read
 * `theme.colors[Primary]?.hex` directly without a helper.
 *
 * @public
 */
export interface EmailTheme {
  /** Numeric brand-style id, or `undefined` when the theme is not tied to one. */
  readonly brandStyleId?: EmailThemeBrandStyleId
  /** Colour palette keyed by slot type. Missing slots are intentionally absent. */
  readonly colors: Readonly<Partial<Record<EmailThemeColorType, EmailThemeColor>>>
  /** Social-link map keyed by slot type. Missing slots are intentionally absent. */
  readonly links: Readonly<Partial<Record<EmailThemeSocialLinkType, EmailThemeSocialLink>>>
  /** Image map keyed by slot type. Missing slots are intentionally absent. */
  readonly images: Readonly<Partial<Record<EmailThemeImageType, EmailThemeImage>>>
  /** Ordered list of web-font registrations. Empty when the theme uses only system fonts. */
  readonly fonts: readonly EmailThemeFont[]
  /** Font-style map — every one of the six slots is always populated. */
  readonly fontStyles: Readonly<Record<EmailThemeFontStyleType, EmailThemeFontStyle>>
}

/**
 * A partial-theme shape used by two call sites:
 *
 * - `createEmailTheme` — seed values applied on top of the defaults
 *   when constructing a fresh theme.
 * - `applyTheme` — a patch written into an existing rcml document;
 *   only the buckets present in the patch are touched.
 *
 * Each bucket uses arrays (not the full `EmailTheme` map shape) so a
 * caller can write `{ colors: [{ type: Primary, hex: '#F00' }] }`
 * without restating the slot key. `fontStyles` accepts entry-level
 * partials so `{ type: H1, color: '#F00' }` changes just the colour
 * and keeps the rest of the slot at its default.
 *
 * @public
 */
export interface EmailThemePatch {
  /** Numeric brand-style id to set on `<rc-brand-style>`. */
  brandStyleId?: EmailThemeBrandStyleId
  /** Colour entries keyed by slot type; unspecified slots fall back to defaults. */
  colors?: EmailThemeColor[]
  /** Social-link entries keyed by slot type; unspecified slots fall back to defaults. */
  links?: EmailThemeSocialLink[]
  /** Image entries keyed by slot type; an empty array clears all images. */
  images?: EmailThemeImage[]
  /** Ordered fonts list; an empty array clears every font registration. */
  fonts?: EmailThemeFont[]
  /**
   * Per-slot partial font-style overrides. Missing fields on an override
   * fall back to the slot's default, so `{ type: H1, color: '#F00' }`
   * changes only the colour and keeps size/weight/family at defaults.
   */
  fontStyles?: Partial<EmailThemeFontStyle>[]
}
