/**
 * Internal: ProseMirror content delegation for the email-template validator.
 *
 * Nodes `rc-text`, `rc-heading`, `rc-button` carry a ProseMirror document
 * in their `content` field. The content-json validator
 * (`../validate-rcml-json.ts`) already handles that shape — we walk the
 * RCML tree and delegate to `safeParseJson` for every such node,
 * translating its `JsonValidationError[]` output into our unified
 * `EmailTemplateValidationIssue[]` form with the embedding path prefixed.
 */

import { emailInlineRfmConfig, emailRfmConfig } from '../content/flavors/index.js'
import { safeParseJson } from '../validate-rcml-json.js'
import { RcmlTagNamesEnum } from '../schema/index.js'
import { EmailTemplateErrorCodes, type EmailTemplateValidationIssue } from '../validate-email-template.js'

type RcmlNodeLike = {
  tagName?: unknown
  content?: unknown
  children?: unknown
}

/**
 * Walk the document tree and validate the `content` field of every text-level
 * element (`rc-text`, `rc-heading`, `rc-button`). Non-objects / non-RCML
 * shapes are skipped — structural problems are the AJV pass's concern.
 *
 * @param doc - Any value (expected to be an {@link import('../rcml-types.js').RcmlDocument}-shaped tree).
 * @returns A list of `CONTENT_INVALID` issues (empty on success).
 */
export function validateContent(doc: unknown): EmailTemplateValidationIssue[] {
  const issues: EmailTemplateValidationIssue[] = []

  visit(doc, '', issues)

  return issues
}

/**
 * Recursive visitor: delegate the `content` field of each text-level node
 * to the RCML-JSON validator, then recurse into children. Appends any
 * violations to the shared `issues` array with the embedding path prefixed.
 */
function visit(node: unknown, path: string, issues: EmailTemplateValidationIssue[]): void {
  if (!isPlainObject(node)) return
  const n = node as RcmlNodeLike
  const tagName = n.tagName

  if (
    tagName === RcmlTagNamesEnum.Text ||
    tagName === RcmlTagNamesEnum.Heading ||
    tagName === RcmlTagNamesEnum.Button
  ) {
    // When `content` is absent the node is an attribute-default override
    // inside <rc-attributes>; AJV already enforces presence in normal
    // positions, so skip content validation here.
    if (n.content !== undefined) {
      const flavor = tagName === RcmlTagNamesEnum.Button ? emailInlineRfmConfig : emailRfmConfig
      const result = safeParseJson(n.content, flavor)

      if (!result.success) {
        for (const err of result.errors) {
          issues.push({
            path: `${path}/content${err.path}`,
            code: EmailTemplateErrorCodes.CONTENT_INVALID,
            message: err.message,
          })
        }
      }
    }
  }

  if (Array.isArray(n.children)) {
    n.children.forEach((child, i) => visit(child, `${path}/children/${i}`, issues))
  }
}

/**
 * Narrow `value` to a plain object (non-array, non-null). Used as a guard
 * before reading shape-dependent properties.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
