/**
 * Automations namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/automail` endpoints. The "Automail" terminology used
 * by the underlying API is hidden — consumers see only "Automation".
 *
 * Typical automation lifecycle:
 * ```
 * createEmailAutomation()  →  attach email content (messages / templates / dynamic sets)
 * ```
 *
 * The automation fires automatically when a subscriber meets the trigger
 * condition (tag assignment or segment entry).
 */

import { createSmsDocument } from '@rule/rcml';

import { RuleApiError, RuleClientError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import { DynamicSetsClient } from '../dynamic-sets/dynamic-sets.client.js';
import { MessagesClient } from '../messages/messages.client.js';
import { TemplatesClient } from '../templates/templates.client.js';
import type {
  Automation,
  AutomationListResponse,
  AutomationResponse,
  AutomationSendoutType,
  AutomationWire,
  CreateAutomationBody,
  CreateDefaultSmsMessageParams,
  CreateDefaultSmsMessageResult,
  CreateEmailAutomationPayload,
  CreateSmsAutomationPayload,
  ListAutomationsParams,
  SetEmailAutomationPayload,
  SetSmsAutomationPayload,
  UpdateAutomationBody,
  UpdateEmailAutomationPayload,
  UpdateSmsAutomationPayload,
} from './automations.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class AutomationsClient extends BaseResource {
  /**
   * Create an email automation.
   *
   * At minimum, provide a `name`. The trigger can be set at creation time or
   * added later with {@link updateEmailAutomation}.
   *
   * @param payload - Automation creation options.
   * @returns The created automation.
   *
   * @example
   * ```typescript
   * const automation = await client.automations.createEmailAutomation({
   *   name: 'Welcome email',
   *   trigger: { type: 'TAG', id: tagId },
   *   sendoutType: 'marketing',
   * });
   * ```
   */
  async createEmailAutomation(payload: CreateEmailAutomationPayload): Promise<Automation> {
    const body: CreateAutomationBody = {
      name: payload.name,
      description: payload.description,
      trigger: payload.trigger,
      sendout_type: payload.sendoutType
        ? mapSendoutTypeToWire(payload.sendoutType)
        : undefined,
    };
    const res = await this.transport.post<AutomationResponse>('/editor/automail', {
      body: JSON.stringify(body),
    });

    return mapAutomationWireToEntity(res.data as AutomationWire);
  }

  /**
   * Fetch an automation by ID.
   *
   * Returns `null` instead of throwing when the automation does not exist
   * (HTTP 404). All other API errors are rethrown.
   *
   * @param id - Automation ID.
   * @returns The automation, or `null` if no automation with that ID exists.
   *
   * @example
   * ```typescript
   * const automation = await client.automations.get(automationId);
   * if (automation) {
   *   console.log(automation.name, automation.active);
   * }
   * ```
   */
  async get(id: number): Promise<Automation | null> {
    try {
      const res = await this.transport.get<AutomationResponse>(`/editor/automail/${id}`);

      return mapAutomationWireToEntity(res.data as AutomationWire);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Set (upsert) an email automation — fully replaces it if it exists,
   * creates it if not.
   *
   * All four fields are required and fully replace the existing values. This is
   * a complete replacement, not a merge. If the automation does not exist, it
   * is created as an email automation.
   *
   * @param id - Automation ID.
   * @param payload - Full replacement body. No `messageType` field — fixed to
   *   `'email'` by the method.
   * @returns The updated or newly created automation.
   *
   * @example
   * ```typescript
   * await client.automations.setEmailAutomation(automationId, {
   *   name: 'Welcome email',
   *   active: true,
   *   trigger: { type: 'TAG', id: tagId },
   *   sendoutType: 'transactional',
   * });
   * ```
   */
  async setEmailAutomation(id: number, payload: SetEmailAutomationPayload): Promise<Automation> {
    const body: UpdateAutomationBody = {
      name: payload.name,
      active: payload.active,
      trigger: payload.trigger,
      sendout_type: mapSendoutTypeToWire(payload.sendoutType),
    };

    try {
      const res = await this.transport.put<AutomationResponse>(`/editor/automail/${id}`, {
        body: JSON.stringify(body),
      });

      return mapAutomationWireToEntity(res.data as AutomationWire);
    } catch (error) {
      if (!(error instanceof RuleApiError) || error.statusCode !== 404) throw error;

      const createRes = await this.transport.post<AutomationResponse>('/editor/automail', {
        body: JSON.stringify(body),
      });

      return mapAutomationWireToEntity(createRes.data as AutomationWire);
    }
  }

  /**
   * Update an email automation.
   *
   * Only the fields you include are changed — omitted fields are preserved
   * from the existing record. The client fetches the current automation,
   * merges your changes over it, and writes the complete merged body back to
   * the API.
   *
   * The `trigger.type` must be uppercase (`'TAG'` or `'SEGMENT'`).
   *
   * @param id - Automation ID.
   * @param partial - Fields to update. All fields are optional.
   * @returns The updated automation.
   * @throws `RuleApiError` with 404 if the automation does not exist.
   * @throws `RuleClientError` if the merged record still lacks `trigger`,
   *   `sendoutType`, or `active` after merging.
   *
   * @example
   * ```typescript
   * // Pause an automation
   * await client.automations.updateEmailAutomation(automationId, { active: false });
   *
   * // Change the trigger
   * await client.automations.updateEmailAutomation(automationId, {
   *   trigger: { type: 'SEGMENT', id: segmentId },
   * });
   * ```
   */
  async updateEmailAutomation(id: number, partial: UpdateEmailAutomationPayload): Promise<Automation> {
    const existing = await this.get(id);

    if (existing === null) {
      throw new RuleApiError(`Automation ${id} not found`, 404);
    }

    const trigger = partial.trigger ?? existing.trigger;
    const sendoutTypeStr = partial.sendoutType ?? existing.sendoutType;
    const sendoutType = sendoutTypeStr != null ? mapSendoutTypeToWire(sendoutTypeStr) : undefined;
    const active = partial.active ?? existing.active;

    if (!trigger) {
      throw new RuleClientError(
        `Cannot update automation ${id}: existing record has no trigger and update did not provide one`
      );
    }

    if (sendoutType == null) {
      throw new RuleClientError(
        `Cannot update automation ${id}: existing record has no sendout_type and update did not provide one`
      );
    }

    if (active == null) {
      throw new RuleClientError(
        `Cannot update automation ${id}: existing record has no active state and update did not provide one`
      );
    }

    const fullBody: UpdateAutomationBody = {
      name: partial.name ?? existing.name,
      active,
      trigger,
      sendout_type: sendoutType,
    };

    const res = await this.transport.put<AutomationResponse>(`/editor/automail/${id}`, {
      body: JSON.stringify(fullBody),
    });

    return mapAutomationWireToEntity(res.data as AutomationWire);
  }

  /**
   * Create an SMS automation.
   *
   * At minimum, provide a `name`. The trigger can be set at creation time or
   * added later with {@link updateSmsAutomation}.
   *
   * @param payload - Automation creation options.
   * @returns The created automation.
   *
   * @example
   * ```typescript
   * const automation = await client.automations.createSmsAutomation({
   *   name: 'Order shipped SMS',
   *   trigger: { type: 'TAG', id: tagId },
   *   sendoutType: 'transactional',
   * });
   * ```
   */
  async createSmsAutomation(payload: CreateSmsAutomationPayload): Promise<Automation> {
    const body: CreateAutomationBody = {
      name: payload.name,
      description: payload.description,
      trigger: payload.trigger,
      sendout_type: payload.sendoutType
        ? mapSendoutTypeToWire(payload.sendoutType)
        : undefined,
      message_type: 2,
    };
    const res = await this.transport.post<AutomationResponse>('/editor/automail', {
      body: JSON.stringify(body),
    });

    return mapAutomationWireToEntity(res.data as AutomationWire);
  }

  /**
   * Create a default SMS message and attach it to an existing automation.
   *
   * Creates three resources in a single call — message, template, and a
   * dynamic set linking them — and attaches them to the automation identified
   * by `automationId`.
   *
   * Use this after {@link createSmsAutomation} to give the automation its SMS
   * content so it appears fully configured in the Rule.io UI.
   *
   * On any error, the method attempts to roll back all resources it already
   * created before rethrowing. The parent automation is never touched.
   *
   * @param automationId - ID of the automation to attach the message to.
   * @param params - Optional overrides. All fields are optional.
   * @returns The IDs of the created message, template, and dynamic set.
   *
   * @example
   * ```typescript
   * const automation = await client.automations.createSmsAutomation({ name: 'Welcome' });
   * const setup = await client.automations.createDefaultSmsMessage(automation.id!);
   * console.log(setup.messageId, setup.templateId, setup.dynamicSetId);
   * ```
   */
  async createDefaultSmsMessage(
    automationId: number,
    params: CreateDefaultSmsMessageParams = {}
  ): Promise<CreateDefaultSmsMessageResult> {
    const messages = this.lazy('messages', () => new MessagesClient(this.transport));
    const templates = this.lazy('templates', () => new TemplatesClient(this.transport));
    const dynamicSets = this.lazy('dynamicSets', () => new DynamicSetsClient(this.transport));

    const { content: templateContentOverride, ...templateMetaOverrides } = params.template ?? {};

    let smsBody: string | undefined;
    if (!templateContentOverride) {
      const isMarketing = (params.sendoutType ?? 'marketing') !== 'transactional';
      smsBody = isMarketing
        ? buildDefaultSmsContent(params.unsubscriptionMethod !== 'stopWord')
        : 'Your message here.';
    }

    const createdResources: { type: 'message' | 'template'; id: number }[] = [];

    try {
      const [messageResult, templateResult] = await Promise.allSettled([
        messages.createSmsAutomationMessage(automationId, {
        automailSetting: { active: false, delayInSeconds: '0' },
        ...params.message,
      }),
        templates.createSmsTemplate({
          name: `Automation ${automationId} SMS template`,
          ...templateMetaOverrides,
          content: templateContentOverride ?? createSmsDocument({ content: smsBody! }),
        }),
      ]);

      if (messageResult.status === 'fulfilled' && messageResult.value.id) {
        createdResources.push({ type: 'message', id: messageResult.value.id });
      }
      if (templateResult.status === 'fulfilled' && templateResult.value.id) {
        createdResources.push({ type: 'template', id: templateResult.value.id });
      }

      if (messageResult.status === 'rejected') throw messageResult.reason;
      if (templateResult.status === 'rejected') throw templateResult.reason;

      const message = messageResult.value;
      const template = templateResult.value;

      if (!message.id) {
        throw new RuleApiError('Failed to create message — no ID returned.', 500);
      }
      if (!template.id) {
        throw new RuleApiError('Failed to create template — no ID returned.', 500);
      }

      const dynamicSet = await dynamicSets.create({
        messageId: message.id,
        templateId: template.id,
      });

      if (!dynamicSet.id) {
        throw new RuleApiError('Failed to create dynamic set — no ID returned.', 500);
      }

      return { messageId: message.id, templateId: template.id, dynamicSetId: dynamicSet.id };
    } catch (error) {
      await this._cleanupResources(createdResources, { messages, templates });
      throw error;
    }
  }

  /**
   * Set (upsert) an SMS automation — fully replaces it if it exists, creates
   * it if not.
   *
   * All four fields are required and fully replace the existing values. If the
   * automation does not exist, it is created as an SMS automation.
   *
   * @param id - Automation ID.
   * @param payload - Full replacement body. No `messageType` field — fixed to
   *   `'text_message'` by the method.
   * @returns The updated or newly created automation.
   *
   * @example
   * ```typescript
   * await client.automations.setSmsAutomation(automationId, {
   *   name: 'Order shipped SMS',
   *   active: true,
   *   trigger: { type: 'TAG', id: tagId },
   *   sendoutType: 'transactional',
   * });
   * ```
   */
  async setSmsAutomation(id: number, payload: SetSmsAutomationPayload): Promise<Automation> {
    const body: UpdateAutomationBody = {
      name: payload.name,
      active: payload.active,
      trigger: payload.trigger,
      sendout_type: mapSendoutTypeToWire(payload.sendoutType),
    };

    try {
      const res = await this.transport.put<AutomationResponse>(`/editor/automail/${id}`, {
        body: JSON.stringify(body),
      });

      return mapAutomationWireToEntity(res.data as AutomationWire);
    } catch (error) {
      if (!(error instanceof RuleApiError) || error.statusCode !== 404) throw error;

      const createRes = await this.transport.post<AutomationResponse>('/editor/automail', {
        body: JSON.stringify({ ...body, message_type: 2 }),
      });

      return mapAutomationWireToEntity(createRes.data as AutomationWire);
    }
  }

  /**
   * Update an SMS automation.
   *
   * Only the fields you include are changed — omitted fields are preserved
   * from the existing record.
   *
   * @param id - Automation ID.
   * @param partial - Fields to update. All fields are optional.
   * @returns The updated automation.
   * @throws `RuleApiError` with 404 if the automation does not exist.
   *
   * @example
   * ```typescript
   * await client.automations.updateSmsAutomation(automationId, { active: false });
   * ```
   */
  updateSmsAutomation(id: number, partial: UpdateSmsAutomationPayload): Promise<Automation> {
    return this.updateEmailAutomation(id, partial);
  }

  /**
   * Delete an automation.
   *
   * @param id - Automation ID.
   * @returns Resolves when the automation has been deleted.
   */
  async delete(id: number): Promise<void> {
    await this.transport.delete(`/editor/automail/${id}`);
  }

  /**
   * Fetch one page of automations.
   *
   * This is the primitive list method. For auto-pagination use
   * {@link iterateAutomations}, {@link iterateAutomationsPages}, or
   * {@link listAllAutomations}.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns Automations on the requested page.
   *
   * @example
   * ```typescript
   * // List active email automations
   * const page = await client.automations.listAutomations({
   *   filters: { active: true, messageType: 'email' },
   *   pagination: { page: 1, pageSize: 20 },
   * });
   * ```
   */
  async listAutomations(params?: ListAutomationsParams): Promise<Automation[]> {
    const wireParams = params
      ? {
          page: params.pagination?.page,
          per_page: params.pagination?.pageSize,
          active: params.filters?.active,
          message_type: params.filters?.messageType
            ? mapMessageTypeFilterToWire(params.filters.messageType)
            : undefined,
          query: params.filters?.query,
        }
      : undefined;
    const qs = wireParams ? buildQueryString(wireParams) : '';
    const res = await this.transport.get<AutomationListResponse>(`/editor/automail${qs}`);

    return (res.data ?? []).map(mapAutomationWireToEntity);
  }

  /**
   * Iterate through all automations page by page.
   *
   * Automatically requests additional pages as needed and yields each full
   * page as an array.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns An async iterable of automation arrays, one array per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.automations.iterateAutomationsPages()) {
   *   console.log(`Page: ${page.length} automations`);
   * }
   * ```
   */
  async *iterateAutomationsPages(
    params: ListAutomationsParams = {}
  ): AsyncIterable<Automation[]> {
    const pageSize = params.pagination?.pageSize ?? 10;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const automations = await this.listAutomations({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield automations;

      hasMore = automations.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all automations one by one.
   *
   * Automatically requests additional pages as needed and yields individual
   * automations one at a time.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns An async iterable of individual {@link Automation} objects.
   *
   * @example
   * ```typescript
   * for await (const automation of client.automations.iterateAutomations()) {
   *   console.log(automation.name, automation.active);
   * }
   * ```
   */
  async *iterateAutomations(params: ListAutomationsParams = {}): AsyncIterable<Automation> {
    for await (const page of this.iterateAutomationsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all automations into a single array.
   *
   * Automatically paginates through all pages. Prefer
   * {@link iterateAutomations} for large automation lists.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns All automations.
   *
   * @example
   * ```typescript
   * const all = await client.automations.listAllAutomations({ filters: { active: true } });
   * ```
   */
  async listAllAutomations(params: ListAutomationsParams = {}): Promise<Automation[]> {
    const results: Automation[] = [];

    for await (const automation of this.iterateAutomations(params)) {
      results.push(automation);
    }

    return results;
  }

  private async _cleanupResources(
    resources: { type: 'message' | 'template'; id: number }[],
    clients: { messages: MessagesClient; templates: TemplatesClient }
  ): Promise<void> {
    for (const resource of resources.reverse()) {
      try {
        if (resource.type === 'message') {
          await clients.messages.delete(resource.id);
        } else {
          await clients.templates.delete(resource.id);
        }
      } catch {
        // best-effort cleanup
      }
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds the default SMS body text, appending either a link-based unsubscribe
 * footer or a stop-word placeholder.
 * @internal
 */
function buildDefaultSmsContent(linkInsteadOfStopWord: boolean): string {
  const body = 'Your message here.\n';

  if (linkInsteadOfStopWord) {
    return `${body}::unsubscribe`;
  }

  return `${body}::placeholder{type="Subscriber" original="[Subscriber:stop_word]" name="Stop word"}`;
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * Maps a raw wire-format automation to a public SDK {@link Automation} entity.
 * @internal
 */
function mapAutomationWireToEntity(wire: AutomationWire): Automation {
  return {
    id: wire.id,
    name: wire.name,
    description: wire.description,
    active: wire.active,
    trigger: wire.trigger,
    sendoutType: wire.sendout_type
      ? mapSendoutTypeFromWire(wire.sendout_type.value)
      : undefined,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

/**
 * Maps a public {@link AutomationSendoutType} to the API integer value.
 *
 * The automation API uses integer enums for sendout_type (unlike campaigns
 * which uses string enums).
 * @internal
 */
function mapSendoutTypeToWire(type: AutomationSendoutType): number {
  return type === 'marketing' ? 1 : 2;
}

/**
 * Maps an API numeric sendout_type value to a public {@link AutomationSendoutType}.
 * @internal
 */
function mapSendoutTypeFromWire(value: number): AutomationSendoutType {
  return value === 1 ? 'marketing' : 'transactional';
}

/**
 * Maps a public message type string to the API integer filter value.
 * @internal
 */
function mapMessageTypeFilterToWire(type: 'email' | 'text_message'): number {
  return type === 'email' ? 1 : 2;
}
