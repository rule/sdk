/**
 * Resolve the preferred brand style for an account.
 *
 * Returns the brand style marked `isDefault` on the account, falling back to
 * the first style in the list if no default is set. Throws if the account has
 * no brand styles at all.
 *
 * Use this helper instead of hardcoding brand style IDs — a customer's
 * preferred style can change.
 *
 * @public
 */

import { RuleApiError } from './errors.js';
import type { RuleClient } from './client.js';
import type { BrandStyleListItem } from './resources/brand-styles/brand-styles.types.js';

export type ResolvePreferredBrandStyleSource = 'default' | 'fallback' | 'explicit';

export interface ResolvePreferredBrandStyleResult {
  /** ID of the resolved brand style. */
  id: number;
  /** The resolved brand style list item. */
  brandStyle: BrandStyleListItem;
  /**
   * How the style was selected.
   *
   * `'explicit'` — a specific `brandStyleId` was passed to the function.
   * `'default'` — the style is flagged `isDefault` on the account.
   * `'fallback'` — no default was set; the first style in the list was used.
   */
  source: ResolvePreferredBrandStyleSource;
}

/**
 * Resolve the preferred brand style for an account.
 *
 * Fetches all brand styles and returns the one marked `isDefault`. If none is
 * marked default, falls back to the first in the list. Throws if the account
 * has no brand styles.
 *
 * @param client - A `RuleClient` instance.
 * @param brandStyleId - Optional: if provided, look up and return this specific
 *   brand style ID instead of auto-resolving the default.
 *
 * @example
 * ```typescript
 * const { id: brandStyleId } = await resolvePreferredBrandStyle(client);
 * ```
 */
export async function resolvePreferredBrandStyle(
  client: RuleClient,
  brandStyleId?: number
): Promise<ResolvePreferredBrandStyleResult> {
  const styles = await client.brandStyles.list();

  if (styles.length === 0) {
    throw new RuleApiError('No brand styles found on this account.', 404);
  }

  if (brandStyleId !== undefined) {
    const match = styles.find((s) => s.id === brandStyleId);

    if (!match) {
      throw new RuleApiError(`Brand style ${brandStyleId} not found.`, 404);
    }

    return { id: match.id, brandStyle: match, source: 'explicit' };
  }

  const defaultStyle = styles.find((s) => s.isDefault);

  if (defaultStyle) {
    return { id: defaultStyle.id, brandStyle: defaultStyle, source: 'default' };
  }

  const fallback = styles[0]!;

  return { id: fallback.id, brandStyle: fallback, source: 'fallback' };
}
