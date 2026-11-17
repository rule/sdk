/**
 * Every norce template must render RCML that passes the schema validator
 * with every optional context branch populated (order confirmation twice:
 * full sections, then the inline fallbacks those sections replace), under
 * a theme with a logo, both with default placeholder social slots and with
 * all six slots configured. Add each new template to `renders`.
 */

import { describe, expect, it } from 'vitest';
import { createEmailTheme, EmailThemeImageType, safeValidateEmailTemplate } from '@rule/rcml';
import type { EmailTheme, RcmlDocument } from '@rule/rcml';
import { customField, loopValue } from '@rule/template-engine';
import { createNorceOrderConfirmationTemplate } from '../src/index.js';

const footer = { fontSize: '10px', textColor: '#666666' };
const firstName = customField('Subscriber', 'FirstName', 1);
const order = (name: string, id: number) => customField('Order', name, id);
const subscriber = (name: string, id: number) => customField('Subscriber', name, id);
const logo = [{ type: EmailThemeImageType.Logo, url: 'https://acme.example/logo.png' }];

const themes: Record<string, EmailTheme> = {
  'default theme (placeholder socials)': createEmailTheme({ brandStyleId: 1, images: logo }),
  'theme with all six socials configured': createEmailTheme({
    brandStyleId: 1,
    images: logo,
    links: [
      { type: 'facebook', url: 'https://facebook.com/acme' },
      { type: 'instagram', url: 'https://instagram.com/acme' },
      { type: 'linkedin', url: 'https://linkedin.com/company/acme' },
      { type: 'tiktok', url: 'https://tiktok.com/@acme' },
      { type: 'x', url: 'https://x.com/acme' },
      { type: 'web', url: 'https://acme.example/' },
    ],
  }),
};

const renders: Record<string, (theme: EmailTheme) => RcmlDocument> = {
  'order-confirmation (all sections)': (theme) =>
    createNorceOrderConfirmationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: {
          ref: order('OrderNumber', 2),
          date: order('OrderDate', 3),
          paymentMethod: order('PaymentMethod', 4),
        },
        cart: {
          products: {
            source: order('Products', 5),
            itemName: loopValue('Name'),
            itemSku: loopValue('PartNo'),
            itemQuantity: loopValue('QtyOrdered'),
            itemPrice: loopValue('UnitPrice'),
            itemTotal: loopValue('RowAmount'),
          },
        },
        // Norce syncs no discount/tax/shipping fields; caller-supplied refs
        // so every financial branch is rendered.
        financial: {
          subtotal: order('OrderTotalExVat', 6),
          discount: order('Discount', 13),
          tax: order('Tax', 14),
          shippingCost: order('Shipping', 15),
          total: order('OrderTotalIncVat', 7),
        },
        shippingAddress: {
          line1: subscriber('Address', 8),
          line2: subscriber('Address2', 16),
          zip: subscriber('ZipCode', 9),
          city: subscriber('City', 10),
          country: subscriber('Country', 11),
        },
        heroHeading: { prefix: 'Order ', suffix: ' confirmed' },
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
  'order-confirmation (inline fallbacks)': (theme) =>
    createNorceOrderConfirmationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref: order('OrderNumber', 2) },
        cart: { items: order('ProductNames', 12) },
        inlineShippingAddress: subscriber('Address', 8),
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
};

describe('norce templates render schema-valid RCML', () => {
  for (const [themeName, theme] of Object.entries(themes)) {
    for (const [templateName, render] of Object.entries(renders)) {
      it(`${templateName} — ${themeName}`, () => {
        const result = safeValidateEmailTemplate(render(theme));

        expect(result.success ? [] : result.errors).toEqual([]);
      });
    }
  }
});
