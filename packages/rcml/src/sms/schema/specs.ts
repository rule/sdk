import { SmsTagNamesEnum } from './tag-names.js'
import type { SmsTagName } from './tag-names.js'
import type { SmsNodeSpec } from './types.js'

export type { SmsNodeSpec, SmsTagName }

export const SMS_SCHEMA_SPEC = {
  [SmsTagNamesEnum.Sms]: {
    isLeaf: true,
    description:
      'Root element of an SMS document. Carries the message body as structured SmsContentJson content.',
  },
} as const satisfies Record<SmsTagName, SmsNodeSpec>
