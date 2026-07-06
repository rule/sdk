/**
 * Shared test fixtures and assertion helpers.
 *
 * Mirrors `packages/vendor-shopify/src/test-fixtures.ts`. `TEST_THEME`
 * has empty `links` / no images so social/logo sections only render
 * when a test explicitly opts in via `TEST_THEME_WITH_SOCIALS`.
 */

import { expect } from 'vitest';
import type { EmailTheme } from '@rule/rcml';
import { EmailThemeColorType, EmailThemeImageType } from '@rule/rcml';
import type { RcmlDocument } from '@rule/rcml';
import { createEmailTheme } from '@rule/rcml';

/** Default test theme. Has a logo, no social links. */
export const TEST_THEME: EmailTheme = {
  ...createEmailTheme({
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
      { fontFamily: 'Helvetica Neue', url: 'https://app.rule.io/brand-style/99999/font/1/css' },
      { fontFamily: 'Arial', url: 'https://app.rule.io/brand-style/99999/font/2/css' },
    ],
  }),
  links: {},
};

/** Theme with two social links populated. */
export const TEST_THEME_WITH_SOCIALS: EmailTheme = {
  ...TEST_THEME,
  links: {
    facebook: { type: 'facebook', url: 'https://facebook.com/example' },
    instagram: { type: 'instagram', url: 'https://instagram.com/example' },
  },
};

/**
 * Assert that a value is a structurally valid RCML document
 * (rcml root with rc-head + rc-body, body has at least one child).
 */
export function assertValidRCMLDocument(doc: unknown): asserts doc is RcmlDocument {
  const d = doc as RcmlDocument;

  expect(d.tagName).toBe('rcml');
  expect(d.children).toHaveLength(2);
  expect(d.children[0].tagName).toBe('rc-head');
  expect(d.children[1].tagName).toBe('rc-body');
  expect(d.children[1].children.length).toBeGreaterThan(0);
}

/** Serialise an RCML document to JSON (for substring assertions). */
export function docToString(doc: RcmlDocument): string {
  return JSON.stringify(doc);
}
