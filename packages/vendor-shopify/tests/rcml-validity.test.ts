/**
 * Every shopify template must render RCML that passes the schema
 * validator with every optional context branch populated (order
 * confirmation twice: full sections, then the inline fallbacks those
 * sections replace), under a theme with a logo, both with default
 * placeholder social slots and with all six slots configured (so the
 * `website` slot's `web` name is exercised).
 */

import { describe, expect, it } from 'vitest';
import { createEmailTheme, EmailThemeImageType, safeValidateEmailTemplate } from '@rule/rcml';
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

const cf = (name: string, id: number) => customField('Order', name, id);
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
      { type: 'website', url: 'https://acme.example/' },
    ],
  }),
};

const financial = {
  subtotal: cf('Subtotal', 10),
  discount: cf('Discount', 11),
  tax: cf('TotalTax', 12),
  shippingCost: cf('ShippingCost', 13),
  total,
};

const renders: Record<string, (theme: EmailTheme) => RcmlDocument> = {
  'order-confirmation (all sections)': (theme) =>
    createOrderConfirmationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref, date, paymentMethod: cf('Gateway', 14) },
        cart: { products: { ...products, itemTotal: loopValue('total') } },
        financial,
        shippingAddress: {
          line1: cf('ShippingAddress1', 6),
          line2: cf('ShippingAddress2', 15),
          zip: cf('ShippingZip', 16),
          city: cf('ShippingCity', 17),
          country: cf('ShippingCountryCode', 18),
        },
        heroHeading: { prefix: 'Order ', suffix: ' confirmed' },
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
  'order-confirmation (inline fallbacks)': (theme) =>
    createOrderConfirmationTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref },
        cart: { items: cf('Names', 19) },
        inlineShippingAddress: cf('ShippingAddress1', 6),
        websiteUrl: 'https://acme.example/',
        footer,
      },
    }),
  'shipping-update': (theme) =>
    createShippingUpdateTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        order: { ref, date, paymentMethod: cf('Gateway', 14), customerEmail: cf('Email', 20) },
        trackingUrl: 'https://acme.example/track',
        status: {
          steps: [
            { label: 'Ordered', bg: '#05CC87', fg: '#ffffff', width: '33%' },
            { label: 'Shipped', bg: '#05CC87', fg: '#ffffff', width: '33%' },
            { label: 'Delivered', bg: '#eeeeee', fg: '#333333', width: '34%' },
          ],
        },
        seller: { company: cf('Company', 21), vatNumber: cf('VatNumber', 22) },
        shippingDetails: {
          address: cf('ShippingAddress1', 6),
          carrier: cf('Carrier', 23),
          tracking: cf('TrackingNumber', 24),
          estimatedDelivery: cf('EstimatedDelivery', 25),
        },
        cart: { products: { ...products, itemTotal: loopValue('total') } },
        financial,
        buyer: { fullName: cf('FullName', 26), billingAddress: cf('BillingAddress', 27) },
        legal: {
          text: 'Terms apply.',
          returnPolicy: { linkText: 'Returns', linkHref: 'https://acme.example/returns' },
          terms: { linkText: 'Terms', linkHref: 'https://acme.example/terms' },
        },
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
        support: { linkText: 'Contact us', linkHref: 'https://acme.example/support' },
        footer,
      },
    }),
  welcome: (theme) =>
    createWelcomeTemplate().render({
      theme,
      context: {
        recipient: { firstName },
        websiteUrl: 'https://acme.example/',
        benefits: ['Free shipping', 'Early access'],
        discount: { code: 'WELCOME10' },
        closing: 'See you soon!',
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
