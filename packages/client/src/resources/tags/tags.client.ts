/**
 * Tags namespace client for the `@rule/client` package.
 *
 * Wraps the v2 `/tags` endpoints — there is no v3 equivalent.
 *
 * Tags support two identifier types: numeric ID and string name. Methods
 * that operate on a single tag are available in both `-ById` and `-ByName`
 * variants, plus a generic dispatcher that accepts either.
 */

import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import type {
  ListTagsParams,
  Tag,
  TagDetail,
  TagDetailWire,
  TagWire,
  TagsListWire,
  UpdateTagPayload,
} from './tags.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class TagsClient extends BaseResource {
  /**
   * Fetch one page of tags in the account.
   *
   * This is the primitive list method. The API supports up to 100 tags per
   * page (`pageSize` ≤ 100, default 100). For auto-pagination use
   * {@link iterateTags}, {@link iterateTagsPages}, or {@link listAllTags}.
   *
   * @param params - Optional pagination parameters.
   * @returns Tags on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.tags.listTags({ pagination: { page: 1, pageSize: 20 } });
   * ```
   */
  async listTags(params?: ListTagsParams): Promise<Tag[]> {
    const wireParams: Record<string, string> = {};

    if (params?.pagination?.pageSize !== undefined) {
      wireParams['limit'] = String(params.pagination.pageSize);
    }

    if (params?.pagination?.page !== undefined) {
      wireParams['page'] = String(params.pagination.page);
    }

    const qs = Object.keys(wireParams).length > 0
      ? `?${new URLSearchParams(wireParams).toString()}`
      : '';
    const wire = await this.transport.get<TagsListWire>(`/tags${qs}`, { version: 'v2' });

    return (wire.tags ?? []).map(mapTagWireToEntity);
  }

  /**
   * Iterate through all tags page by page.
   *
   * Automatically requests additional pages as needed and yields each full
   * page as an array.
   *
   * `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of tags fetched per request.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of tag arrays, one array per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.tags.iterateTagsPages({ pagination: { pageSize: 20 } })) {
   *   console.log(`Page: ${page.length} tags`);
   * }
   * ```
   */
  async *iterateTagsPages(params: ListTagsParams = {}): AsyncIterable<Tag[]> {
    const pageSize = params.pagination?.pageSize ?? 100;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const tags = await this.listTags({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield tags;

      hasMore = tags.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all tags one by one.
   *
   * Automatically requests additional pages as needed and yields individual
   * tags one at a time.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of individual {@link Tag} objects.
   *
   * @example
   * ```typescript
   * for await (const tag of client.tags.iterateTags()) {
   *   console.log(tag.name);
   * }
   * ```
   */
  async *iterateTags(params: ListTagsParams = {}): AsyncIterable<Tag> {
    for await (const page of this.iterateTagsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all tags into a single array.
   *
   * Automatically paginates through all pages. Prefer {@link iterateTags}
   * for large tag libraries.
   *
   * @param params - Optional pagination parameters.
   * @returns All tags in the account.
   *
   * @example
   * ```typescript
   * const all = await client.tags.listAllTags();
   * ```
   */
  async listAllTags(params: ListTagsParams = {}): Promise<Tag[]> {
    const results: Tag[] = [];

    for await (const tag of this.iterateTags(params)) {
      results.push(tag);
    }

    return results;
  }

  /**
   * Fetch a single tag by its numeric ID.
   *
   * Returns `null` instead of throwing when the tag does not exist (HTTP 404).
   * All other API errors are rethrown.
   *
   * @param id - The tag's numeric ID.
   * @param opts - Optional request options.
   * @param opts.withCount - When `true`, the response includes `recipientCount`.
   * @returns The tag entity, or `null` if no tag with that ID exists.
   *
   * @example
   * ```typescript
   * const tag = await client.tags.getById(42, { withCount: true });
   * if (tag) {
   *   console.log(tag.name, tag.recipientCount);
   * }
   * ```
   */
  async getById(
    id: number,
    opts: { withCount?: boolean } = {}
  ): Promise<TagDetail | null> {
    let url = `/tags/${id}?identified_by=id`;

    if (opts.withCount) url += '&with_count=true';

    try {
      const wire = await this.transport.get<TagDetailWire>(url, { version: 'v2' });

      return mapTagDetailWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Fetch a single tag by name.
   *
   * Returns `null` instead of throwing when the tag does not exist (HTTP 404).
   * All other API errors are rethrown. The name is URL-encoded automatically.
   *
   * @param name - The tag name.
   * @param opts - Optional request options.
   * @param opts.withCount - When `true`, the response includes `recipientCount`.
   * @returns The tag entity, or `null` if no tag with that name exists.
   *
   * @example
   * ```typescript
   * const tag = await client.tags.getByName('newsletter');
   * ```
   */
  async getByName(
    name: string,
    opts: { withCount?: boolean } = {}
  ): Promise<TagDetail | null> {
    let url = `/tags/${encodeURIComponent(name)}?identified_by=name`;

    if (opts.withCount) url += '&with_count=true';

    try {
      const wire = await this.transport.get<TagDetailWire>(url, { version: 'v2' });

      return mapTagDetailWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Update a tag identified by its numeric ID.
   *
   * Only the fields you include are changed.
   *
   * @param id - The tag's numeric ID.
   * @param payload - Fields to update (`name` and/or `description`).
   * @returns The updated tag entity, or `null` if no tag with that ID exists.
   * @throws `RuleApiError` on 409 DuplicateTag (name already taken) or other errors.
   *
   * @example
   * ```typescript
   * const updated = await client.tags.updateById(42, { name: 'VIP Customers' });
   * ```
   */
  async updateById(id: number, payload: UpdateTagPayload): Promise<Tag | null> {
    try {
      const wire = await this.transport.put<TagWire>(`/tags/${id}?identified_by=id`, {
        version: 'v2',
        body: JSON.stringify(payload),
      });

      return mapTagWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Update a tag identified by name.
   *
   * Only the fields you include are changed. The name is URL-encoded automatically.
   *
   * @param name - The tag name.
   * @param payload - Fields to update (`name` and/or `description`).
   * @returns The updated tag entity, or `null` if no tag with that name exists.
   * @throws `RuleApiError` on 409 DuplicateTag (name already taken) or other errors.
   *
   * @example
   * ```typescript
   * await client.tags.updateByName('newsletter', { description: 'Monthly digest' });
   * ```
   */
  async updateByName(name: string, payload: UpdateTagPayload): Promise<Tag | null> {
    try {
      const wire = await this.transport.put<TagWire>(
        `/tags/${encodeURIComponent(name)}?identified_by=name`,
        { version: 'v2', body: JSON.stringify(payload) }
      );

      return mapTagWireToEntity(wire);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Delete a tag by its numeric ID.
   *
   * Resolves without error when the tag does not exist (HTTP 404 is swallowed).
   *
   * @param id - The tag's numeric ID.
   * @returns Resolves when the tag has been deleted (or did not exist).
   */
  async deleteById(id: number): Promise<void> {
    try {
      await this.transport.delete(`/tags/${id}?identified_by=id`, { version: 'v2' });
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) return;

      throw error;
    }
  }

  /**
   * Delete a tag by name.
   *
   * Resolves without error when the tag does not exist (HTTP 404 is swallowed).
   * The name is URL-encoded automatically.
   *
   * @param name - The tag name.
   * @returns Resolves when the tag has been deleted (or did not exist).
   */
  async deleteByName(name: string): Promise<void> {
    try {
      await this.transport.delete(
        `/tags/${encodeURIComponent(name)}?identified_by=name`,
        { version: 'v2' }
      );
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) return;

      throw error;
    }
  }

  /**
   * Remove all subscriber associations from a tag identified by numeric ID.
   *
   * The tag itself and the subscribers are not deleted — only the association
   * between them is cleared. Resolves without error when the tag does not exist.
   *
   * @param id - The tag's numeric ID.
   * @returns Resolves when all subscriber associations have been removed.
   */
  async clearById(id: number): Promise<void> {
    try {
      await this.transport.delete(`/tags/${id}/clear?identified_by=id`, { version: 'v2' });
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) return;

      throw error;
    }
  }

  /**
   * Remove all subscriber associations from a tag identified by name.
   *
   * The tag itself and the subscribers are not deleted — only the association
   * between them is cleared. Resolves without error when the tag does not exist.
   * The name is URL-encoded automatically.
   *
   * @param name - The tag name.
   * @returns Resolves when all subscriber associations have been removed.
   */
  async clearByName(name: string): Promise<void> {
    try {
      await this.transport.delete(
        `/tags/${encodeURIComponent(name)}/clear?identified_by=name`,
        { version: 'v2' }
      );
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) return;

      throw error;
    }
  }

}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * Maps a raw wire-format tag to a public SDK {@link Tag} entity.
 * @internal
 */
function mapTagWireToEntity(wire: TagWire): Tag {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

/**
 * Maps a raw wire-format tag detail to a public SDK {@link TagDetail} entity.
 * @internal
 */
function mapTagDetailWireToEntity(wire: TagDetailWire): TagDetail {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
    recipientCount: wire.recipient_count,
  };
}
