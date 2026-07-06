import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkDirective from 'remark-directive'
import { VFile } from 'vfile'
import { preprocessMarkdown } from './preprocess.js'
import { validate } from './validate.js'
import { formatErrors } from './format.js'
import { emailRfmConfig } from '../flavors/email-rfm.js'
import { emailInlineRfmConfig } from '../flavors/email-inline-rfm.js'
import type { RcmlParseOptions, RcmlParseResult, ValidationError } from './types.js'
import type { FlavorConfig } from '../flavors/types.js'
import type { Node } from 'unist'

/**
 * Error thrown when `parseEmailRfm()` or `parseEmailInlineRfm()` (or any custom
 * flavor-specific parse function) receives input that fails validation.
 *
 * The `message` property contains a numbered, human-readable list of all
 * errors — suitable for an MCP to read and act on iteratively.
 *
 * @internal
 */
export class RcmlValidationError extends Error {
  readonly errors: ValidationError[]

  constructor(errors: ValidationError[], formatted: string) {
    super(formatted)
    this.name = 'RcmlValidationError'
    this.errors = errors
  }
}

/**
 * Parse an Email RFM or Email Inline RFM markdown string into a Remark AST.
 *
 * This is Stage 1 of the rcml-generator pipeline. The result is a raw MDAST
 * with no validation applied — use `parseEmailRfm()` or `parseEmailInlineRfm()` for
 * validated parsing, or call `validate(ast, config)` separately.
 *
 * @param input - Raw markdown text
 * @param options - Parse options
 * @returns Object containing the MDAST Root node and the VFile
 *
 * @internal
 *
 * @example
 * ```ts
 * const { ast } = parse('Hello :font[world]{font-weight="bold"}')
 * ```
 */
export function parse(
  input: string,
  options: RcmlParseOptions = {},
): RcmlParseResult {
  const file = new VFile({ value: preprocessMarkdown(input) })
  const processor = unified().use(remarkParse).use(remarkDirective)
  const ast = processor.parse(file)

  if (options.position === false) {
    stripPositions(ast)
  }

  return { ast, file }
}

/**
 * Recursively remove `position` properties from all AST nodes.
 * @internal
 */
function stripPositions(node: Node): void {
  delete node.position

  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) {
      stripPositions(child as Node)
    }
  }
}

/**
 * Options accepted by {@link parseEmailRfm} and {@link parseEmailInlineRfm}.
 * @internal
 */
export interface FlavorParseOptions {
  /**
   * Include position information in AST nodes.
   * @default true
   */
  position?: boolean;
}

/**
 * Parse and validate a markdown string using the given flavor config.
 * Throws {@link RcmlValidationError} if validation fails.
 * @internal
 */
function parseWithFlavor(input: string, options: FlavorParseOptions, config: FlavorConfig): RcmlParseResult {
  const result = parse(input, options)
  const validation = validate(result.ast, config)

  if (!validation.valid) {
    throw new RcmlValidationError(validation.errors, formatErrors(validation) ?? 'Validation failed')
  }

  return result
}

/**
 * Parse and validate a full Email RFM markdown string.
 *
 * Throws `RcmlValidationError` if the input contains syntax not allowed by
 * the Email RFM flavor (e.g. headings, native bold, unknown directives).
 *
 * @internal
 *
 * @example
 * ```ts
 * const { ast } = parseEmailRfm('A :font[bold]{font-weight="bold"} paragraph.')
 * ```
 */
export function parseEmailRfm(input: string, options: FlavorParseOptions = {}): RcmlParseResult {
  return parseWithFlavor(input, options, emailRfmConfig)
}

/**
 * Parse and validate an Email Inline RFM markdown string.
 *
 * Throws `RcmlValidationError` if the input contains syntax not allowed by
 * the Email Inline RFM flavor (e.g. lists, :::align, hard breaks).
 *
 * @internal
 *
 * @example
 * ```ts
 * const { ast } = parseEmailInlineRfm(':font[Click here]{font-weight="bold"}')
 * ```
 */
export function parseEmailInlineRfm(input: string, options: FlavorParseOptions = {}): RcmlParseResult {
  return parseWithFlavor(input, options, emailInlineRfmConfig)
}
