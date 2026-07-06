/**
 * Brand-styles namespace client for the `@rule/client` package.
 *
 * Wraps the v3 `/brand-styles` endpoints — list, get, create (from-domain
 * or manual), update (PATCH), and delete.
 */

import { RuleApiError } from '../../errors.js';
import { BaseResource } from '../../core/base-resource.js';
import type {
  BrandStyle,
  BrandStyleBody,
  BrandStyleColour,
  BrandStyleColourWire,
  BrandStyleFont,
  BrandStyleFontWire,
  BrandStyleImage,
  BrandStyleImageWire,
  BrandStyleLink,
  BrandStyleLinkWire,
  BrandStyleListItem,
  BrandStyleListItemWire,
  BrandStyleListResponse,
  BrandStyleResponse,
  BrandStyleWire,
  CreateBrandStyleFromDomainPayload,
  CreateBrandStylePayload,
  UpdateBrandStylePayload,
} from './brand-styles.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class BrandStylesClient extends BaseResource {
  /**
   * List all brand styles for the account.
   *
   * Returns summary items only. Use {@link get} to fetch full details
   * (colours, fonts, links, images) for a specific style.
   *
   * @returns Array of brand style summary items.
   *
   * @example
   * ```typescript
   * const styles = await client.brandStyles.list();
   * const defaultStyle = styles.find((s) => s.isDefault);
   * ```
   */
  async list(): Promise<BrandStyleListItem[]> {
    const res = await this.transport.get<BrandStyleListResponse>('/brand-styles');

    return (res.data ?? []).map(mapBrandStyleListItemWireToEntity);
  }

  /**
   * Get a brand style by ID.
   *
   * Returns `null` instead of throwing when the style does not exist (HTTP 404).
   * All other API errors are rethrown.
   *
   * @param id - Brand style ID.
   * @returns Full brand style detail, or `null` if the ID does not exist.
   *
   * @example
   * ```typescript
   * const style = await client.brandStyles.get(brandStyleId);
   * if (style) {
   *   console.log(style.name, style.isDefault, style.colours);
   * }
   * ```
   */
  async get(id: number): Promise<BrandStyle | null> {
    try {
      const res = await this.transport.get<BrandStyleResponse>(`/brand-styles/${id}`);

      return mapBrandStyleWireToEntity(res.data);
    } catch (error) {
      if (error instanceof RuleApiError && error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Create a brand style by auto-detecting assets from a live domain.
   *
   * Rule.io fetches brand colours, logo, fonts, and social links from the
   * given website. This is the fastest way to create a first brand style.
   *
   * @param payload - The domain to fetch brand assets from.
   * @returns The created brand style.
   * @throws `RuleApiError` 409 if a brand style for this domain already exists.
   * @throws `RuleApiError` 424 if the domain could not be fetched.
   *
   * @example
   * ```typescript
   * const style = await client.brandStyles.createFromDomain({ domain: 'example.com' });
   * const brandStyleId = style.id;
   * ```
   */
  async createFromDomain(payload: CreateBrandStyleFromDomainPayload): Promise<BrandStyle> {
    const res = await this.transport.post<BrandStyleResponse>('/brand-styles/from-domain', {
      body: JSON.stringify(payload),
    });

    return mapBrandStyleWireToEntity(res.data);
  }

  /**
   * Create a brand style manually with explicit values.
   *
   * Specify each visual element (colours, fonts, social links, images) directly.
   *
   * @param payload - Brand style data. `name` is required; all other fields are optional.
   * @returns The created brand style.
   *
   * @example
   * ```typescript
   * const style = await client.brandStyles.createManually({
   *   name: 'Acme Brand',
   *   colours: [
   *     { type: 'brand',  hex: '#0066CC', brightness: 40 },
   *     { type: 'accent', hex: '#FF5500', brightness: 60 },
   *   ],
   *   fonts: [
   *     { type: 'title', name: 'Helvetica', origin: 'system' },
   *   ],
   *   links: [
   *     { type: 'website', link: 'https://example.com' },
   *   ],
   * });
   * ```
   */
  async createManually(payload: CreateBrandStylePayload): Promise<BrandStyle> {
    const res = await this.transport.post<BrandStyleResponse>('/brand-styles/manually', {
      body: JSON.stringify(mapPayloadToBody(payload)),
    });

    return mapBrandStyleWireToEntity(res.data);
  }

  /**
   * Update an existing brand style (partial update via PATCH).
   *
   * Only the fields you include are changed — omitted fields are left as-is.
   *
   * @param id - Brand style ID.
   * @param payload - Fields to update. All fields are optional.
   * @returns The updated brand style.
   *
   * @example
   * ```typescript
   * await client.brandStyles.update(brandStyleId, {
   *   name: 'Acme Brand v2',
   *   colours: [{ type: 'accent', hex: '#003399', brightness: 30 }],
   * });
   * ```
   */
  async update(id: number, payload: UpdateBrandStylePayload): Promise<BrandStyle> {
    const res = await this.transport.patch<BrandStyleResponse>(`/brand-styles/${id}`, {
      body: JSON.stringify(mapPayloadToBody(payload)),
    });

    return mapBrandStyleWireToEntity(res.data);
  }

  /**
   * Delete a brand style.
   *
   * At least one brand style must exist on the account at all times. If this
   * is the last style, deletion fails with 403. Create a replacement first,
   * then delete the old one.
   *
   * @param id - Brand style ID.
   * @returns Resolves when the brand style has been deleted.
   *
   * @example
   * ```typescript
   * await client.brandStyles.delete(brandStyleId);
   * ```
   */
  async delete(id: number): Promise<void> {
    await this.transport.fetchRaw('DELETE', `/brand-styles/${id}`);
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * @internal
 */
function mapBrandStyleColourWireToEntity(w: BrandStyleColourWire): BrandStyleColour {
  return {
    id: w.id,
    brandStyleId: w.brand_style_id,
    type: w.type,
    hex: w.hex,
    brightness: w.brightness,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * @internal
 */
function mapBrandStyleLinkWireToEntity(w: BrandStyleLinkWire): BrandStyleLink {
  return {
    id: w.id,
    brandStyleId: w.brand_style_id,
    type: w.type,
    link: w.link,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * @internal
 */
function mapBrandStyleFontWireToEntity(w: BrandStyleFontWire): BrandStyleFont {
  return {
    id: w.id,
    brandStyleId: w.brand_style_id,
    type: w.type,
    name: w.name,
    origin: w.origin,
    originId: w.origin_id,
    originName: w.origin_name,
    url: w.url,
    weights: w.weights,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * @internal
 */
function mapBrandStyleImageWireToEntity(w: BrandStyleImageWire): BrandStyleImage {
  return {
    id: w.id,
    brandStyleId: w.brand_style_id,
    type: w.type,
    publicPath: w.public_path,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * Maps a raw wire-format brand style to a public SDK {@link BrandStyle} entity.
 * @internal
 */
function mapBrandStyleWireToEntity(w: BrandStyleWire): BrandStyle {
  return {
    id: w.id,
    accountId: w.account_id,
    name: w.name,
    description: w.description,
    domain: w.domain,
    isDefault: w.is_default,
    isFetchable: w.is_fetchable,
    colours: w.colours?.map(mapBrandStyleColourWireToEntity),
    links: w.links?.map(mapBrandStyleLinkWireToEntity),
    fonts: w.fonts?.map(mapBrandStyleFontWireToEntity),
    images: w.images?.map(mapBrandStyleImageWireToEntity),
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * Maps a raw wire-format list item to a public SDK {@link BrandStyleListItem}.
 * @internal
 */
function mapBrandStyleListItemWireToEntity(w: BrandStyleListItemWire): BrandStyleListItem {
  return {
    id: w.id,
    name: w.name,
    isDefault: w.is_default,
    createdAt: w.created_at,
    updatedAt: w.updated_at,
  };
}

/**
 * Maps a camelCase create/update payload to the snake_case wire body.
 * @internal
 */
function mapPayloadToBody(p: CreateBrandStylePayload | UpdateBrandStylePayload): BrandStyleBody {
  return {
    name: (p as CreateBrandStylePayload).name,
    description: p.description,
    domain: p.domain,
    is_default: p.isDefault,
    colours: p.colours,
    links: p.links,
    fonts: p.fonts?.map((f) => ({
      type: f.type,
      name: f.name,
      origin: f.origin,
      origin_id: f.originId,
      weights: f.weights,
      font: f.font,
    })),
    images: p.images,
  };
}
