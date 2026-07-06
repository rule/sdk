import { SmsDocumentBuildErrorCodes, type SmsDocumentBuildIssue } from '../builders/errors.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Check that `input` has the correct `rc-sms` leaf-node shape.
 *
 * Returns an empty array when the structure is valid, or a list of issues.
 * @internal
 */
export function validateSmsStructure(input: unknown): SmsDocumentBuildIssue[] {
  const issues: SmsDocumentBuildIssue[] = []

  if (typeof input !== 'object' || input === null) {
    issues.push({
      code: SmsDocumentBuildErrorCodes.STRUCTURE_INVALID,
      path: '',
      message: 'SMS document must be an object.',
    })

    return issues
  }

  const node = input as Record<string, unknown>

  if (node['tagName'] !== 'rc-sms') {
    issues.push({
      code: SmsDocumentBuildErrorCodes.STRUCTURE_INVALID,
      path: 'tagName',
      message: `tagName must be 'rc-sms', got '${String(node['tagName'])}'.`,
    })
  }

  if (node['id'] === undefined || node['id'] === null) {
    issues.push({
      code: SmsDocumentBuildErrorCodes.ID_INVALID,
      path: 'id',
      message: 'id is required (a UUID string).',
    })
  } else if (typeof node['id'] !== 'string' || !UUID_RE.test(node['id'])) {
    issues.push({
      code: SmsDocumentBuildErrorCodes.ID_INVALID,
      path: 'id',
      message: `id must be a valid UUID, got '${String(node['id'])}'.`,
    })
  }

  if (node['content'] === undefined || node['content'] === null) {
    issues.push({
      code: SmsDocumentBuildErrorCodes.CONTENT_REQUIRED,
      path: 'content',
      message: 'content is required.',
    })
  }

  return issues
}
