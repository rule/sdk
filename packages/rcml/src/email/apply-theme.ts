/**
 * Public entry point for applying a theme (or a partial patch) to an
 * {@link RcmlDocument}.
 *
 * Exposes a single function, {@link applyTheme}, that unifies the
 * "full-theme" and "partial-patch" cases. Internal per-field helpers live
 * in `./theme/theme-rcml.ts`; this file's only job is orchestrating them
 * based on which fields the caller provided.
 */

import type { RcmlAttributes, RcmlDocument, RcmlHead } from './rcml-types.js'
import type {
  EmailTheme,
  EmailThemeColor,
  EmailThemeFont,
  EmailThemeFontStyle,
  EmailThemeImage,
  EmailThemePatch,
  EmailThemeSocialLink,
} from './theme-types.js'
import { EmailThemeColorType, EmailThemeImageType } from './theme-types.js'
import { DEFAULT_FONT_STYLES_MAP } from './theme-defaults.js'
import {
  type AnyAttrChild,
  EmailThemeApplyError,
  applyBodyDefaults,
  cloneHead,
  findOrCreateAttributes,
  overlayFontsInHead,
  upsertBodyBackgroundColor,
  upsertBrandColorClass,
  upsertBrandStyleInHead,
  upsertButtonBackgroundColor,
  upsertFontStyleClass,
  upsertLogoClass,
  upsertSectionBackgroundColor,
  upsertSocialOverlay,
} from './theme/theme-rcml.js'

export { EmailThemeApplyError }

/**
 * Apply a theme or a partial patch to an RCML document. The input doc is
 * not mutated; a new {@link RcmlDocument} is returned.
 *
 * Every bucket uses **overlay** semantics: for each entry the caller
 * provides, the matching rcml node is upserted (updated if present,
 * created if missing). Entries the caller does *not* mention are left
 * alone. This means:
 *
 * - Pass a full {@link EmailTheme} → every bucket's every sub-slot is
 *   present, so every theme-controlled node is upserted. The doc ends
 *   up matching the theme, but any orphan custom nodes that aren't part
 *   of the theme's vocabulary survive.
 * - Pass a partial {@link EmailThemePatch} (e.g.
 *   `{ colors: [{ type: Primary, hex: '#F00' }] }`) → only `rc-button`'s
 *   background-color is touched. `rc-body`, `rc-section`, the
 *   `rcml-brand-color` class, `rc-social`, `rc-font` etc. are untouched.
 * - Pass an empty bucket (e.g. `{ colors: [] }`) → no-op for that bucket.
 *   `applyTheme` never removes nodes; there's no explicit "clear" verb.
 *
 * Works uniformly on:
 * - Docs with no theme yet (missing head nodes get created).
 * - Docs with the default theme applied (node identity preserved; `id`s
 *   kept).
 * - Docs with a different custom theme (same upsert-only behaviour).
 *
 * @param doc   The document to theme. Not mutated.
 * @param theme Either a full {@link EmailTheme} or a partial
 *              {@link EmailThemePatch}.
 * @returns     A new {@link RcmlDocument} with the theme applied.
 *
 * @throws {@link EmailThemeApplyError} when a URL (logo src, social href,
 * font href) fails safety validation.
 *
 * @public
 */
export function applyTheme(
  doc: RcmlDocument,
  theme: EmailTheme | EmailThemePatch
): RcmlDocument {
  const patch = normalizeInput(theme)
  const [head, body] = doc.children
  const cloned: RcmlHead = cloneHead(head)
  let updatedBody = body

  if (patch.brandStyleId !== undefined) {
    upsertBrandStyleInHead(cloned.children, patch.brandStyleId)
  }

  const touchesAttributes =
    hasEntries(patch.colors) ||
    hasEntries(patch.links) ||
    hasEntries(patch.images) ||
    hasEntries(patch.fontStyles)

  if (touchesAttributes) {
    const attributes: RcmlAttributes = findOrCreateAttributes(cloned.children)
    const attrChildren = attributes.children as unknown as AnyAttrChild[]

    if (patch.colors) {
      for (const color of patch.colors) {
        applyColorOverlay(attrChildren, color)
      }
    }

    if (patch.images) {
      for (const image of patch.images) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (image.type === EmailThemeImageType.Logo) {
          upsertLogoClass(attrChildren, image.url)
        }
      }
    }

    if (patch.fontStyles) {
      for (const partial of patch.fontStyles) {
        if (partial.type === undefined) continue

        const merged: EmailThemeFontStyle = {
          ...DEFAULT_FONT_STYLES_MAP[partial.type],
          ...partial,
          type: partial.type,
        }

        upsertFontStyleClass(attrChildren, merged, partial.type)
      }
    }

    if (patch.links && patch.links.length > 0) {
      upsertSocialOverlay(attrChildren, patch.links)
    }
  }

  {
    const logoImages = patch.images?.filter(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      (img) => img.type === EmailThemeImageType.Logo
    )
    const lastLogo = logoImages && logoImages.length > 0
      ? logoImages[logoImages.length - 1]
      : undefined
    const logoUrl = lastLogo?.url

    updatedBody = applyBodyDefaults(updatedBody, logoUrl)
  }

  if (patch.fonts && patch.fonts.length > 0) {
    cloned.children = overlayFontsInHead(cloned.children, patch.fonts)
  }

  return { ...doc, children: [cloned, updatedBody] }
}

/**
 * Type guard: is `value` a non-empty array? Used as the trigger for
 * attribute-bucket work inside {@link applyTheme} — an absent or empty
 * bucket is a no-op.
 */
function hasEntries<T>(value: readonly T[] | undefined): value is readonly T[] {
  return value !== undefined && value.length > 0
}

/**
 * Route a single {@link EmailThemeColor} to the internal upsert helper
 * that owns its rcml-level representation. Unknown color types are
 * ignored silently.
 *
 * @param attrChildren - `<rc-attributes>` children (mutated).
 * @param color        - The colour entry to overlay.
 */
function applyColorOverlay(attrChildren: AnyAttrChild[], color: EmailThemeColor): void {
  switch (color.type) {
    case EmailThemeColorType.Background:
      upsertBodyBackgroundColor(attrChildren, color.hex)

      return
    case EmailThemeColorType.Body:
      upsertSectionBackgroundColor(attrChildren, color.hex)

      return
    case EmailThemeColorType.Primary:
      upsertButtonBackgroundColor(attrChildren, color.hex)

      return
    case EmailThemeColorType.Secondary:
      upsertBrandColorClass(attrChildren, color.hex)

      return
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Internal normalization
// ──────────────────────────────────────────────────────────────────────────

interface NormalizedInput {
  brandStyleId?: number
  colors?: EmailThemeColor[]
  links?: EmailThemeSocialLink[]
  images?: EmailThemeImage[]
  fonts?: readonly EmailThemeFont[]
  fontStyles?: Partial<EmailThemeFontStyle>[]
}

/**
 * Normalise either an {@link EmailTheme} (with map-shaped `colors` /
 * `links` / `images` / `fontStyles`) or an {@link EmailThemePatch}
 * (with array-shaped buckets) into a uniform shape the orchestrator
 * can iterate over.
 *
 * Absent fields stay absent; present-but-empty arrays stay empty
 * arrays; map-shaped fields expand via `Object.values` with `undefined`
 * entries filtered out.
 *
 * @param input - A full theme or a patch.
 * @returns     A {@link NormalizedInput} with every bucket as an array
 *              (or `undefined` when the caller did not provide it).
 */
function normalizeInput(input: EmailTheme | EmailThemePatch): NormalizedInput {
  const out: NormalizedInput = {}

  if (input.brandStyleId !== undefined) {
    out.brandStyleId = input.brandStyleId
  }

  if (input.colors !== undefined) {
    out.colors = Array.isArray(input.colors)
      ? input.colors
      : Object.values(input.colors).filter((x): x is EmailThemeColor => x !== undefined)
  }

  if (input.links !== undefined) {
    out.links = Array.isArray(input.links)
      ? input.links
      : Object.values(input.links).filter((x): x is EmailThemeSocialLink => x !== undefined)
  }

  if (input.images !== undefined) {
    out.images = Array.isArray(input.images)
      ? input.images
      : Object.values(input.images).filter((x): x is EmailThemeImage => x !== undefined)
  }

  if (input.fonts !== undefined) {
    out.fonts = input.fonts
  }

  if (input.fontStyles !== undefined) {
    out.fontStyles = Array.isArray(input.fontStyles)
      ? input.fontStyles
      : (Object.values(input.fontStyles) as Partial<EmailThemeFontStyle>[])
  }

  return out
}

