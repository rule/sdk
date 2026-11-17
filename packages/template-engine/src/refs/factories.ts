/**
 * Ergonomic factory functions for {@link TemplateRef} values.
 *
 * Prefer these over object literals at call sites — they keep the
 * `kind` discriminator out of caller code and give TypeScript a single
 * place to infer the ref type from.
 *
 * @public
 */

import { CustomFieldRef, LoopValueRef } from './types.js'

/**
 * Build a {@link CustomFieldRef}.
 *
 * @param group - Logical field group, e.g. `Subscriber`, `Order`.
 * @param name - Field name within the group, e.g. `FirstName`.
 * @param id - Optional backend numeric id. Required at serialization
 *   time for formats that encode it (RFM does).
 */
export function customField(
  group: string,
  name: string,
  id?: string | number,
): CustomFieldRef {
  return new CustomFieldRef(group, name, id !== undefined ? Number(id) : undefined)
}

/**
 * Build a {@link LoopValueRef}.
 *
 * @param key - Property key inside the current loop item
 *   (e.g. `name`, `sku`, `quantity`).
 * @param index - 1-based column slot the value fills (default `1`, the
 *   only slot of a single-column loop).
 * @throws Error when `index` is not a positive integer — Rule does not
 *   render a token with any other slot.
 */
export function loopValue(key: string, index = 1): LoopValueRef {
  return new LoopValueRef(key, index)
}
