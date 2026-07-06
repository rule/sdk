/**
 * Custom field schema types for the `@rule/client` customField namespace.
 *
 * These types wrap the v2 `/customizations` endpoints which manage the
 * structure of custom field groups and their fields. For reading and writing
 * actual subscriber field values, see `client.subscribers.*CustomFieldData*`.
 */

// ── Public SDK types ──────────────────────────────────────────────────────────

/**
 * Custom field data type.
 *
 * - `'text'` — free-form text (default)
 * - `'single'` — single-select
 * - `'multiple'` — multi-select
 * - `'json'` — arbitrary JSON
 * - `'date'` — date only (`YYYY-MM-DD`)
 * - `'datetime'` — date and time
 * - `'time'` — time only
 */
export type CustomFieldValueType =
  | 'text'
  | 'single'
  | 'multiple'
  | 'json'
  | 'date'
  | 'datetime'
  | 'time';

/**
 * A custom field definition within a group.
 */
export interface CustomFieldDefinition {
  /** Field ID. */
  id: number;
  /** Field name. */
  name: string;
  /** Field data type. */
  type: CustomFieldValueType;
}

/**
 * A custom field group, as returned by `CustomFieldClient.getGroup`
 * and `CustomFieldClient.listGroups`.
 */
export interface CustomFieldGroup {
  /** Group ID. */
  id: number;
  /** Group name. */
  name: string;
  /** Fields defined in this group. */
  fields: CustomFieldDefinition[];
  /** ISO 8601 timestamp of when the group was created. */
  createdAt?: string;
  /** ISO 8601 timestamp of when the group was last updated. */
  updatedAt?: string;
}

/**
 * Parameters for `CustomFieldClient.listGroups` and the auto-pagination
 * helpers (`CustomFieldClient.iterateGroups`,
 * `CustomFieldClient.iterateGroupsPages`,
 * `CustomFieldClient.listAllGroups`).
 */
export interface ListCustomFieldGroupsParams {
  /**
   * Number of groups per page (1–100, default 100).
   */
  limit?: number;
}

/**
 * An entry for `CustomFieldClient.createGroups`.
 *
 * Specifies one field to create using the `"GroupName.FieldName"` key
 * format. Both the group and the field are created if they do not already
 * exist.
 *
 * @example
 * ```typescript
 * await client.customField.createGroups([
 *   { key: 'Booking.FirstName', type: 'text' },
 *   { key: 'Booking.LastName',  type: 'text' },
 *   { key: 'Order.TotalAmount', type: 'text' },
 * ]);
 * ```
 */
export interface CreateCustomFieldEntry {
  /**
   * Group and field name joined by a dot: `"GroupName.FieldName"`.
   *
   * Both the group and the field are created if they do not already exist.
   */
  key: string;
  /**
   * Field data type.
   *
   * Defaults to `'text'` when omitted.
   */
  type?: CustomFieldValueType;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format custom field definition from the v2 `/customizations` API.
 * @internal
 */
export interface CustomFieldDefinitionWire {
  id: number;
  name: string;
  type: CustomFieldValueType;
}

/**
 * Wire-format custom field group from GET `/customizations/{identifier}`.
 * @internal
 */
export interface CustomFieldGroupWire {
  id: number;
  name: string;
  fields: CustomFieldDefinitionWire[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Wire response from GET `/customizations`.
 * @internal
 */
export interface CustomFieldGroupsListWire {
  groups?: CustomFieldGroupWire[];
  meta?: { next?: string };
}
