/**
 * Templates namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/template` endpoints. Templates hold RCML email bodies
 * and are linked to messages via dynamic sets — they are not associated
 * directly with messages in the API.
 *
 * Use {@link render} to preview a template's HTML output before attaching it
 * to a campaign or automation.
 */

import { randomUUID } from 'node:crypto';
import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import type { SmsDocument } from '@rule/rcml';
import type {
  CreateEmailTemplatePayload,
  CreateSmsTemplatePayload,
  EmailTemplate,
  ListTemplatesParams,
  RenderTemplateParams,
  SmsTemplate,
  Template,
  TemplateListResponse,
  TemplateResponse,
  TemplateWire,
  UpdateEmailTemplatePayload,
  UpdateSmsTemplatePayload,
} from './templates.types.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SMS_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function normalizeSmsId(doc: SmsDocument): SmsDocument {
  if (typeof doc.id === 'string' && SMS_UUID_RE.test(doc.id)) return doc

  return { ...doc, id: randomUUID() }
}

// ── Client ────────────────────────────────────────────────────────────────────

export class TemplatesClient extends BaseResource {
  /**
   * Create an email template.
   *
   * Templates are not linked to a message at creation time — use a dynamic
   * set to connect a template to a message after both have been created.
   *
   * @param payload - Template name and RCML document body.
   * @returns The created email template.
   *
   * @example
   * ```typescript
   * import { buildRcmlDocument } from '@rule/rcml';
   *
   * const template = await client.templates.createEmailTemplate({
   *   name: 'Welcome email — v1',
   *   content: buildRcmlDocument({ ... }),
   * });
   * ```
   */
  async createEmailTemplate(payload: CreateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await this.transport.post<TemplateResponse>('/editor/template', {
      body: JSON.stringify({
        name: payload.name,
        message_type: 'email',
        template: payload.content,
      }),
    });

    return mapTemplateWireToEntity(res.data);
  }

  /**
   * Fetch a template by ID.
   *
   * Returns `null` instead of throwing when the template does not exist (HTTP
   * 404). All other API errors are rethrown.
   *
   * @param id - Template ID.
   * @returns The template, or `null` if no template with that ID exists.
   *
   * @example
   * ```typescript
   * const template = await client.templates.get(templateId);
   * if (template) {
   *   console.log(template.name, template.messageType);
   * }
   * ```
   */
  async get(id: number): Promise<Template | null> {
    try {
      const res = await this.transport.get<TemplateResponse>(`/editor/template/${id}`);

      return mapTemplateWireToEntity(res.data);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Update an email template.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   *
   * @param id - Template ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated email template.
   *
   * @example
   * ```typescript
   * await client.templates.updateEmailTemplate(templateId, {
   *   name: 'Welcome email — v2',
   *   content: updatedRcmlDocument,
   * });
   * ```
   */
  async updateEmailTemplate(id: number, payload: UpdateEmailTemplatePayload): Promise<EmailTemplate> {
    const res = await this.transport.put<TemplateResponse>(`/editor/template/${id}`, {
      body: JSON.stringify({
        name: payload.name,
        template: payload.content,
      }),
    });

    return mapTemplateWireToEntity(res.data);
  }

  /**
   * Create an SMS template.
   *
   * Construct the `content` document with `createSmsDocument` from
   * `@rule/rcml`. Templates are not linked to a message at creation time —
   * use a dynamic set to connect a template to a message after both have been
   * created.
   *
   * @param payload - Template name and SMS document body.
   * @returns The created SMS template.
   *
   * @example
   * ```typescript
   * import { createSmsDocument } from '@rule/rcml';
   *
   * const template = await client.templates.createSmsTemplate({
   *   name: 'Order shipped SMS',
   *   content: createSmsDocument({ content: 'Your order has shipped!' }),
   * });
   * ```
   */
  async createSmsTemplate(payload: CreateSmsTemplatePayload): Promise<SmsTemplate> {
    const res = await this.transport.post<TemplateResponse>('/editor/template', {
      body: JSON.stringify({
        name: payload.name,
        message_type: 'text_message',
        template: normalizeSmsId(payload.content),
      }),
    });

    return mapTemplateWireToEntity(res.data);
  }

  /**
   * Update an SMS template.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   *
   * @param id - Template ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated SMS template.
   *
   * @example
   * ```typescript
   * import { createSmsDocument } from '@rule/rcml';
   *
   * await client.templates.updateSmsTemplate(templateId, {
   *   content: createSmsDocument({ content: 'Your order has shipped — updated!' }),
   * });
   * ```
   */
  async updateSmsTemplate(id: number, payload: UpdateSmsTemplatePayload): Promise<SmsTemplate> {
    const res = await this.transport.put<TemplateResponse>(`/editor/template/${id}`, {
      body: JSON.stringify({
        name: payload.name,
        ...(payload.content !== undefined && { template: normalizeSmsId(payload.content) }),
      }),
    });

    return mapTemplateWireToEntity(res.data);
  }

  /**
   * Delete a template.
   *
   * This permanently removes the template. Delete any dynamic sets that
   * reference the template first; otherwise those dynamic sets will point to
   * a non-existent template and no email can be sent.
   *
   * @param id - Template ID.
   * @returns Resolves when the template has been deleted.
   */
  async delete(id: number): Promise<void> {
    await this.transport.delete(`/editor/template/${id}`);
  }

  /**
   * Fetch one page of templates.
   *
   * This is the primitive list method. The API returns templates of all types
   * (email and SMS) and does not support server-side filtering by message type.
   *
   * The API returns up to 100 templates per page (`pageSize` ≤ 100, default 15).
   *
   * @param params - Optional pagination parameters.
   * @returns Templates on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.templates.listTemplates({ pagination: { page: 1, pageSize: 50 } });
   * ```
   */
  async listTemplates(params?: ListTemplatesParams): Promise<Template[]> {
    const wireParams = params?.pagination
      ? { page: params.pagination.page, per_page: params.pagination.pageSize }
      : undefined;
    const qs = wireParams ? buildQueryString(wireParams) : '';
    const res = await this.transport.get<TemplateListResponse>(`/editor/template${qs}`);

    return res.data.map(mapTemplateWireToEntity);
  }

  /**
   * Iterate through all templates page by page.
   *
   * Automatically requests additional pages as needed and yields each full
   * page as an array.
   *
   * `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of templates fetched per request.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of template arrays, one array per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.templates.iterateTemplatesPages({ pagination: { pageSize: 50 } })) {
   *   console.log(`Page: ${page.length} templates`);
   * }
   * ```
   */
  async *iterateTemplatesPages(params: ListTemplatesParams = {}): AsyncIterable<Template[]> {
    const pageSize = params.pagination?.pageSize ?? 15;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const templates = await this.listTemplates({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield templates;

      hasMore = templates.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all templates one by one.
   *
   * Automatically requests additional pages as needed and yields individual
   * templates one at a time.
   *
   * `pagination.page` controls the starting page.
   * `pagination.pageSize` controls the number of templates fetched per request.
   *
   * @param params - Optional pagination parameters.
   * @returns An async iterable of individual {@link Template} objects across all pages.
   *
   * @example
   * ```typescript
   * for await (const template of client.templates.iterateTemplates()) {
   *   console.log(template.name);
   * }
   * ```
   */
  async *iterateTemplates(params: ListTemplatesParams = {}): AsyncIterable<Template> {
    for await (const page of this.iterateTemplatesPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all templates into a single array.
   *
   * Automatically paginates through all pages. Prefer {@link iterateTemplates}
   * for large template libraries.
   *
   * @param params - Optional pagination parameters.
   * @returns All templates.
   *
   * @example
   * ```typescript
   * const all = await client.templates.listAllTemplates();
   * ```
   */
  async listAllTemplates(params: ListTemplatesParams = {}): Promise<Template[]> {
    const results: Template[] = [];

    for await (const template of this.iterateTemplates(params)) {
      results.push(template);
    }

    return results;
  }

  /**
   * Render a template to HTML.
   *
   * Returns the fully rendered HTML output of the template. Optionally pass
   * `subscriberId` to substitute merge tags with the subscriber's actual
   * field values.
   *
   * Returns `null` instead of throwing when the template does not exist (HTTP
   * 404). All other API errors are rethrown.
   *
   * @param id - Template ID.
   * @param params - Optional render parameters.
   * @returns The rendered HTML string, or `null` if the template does not exist.
   *
   * @example
   * ```typescript
   * // Render without subscriber context (merge tags shown as placeholders)
   * const html = await client.templates.render(templateId);
   *
   * // Render with a subscriber's data substituted into merge tags
   * const personalized = await client.templates.render(templateId, { subscriberId: 42 });
   * ```
   */
  async render(id: number, params?: RenderTemplateParams): Promise<string | null> {
    const qs = params?.subscriberId !== undefined
      ? buildQueryString({ subscriber_id: params.subscriberId })
      : '';

    try {
      return await this.transport.requestText('GET', `/editor/template/${id}/render${qs}`);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * Maps a raw wire-format template to a public SDK {@link Template} entity.
 * @internal
 */
function mapTemplateWireToEntity(wire: TemplateWire): Template {
  return {
    id: wire.id,
    name: wire.name,
    content: wire.template,
    messageType: wire.message_type,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}
