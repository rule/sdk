/**
 * Brand-style types for the `@rule/client` brand-styles namespace.
 *
 * A brand style captures your visual identity — logo, colours, fonts, and
 * social links. The RCML template builders use brand styles to produce
 * consistently branded emails without you specifying design values in every
 * template.
 */

import type { RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

// ── Enumerations ──────────────────────────────────────────────────────────────

/**
 * Colour role in a brand style.
 *
 * - `accent` — primary action / highlight colour
 * - `dark` — text colour
 * - `light` — light background or secondary text
 * - `brand` — main brand colour
 * - `side` — sidebar / panel background
 */
export type BrandStyleColourType = 'accent' | 'dark' | 'light' | 'brand' | 'side';

/** Social or web link type in a brand style. */
export type BrandStyleLinkType =
  | 'instagram'
  | 'facebook'
  | 'twitter'
  | 'github'
  | 'youtube'
  | 'linkedin'
  | 'crunchbase'
  | 'website'
  | 'pinterest'
  | 'tiktok';

/** Font role in a brand style: `'title'` for headings, `'body'` for body text. */
export type BrandStyleFontType = 'title' | 'body';

/** Font origin: where the font is sourced from. */
export type BrandStyleFontOrigin = 'google' | 'system' | 'custom';

/** Image type in a brand style. */
export type BrandStyleImageType = 'logo' | 'icon' | 'symbol' | 'banner';

// ── Entity sub-types ──────────────────────────────────────────────────────────

/** A colour entry embedded in a `BrandStyle`. */
export interface BrandStyleColour {
  id: number;
  /** ID of the brand style this colour belongs to. */
  brandStyleId: number;
  type: BrandStyleColourType;
  /** Hex colour value, e.g. `'#FF5733'`. */
  hex: string;
  /** Perceived brightness of the colour, 0–100. */
  brightness: number;
  createdAt: string;
  updatedAt: string;
}

/** A social or web link embedded in a `BrandStyle`. */
export interface BrandStyleLink {
  id: number;
  brandStyleId: number;
  type: BrandStyleLinkType;
  /** Full URL, e.g. `'https://instagram.com/yourbrand'`. */
  link: string;
  createdAt: string;
  updatedAt: string;
}

/** A font entry embedded in a `BrandStyle`. */
export interface BrandStyleFont {
  id: number;
  brandStyleId: number;
  type: BrandStyleFontType;
  /** Font family name. */
  name: string;
  /** Where the font is sourced from. */
  origin?: BrandStyleFontOrigin | null;
  /** Google Fonts ID or other origin-specific identifier. */
  originId?: string | null;
  /** Human-readable origin name. */
  originName?: string | null;
  /** URL to the font file for custom fonts. */
  url?: string | null;
  /** Available font weights, e.g. `['400', '700']`. */
  weights?: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/** An image (logo, banner, etc.) embedded in a `BrandStyle`. */
export interface BrandStyleImage {
  id: number;
  brandStyleId: number;
  type?: BrandStyleImageType | null;
  /** Public URL of the uploaded image file. */
  publicPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Entities ──────────────────────────────────────────────────────────────────

/**
 * Full brand style detail as returned by `BrandStylesClient.get`.
 */
export interface BrandStyle {
  id: number;
  /** ID of the account this brand style belongs to. */
  accountId: number;
  /** Human-readable name. */
  name: string;
  description?: string | null;
  /** Domain the style was auto-detected from, if applicable. */
  domain?: string | null;
  /**
   * Whether this is the account's default brand style.
   *
   * The default style is used when no specific style is requested.
   */
  isDefault: boolean;
  /**
   * Whether the brand assets can be re-fetched from the domain.
   *
   * Only relevant for styles created via `BrandStylesClient.createFromDomain`.
   */
  isFetchable?: boolean | null;
  colours?: BrandStyleColour[] | null;
  links?: BrandStyleLink[] | null;
  fonts?: BrandStyleFont[] | null;
  images?: BrandStyleImage[] | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified brand style summary returned by `BrandStylesClient.list`.
 *
 * Use `BrandStylesClient.get` to fetch the full detail including
 * colours, fonts, links, and images.
 */
export interface BrandStyleListItem {
  id: number;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Payload entry types ───────────────────────────────────────────────────────

/** A colour entry in a create or update payload. */
export interface BrandStyleColourEntry {
  type: BrandStyleColourType;
  /** Hex colour value, e.g. `'#FF5733'`. */
  hex: string;
  /** Perceived brightness, 0–100. */
  brightness: number;
}

/** A social or web link entry in a create or update payload. */
export interface BrandStyleLinkEntry {
  type: BrandStyleLinkType;
  /** Full URL. */
  link: string;
}

/** A font entry in a create or update payload. */
export interface BrandStyleFontEntry {
  type: BrandStyleFontType;
  /** Font family name. */
  name: string;
  origin: BrandStyleFontOrigin;
  /** Google Fonts ID or other origin-specific identifier. */
  originId?: string | null;
  /** Available font weights, e.g. `['400', '700']`. */
  weights?: string[] | null;
  /** Custom font file — only needed when `origin` is `'custom'`. */
  font?: { name?: string; file: string };
}

/** An image entry in a create or update payload. */
export interface BrandStyleImageEntry {
  type: BrandStyleImageType;
  /** Image file as a base64-encoded string. */
  image?: { name?: string; file: string };
}

// ── Create / update payloads ──────────────────────────────────────────────────

/**
 * Payload for `BrandStylesClient.createFromDomain`.
 *
 * @example
 * ```typescript
 * const style = await client.brandStyles.createFromDomain({ domain: 'example.com' });
 * ```
 */
export interface CreateBrandStyleFromDomainPayload {
  /** Domain to fetch brand assets from (e.g. `'example.com'`). */
  domain: string;
}

/**
 * Payload for `BrandStylesClient.createManually`.
 *
 * @example
 * ```typescript
 * const style = await client.brandStyles.createManually({
 *   name: 'Acme Brand',
 *   colours: [
 *     { type: 'brand',  hex: '#0066CC', brightness: 40 },
 *     { type: 'accent', hex: '#FF5500', brightness: 60 },
 *   ],
 *   links: [
 *     { type: 'website',  link: 'https://example.com' },
 *     { type: 'linkedin', link: 'https://linkedin.com/company/example' },
 *   ],
 *   fonts: [
 *     { type: 'title', name: 'Helvetica', origin: 'system' },
 *     { type: 'body',  name: 'Arial',     origin: 'system' },
 *   ],
 * });
 * ```
 */
export interface CreateBrandStylePayload {
  /** Brand style name. Required. */
  name: string;
  description?: string | null;
  /** Domain to associate with the style. */
  domain?: string | null;
  /** Set this style as the account default. */
  isDefault?: boolean | null;
  colours?: BrandStyleColourEntry[] | null;
  links?: BrandStyleLinkEntry[] | null;
  fonts?: BrandStyleFontEntry[] | null;
  images?: BrandStyleImageEntry[] | null;
}

/**
 * Payload for `BrandStylesClient.update` (PATCH — all fields optional).
 *
 * Only the fields you include are changed.
 *
 * @example
 * ```typescript
 * await client.brandStyles.update(brandStyleId, {
 *   name: 'Acme Brand v2',
 *   colours: [{ type: 'accent', hex: '#003399', brightness: 30 }],
 * });
 * ```
 */
export interface UpdateBrandStylePayload {
  name?: string;
  description?: string | null;
  domain?: string | null;
  isDefault?: boolean | null;
  colours?: BrandStyleColourEntry[] | null;
  links?: BrandStyleLinkEntry[] | null;
  fonts?: BrandStyleFontEntry[] | null;
  images?: BrandStyleImageEntry[] | null;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/** @internal */
export interface BrandStyleColourWire {
  id: number;
  brand_style_id: number;
  type: BrandStyleColourType;
  hex: string;
  brightness: number;
  created_at: string;
  updated_at: string;
}

/** @internal */
export interface BrandStyleLinkWire {
  id: number;
  brand_style_id: number;
  type: BrandStyleLinkType;
  link: string;
  created_at: string;
  updated_at: string;
}

/** @internal */
export interface BrandStyleFontWire {
  id: number;
  brand_style_id: number;
  type: BrandStyleFontType;
  name: string;
  origin?: BrandStyleFontOrigin | null;
  origin_id?: string | null;
  origin_name?: string | null;
  url?: string | null;
  weights?: string[] | null;
  created_at: string;
  updated_at: string;
}

/** @internal */
export interface BrandStyleImageWire {
  id: number;
  brand_style_id: number;
  type?: BrandStyleImageType | null;
  public_path?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Wire-format full brand style entity.
 * @internal
 */
export interface BrandStyleWire {
  id: number;
  account_id: number;
  name: string;
  description?: string | null;
  domain?: string | null;
  is_default: boolean;
  is_fetchable?: boolean | null;
  colours?: BrandStyleColourWire[] | null;
  links?: BrandStyleLinkWire[] | null;
  fonts?: BrandStyleFontWire[] | null;
  images?: BrandStyleImageWire[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Wire-format brand style list item.
 * @internal
 */
export interface BrandStyleListItemWire {
  id: number;
  name: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Wire request body for POST /brand-styles/manually and PATCH /brand-styles/{id}.
 * All payload fields map to snake_case.
 * @internal
 */
export interface BrandStyleBody {
  name?: string;
  description?: string | null;
  domain?: string | null;
  is_default?: boolean | null;
  colours?: Array<{ type: BrandStyleColourType; hex: string; brightness: number }> | null;
  links?: Array<{ type: BrandStyleLinkType; link: string }> | null;
  fonts?: Array<{
    type: BrandStyleFontType;
    name: string;
    origin: BrandStyleFontOrigin;
    origin_id?: string | null;
    weights?: string[] | null;
    font?: { name?: string; file: string };
  }> | null;
  images?: Array<{
    type: BrandStyleImageType;
    image?: { name?: string; file: string };
  }> | null;
}

/**
 * Wire response from GET/POST /brand-styles endpoints (single style).
 * @internal
 */
export interface BrandStyleResponse extends RuleApiResponse {
  data: BrandStyleWire;
}

/**
 * Wire response from GET /brand-styles (list).
 * @internal
 */
export interface BrandStyleListResponse extends RuleApiResponse {
  data?: BrandStyleListItemWire[];
}
