/**
 * Dynamic-sets namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/dynamic-set` endpoints. A dynamic set connects a
 * template to a message. A message can have multiple dynamic sets — one per
 * trigger (tag or segment) plus an optional "Default" fallback.
 */

import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import type {
  CreateDynamicSetBody,
  CreateDynamicSetPayload,
  DynamicSet,
  DynamicSetListResponse,
  DynamicSetResponse,
  DynamicSetSender,
  DynamicSetSenderWire,
  DynamicSetTrigger,
  DynamicSetTriggerWire,
  DynamicSetWire,
  UpdateDynamicSetBody,
  UpdateDynamicSetPayload,
} from './dynamic-sets.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class DynamicSetsClient extends BaseResource {
  /**
   * Create a dynamic set to connect a template to a message.
   *
   * At minimum, provide `messageId`. You can attach a template immediately
   * via `templateId`, or attach one later with {@link update}. Omit `trigger`
   * to create a "Default" dynamic set — the fallback for subscribers not
   * matched by any trigger-specific variant.
   *
   * @param payload - Dynamic set creation options.
   * @returns The created dynamic set.
   *
   * @example
   * ```typescript
   * const ds = await client.dynamicSets.create({
   *   messageId,
   *   templateId,
   * });
   * ```
   */
  async create(payload: CreateDynamicSetPayload): Promise<DynamicSet> {
    const body = mapCreatePayloadToBody(payload);
    const res = await this.transport.post<DynamicSetResponse>('/editor/dynamic-set', {
      body: JSON.stringify(body),
    });

    return mapDynamicSetWireToEntity(res.data);
  }

  /**
   * Fetch a dynamic set by ID.
   *
   * Returns `null` instead of throwing when the dynamic set does not exist
   * (HTTP 404). All other API errors are rethrown.
   *
   * @param id - Dynamic set ID.
   * @returns The dynamic set, or `null` if no dynamic set with that ID exists.
   *
   * @example
   * ```typescript
   * const ds = await client.dynamicSets.get(dynamicSetId);
   * if (ds) {
   *   console.log(ds.templateId, ds.active);
   * }
   * ```
   */
  async get(id: number): Promise<DynamicSet | null> {
    try {
      const res = await this.transport.get<DynamicSetResponse>(`/editor/dynamic-set/${id}`);

      return mapDynamicSetWireToEntity(res.data);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Update a dynamic set.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   *
   * Only one active dynamic set per trigger is allowed. If you activate a
   * dynamic set that has the same trigger as an existing active one, the API
   * automatically deactivates the existing one.
   *
   * @param id - Dynamic set ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated dynamic set.
   *
   * @example
   * ```typescript
   * // Swap in a different template
   * await client.dynamicSets.update(dynamicSetId, { templateId: newTemplateId });
   * ```
   */
  async update(id: number, payload: UpdateDynamicSetPayload): Promise<DynamicSet> {
    const body = mapUpdatePayloadToBody(payload);
    const res = await this.transport.put<DynamicSetResponse>(`/editor/dynamic-set/${id}`, {
      body: JSON.stringify(body),
    });

    return mapDynamicSetWireToEntity(res.data);
  }

  /**
   * Delete a dynamic set.
   *
   * Deleting a dynamic set breaks the link between the message and the
   * template. The template itself is not deleted.
   *
   * @param id - Dynamic set ID.
   * @returns Resolves when the dynamic set has been deleted.
   */
  async delete(id: number): Promise<void> {
    await this.transport.delete(`/editor/dynamic-set/${id}`);
  }

  /**
   * List all dynamic sets for a message.
   *
   * Returns all dynamic sets — both active and inactive — across all triggers
   * for the given message.
   *
   * @param messageId - ID of the message whose dynamic sets to retrieve.
   * @returns Array of dynamic sets belonging to the message.
   *
   * @example
   * ```typescript
   * const sets = await client.dynamicSets.listDynamicSets(messageId);
   * const active = sets.filter((ds) => ds.active);
   * ```
   */
  async listDynamicSets(messageId: number): Promise<DynamicSet[]> {
    const qs = buildQueryString({ message_id: messageId });
    const res = await this.transport.get<DynamicSetListResponse>(`/editor/dynamic-set${qs}`);

    return res.data.map(mapDynamicSetWireToEntity);
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * Maps a raw wire-format dynamic set to a public SDK {@link DynamicSet} entity.
 * @internal
 */
function mapDynamicSetWireToEntity(wire: DynamicSetWire): DynamicSet {
  return {
    id: wire.id,
    name: wire.name,
    templateId: wire.template_id,
    subject: wire.subject,
    preHeader: wire.pre_header,
    utmCampaign: wire.utm_campaign,
    utmTerm: wire.utm_term,
    sender: wire.sender ? mapSenderWireToEntity(wire.sender) : undefined,
    trigger: wire.trigger ?? undefined,
    active: wire.active,
    position: wire.position,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  };
}

/**
 * @internal
 */
function mapSenderWireToEntity(wire: DynamicSetSenderWire): DynamicSet['sender'] {
  return {
    email: wire.email,
    phone: wire.phone_number,
    name: wire.name,
  };
}

/**
 * @internal
 */
function mapSenderToWire(sender: DynamicSetSender): DynamicSetSenderWire {
  return {
    email: sender.email,
    phone_number: sender.phone,
    name: sender.name,
  };
}

/**
 * @internal
 */
function mapTriggerToWire(trigger: DynamicSetTrigger): DynamicSetTriggerWire {
  return { id: trigger.id, type: trigger.type };
}

/**
 * @internal
 */
function mapCreatePayloadToBody(p: CreateDynamicSetPayload): CreateDynamicSetBody {
  return {
    message_id: p.messageId,
    template_id: p.templateId,
    name: p.name,
    subject: p.subject,
    pre_header: p.preHeader,
    utm_campaign: p.utmCampaign,
    utm_term: p.utmTerm,
    sender: p.sender ? mapSenderToWire(p.sender) : undefined,
    trigger: p.trigger ? mapTriggerToWire(p.trigger) : p.trigger,
    active: p.active,
  };
}

/**
 * @internal
 */
function mapUpdatePayloadToBody(p: UpdateDynamicSetPayload): UpdateDynamicSetBody {
  return {
    template_id: p.templateId,
    name: p.name,
    subject: p.subject,
    pre_header: p.preHeader,
    utm_campaign: p.utmCampaign,
    utm_term: p.utmTerm,
    sender: p.sender ? mapSenderToWire(p.sender) : undefined,
    trigger: p.trigger ? mapTriggerToWire(p.trigger) : p.trigger,
    active: p.active,
  };
}
