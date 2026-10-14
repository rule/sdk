/**
 * Default values used by {@link EmailTheme} when a slot is not explicitly set.
 * `createEmailTheme()` returns a theme seeded with these values so callers
 * get a renderable starting point without having to populate every slot.
 *
 * @public
 */

import type {
  EmailThemeColor,
  EmailThemeFontStyle,
  EmailThemeSocialLink,
  EmailThemeSocialLinkType,
} from './theme-types.js'
import { migrateLegacySocialLink } from './theme/legacy-social-link.js'
import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
} from './theme-types.js'

/**
 * Default hex values for the four colour slots a theme controls. Seeded
 * into `theme.colors` by {@link createEmailTheme} when the caller does
 * not override a slot.
 *
 * @public
 */
export const DEFAULT_COLORS_MAP: Record<EmailThemeColorType, EmailThemeColor> = {
  [EmailThemeColorType.Body]: { type: EmailThemeColorType.Body, hex: '#FFFFFF' },
  [EmailThemeColorType.Primary]: { type: EmailThemeColorType.Primary, hex: '#05CC87' },
  [EmailThemeColorType.Secondary]: { type: EmailThemeColorType.Secondary, hex: '#F6F8F9' },
  [EmailThemeColorType.Background]: { type: EmailThemeColorType.Background, hex: '#F3F3F3' },
}

/**
 * Placeholder URLs for each social-link slot. A default-seeded theme
 * always round-trips to well-formed rcml because every slot has a
 * valid URL. Callers overlay real links through the `links` bucket of
 * {@link createEmailTheme} or {@link applyTheme}.
 *
 * These values must match, byte for byte, the Rule editor's own social
 * defaults (`defaultHref` in `social-media-links.model.ts` of the
 * `rule/rule` frontend, `email-editor/core/models`). The editor compares
 * the template's social links with the brand style's, and a brand style
 * without links resolves to its own defaults; any difference (even a
 * trailing slash) makes the editor show the brand style as "Custom".
 *
 * @public
 */
export const DEFAULT_LINKS_MAP: Record<EmailThemeSocialLinkType, EmailThemeSocialLink> = {
  facebook: { type: 'facebook', url: 'https://facebook.com' },
  instagram: { type: 'instagram', url: 'https://www.instagram.com' },
  linkedin: { type: 'linkedin', url: 'https://www.linkedin.com' },
  tiktok: { type: 'tiktok', url: 'https://www.tiktok.com' },
  x: { type: 'x', url: 'https://www.x.com' },
  web: { type: 'web', url: 'https://www.website.com' },
}

/**
 * Placeholder URLs that earlier SDK versions wrote into templates. They
 * are no longer produced, but templates created before the defaults were
 * aligned with the editor still carry them, so {@link getConfiguredSocialLinks}
 * keeps treating them as "not configured".
 */
const LEGACY_PLACEHOLDER_URLS: Readonly<Record<EmailThemeSocialLinkType, readonly string[]>> = {
  facebook: ['https://www.facebook.com/'],
  instagram: ['https://www.instagram.com/'],
  linkedin: ['https://www.linkedin.com/'],
  tiktok: ['https://www.tiktok.com/'],
  x: ['https://x.com/'],
  web: ['https://www.example.com/'],
}

/**
 * Filter `theme.links` to entries the consumer explicitly configured —
 * any slot whose URL still equals the corresponding {@link
 * DEFAULT_LINKS_MAP} placeholder (or a placeholder written by an earlier
 * SDK version) is treated as not configured and dropped.
 *
 * Use this in vendor templates that should *not* render a social block
 * when the consumer never supplied socials. `createEmailTheme` always
 * seeds `theme.links` with the defaults so a naive
 * `Object.values(theme.links).length > 0` check is always true.
 *
 * A legacy `'website'` entry (from a theme persisted before the slot was
 * renamed to `'web'`) is returned as `'web'`; entries with an unknown
 * `type` are ignored.
 *
 * Edge case: if a consumer happens to set a URL to *exactly* the
 * default placeholder string (e.g. `'https://facebook.com'`),
 * this helper treats it as unconfigured. Real social URLs almost
 * always include a username or path segment, so the false-negative
 * rate is negligible in practice.
 *
 * @public
 */
export function getConfiguredSocialLinks(
  links: Readonly<Partial<Record<EmailThemeSocialLinkType, EmailThemeSocialLink>>>,
): EmailThemeSocialLink[] {
  const result: EmailThemeSocialLink[] = []

  for (const entry of Object.values(links)) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (entry === undefined) continue

    // A persisted theme may still carry the legacy 'website' slot; it is
    // returned as 'web'. Entries with an unknown type are ignored.
    const link = migrateLegacySocialLink(entry)
    const placeholder = DEFAULT_LINKS_MAP[link.type] as EmailThemeSocialLink | undefined

    if (placeholder === undefined || link.url === placeholder.url) continue
    if (LEGACY_PLACEHOLDER_URLS[link.type].includes(link.url)) continue
    result.push(link)
  }

  return result
}

/** Named system-font families available out of the box. @public */
export enum DefaultFontFamily {
  Arial = 'Arial',
  Verdana = 'Verdana',
  Helvetica = 'Helvetica',
  Tahoma = 'Tahoma',
  TrebuchetMS = 'TrebuchetMS',
  TimesNewRoman = 'TimesNewRoman',
  Georgia = 'Georgia',
  Garamond = 'Garamond',
  CourierNew = 'CourierNew',
  BrushScriptMT = 'BrushScriptMT',
}

/**
 * Display-name mapping for {@link DefaultFontFamily} values — the exact
 * string the renderer expects in CSS `font-family`, e.g.
 * `TrebuchetMS` → `'Trebuchet MS'`.
 *
 * @public
 */
export const DEFAULT_MAIN_FONT_FAMILIES_MAP: Record<DefaultFontFamily, string> = {
  [DefaultFontFamily.Arial]: 'Arial',
  [DefaultFontFamily.Verdana]: 'Verdana',
  [DefaultFontFamily.Helvetica]: 'Helvetica',
  [DefaultFontFamily.Tahoma]: 'Tahoma',
  [DefaultFontFamily.TrebuchetMS]: 'Trebuchet MS',
  [DefaultFontFamily.TimesNewRoman]: 'Times New Roman',
  [DefaultFontFamily.Georgia]: 'Georgia',
  [DefaultFontFamily.Garamond]: 'Garamond',
  [DefaultFontFamily.CourierNew]: 'Courier New',
  [DefaultFontFamily.BrushScriptMT]: 'Brush Script MT',
}

/**
 * CSS generic-family fallback for each {@link DefaultFontFamily} — the
 * token after the comma in a `font-family` stack, e.g. `sans-serif`,
 * `serif`, `monospace`, or `cursive`.
 *
 * @public
 */
export const DEFAULT_FALLBACK_FONT_FAMILIES_MAP: Record<DefaultFontFamily, string> = {
  [DefaultFontFamily.Arial]: 'sans-serif',
  [DefaultFontFamily.Verdana]: 'sans-serif',
  [DefaultFontFamily.Helvetica]: 'sans-serif',
  [DefaultFontFamily.Tahoma]: 'sans-serif',
  [DefaultFontFamily.TrebuchetMS]: 'sans-serif',
  [DefaultFontFamily.TimesNewRoman]: 'serif',
  [DefaultFontFamily.Georgia]: 'serif',
  [DefaultFontFamily.Garamond]: 'serif',
  [DefaultFontFamily.CourierNew]: 'monospace',
  [DefaultFontFamily.BrushScriptMT]: 'cursive',
}

/**
 * Return the CSS generic-family fallback for a main family name.
 * The lookup is keyed by {@link DefaultFontFamily} enum keys — e.g.
 * `'TimesNewRoman'`, `'CourierNew'`. Anything the map does not know
 * about falls back to the Helvetica default (`'sans-serif'`), so the
 * function never returns `undefined` and never throws.
 *
 * @param fontFamily - A {@link DefaultFontFamily} key, or any other
 *                     string (unknown strings get the Helvetica
 *                     fallback).
 * @returns          A CSS generic family: `'sans-serif'`, `'serif'`,
 *                   `'monospace'`, or `'cursive'`.
 *
 * @public
 */
export function getFallbackFontFamily(fontFamily: string): string {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    DEFAULT_FALLBACK_FONT_FAMILIES_MAP[fontFamily as DefaultFontFamily] ??
    DEFAULT_FALLBACK_FONT_FAMILIES_MAP[DefaultFontFamily.Helvetica]
  )
}

/**
 * Base values shared by every default font-style. Per-type defaults override
 * `fontSize`, `fontWeight`, and `color`.
 *
 * @public
 */
export const DEFAULT_FONT_STYLE_BASE: Omit<EmailThemeFontStyle, 'type'> = {
  fontFamily: DEFAULT_MAIN_FONT_FAMILIES_MAP[DefaultFontFamily.Helvetica],
  fallbackFontFamily: DEFAULT_FALLBACK_FONT_FAMILIES_MAP[DefaultFontFamily.Helvetica],
  fontSize: '16px',
  color: '#0F0F1F',
  lineHeight: '120%',
  letterSpacing: '0em',
  fontStyle: 'normal',
  fontWeight: '400',
  textDecoration: 'none',
}

/**
 * Default fully-populated font-style for each of the six slots. Each
 * entry spreads {@link DEFAULT_FONT_STYLE_BASE} and overrides only the
 * fields that actually differ per slot (size + weight for headings,
 * size + colour for the button label). Seeded into `theme.fontStyles`
 * by {@link createEmailTheme}.
 *
 * @public
 */
export const DEFAULT_FONT_STYLES_MAP: Record<EmailThemeFontStyleType, EmailThemeFontStyle> = {
  [EmailThemeFontStyleType.Paragraph]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.Paragraph,
    fontSize: '16px',
  },
  [EmailThemeFontStyleType.H1]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.H1,
    fontSize: '36px',
    fontWeight: '700',
  },
  [EmailThemeFontStyleType.H2]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.H2,
    fontSize: '28px',
    fontWeight: '700',
  },
  [EmailThemeFontStyleType.H3]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.H3,
    fontSize: '24px',
    fontWeight: '700',
  },
  [EmailThemeFontStyleType.H4]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.H4,
    fontSize: '18px',
    fontWeight: '700',
  },
  [EmailThemeFontStyleType.ButtonLabel]: {
    ...DEFAULT_FONT_STYLE_BASE,
    type: EmailThemeFontStyleType.ButtonLabel,
    fontSize: '14px',
    color: '#FFFFFF',
  },
}
