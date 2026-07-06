/**
 * Campaigns namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/editor/campaign` endpoints, including the auxiliary
 * `/copy` and `/schedule` actions.
 *
 * Typical email campaign lifecycle:
 * ```
 * createEmailCampaign()  →  updateEmailCampaign() (name, recipients)  →  schedule()
 * ```
 *
 * Use {@link setEmailCampaign} for full replacement and
 * {@link updateEmailCampaign} for partial updates via read-modify-write.
 * For single-field changes, prefer the focused convenience methods
 * ({@link renameCampaign}, {@link setCampaignSendoutType}, etc.).
 */

import { createSmsDocument } from '@rule/rcml';

import { RuleApiError, RuleClientError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import { buildQueryString } from '../../core/query-string.js';
import { buildDefaultBrandedTemplate } from '../../default-branded-template.js';
import { BrandStylesClient } from '../brand-styles/brand-styles.client.js';
import { DynamicSetsClient } from '../dynamic-sets/dynamic-sets.client.js';
import { MessagesClient } from '../messages/messages.client.js';
import { TemplatesClient } from '../templates/templates.client.js';
import { AccountClient } from '../account/account.client.js';
import type {
  Campaign,
  CampaignListResponse,
  CampaignMessageType,
  CampaignRecipientSegment,
  CampaignRecipientTag,
  CampaignResponse,
  CampaignSendoutType,
  CampaignStatus,
  CampaignWire,
  CreateDefaultCampaignResult,
  CreateDefaultEmailCampaignParams,
  CreateDefaultSmsCampaignParams,
  CreateEmailCampaignPayload,
  CreateSmsCampaignPayload,
  ListCampaignsParams,
  ScheduleCampaignPayload,
  SetEmailCampaignPayload,
  SetSmsCampaignPayload,
  UpdateEmailCampaignPayload,
  UpdateSmsCampaignPayload,
} from './campaigns.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class CampaignsClient extends BaseResource {
  /**
   * Create an email campaign.
   *
   * The campaign starts with no name and no recipients. Use
   * {@link updateEmailCampaign} to add a name and recipients before scheduling.
   *
   * @param payload - Campaign creation options.
   * @returns The created campaign.
   *
   * @example
   * ```typescript
   * const campaign = await client.campaigns.createEmailCampaign({
   *   sendoutType: 'marketing',
   * });
   * ```
   */
  async createEmailCampaign(payload: CreateEmailCampaignPayload): Promise<Campaign> {
    const res = await this.transport.post<CampaignResponse>('/editor/campaign', {
      body: JSON.stringify({
        name: payload.name,
        message_type: '1',  // string — API requires string enum
        sendout_type: payload.sendoutType
          ? mapSendoutTypeToWire(payload.sendoutType)
          : undefined,
        tags: payload.tags,
        segments: payload.segments,
        subscribers: payload.subscribers,
      }),
    });

    return mapCampaignWireToEntity(res.data);
  }

  /**
   * Fetch a campaign by ID.
   *
   * Returns `null` instead of throwing when the campaign does not exist (HTTP
   * 404). All other API errors are rethrown.
   *
   * @param id - Campaign ID.
   * @returns The campaign, or `null` if no campaign with that ID exists.
   *
   * @example
   * ```typescript
   * const campaign = await client.campaigns.get(campaignId);
   * if (campaign) {
   *   console.log(campaign.name, campaign.status?.key);
   * }
   * ```
   */
  async get(id: number): Promise<Campaign | null> {
    try {
      const res = await this.transport.get<CampaignResponse>(`/editor/campaign/${id}`);

      return mapCampaignWireToEntity(res.data);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Set (upsert) an email campaign — fully replaces it if it exists, creates
   * it if not.
   *
   * All five fields are required and fully replace the existing values. This is
   * a complete replacement, not a merge. If the campaign does not exist, it is
   * created as an email campaign.
   *
   * @param id - Campaign ID.
   * @param payload - Full replacement body. No `messageType` field — fixed to
   *   `'email'` by the method.
   * @returns The updated or newly created campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setEmailCampaign(campaignId, {
   *   name: 'Spring Newsletter',
   *   sendoutType: 'marketing',
   *   tags: [{ id: 42, negative: false }],
   *   segments: [],
   *   subscribers: [],
   * });
   * ```
   */
  async setEmailCampaign(id: number, payload: SetEmailCampaignPayload): Promise<Campaign> {
    const body = {
      name: payload.name,
      sendout_type: mapSendoutTypeToWire(payload.sendoutType),
      tags: payload.tags,
      segments: payload.segments,
      subscribers: payload.subscribers,
    };

    try {
      const res = await this.transport.put<CampaignResponse>(`/editor/campaign/${id}`, {
        body: JSON.stringify(body),
      });

      return mapCampaignWireToEntity(res.data);
    } catch (error) {
      if (!(error instanceof RuleApiError) || error.statusCode !== 404) throw error;

      const createRes = await this.transport.post<CampaignResponse>('/editor/campaign', {
        body: JSON.stringify({ ...body, message_type: '1' }),  // string — API requires string enum
      });

      return mapCampaignWireToEntity(createRes.data);
    }
  }

  /**
   * Update an email campaign with a partial body.
   *
   * Only the fields you include are changed — omitted fields are preserved from
   * the existing record. The client fetches the current campaign, merges your
   * changes over it, and writes the complete merged body back to the API.
   *
   * For single-field updates prefer the focused convenience methods:
   * {@link renameCampaign}, {@link setCampaignSendoutType},
   * {@link setCampaignTags}, {@link setCampaignSegments},
   * {@link setCampaignSubscribers}.
   *
   * @param id - Campaign ID.
   * @param partial - Fields to update. All fields are optional.
   * @returns The updated campaign.
   * @throws `RuleApiError` with 404 if the campaign does not exist.
   * @throws `RuleClientError` if the merged record still lacks `sendoutType`
   *   or `tags` after merging.
   *
   * @example
   * ```typescript
   * await client.campaigns.updateEmailCampaign(campaignId, {
   *   name: 'Spring Newsletter 2025',
   *   tags: [{ id: 42, negative: false }],
   * });
   * ```
   */
  async updateEmailCampaign(id: number, partial: UpdateEmailCampaignPayload): Promise<Campaign> {
    const existing = await this.get(id);

    if (existing === null) {
      throw new RuleApiError(`Campaign ${id} not found`, 404);
    }

    // Always send sendout_type as a string — the API requires string enum ("1"/"2").
    // existing.sendoutType.value is guaranteed by the API but may be absent in
    // malformed or test-stubbed responses, so guard defensively.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const existingSendoutNum = existing.sendoutType?.value;
     
    const sendoutType: '1' | '2' | undefined = partial.sendoutType
      ? mapSendoutTypeToWire(partial.sendoutType)
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      : existingSendoutNum != null
        ? (String(existingSendoutNum) as '1' | '2')
        : undefined;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const tags = partial.tags ?? existing.recipients?.tags;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const segments = partial.segments ?? existing.recipients?.segments;
    const subscribers = partial.subscribers
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      ?? existing.recipients?.subscribers?.map((s) => s.id);

    if (sendoutType == null) {
      throw new RuleClientError(
        `Cannot update campaign ${id}: existing record has no sendout_type and update did not provide one`
      );
    }

    if (tags == null) {
      throw new RuleClientError(
        `Cannot update campaign ${id}: existing record has no tags and update did not provide one`
      );
    }

    const fullBody = {
      name: partial.name ?? existing.name,
      sendout_type: sendoutType,
      tags,
      segments: segments ?? [],
      subscribers: subscribers ?? [],
    };

    const res = await this.transport.put<CampaignResponse>(`/editor/campaign/${id}`, {
      body: JSON.stringify(fullBody),
    });

    return mapCampaignWireToEntity(res.data);
  }

  /**
   * Rename a campaign.
   *
   * @param id - Campaign ID.
   * @param name - New campaign name.
   * @returns The updated campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.renameCampaign(campaignId, 'Spring Newsletter 2025');
   * ```
   */
  renameCampaign(id: number, name: string): Promise<Campaign> {
    return this.updateEmailCampaign(id, { name });
  }

  /**
   * Change the sendout type of a campaign.
   *
   * @param id - Campaign ID.
   * @param sendoutType - New sendout type (`'marketing'` or `'transactional'`).
   * @returns The updated campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setCampaignSendoutType(campaignId, 'transactional');
   * ```
   */
  setCampaignSendoutType(id: number, sendoutType: CampaignSendoutType): Promise<Campaign> {
    return this.updateEmailCampaign(id, { sendoutType });
  }

  /**
   * Replace all tag-based recipient filters on a campaign.
   *
   * @param id - Campaign ID.
   * @param tags - New tag recipient filters. Use `negative: true` to exclude subscribers with that tag.
   * @returns The updated campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setCampaignTags(campaignId, [
   *   { id: 42, negative: false },  // include tag 42
   *   { id: 7,  negative: true },   // exclude tag 7
   * ]);
   * ```
   */
  setCampaignTags(id: number, tags: CampaignRecipientTag[]): Promise<Campaign> {
    return this.updateEmailCampaign(id, { tags });
  }

  /**
   * Replace all segment-based recipient filters on a campaign.
   *
   * @param id - Campaign ID.
   * @param segments - New segment recipient filters.
   * @returns The updated campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setCampaignSegments(campaignId, [
   *   { id: 12, negative: false },
   * ]);
   * ```
   */
  setCampaignSegments(id: number, segments: CampaignRecipientSegment[]): Promise<Campaign> {
    return this.updateEmailCampaign(id, { segments });
  }

  /**
   * Replace the individual subscriber targets on a campaign.
   *
   * @param id - Campaign ID.
   * @param subscribers - Subscriber IDs to target. Pass an empty array to clear all.
   * @returns The updated campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setCampaignSubscribers(campaignId, [101, 102, 103]);
   * ```
   */
  setCampaignSubscribers(id: number, subscribers: number[]): Promise<Campaign> {
    return this.updateEmailCampaign(id, { subscribers });
  }

  /**
   * Create an SMS campaign.
   *
   * The campaign starts with no name and no recipients. Use
   * {@link updateSmsCampaign} to add a name and recipients before scheduling.
   *
   * @param payload - Campaign creation options.
   * @returns The created campaign.
   *
   * @example
   * ```typescript
   * const campaign = await client.campaigns.createSmsCampaign({
   *   name: 'Flash sale SMS',
   * });
   * ```
   */
  async createSmsCampaign(payload: CreateSmsCampaignPayload): Promise<Campaign> {
    const res = await this.transport.post<CampaignResponse>('/editor/campaign', {
      body: JSON.stringify({
        name: payload.name,
        message_type: '2',  // string — API requires string enum
        sendout_type: payload.sendoutType
          ? mapSendoutTypeToWire(payload.sendoutType)
          : undefined,
        tags: payload.tags,
        segments: payload.segments,
        subscribers: payload.subscribers,
      }),
    });

    return mapCampaignWireToEntity(res.data);
  }

  /**
   * Set (upsert) an SMS campaign — fully replaces it if it exists, creates
   * it if not.
   *
   * All five fields are required and fully replace the existing values. If the
   * campaign does not exist, it is created as an SMS campaign.
   *
   * @param id - Campaign ID.
   * @param payload - Full replacement body. No `messageType` field — fixed to
   *   `'text_message'` by the method.
   * @returns The updated or newly created campaign.
   *
   * @example
   * ```typescript
   * await client.campaigns.setSmsCampaign(campaignId, {
   *   name: 'Flash sale SMS',
   *   sendoutType: 'marketing',
   *   tags: [{ id: 42, negative: false }],
   *   segments: [],
   *   subscribers: [],
   * });
   * ```
   */
  async setSmsCampaign(id: number, payload: SetSmsCampaignPayload): Promise<Campaign> {
    const body = {
      name: payload.name,
      sendout_type: mapSendoutTypeToWire(payload.sendoutType),
      tags: payload.tags,
      segments: payload.segments,
      subscribers: payload.subscribers,
    };

    try {
      const res = await this.transport.put<CampaignResponse>(`/editor/campaign/${id}`, {
        body: JSON.stringify(body),
      });

      return mapCampaignWireToEntity(res.data);
    } catch (error) {
      if (!(error instanceof RuleApiError) || error.statusCode !== 404) throw error;

      const createRes = await this.transport.post<CampaignResponse>('/editor/campaign', {
        body: JSON.stringify({ ...body, message_type: '2' }),  // string — API requires string enum
      });

      return mapCampaignWireToEntity(createRes.data);
    }
  }

  /**
   * Update an SMS campaign with a partial body.
   *
   * Only the fields you include are changed — omitted fields are preserved from
   * the existing record.
   *
   * @param id - Campaign ID.
   * @param partial - Fields to update. All fields are optional.
   * @returns The updated campaign.
   * @throws `RuleApiError` with 404 if the campaign does not exist.
   *
   * @example
   * ```typescript
   * await client.campaigns.updateSmsCampaign(campaignId, {
   *   name: 'Flash sale SMS — updated',
   *   tags: [{ id: 42, negative: false }],
   * });
   * ```
   */
  updateSmsCampaign(id: number, partial: UpdateSmsCampaignPayload): Promise<Campaign> {
    return this.updateEmailCampaign(id, partial);
  }

  /**
   * Delete a campaign.
   *
   * @param id - Campaign ID.
   * @returns Resolves when the campaign has been deleted.
   */
  async delete(id: number): Promise<void> {
    await this.transport.delete(`/editor/campaign/${id}`);
  }

  /**
   * Copy (duplicate) a campaign.
   *
   * Useful for recurring newsletters where the structure stays the same but
   * the content changes each time.
   *
   * @param id - ID of the campaign to copy.
   * @returns The newly created campaign copy.
   *
   * @example
   * ```typescript
   * const copy = await client.campaigns.copy(campaignId);
   * const newCampaignId = copy.id!;
   * ```
   */
  async copy(id: number): Promise<Campaign> {
    const res = await this.transport.post<CampaignResponse>(`/editor/campaign/${id}/copy`);

    return mapCampaignWireToEntity(res.data);
  }

  /**
   * Schedule, send immediately, or cancel the schedule of a campaign.
   *
   * - `type: 'now'` sends the campaign immediately
   * - `type: 'schedule'` with a `datetime` schedules it for later
   * - `type: null` cancels a previously scheduled send (moves back to draft)
   *
   * @param id - Campaign ID.
   * @param payload - Schedule configuration.
   * @returns Resolves when the schedule has been applied.
   *
   * @example
   * ```typescript
   * await client.campaigns.schedule(campaignId, { type: 'now' });
   * ```
   */
  async schedule(id: number, payload: ScheduleCampaignPayload): Promise<void> {
    await this.transport.post(`/editor/campaign/${id}/schedule`, {
      body: JSON.stringify(payload),
    });
  }

  /**
   * Fetch one page of campaigns.
   *
   * This is the primitive list method. For auto-pagination use
   * {@link iterateCampaigns}, {@link iterateCampaignsPages}, or
   * {@link listAllCampaigns}.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns Campaigns on the requested page.
   *
   * @example
   * ```typescript
   * const page = await client.campaigns.listCampaigns({
   *   filters: { messageType: 'email' },
   *   pagination: { page: 1, pageSize: 20 },
   * });
   * ```
   */
  async listCampaigns(params?: ListCampaignsParams): Promise<Campaign[]> {
    const wireParams = params
      ? {
          page: params.pagination?.page,
          per_page: params.pagination?.pageSize,
          message_type: params.filters?.messageType
            ? mapMessageTypeToWire(params.filters.messageType)
            : undefined,
        }
      : undefined;
    const qs = wireParams ? buildQueryString(wireParams) : '';
    const res = await this.transport.get<CampaignListResponse>(`/editor/campaign${qs}`);

    return res.data.map(mapCampaignWireToEntity);
  }

  /**
   * Iterate through all campaigns page by page.
   *
   * Automatically requests additional pages as needed and yields each full
   * page as an array.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns An async iterable of campaign arrays, one array per page.
   *
   * @example
   * ```typescript
   * for await (const page of client.campaigns.iterateCampaignsPages()) {
   *   console.log(`Page: ${page.length} campaigns`);
   * }
   * ```
   */
  async *iterateCampaignsPages(params: ListCampaignsParams = {}): AsyncIterable<Campaign[]> {
    const pageSize = params.pagination?.pageSize ?? 15;
    let page = params.pagination?.page ?? 1;
    let hasMore = true;

    while (hasMore) {
      const campaigns = await this.listCampaigns({
        ...params,
        pagination: { ...params.pagination, page, pageSize },
      });

      yield campaigns;

      hasMore = campaigns.length >= pageSize;
      page += 1;
    }
  }

  /**
   * Iterate through all campaigns one by one.
   *
   * Automatically requests additional pages as needed and yields individual
   * campaigns one at a time.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns An async iterable of individual {@link Campaign} objects.
   *
   * @example
   * ```typescript
   * for await (const campaign of client.campaigns.iterateCampaigns()) {
   *   console.log(campaign.name, campaign.status?.key);
   * }
   * ```
   */
  async *iterateCampaigns(params: ListCampaignsParams = {}): AsyncIterable<Campaign> {
    for await (const page of this.iterateCampaignsPages(params)) {
      yield* page;
    }
  }

  /**
   * Collect all campaigns into a single array.
   *
   * Automatically paginates through all pages. Prefer {@link iterateCampaigns}
   * for large campaign lists.
   *
   * @param params - Optional pagination and filter parameters.
   * @returns All campaigns.
   *
   * @example
   * ```typescript
   * const all = await client.campaigns.listAllCampaigns();
   * ```
   */
  async listAllCampaigns(params: ListCampaignsParams = {}): Promise<Campaign[]> {
    const results: Campaign[] = [];

    for await (const campaign of this.iterateCampaigns(params)) {
      results.push(campaign);
    }

    return results;
  }

  /**
   * Create a complete email campaign with all its dependencies in one call.
   *
   * Executes the full creation sequence:
   * 1. Create the campaign.
   * 2. In parallel: create the message (using the campaign name as subject)
   *    and create the email template (built from the given brand style).
   * 3. Create the default dynamic set linking the message to the template.
   *
   * If any step fails, all previously created resources are deleted
   * automatically before the error is rethrown.
   *
   * @param params - Brand style ID and optional campaign name and sendout type.
   * @returns IDs of all created resources.
   *
   * @example
   * ```typescript
   * const result = await client.campaigns.createDefaultEmailCampaign({
   *   brandStyleId: 42,
   * });
   * console.log(result.campaignId, result.messageId, result.templateId, result.dynamicSetId);
   * ```
   */
  async createDefaultEmailCampaign(
    params: CreateDefaultEmailCampaignParams
  ): Promise<CreateDefaultCampaignResult> {
    const brandStyles = this.lazy('brandStyles', () => new BrandStylesClient(this.transport));
    const messages = this.lazy('messages', () => new MessagesClient(this.transport));
    const templates = this.lazy('templates', () => new TemplatesClient(this.transport));
    const dynamicSets = this.lazy('dynamicSets', () => new DynamicSetsClient(this.transport));

    const { content: templateContentOverride, ...templateMetaOverrides } = params.template ?? {};

    let templateContent = templateContentOverride;

    if (!templateContent) {
      const brandStyle = await brandStyles.get(params.brandStyleId);

      if (!brandStyle) {
        throw new RuleApiError(`Brand style ${params.brandStyleId} not found.`, 404);
      }

      templateContent = buildDefaultBrandedTemplate(brandStyle);
    }

    const createdResources: { type: 'campaign' | 'message' | 'template'; id: number }[] = [];

    try {
      const campaign = await this.createEmailCampaign({
        name: params.name,
        sendoutType: params.sendoutType ?? 'marketing',
      });

      if (!campaign.id) {
        throw new RuleApiError('Failed to create campaign — no ID returned.', 500);
      }

      const campaignId = campaign.id;

      createdResources.push({ type: 'campaign', id: campaignId });

      const [messageResult, templateResult] = await Promise.allSettled([
        messages.createEmailCampaignMessage(campaignId, {
          ...params.message,
          subject: params.message?.subject ?? campaign.name,
        }),
        templates.createEmailTemplate({
          name: `Campaign ${campaignId} template`,
          ...templateMetaOverrides,
          content: templateContent,
        }),
      ]);

      if (messageResult.status === 'fulfilled' && messageResult.value.id) {
        createdResources.push({ type: 'message', id: messageResult.value.id });
      }

      if (templateResult.status === 'fulfilled' && templateResult.value.id) {
        createdResources.push({ type: 'template', id: templateResult.value.id });
      }

      if (messageResult.status === 'rejected') {
        throw messageResult.reason;
      }

      if (templateResult.status === 'rejected') {
        throw templateResult.reason;
      }

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

      return {
        campaignId,
        messageId: message.id,
        templateId: template.id,
        dynamicSetId: dynamicSet.id,
      };
    } catch (error) {
      await this._cleanupResources(createdResources, { messages, templates });
      throw error;
    }
  }

  /**
   * Create a complete SMS campaign with all its dependencies in one call.
   *
   * Executes the full creation sequence:
   * 1. Fetch account sender details when needed (to determine the unsubscribe
   *    footer style for the default SMS body). Skipped when both
   *    `message.subject` and `template.content` are provided.
   * 2. Create the campaign.
   * 3. In parallel: create the SMS message and create the SMS template (built
   *    from the resolved SMS body text).
   * 4. Create the default dynamic set linking the message to the template.
   *
   * If any step fails, all previously created resources are deleted
   * automatically before the error is rethrown.
   *
   * @param params - Optional campaign name and sendout type.
   * @returns IDs of all created resources.
   *
   * @example
   * ```typescript
   * const result = await client.campaigns.createDefaultSmsCampaign();
   * console.log(result.campaignId, result.messageId, result.templateId, result.dynamicSetId);
   * ```
   */
  async createDefaultSmsCampaign(
    params: CreateDefaultSmsCampaignParams = {}
  ): Promise<CreateDefaultCampaignResult> {
    const account = this.lazy('account', () => new AccountClient(this.transport));
    const messages = this.lazy('messages', () => new MessagesClient(this.transport));
    const templates = this.lazy('templates', () => new TemplatesClient(this.transport));
    const dynamicSets = this.lazy('dynamicSets', () => new DynamicSetsClient(this.transport));

    const { content: templateContentOverride, ...templateMetaOverrides } = params.template ?? {};

    let smsBody: string | undefined;

    if (!templateContentOverride) {
      const isMarketing = (params.sendoutType ?? 'marketing') !== 'transactional';

      if (isMarketing) {
        const senderDetails = await account.getSenderDetails();

        smsBody = buildDefaultSmsContent(senderDetails.linkInsteadOfStopWord ?? false);
      } else {
        smsBody = 'Your message here.';
      }
    }

    const createdResources: { type: 'campaign' | 'message' | 'template'; id: number }[] = [];

    try {
      const campaign = await this.createSmsCampaign({
        name: params.name,
        sendoutType: params.sendoutType ?? 'marketing',
      });

      if (!campaign.id) {
        throw new RuleApiError('Failed to create campaign — no ID returned.', 500);
      }

      const campaignId = campaign.id;

      createdResources.push({ type: 'campaign', id: campaignId });

      const [messageResult, templateResult] = await Promise.allSettled([
        messages.createSmsCampaignMessage(campaignId, {
          ...params.message,
        }),
        templates.createSmsTemplate({
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

      if (messageResult.status === 'rejected') {
        throw messageResult.reason;
      }

      if (templateResult.status === 'rejected') {
        throw templateResult.reason;
      }

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

      return {
        campaignId,
        messageId: message.id,
        templateId: template.id,
        dynamicSetId: dynamicSet.id,
      };
    } catch (error) {
      await this._cleanupResources(createdResources, { messages, templates });
      throw error;
    }
  }

  private async _cleanupResources(
    resources: { type: 'campaign' | 'message' | 'template'; id: number }[],
    clients: { messages: MessagesClient; templates: TemplatesClient }
  ): Promise<void> {
    for (const resource of resources.reverse()) {
      try {
        if (resource.type === 'campaign') {
          await this.delete(resource.id);
        } else if (resource.type === 'message') {
          await clients.messages.delete(resource.id);
        } else {
          await clients.templates.delete(resource.id);
        }
      } catch {
        // Ignore cleanup errors — best-effort only.
      }
    }
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * Maps a raw wire-format campaign to a public SDK {@link Campaign} entity.
 * @internal
 */
function mapCampaignWireToEntity(wire: CampaignWire): Campaign {
  // The API guarantees status, messageType, sendoutType, recipients, createdAt,
  // updatedAt in every response. The wire type keeps these optional so that
  // partial test stubs and create/copy responses (which may lack some fields)
  // still type-check. We cast here — real API data always includes them.
  return {
    id: wire.id,
    name: wire.name,
    status: wire.status as CampaignStatus,
    messageType: wire.message_type as CampaignStatus,
    sendoutType: wire.sendout_type as CampaignStatus,
    numberOfRecipients: wire.number_of_recipients,
    totalSent: wire.total_sent,
    recipients: {
      tags: wire.recipients?.tags,
      segments: wire.recipients?.segments,
      subscribers: wire.recipients?.subscribers?.map((s) => ({
        id: s.id,
        email: s.email,
        phoneNumber: s.phone_number,
      })),
    },
    createdAt: wire.created_at as string,
    updatedAt: wire.updated_at as string,
  };
}

/**
 * Maps a public {@link CampaignSendoutType} to the API string enum value.
 *
 * The POST/PUT `/editor/campaign` request body expects `sendout_type` as a
 * string (`"1"` or `"2"`), not a numeric value.
 * @internal
 */
function mapSendoutTypeToWire(type: CampaignSendoutType): '1' | '2' {
  return type === 'marketing' ? '1' : '2';
}

/**
 * Maps a public {@link CampaignMessageType} to a numeric value for the list
 * query string parameter.
 *
 * The GET `/editor/campaign` query parameter expects an integer for
 * `message_type`, unlike the POST/PUT request body which uses a string enum.
 * @internal
 */
function mapMessageTypeToWire(type: CampaignMessageType): number {
  return type === 'email' ? 1 : 2;
}

/**
 * Build the default SMS body content string in SMS RFM format.
 *
 * Mirrors the frontend's `InitialSmsTemplateRcmlBuilder`: appends either a
 * link-based unsubscribe (`linkInsteadOfStopWord = true`) or a stop-word
 * (`linkInsteadOfStopWord = false`) after the placeholder message text.
 * @internal
 */
function buildDefaultSmsContent(linkInsteadOfStopWord: boolean): string {
  const body = 'Your message here.\n';

  if (linkInsteadOfStopWord) {
    return `${body}::unsubscribe`;
  }

  return `${body}::placeholder{type="Subscriber" original="[Subscriber:stop_word]" name="Stop word"}`;
}
