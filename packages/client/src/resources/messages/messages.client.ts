/**
 * Messages namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/message` endpoints. A message belongs to a single
 * dispatcher (campaign or automation) and holds the subject, sender settings,
 * and optional delivery configuration for the email or SMS.
 *
 * Use the type-and-dispatcher-specific methods
 * (`createEmailCampaignMessage`, `createEmailAutomationMessage`, etc.)
 * rather than a generic create/update — they enforce the right payload shape
 * for each scenario.
 */

import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import type {
  AutomailSetting,
  AutomailSettingReadWire,
  AutomailSettingRead,
  AutomailSettingWriteWire,
  CreateEmailAutomationMessagePayload,
  CreateEmailCampaignMessagePayload,
  CreateMessageBody,
  CreateSmsAutomationMessagePayload,
  CreateSmsCampaignMessagePayload,
  EmailAutomationMessage,
  EmailCampaignMessage,
  Message,
  MessageListResponse,
  MessageResponse,
  MessageSenderWire,
  MessageWire,
  SmsAutomationMessage,
  SmsCampaignMessage,
  UpdateEmailAutomationMessagePayload,
  UpdateEmailCampaignMessagePayload,
  UpdateMessageBody,
  UpdateSmsAutomationMessagePayload,
  UpdateSmsCampaignMessagePayload,
} from './messages.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class MessagesClient extends BaseResource {
  /**
   * Create an email message attached to a campaign.
   *
   * The message holds the subject and sender settings for the campaign email.
   * After creating a message, create a template and link them with a dynamic
   * set to complete the email chain.
   *
   * @param campaignId - ID of the campaign this message belongs to.
   * @param payload - Subject, sender details, and optional UTM tracking fields.
   * @returns The created campaign email message.
   *
   * @example
   * ```typescript
   * const message = await client.messages.createEmailCampaignMessage(campaignId, {
   *   subject: 'Your order is on its way',
   *   fromName: 'Jane from Acme',
   *   fromEmail: 'jane@acme.com',
   * });
   * ```
   */
  async createEmailCampaignMessage(
    campaignId: number,
    payload: CreateEmailCampaignMessagePayload
  ): Promise<EmailCampaignMessage> {
    const body = mapCampaignPayloadToBody(campaignId, payload);
    const res = await this.transport.post<MessageResponse>('/editor/message', {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Create an email message attached to an automation.
   *
   * The message holds the subject, sender settings, and automail delivery
   * configuration for the automation email. After creating a message, create a
   * template and link them with a dynamic set to complete the email chain.
   *
   * @param automationId - ID of the automation this message belongs to.
   * @param payload - Subject, sender details, optional UTM fields, and automail
   *   delivery settings (active flag and delay).
   * @returns The created automation email message.
   *
   * @example
   * ```typescript
   * const message = await client.messages.createEmailAutomationMessage(automationId, {
   *   subject: 'Welcome to Acme!',
   *   fromName: 'Jane from Acme',
   *   fromEmail: 'jane@acme.com',
   *   automailSetting: { active: true, delayInSeconds: '0' },
   * });
   * ```
   */
  async createEmailAutomationMessage(
    automationId: number,
    payload: CreateEmailAutomationMessagePayload
  ): Promise<EmailAutomationMessage> {
    const body = mapAutomationPayloadToBody(automationId, payload);
    const res = await this.transport.post<MessageResponse>('/editor/message', {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Fetch a message by ID.
   *
   * Returns `null` instead of throwing when the message does not exist (HTTP
   * 404). All other API errors are rethrown.
   *
   * @param id - Message ID.
   * @returns The message, or `null` if no message with that ID exists.
   */
  async get(id: number): Promise<Message | null> {
    try {
      const res = await this.transport.get<MessageResponse>(`/editor/message/${id}`);

      return mapMessageWireToEntity(res.data);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Update an email campaign message.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   * Campaign messages do not have automail delivery settings; use
   * {@link updateEmailAutomationMessage} for automation messages.
   *
   * @param id - Message ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated campaign email message.
   *
   * @example
   * ```typescript
   * await client.messages.updateEmailCampaignMessage(messageId, {
   *   subject: 'Updated subject line',
   * });
   * ```
   */
  async updateEmailCampaignMessage(
    id: number,
    payload: UpdateEmailCampaignMessagePayload
  ): Promise<EmailCampaignMessage> {
    const body = mapUpdatePayloadToBody(payload);
    const res = await this.transport.put<MessageResponse>(`/editor/message/${id}`, {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Update an email automation message.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   * Use `automailSetting` to change the active flag or send delay. For
   * campaign messages use {@link updateEmailCampaignMessage}.
   *
   * @param id - Message ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated automation email message.
   *
   * @example
   * ```typescript
   * await client.messages.updateEmailAutomationMessage(messageId, {
   *   subject: 'Welcome — updated copy',
   *   automailSetting: { active: true, delayInSeconds: '3600' },
   * });
   * ```
   */
  async updateEmailAutomationMessage(
    id: number,
    payload: UpdateEmailAutomationMessagePayload
  ): Promise<EmailAutomationMessage> {
    const body = mapUpdatePayloadToBody(payload);
    const res = await this.transport.put<MessageResponse>(`/editor/message/${id}`, {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Create an SMS message attached to a campaign.
   *
   * The `subject` field holds the SMS body text. After creating a message,
   * create an SMS template and link them with a dynamic set to complete the
   * SMS chain.
   *
   * @param campaignId - ID of the SMS campaign this message belongs to.
   * @param payload - Optional UTM tracking fields.
   * @returns The created campaign SMS message.
   *
   * @example
   * ```typescript
   * const message = await client.messages.createSmsCampaignMessage(campaignId, {
   *   utmCampaign: 'spring-sale',
   * });
   * ```
   */
  async createSmsCampaignMessage(
    campaignId: number,
    payload: CreateSmsCampaignMessagePayload
  ): Promise<SmsCampaignMessage> {
    const body: CreateMessageBody = {
      dispatcher: { id: campaignId, type: 'campaign' },
      type: 2,
      utm_campaign: payload.utmCampaign,
      utm_term: payload.utmTerm,
    };
    const res = await this.transport.post<MessageResponse>('/editor/message', {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Create an SMS message attached to an automation.
   *
   * After creating a message, create an SMS template and link them with a
   * dynamic set to complete the SMS chain.
   *
   * @param automationId - ID of the SMS automation this message belongs to.
   * @param payload - Optional UTM fields and automail delivery settings (active
   *   flag and delay).
   * @returns The created automation SMS message.
   *
   * @example
   * ```typescript
   * const message = await client.messages.createSmsAutomationMessage(automationId, {
   *   utmCampaign: 'welcome-flow',
   *   automailSetting: { active: true, delayInSeconds: '0' },
   * });
   * ```
   */
  async createSmsAutomationMessage(
    automationId: number,
    payload: CreateSmsAutomationMessagePayload
  ): Promise<SmsAutomationMessage> {
    const body: CreateMessageBody = {
      dispatcher: { id: automationId, type: 'automail' },
      type: 2,
      utm_campaign: payload.utmCampaign,
      utm_term: payload.utmTerm,
      automail_setting: payload.automailSetting
        ? mapAutomailSetting(payload.automailSetting)
        : undefined,
    };
    const res = await this.transport.post<MessageResponse>('/editor/message', {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Update an SMS campaign message.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   *
   * @param id - Message ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated campaign SMS message.
   *
   * @example
   * ```typescript
   * await client.messages.updateSmsCampaignMessage(messageId, {
   *   utmCampaign: 'spring-sale',
   * });
   * ```
   */
  async updateSmsCampaignMessage(
    id: number,
    payload: UpdateSmsCampaignMessagePayload
  ): Promise<SmsCampaignMessage> {
    const body: UpdateMessageBody = {
      utm_campaign: payload.utmCampaign,
      utm_term: payload.utmTerm,
    };
    const res = await this.transport.put<MessageResponse>(`/editor/message/${id}`, {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Update an SMS automation message.
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   * Use `automailSetting` to change the active flag or send delay.
   *
   * @param id - Message ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated automation SMS message.
   *
   * @example
   * ```typescript
   * await client.messages.updateSmsAutomationMessage(messageId, {
   *   automailSetting: { active: true, delayInSeconds: '3600' },
   * });
   * ```
   */
  async updateSmsAutomationMessage(
    id: number,
    payload: UpdateSmsAutomationMessagePayload
  ): Promise<SmsAutomationMessage> {
    const body: UpdateMessageBody = {
      utm_campaign: payload.utmCampaign,
      utm_term: payload.utmTerm,
      automail_setting: payload.automailSetting
        ? mapAutomailSetting(payload.automailSetting)
        : undefined,
    };
    const res = await this.transport.put<MessageResponse>(`/editor/message/${id}`, {
      body: JSON.stringify(body),
    });

    return mapMessageWireToEntity(res.data);
  }

  /**
   * Delete a message.
   *
   * This permanently removes the message. Templates linked via dynamic sets
   * are not deleted and can be reused on a new message.
   *
   * @param id - Message ID.
   */
  async delete(id: number): Promise<void> {
    await this.transport.delete(`/editor/message/${id}`);
  }

  /**
   * List all messages attached to a campaign.
   *
   * A campaign typically has one message, but the API supports multiple
   * messages per dispatcher (e.g. for A/B variants).
   *
   * @param campaignId - ID of the campaign whose messages to retrieve.
   * @returns All messages belonging to the campaign.
   */
  async listCampaignMessages(campaignId: number): Promise<EmailCampaignMessage[]> {
    const qs = buildQueryString({ id: campaignId, dispatcher_type: 'campaign' });
    const res = await this.transport.get<MessageListResponse>(`/editor/message${qs}`);

    return res.data.map(mapMessageWireToEntity);
  }

  /**
   * List all messages attached to an automation.
   *
   * An automation typically has one message, but the API supports multiple
   * messages per dispatcher (e.g. for A/B variants).
   *
   * @param automationId - ID of the automation whose messages to retrieve.
   * @returns All messages belonging to the automation.
   */
  async listAutomationMessages(automationId: number): Promise<EmailAutomationMessage[]> {
    const qs = buildQueryString({ id: automationId, dispatcher_type: 'automail' });
    const res = await this.transport.get<MessageListResponse>(`/editor/message${qs}`);

    return res.data.map(mapMessageWireToEntity);
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

function mapMessageWireToEntity(wire: MessageWire): Message {
  return {
    id: wire.id,
    subject: wire.subject,
    preheader: wire.pre_header,
    fromName: wire.sender?.name,
    fromEmail: wire.sender?.email,
    utmCampaign: wire.utm_campaign,
    utmTerm: wire.utm_term,
    messageType: wire.type,
    dispatcher: wire.dispatcher,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
    automailSetting: wire.automail_setting
      ? mapAutomailSettingFromWire(wire.automail_setting)
      : undefined,
  };
}

function mapSender(
  fromName: string | null | undefined,
  fromEmail: string | null | undefined
): MessageSenderWire | undefined {
  if (fromName === undefined && fromEmail === undefined) return undefined;

  return { name: fromName, email: fromEmail };
}

function mapAutomailSetting(s: AutomailSetting): AutomailSettingWriteWire {
  return {
    active: s.active,
    delay_in_seconds: parseInt(s.delayInSeconds, 10),
  };
}

function mapAutomailSettingFromWire(w: AutomailSettingReadWire): AutomailSettingRead {
  if (w.type === 'delay') {
    return { type: 'delay', active: w.active, delayInSeconds: String(w.delay) };
  }

  if (w.type === 'custom') {
    return { type: 'custom', active: w.active };
  }

  throw new Error(
    `Unexpected automail_setting.type on wire: ${JSON.stringify((w as { type: unknown }).type)}`
  );
}

function mapCampaignPayloadToBody(
  campaignId: number,
  p: CreateEmailCampaignMessagePayload
): CreateMessageBody {
  return {
    dispatcher: { id: campaignId, type: 'campaign' },
    type: 1,
    subject: p.subject,
    pre_header: p.preheader,
    sender: mapSender(p.fromName, p.fromEmail),
    utm_campaign: p.utmCampaign,
    utm_term: p.utmTerm,
  };
}

function mapAutomationPayloadToBody(
  automationId: number,
  p: CreateEmailAutomationMessagePayload
): CreateMessageBody {
  return {
    dispatcher: { id: automationId, type: 'automail' },
    type: 1,
    subject: p.subject,
    pre_header: p.preheader,
    sender: mapSender(p.fromName, p.fromEmail),
    utm_campaign: p.utmCampaign,
    utm_term: p.utmTerm,
    automail_setting: p.automailSetting ? mapAutomailSetting(p.automailSetting) : undefined,
  };
}

function mapUpdatePayloadToBody(
  p: UpdateEmailCampaignMessagePayload | UpdateEmailAutomationMessagePayload
): UpdateMessageBody {
  return {
    subject: p.subject,
    pre_header: p.preheader,
    sender: mapSender(p.fromName, p.fromEmail),
    utm_campaign: p.utmCampaign,
    utm_term: p.utmTerm,
    automail_setting:
      'automailSetting' in p && p.automailSetting
        ? mapAutomailSetting(p.automailSetting)
        : undefined,
  };
}
