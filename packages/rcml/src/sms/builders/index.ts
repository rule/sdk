// Error types
export { SmsDocumentBuildErrorCodes, SmsDocumentBuildError, throwIfSmsIssues } from './errors.js'
export type { SmsDocumentBuildErrorCode, SmsDocumentBuildIssue } from './errors.js'

// Content node builders
export { createContent, createMessageNode, createLinkNode, createUnsubscribeNodes } from './nodes.js'
export type {
  CreateSmsContentOptions,
  CreateSmsMessageNodeOptions,
  CreateSmsLinkNodeOptions,
} from './nodes.js'

// Placeholder builders
export {
  createCustomFieldPlaceholder,
  createDatePlaceholder,
  createLinkPlaceholder,
  createPlaceholderNode,
  createRemoteContentPlaceholder,
  createSubscriberPlaceholder,
  createUserPlaceholder,
} from './placeholders.js'
export type {
  CreateSmsCustomFieldPlaceholderOptions,
  CreateSmsDatePlaceholderOptions,
  CreateSmsLinkPlaceholderOptions,
  CreateSmsPlaceholderNodeOptions,
  CreateSmsRemoteContentPlaceholderOptions,
  CreateSmsSubscriberPlaceholderOptions,
  CreateSmsUserPlaceholderOptions,
  SmsDateFormat,
  SmsDateSource,
  SmsSubscriberField,
  SmsSystemLinkType,
  SmsUserField,
} from './placeholders.js'

// Namespace bundle
export { sms } from './sms-namespace.js'
