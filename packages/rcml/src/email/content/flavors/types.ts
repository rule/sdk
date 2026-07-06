import type { ZodType } from 'zod'

/**
 * Configuration object that fully describes a RFM markdown flavor.
 *
 * Pass an instance to `validate()` or create flavor-specific parse functions
 * using `parseEmailRfm()` / `parseEmailInlineRfm()` as a reference.
 *
 * To add a new flavor, create a `FlavorConfig` — no changes to the parser
 * or validator are required.
 *
 * @example
 * ```ts
 * import type { FlavorConfig } from 'rcml-generator'
 * import { z } from 'zod'
 *
 * const myFlavor: FlavorConfig = {
 *   name: 'My Flavor',
 *   allowedBlockNodes: new Set(['list', 'listItem']),
 *   allowedTextDirectives: new Map([['font', z.object({ 'font-weight': z.string() }).passthrough()]]),
 *   allowedLeafDirectives: new Map(),
 *   allowedContainerDirectives: new Map(),
 * }
 * ```
 */
export interface FlavorConfig {
  /**
   * Human-readable flavor name used in error messages (e.g. `"Inline RFM"`).
   */
  name: string;

  /**
   * MDAST block node types allowed beyond the implicit baseline of
   * `root` and `paragraph` (which are always permitted).
   *
   * Common values: `"list"`, `"listItem"`, `"break"`.
   */
  allowedBlockNodes: ReadonlySet<string>;

  /**
   * Allowed text directives (`:name[...]{...}`) keyed by directive name.
   *
   * The value is a Zod schema used to validate the directive's attributes,
   * or `null` to skip attribute validation for that directive.
   */
  allowedTextDirectives: ReadonlyMap<string, ZodType | null>;

  /**
   * Allowed leaf directives (`::name{...}`) keyed by directive name.
   *
   * Used for inline atom directives: `::placeholder`, `::loop-value`.
   * The value is a Zod schema for attribute validation, or `null` to skip validation.
   */
  allowedLeafDirectives: ReadonlyMap<string, ZodType | null>;

  /**
   * Allowed container directives (`:::name{...}`) keyed by directive name.
   *
   * The value is a Zod schema used to validate the directive's attributes,
   * or `null` to skip attribute validation for that directive.
   */
  allowedContainerDirectives: ReadonlyMap<string, ZodType | null>;

  /**
   * When `true`, the document must contain exactly one paragraph.
   * Used by Inline RFM, where multi-paragraph content is structurally invalid.
   *
   * Enforced at the JSON Schema level (`maxItems: 1` on `doc.content`).
   */
  singleParagraph?: boolean;
}
