/**
 * Custom field schema client for the `@rule/client` package.
 *
 * Wraps the v2 `/customizations` endpoints for managing custom field group
 * schemas — creating groups and fields, listing them, and fetching a single
 * group with its field definitions.
 *
 * For reading and writing actual subscriber field **values**, use the
 * `client.subscribers.*CustomFieldData*` methods instead.
 */

import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import type {
  CreateCustomFieldEntry,
  CustomFieldDefinition,
  CustomFieldDefinitionWire,
  CustomFieldGroup,
  CustomFieldGroupWire,
  CustomFieldGroupsListWire,
  ListCustomFieldGroupsParams,
} from './custom-field.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class CustomFieldClient extends BaseResource {
  /**
   * Fetch one page of custom field groups.
   *
   * This is the primitive list method. For auto-pagination use
   * {@link iterateGroups}, {@link iterateGroupsPages}, or
   * {@link listAllGroups}.
   *
   * @param params - Optional parameters.
   * @returns Groups on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.customField.listGroups({ limit: 20 });
   * ```
   */
  async listGroups(params?: ListCustomFieldGroupsParams): Promise<CustomFieldGroup[]> {
    const qs = params?.limit !== undefined ? `?limit=${params.limit}` : '';
    const wire = await this.transport.get<CustomFieldGroupsListWire>(
      `/customizations${qs}`,
      { version: 'v2' }
    );

    return (wire.groups ?? []).map(mapGroupWireToEntity);
  }

  /**
   * Iterate through all custom field groups page by page.
   *
   * Automatically requests additional pages as needed and yields each full
   * page as an array.
   *
   * @param params - Optional parameters.
   * @returns An async iterable of group arrays, one array per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.customField.iterateGroupsPages({ limit: 20 })) {
   *   console.log(`Page: ${page.length} groups`);
   * }
   * ```
   */
  async *iterateGroupsPages(
    params: ListCustomFieldGroupsParams = {}
  ): AsyncIterable<CustomFieldGroup[]> {
    const limit = params.limit ?? 100;
    let hasMore = true;

    while (hasMore) {
      const groups = await this.listGroups({ limit });

      yield groups;

      hasMore = groups.length >= limit;
    }
  }

  /**
   * Iterate through all custom field groups one by one.
   *
   * Automatically requests additional pages as needed and yields individual
   * groups one at a time.
   *
   * @param params - Optional parameters.
   * @returns An async iterable of individual {@link CustomFieldGroup} objects.
   *
   * @example
   * ```typescript
   * for await (const group of client.customField.iterateGroups()) {
   *   console.log(group.name, group.fields.map((f) => f.name));
   * }
   * ```
   */
  async *iterateGroups(params: ListCustomFieldGroupsParams = {}): AsyncIterable<CustomFieldGroup> {
    for await (const page of this.iterateGroupsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all custom field groups into a single array.
   *
   * Automatically paginates through all pages. Prefer {@link iterateGroups}
   * for large accounts.
   *
   * @param params - Optional parameters.
   * @returns All custom field groups.
   *
   * @example
   * ```typescript
   * const all = await client.customField.listAllGroups();
   * ```
   */
  async listAllGroups(params: ListCustomFieldGroupsParams = {}): Promise<CustomFieldGroup[]> {
    const results: CustomFieldGroup[] = [];

    for await (const group of this.iterateGroups(params)) {
      results.push(group);
    }

    return results;
  }

  /**
   * Fetch a single custom field group by its numeric ID.
   *
   * Returns `null` instead of throwing when the group does not exist (HTTP 404).
   *
   * @param id - Group ID.
   * @returns The group with its fields, or `null` if not found.
   *
   * @example
   * ```typescript
   * const group = await client.customField.getGroupById(42);
   * if (group) {
   *   const fieldIds = group.fields.map((f) => f.id);
   * }
   * ```
   */
  async getGroupById(id: number): Promise<CustomFieldGroup | null> {
    try {
      const wire = await this.transport.get<CustomFieldGroupWire>(
        `/customizations/${id}`,
        { version: 'v2' }
      );

      return mapGroupWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.isNotFound()) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Fetch a single custom field group by name.
   *
   * The name is URL-encoded automatically. Returns `null` instead of
   * throwing when the group does not exist (HTTP 404).
   *
   * @param name - Group name.
   * @returns The group with its fields, or `null` if not found.
   *
   * @example
   * ```typescript
   * const group = await client.customField.getGroupByName('Booking');
   * if (group) {
   *   const fieldIds = group.fields.map((f) => f.id);
   * }
   * ```
   */
  async getGroupByName(name: string): Promise<CustomFieldGroup | null> {
    try {
      const wire = await this.transport.get<CustomFieldGroupWire>(
        `/customizations/${encodeURIComponent(name)}`,
        { version: 'v2' }
      );

      return mapGroupWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.isNotFound()) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Create custom field groups and fields.
   *
   * Each entry specifies one field using the `"GroupName.FieldName"` format.
   * Both the group and the field are created if they do not already exist —
   * the operation is idempotent for existing entries.
   *
   * @param fields - One or more field entries to create.
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
  async createGroups(fields: CreateCustomFieldEntry[]): Promise<void> {
    await this.transport.post(
      '/customizations',
      {
        version: 'v2',
        body: JSON.stringify({ fields }),
      }
    );
  }

}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * @internal
 */
function mapFieldWireToEntity(w: CustomFieldDefinitionWire): CustomFieldDefinition {
  return { id: w.id, name: w.name, type: w.type };
}

/**
 * Maps a raw wire-format custom field group to a public SDK entity.
 * @internal
 */
function mapGroupWireToEntity(w: CustomFieldGroupWire): CustomFieldGroup {
  return {
    id: w.id,
    name: w.name,
    fields: w.fields.map(mapFieldWireToEntity),
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}
