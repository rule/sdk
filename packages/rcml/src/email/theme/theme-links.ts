/**
 * Internal factory helper for {@link EmailTheme.links}. Used by
 * `create-theme.ts` to apply the `links` bucket of an
 * {@link EmailThemePatch}.
 *
 * @internal
 */

import type {
  EmailTheme,
  EmailThemeSocialLink,
  EmailThemeSocialLinkType,
} from '../theme-types.js'
import { DEFAULT_LINKS_MAP } from '../theme-defaults.js'
import { migrateLegacySocialLink } from './legacy-social-link.js'
import { deepClone } from './utils.js'

const LINK_ORDER: readonly EmailThemeSocialLinkType[] = [
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'x',
  'web',
]

/**
 * Return a new theme whose `links` bucket is built by cloning
 * {@link DEFAULT_LINKS_MAP} and overlaying each entry in `links` keyed by
 * its `type`. Slot types not present in `links` keep the default URL;
 * entries whose `type` is not one of the six
 * {@link EmailThemeSocialLinkType} values are dropped silently, except the
 * legacy `'website'` type, which is treated as `'web'`. Each
 * provided entry is shallow-copied into the result so later mutation of
 * `links` does not affect the returned theme.
 *
 * @param theme - Base theme to copy; left untouched.
 * @param links - Per-type social-link overrides applied on top of the
 *                defaults. Pass `[]` to reset every slot back to its
 *                default URL.
 * @returns     A fresh {@link EmailTheme} with a new `links` map.
 *
 * @internal
 */
export function resetLinksTo(theme: EmailTheme, links: EmailThemeSocialLink[]): EmailTheme {
  const next: Partial<Record<EmailThemeSocialLinkType, EmailThemeSocialLink>> =
    deepClone(DEFAULT_LINKS_MAP)

  for (const entry of links) {
    const link = migrateLegacySocialLink(entry)

    if (LINK_ORDER.includes(link.type)) {
      next[link.type] = { ...link }
    }
  }

  return { ...theme, links: next }
}
