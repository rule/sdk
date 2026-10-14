/**
 * Internal helper for the `'website'` → `'web'` social-link slot rename.
 *
 * Themes created before the rename (including persisted ones, since a theme
 * is a plain JSON-serialisable object) carry the website slot as
 * `{ type: 'website' }` / `links.website`. The public
 * {@link EmailThemeSocialLinkType} no longer includes `'website'`, but every
 * entry point that accepts links at runtime migrates it here so such input
 * keeps producing valid RCML instead of `name="website"`.
 *
 * @internal
 */

import type { EmailThemeSocialLink } from '../theme-types.js'

/**
 * Return `link` with the legacy `'website'` type renamed to `'web'`; any
 * other link is returned as-is.
 *
 * @internal
 */
export function migrateLegacySocialLink(link: EmailThemeSocialLink): EmailThemeSocialLink {
  return (link.type as string) === 'website' ? { ...link, type: 'web' } : link
}
