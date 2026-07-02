export type { SmsDocument, SmsContentJson } from './sms-types.js'
export { createSmsDocument } from './create-sms-document.js'
export type { CreateSmsDocumentOptions } from './create-sms-document.js'

export { smsRfmToJson } from './sms-rfm-to-json.js'
export { jsonToSmsRfm } from './json-to-sms-rfm.js'

export {
  validateSmsJson,
  safeParseSmsJson,
  SmsContentParseError,
} from './validate-sms-json.js'
export type {
  SmsContentValidationError,
  SmsContentSafeParseResult,
  SmsPlaceholderType,
  SmsMessageNode,
  SmsLinkNode,
  SmsPlaceholderNode,
  SmsTopLevelNode,
} from './validate-sms-json.js'

export {
  validateSmsDocument,
  safeValidateSmsDocument,
  SmsDocumentValidationError,
  SmsDocumentErrorCodes,
} from './validate-sms-document.js'
export type {
  SmsDocumentErrorCode,
  SmsDocumentValidationIssue,
  SafeValidateSmsResult,
} from './validate-sms-document.js'

export { smsToXml } from './sms-to-xml.js'
export type { SmsToXmlOptions } from './sms-to-xml.js'

export {
  xmlToSms,
  safeXmlToSms,
  SmsXmlParseError,
  SmsXmlErrorCodes,
} from './xml-to-sms.js'
export type {
  SmsXmlErrorCode,
  SmsXmlParseIssue,
  SafeXmlToSmsResult,
} from './xml-to-sms.js'

export {
  SmsDocumentBuildError,
  SmsDocumentBuildErrorCodes,
} from './builders/index.js'
export type {
  SmsDocumentBuildErrorCode,
  SmsDocumentBuildIssue,
} from './builders/index.js'

// Content-JSON builder namespace — the public import surface for SMS node builders.
// Access via `sms.createMessageNode(...)`, `sms.createLinkNode(...)`, etc.
export { sms } from './builders/index.js'
// Option-type names are re-exported for use in caller code that wants to
// declare typed wrappers around builders. Function names are intentionally
// not re-exported flat — use the `sms.` namespace.
export type {
  CreateSmsContentOptions,
  CreateSmsMessageNodeOptions,
  CreateSmsLinkNodeOptions,
  CreateSmsPlaceholderNodeOptions,
  CreateSmsSubscriberPlaceholderOptions,
  CreateSmsUserPlaceholderOptions,
  CreateSmsCustomFieldPlaceholderOptions,
  CreateSmsDatePlaceholderOptions,
  CreateSmsRemoteContentPlaceholderOptions,
  SmsDateFormat,
  SmsDateSource,
} from './builders/index.js'

export { SmsTagNamesEnum, SMS_SCHEMA_SPEC } from './schema/index.js'
export type { SmsTagName, SmsNodeSpec } from './schema/index.js'

export { smsSpec } from './sms-spec.js'
export type { SmsSpec, SmsPublicTagSpec, SmsContentSpec } from './sms-spec.js'

export { smsRfmSpec } from './sms-rfm-spec.js'
export type {
  SmsRfmSpec,
  SmsRfmFlavorSpec,
  SmsRfmNodeSpec,
  SmsRfmMarkSpec,
  SmsRfmAttrSpec,
} from './sms-rfm-spec.js'

export { smsPlaceholderSpec } from './sms-placeholder-spec.js'
export type { SmsPlaceholderTokenType } from './sms-placeholder-spec.js'
