/**
 * Shared test fixtures and assertion helpers.
 *
 * Centralises duplicated constants (TEST_THEME, assertValidRCMLDocument,
 * docToString) so every test file that needs them imports from one place.
 */

import { expect } from 'vitest';
import type { EmailTheme } from '@rule/rcml';
import { EmailThemeColorType, EmailThemeImageType } from '@rule/rcml';
import type { RcmlDocument } from '@rule/rcml';
import { createEmailTheme } from '@rule/rcml';

// ============================================================================
// Shared theme fixture
// ============================================================================

/**
 * Default test theme — mirrors the brand-style fixture that older tests
 * used, but materialised as an {@link EmailTheme} so it can be passed
 * directly into `VendorConsumerConfig.theme`.
 */
export const TEST_THEME: EmailTheme = createEmailTheme({
  brandStyleId: 99999,
  colors: [
    { type: EmailThemeColorType.Primary, hex: '#0066CC' },
    { type: EmailThemeColorType.Secondary, hex: '#F6F8F9' },
    { type: EmailThemeColorType.Body, hex: '#FFFFFF' },
    { type: EmailThemeColorType.Background, hex: '#F3F3F3' },
  ],
  images: [
    { type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' },
  ],
  fonts: [
    {
      fontFamily: 'Helvetica Neue',
      url: 'https://app.rule.io/brand-style/99999/font/1/css',
    },
    {
      fontFamily: 'Arial',
      url: 'https://app.rule.io/brand-style/99999/font/2/css',
    },
  ],
});

/** Helper to build a theme variant without a logo. */
export function themeWithoutLogo(): EmailTheme {
  return createEmailTheme({
    brandStyleId: 99999,
    colors: [
      { type: EmailThemeColorType.Primary, hex: '#0066CC' },
      { type: EmailThemeColorType.Secondary, hex: '#F6F8F9' },
      { type: EmailThemeColorType.Body, hex: '#FFFFFF' },
      { type: EmailThemeColorType.Background, hex: '#F3F3F3' },
    ],
    fonts: [
      {
        fontFamily: 'Helvetica Neue',
        url: 'https://app.rule.io/brand-style/99999/font/1/css',
      },
      {
        fontFamily: 'Arial',
        url: 'https://app.rule.io/brand-style/99999/font/2/css',
      },
    ],
  });
}

// ============================================================================
// Assertion helpers
// ============================================================================

/**
 * Assert that a value is a structurally valid RCML document (rcml root with
 * rc-head + rc-body, and at least one child in the body).
 */
export function assertValidRCMLDocument(doc: unknown): asserts doc is RcmlDocument {
  const d = doc as RcmlDocument;

  expect(d.tagName).toBe('rcml');
  expect(d.children).toHaveLength(2);
  expect(d.children[0].tagName).toBe('rc-head');
  expect(d.children[1].tagName).toBe('rc-body');
  expect(d.children[1].children.length).toBeGreaterThan(0);
}

/**
 * Serialise an RCML document to a JSON string (useful for substring assertions).
 */
export function docToString(doc: RcmlDocument): string {
  return JSON.stringify(doc);
}
