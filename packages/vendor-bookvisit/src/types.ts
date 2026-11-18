// TODO: move the content of this file to packages/vendor/src/vendor-types.ts after all vendors are refactored
// (copied from packages/vendor-bookzen/src/types.ts)
export type VendorFieldDefinition = {
  /** The Rule.io custom field group name (e.g. "Subscriber", "Booking"). */
  groupName: string;

  /** The Rule.io custom field name (e.g. "FirstName", "CheckInDate"). */
  fieldName: string;

  /** Whether this field is historical (append-only) or current (overwritten). */
  historical: boolean;

  /** Human-readable description of the field. */
  description: string;
};

export type VendorFieldSchema = {
  [vendorFieldName: string]: VendorFieldDefinition;
};
