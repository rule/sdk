/**
 * Internal helpers shared across the theme submodule. Nothing here is
 * part of the public `@rule/rcml` surface.
 *
 * @internal
 */

/**
 * Structural clone of `value` via a `JSON.stringify`/`JSON.parse`
 * round-trip. The copy and the input share no references at any depth,
 * so the result is safe to mutate freely. Only intended for the plain-
 * object shapes this module deals with — functions, class instances,
 * `Map`/`Set`, and `undefined` values inside objects are not preserved.
 *
 * @param value - The value to clone. Must be JSON-serialisable.
 * @returns     An independent copy of `value`.
 *
 * @internal
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
