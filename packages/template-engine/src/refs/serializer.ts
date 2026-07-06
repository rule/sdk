/**
 * Default {@link TemplateRefSerializer} targeting the Rule.io RFM
 * placeholder format, plus a dispatcher and runtime type guard.
 *
 * The default output is byte-identical to the strings produced by
 * `email.createCustomField` / `email.createLoopValue` in `@rule/rcml` —
 * so existing downstream parsers and snapshot assertions keep working
 * after callers switch from pre-rendered strings to typed refs.
 *
 * @public
 */

import { TemplateRefBase } from './types.js'
import type {
  CustomFieldRef,
  LoopValueRef,
  TemplateRef,
  TemplateRefSerializer,
} from './types.js'

/**
 * Narrow an unknown value to a {@link TemplateRef}. Used by the
 * compiler's stringification step to dispatch refs through the
 * serializer before falling back to JSON.
 */
export function isTemplateRef(value: unknown): value is TemplateRef {
  return value instanceof TemplateRefBase
}

/**
 * Serialize any {@link TemplateRef} through the supplied serializer
 * by dispatching on `kind`. Exhaustive over the union; adding a new
 * ref kind surfaces as a type error here.
 */
export function serializeRef(
  ref: TemplateRef,
  serializer: TemplateRefSerializer,
): string {
  switch (ref.kind) {
    case 'custom-field':
      return serializer.serializeCustomField(ref)

    case 'loop-value':
      return serializer.serializeLoopValue(ref)
  }
}

/**
 * Default serializer emitting Rule.io RFM placeholder strings.
 *
 * Output forms:
 * - `CustomFieldRef` →
 *   `::placeholder{type="CustomField" name="<group>.<name>" value="<id>" original="[CustomField:<id>]"}`
 * - `LoopValueRef` →
 *   `::loop-value{original="[LoopValue:<key>]" value="<key>" index="<key>"}`
 *
 * `CustomFieldRef.id` is required; an undefined id raises an error so
 * the render fails loudly rather than emitting a malformed atom.
 */
export const defaultTemplateRefSerializer: TemplateRefSerializer = {
  serializeCustomField(ref: CustomFieldRef): string {
    if (ref.id === undefined) {
      throw new Error(
        `CustomFieldRef.id is required for serialization (ref: ${ref.group}.${ref.name})`,
      )
    }

    const fullName = ref.group ? `${ref.group}.${ref.name}` : ref.name

    return `::placeholder{type="CustomField" name="${fullName}" value="${String(ref.id)}" original="[CustomField:${String(ref.id)}]"}`
  },

  serializeLoopValue(ref: LoopValueRef): string {
    return `::loop-value{original="[LoopValue:${ref.key}]" value="${ref.key}" index="${ref.key}"}`
  },
}
