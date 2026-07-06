/**
 * Internal: cross-element column-width validation.
 *
 * When an `rc-section` contains more than one `rc-column` and every column
 * carries a percentage `width`, this pass checks that the widths sum to 100 %.
 * Single-column sections are left untouched. Columns with a missing or
 * non-percentage width (e.g. `200px`) are skipped — those values are
 * individually valid per the published schema (`validator: V.PxOrPercentage`,
 * width is optional for single-column). Only when all columns in a
 * multi-column section are percentage-valued is the sum enforced.
 */

import {
  EmailTemplateErrorCodes,
  type EmailTemplateValidationIssue,
} from '../validate-email-template.js'

const PCT_RE = /^(\d+(?:\.\d+)?)%$/

/**
 * Walk `doc` and emit `ATTR_INVALID_VALUE` issues for any multi-column
 * section where all columns carry percentage widths that do not sum to 100 %.
 * Columns with absent or non-percentage widths are not flagged here — those
 * are covered by the AJV structural pass and the per-attribute Zod pass.
 *
 * @param doc - Any value (expected to be an {@link import('../rcml-types.js').RcmlDocument}-shaped tree).
 * @returns A list of `ATTR_INVALID_VALUE` issues (empty on success).
 */
export function validateColumnWidths(doc: unknown): EmailTemplateValidationIssue[] {
  const issues: EmailTemplateValidationIssue[] = []

  visitNode(doc, '', issues)

  return issues
}

function visitNode(node: unknown, path: string, issues: EmailTemplateValidationIssue[]): void {
  if (!isObj(node)) return

  if (node.tagName === 'rc-section') {
    const children: unknown[] = Array.isArray(node.children) ? node.children : []
    const columns = children
      .map((c, i) => ({ node: c, index: i }))
      .filter(({ node: c }) => isObj(c) && c.tagName === 'rc-column')

    if (columns.length > 1) {
      let sum = 0
      let allPercentage = true

      for (const { node: col } of columns) {
        const width =
          isObj(col) && isObj(col.attributes) ? (col.attributes.width as unknown) : undefined
        const m = typeof width === 'string' ? PCT_RE.exec(width) : null

        if (!m) {
          allPercentage = false
          break
        }

        sum += parseFloat(m[1])
      }

      if (allPercentage && Math.abs(sum - 100) > 0.5) {
        const displaySum = parseFloat(sum.toFixed(2))

        issues.push({
          path: `${path}/children`,
          code: EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
          message: `Column widths in this section sum to ${displaySum}% but must sum to 100%.`,
        })
      }
    }
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child: unknown, i: number) => {
      visitNode(child, `${path}/children/${i}`, issues)
    })
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
