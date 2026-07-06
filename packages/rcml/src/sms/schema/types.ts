/** Declaration for one SMS RCML tag. */
export interface SmsNodeSpec {
  /** `true` — `rc-sms` is a leaf node; it carries no child elements. */
  isLeaf: boolean
  /** Human-readable description for tooling and documentation. */
  description?: string
}
