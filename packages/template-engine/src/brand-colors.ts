/**
 * Brand colours projected into every template's compile context as
 * `brand`, so XML can colour elements the theme's default attributes
 * don't reach (a divider, a hairline) with `@{brand.hairline}` instead
 * of a hard-coded hex. Values are fixed at render time and outrank the
 * rc-head defaults the Rule editor edits, so prefer those defaults:
 * a canvas-coloured section is `background-color="transparent"`, not
 * `@{brand.canvas}`.
 *
 * Names follow the Rule brand-style UI, not the `EmailThemeColorType`
 * slot names, because the two disagree on "Background":
 *
 * | `brand.*`    | Rule UI label | Theme slot                         |
 * | ------------ | ------------- | ---------------------------------- |
 * | `primary`    | Primary       | `EmailThemeColorType.Primary`      |
 * | `secondary`  | Secondary     | `EmailThemeColorType.Secondary`    |
 * | `text`       | Text          | `fontStyles.p.color`               |
 * | `background` | Background    | `EmailThemeColorType.Body`         |
 * | `canvas`     | Canvas        | `EmailThemeColorType.Background`   |
 *
 * `muted` and `hairline` have no brand-style slot; they are derived by
 * blending `text` over `background` (60% and 8%), so they follow the
 * brand on any palette, dark ones included.
 *
 * @public
 */

import type { EmailTheme } from '@rule/rcml'
import { DEFAULT_COLORS_MAP, EmailThemeColorType, EmailThemeFontStyleType } from '@rule/rcml'

/**
 * CSS colours a template can reference as `@{brand.<key>}` — hex
 * whenever the theme supplies hex; a non-hex theme colour (`rgb(…)`,
 * a name) passes through to `text` and `muted` as given.
 *
 * @public
 */
export interface BrandColors {
  readonly primary: string
  readonly secondary: string
  readonly text: string
  readonly background: string
  readonly canvas: string
  /** `text` at 60% over `background` — secondary labels and meta text. */
  readonly muted: string
  /** `text` at 8% over `background` — dividers and hairlines. */
  readonly hairline: string
}

const MUTED_ALPHA = 0.6
const HAIRLINE_ALPHA = 0.08

/**
 * Parse `#RGB`, `#RGBA`, `#RRGGBB` or `#RRGGBBAA` (alpha ignored; the
 * leading `#` is optional) into channels.
 */
function parseHex(hex: string): [number, number, number] | undefined {
  const m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim())

  if (m === null) {
    return undefined
  }

  const raw = m[1]
  const full = raw.length <= 4 ? raw.slice(0, 3).split('').map((c) => c + c).join('') : raw.slice(0, 6)

  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number]
}

/**
 * Blend `fg` over `bg` at `alpha` (0–1) and return `#RRGGBB`. Returns
 * `fallback` (default `fg`) when either input is not `#RGB`, `#RGBA`,
 * `#RRGGBB` or `#RRGGBBAA` (the `#` may be omitted).
 */
export function blendHex(fg: string, bg: string, alpha: number, fallback: string = fg): string {
  const f = parseHex(fg)
  const b = parseHex(bg)

  if (f === undefined || b === undefined) {
    return fallback
  }

  return (
    '#' +
    f
      .map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)))
      .map((c) => c.toString(16).padStart(2, '0').toUpperCase())
      .join('')
  )
}

/**
 * Read the brand palette off a theme. A colour slot the theme leaves
 * unset falls back to `DEFAULT_COLORS_MAP` (the values
 * `createEmailTheme` seeds); `applyTheme` writes no attribute for such
 * a slot, so the rendered head carries that fallback only where the
 * template seeds it (e.g. `<rc-section background-color="@{brand.background}"/>`
 * inside `<rc-attributes>`).
 *
 * When `text` or `background` is not hex (`rgb(…)`, a colour name),
 * `muted` falls back to `text` so secondary copy stays readable, and
 * `hairline` falls back to `background` so dividers fade out rather
 * than render as solid text-coloured rules.
 *
 * @public
 */
export function getBrandColors(theme: EmailTheme): BrandColors {
  const slot = (type: EmailThemeColorType): string => theme.colors[type]?.hex ?? DEFAULT_COLORS_MAP[type].hex
  const text = theme.fontStyles[EmailThemeFontStyleType.Paragraph].color
  const background = slot(EmailThemeColorType.Body)

  return {
    primary: slot(EmailThemeColorType.Primary),
    secondary: slot(EmailThemeColorType.Secondary),
    text,
    background,
    canvas: slot(EmailThemeColorType.Background),
    muted: blendHex(text, background, MUTED_ALPHA),
    hairline: blendHex(text, background, HAIRLINE_ALPHA, background),
  }
}
