/**
 * Every shopify template must render RCML that passes the schema
 * validator — with all optional sections populated (so each
 * `rc-class="rcml-brand-color"` section is exercised) and under both a
 * default theme (placeholder social slots) and a theme whose six social
 * slots are all configured (so the `website` slot's `web` name is
 * exercised).
 */

import { describe, expect, it } from 'vitest';
import { createEmailTheme, safeValidateEmailTemplate } from '@rule/rcml';
import type { EmailTheme, RcmlDocument } from '@rule/rcml';
import { customField, loopValue } from '@rule/template-engine';
import {
  createAbandonedCartTemplate,
  createOrderCancellationTemplate,
  createOrderConfirmationTemplate,
  createShippingUpdateTemplate,
  createWelcomeTemplate,
} from '../src/index.js';

const footer = { fontSize: '10px', textColor: '#666666' };
const firstName = customField('Subscriber', 'FirstName', 1);
const ref = customField('Order', 'Number', 2);
const date = customField('Order', 'Date', 3);
const total = customField('Order', 'TotalPrice', 4);
const products = {
  source: customField('Order', 'Products', 5),
  itemName: loopValue('name'),
  itemSku: loopValue('sku'),
  itemQuantity: loopValue('quantity'),
  itemPrice: loopValue('price'),
};

const themes: Record<string, EmailTheme> = {
  'default theme (placeholder socials)': createEmailTheme({ brandStyleId: 1 }),
  'theme with all six socials configured': createEmailTheme({
    brandStyleId: 1,
    links: [
      { type: 'facebook', url: 'https://facebook.com/acme' },
      { type: 'instagram', url: 'https://instagram.com/acme' },
      { type: 'linkedin', url: 'https://linkedin.com/company/acme' },
      { type: 'tiktok', url: 'https://tiktok.com/@acme' },
      { type: 'x', url: 'https://x.com/acme' },
      { type: 'website', url: 'https://acme.example/' },
    ],
  }),
};

const renders: Record<string, (theme: EmailTheme) => RcmlDocument> = {
  'order-confirmation': (theme) =>
    createOrderConfirmationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref, date },
        cart: { products },
        financial: { total },
        shippingAddress: { line1: customField('Order', 'ShippingAddress1', 6) },
        heroHeading: { prefix: 'Order ', suffix: ' confirmed' },
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
  'shipping-update': (theme) =>
    createShippingUpdateTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref, date },
        trackingUrl: 'https://acme.example/track',
        shippingDetails: { address: customField('Order', 'ShippingAddress1', 6) },
        cart: { products },
        financial: { total },
        footer,
      },
    }),
  'abandoned-cart': (theme) =>
    createAbandonedCartTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        cart: { url: 'https://acme.example/cart', totalPrice: total, products },
        footer,
      },
    }),
  'order-cancellation': (theme) =>
    createOrderCancellationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref, date },
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
  welcome: (theme) =>
    createWelcomeTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        websiteUrl: 'https://acme.example/',
        benefits: ['Free shipping'],
        discount: { code: 'WELCOME10' },
        footer,
      },
    }),
};

describe('shopify templates render schema-valid RCML', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [templateName, render] of Object.entries(renders)) {
      it(`${templateName} — ${themeName}`, () => {
        const result = safeValidateEmailTemplate(render(theme));

        expect(result.success ? [] : result.errors).toEqual([]);
      });
    }
  }
});
