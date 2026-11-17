/**
 * Typed template references — values that flow through `compileTemplate`
 * context as data rather than pre-rendered placeholder strings.
 *
 * A {@link TemplateRef} describes *what* the value refers to (a custom
 * field, a loop value); the compiler serializes it into the final
 * provider-specific string at the last moment, via a
 * {@link TemplateRefSerializer}. Callers stay format-agnostic.
 *
 * See `docs/typed-template-refs.md` for the architectural rationale.
 *
 * @public
 */

/**
 * Abstract base for all template reference kinds. Extend to add new
 * variants; the `kind` discriminator drives exhaustive dispatch in
 * {@link serializeRef}.
 *
 * @public
 */
export abstract class TemplateRefBase {
  abstract readonly kind: 'custom-field' | 'loop-value'
}

/**
 * Reference to a backend-resolved custom field (e.g. `Subscriber.FirstName`).
 *
 * `group` + `name` identify the field logically. `id` is the backend's
 * numeric identifier — optional in the type so callers can build refs
 * before the id is known, but **required at serialization time** for
 * formats that encode it (like RFM's `[CustomField:<id>]` form).
 *
 * @public
 */
export class CustomFieldRef extends TemplateRefBase {
  readonly kind = 'custom-field' as const

  constructor(
    readonly group: string,
    readonly name: string,
    readonly id?: number,
  ) {
    super()
  }
}

/**
 * Reference to a property of the current loop item (e.g. `name`, `sku`,
 * `quantity`). Only meaningful inside a `<?for?>`-driven loop.
 *
 * `index` is the 1-based column slot the value fills, counted across all
 * sections of the loop block (see `placeholderSpec.tokens.LoopValue` in
 * `@rule/rcml`). A single-column loop uses slot `1` for every value.
 * The constructor throws when `index` is not a positive integer, since
 * Rule does not render a token with any other slot.
 *
 * @public
 */
export class LoopValueRef extends TemplateRefBase {
  readonly kind = 'loop-value' as const

  constructor(
    readonly key: string,
    readonly index = 1,
  ) {
    super()

    if (!Number.isSafeInteger(index) || index < 1) {
      throw new Error(`LoopValueRef index must be a positive integer (got ${String(index)} for '${key}')`)
    }
  }
}

/**
 * Discriminated union of every supported template reference kind.
 * Extend by adding new variants + matching {@link TemplateRefSerializer}
 * methods.
 *
 * @public
 */
export type TemplateRef = CustomFieldRef | LoopValueRef

/**
 * Pluggable serializer that converts {@link TemplateRef} values to the
 * provider-specific placeholder strings emitted at render time.
 *
 * A default implementation targeting the Rule.io RFM format ships as
 * {@link defaultTemplateRefSerializer}. Callers can pass their own via
 * `compileTemplate({ serializer })` to target another backend.
 *
 * @public
 */
export interface TemplateRefSerializer {
  serializeCustomField(ref: CustomFieldRef): string
  serializeLoopValue(ref: LoopValueRef): string
}
