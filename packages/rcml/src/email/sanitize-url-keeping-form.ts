/**
 * `sanitizeUrlKeepingForm` — `sanitizeUrl` that does not rewrite a URL which
 * is already fine.
 *
 * `sanitizeUrl` from `@braintree/sanitize-url` returns `new URL(...).toString()`
 * for http(s) URLs, so besides rejecting unsafe input it also normalises safe
 * input: it appends a slash to a bare origin, lowercases the host and
 * converts it to punycode, and so on. The Rule editor stores a brand style's
 * links exactly as typed and compares them with a template's social hrefs by
 * exact string, so such normalisation alone makes it show the brand style as
 * "Custom".
 *
 * @public
 */

import { sanitizeUrl } from '@braintree/sanitize-url'

/**
 * Control, whitespace and zero-width characters. `sanitizeUrl` strips or
 * decodes them, and `new URL` silently drops some of them, so a string that
 * contains any is never returned as given.
 */
const UNSAFE_CHARS = /[\s\u0000-\u001F\u007F-\u009F\u2000-\u200D\uFEFF]/

/**
 * Sanitise `url` like `sanitizeUrl`, but return it as given when it already
 * is the same URL as the sanitised one, so normalisation alone (trailing
 * slash, host case, punycode, ...) does not change it.
 *
 * `sanitizeUrl` still decides what is rejected: an unsafe URL gives
 * `'about:blank'`. The given string (trimmed) is returned only when it
 * contains no control, whitespace or zero-width characters and parses to
 * exactly the URL the sanitiser approved. Anything the sanitiser decoded or
 * stripped (HTML entities, percent-encoded characters, hidden characters)
 * makes the two differ, and the sanitised string is returned instead.
 *
 * @param url - The URL to sanitise.
 * @returns   The URL as given, or `sanitizeUrl(url)` when it differs by more
 *            than normalisation, or `'about:blank'` for an unsafe URL.
 *
 * @example
 * ```ts
 * sanitizeUrlKeepingForm('https://facebook.com')   // 'https://facebook.com'
 * sanitizeUrlKeepingForm('https://Acme.Example')   // 'https://Acme.Example'
 * sanitizeUrlKeepingForm('javascript:alert(1)')    // 'about:blank'
 * ```
 *
 * @public
 */
export function sanitizeUrlKeepingForm(url: string): string {
  const safe = sanitizeUrl(url)

  if (safe === 'about:blank') return safe

  const given = url.trim()

  return !UNSAFE_CHARS.test(given) && URL.canParse(given) && new URL(given).href === safe
    ? given
    : safe
}
