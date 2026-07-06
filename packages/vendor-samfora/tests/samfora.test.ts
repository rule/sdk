/**
 * Samfora Vendor Preset Tests
 */

import { describe, it, expect } from 'vitest';
import { VendorPresetError } from '@rule/vendor';
import type { CustomFieldMap, VendorConsumerConfig } from '@rule/vendor';
import type { RcmlDocument } from '@rule/rcml';
import { samforaPreset, SAMFORA_FIELDS, SAMFORA_TAGS } from '../src/index.js';
import { TEST_THEME, themeWithoutLogo, assertValidRCMLDocument, docToString } from './helpers.js';

// ============================================================================
// Shared fixtures
// ============================================================================

/**
 * Every field `validateConfig` requires. This set guarantees that every
 * automation returned by `getAutomations(TEST_CONFIG)` is buildable.
 */
const TEST_CUSTOM_FIELDS: CustomFieldMap = {
  [SAMFORA_FIELDS.donorFirstName]: 200001,
  [SAMFORA_FIELDS.donationAmount]: 200002,
  [SAMFORA_FIELDS.donationDate]: 200003,
  [SAMFORA_FIELDS.donationRef]: 200004,
  [SAMFORA_FIELDS.causeName]: 200005,
  [SAMFORA_FIELDS.totalLifetimeAmount]: 200008,
  [SAMFORA_FIELDS.taxYear]: 200009,
  [SAMFORA_FIELDS.taxDeductibleAmount]: 200010,
};

/** Optional fields (currency display + donation type). */
const TEST_CUSTOM_FIELDS_WITH_OPTIONAL: CustomFieldMap = {
  ...TEST_CUSTOM_FIELDS,
  [SAMFORA_FIELDS.donationCurrency]: 200006,
  [SAMFORA_FIELDS.donationType]: 200007,
};

const TEST_CONFIG: VendorConsumerConfig = {
  theme: TEST_THEME,
  customFields: TEST_CUSTOM_FIELDS,
  websiteUrl: 'https://samfora.org',
};

const TEST_CONFIG_WITH_OPTIONAL: VendorConsumerConfig = {
  theme: TEST_THEME,
  customFields: TEST_CUSTOM_FIELDS_WITH_OPTIONAL,
  websiteUrl: 'https://samfora.org',
};

// ============================================================================
// Preset metadata
// ============================================================================

describe('samforaPreset', () => {
  it('has correct vendor metadata', () => {
    expect(samforaPreset.vendor).toBe('samfora');
    expect(samforaPreset.displayName).toBe('Samfora');
    expect(samforaPreset.vertical).toBe('donation');
  });

  it('exposes field and tag schemas', () => {
    expect(samforaPreset.fields).toBe(SAMFORA_FIELDS);
    expect(samforaPreset.tags).toBe(SAMFORA_TAGS);
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validateConfig', () => {
    it('passes with all required fields', () => {
      expect(() => samforaPreset.validateConfig(TEST_CONFIG)).not.toThrow();
    });

    it('throws VendorPresetError when any required field is missing', () => {
      const incomplete: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {
          [SAMFORA_FIELDS.donorFirstName]: 200001,
        },
      };

      expect(() => samforaPreset.validateConfig(incomplete)).toThrow(VendorPresetError);
    });

    it('error message lists the missing fields', () => {
      const empty: VendorConsumerConfig = { ...TEST_CONFIG, customFields: {} };

      expect(() => samforaPreset.validateConfig(empty)).toThrow(
        /samforaPreset.*donorFirstName/,
      );
    });

    it('requires tax-summary fields so every returned automation is buildable', () => {
      const withoutTaxFields: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {
          [SAMFORA_FIELDS.donorFirstName]: 200001,
          [SAMFORA_FIELDS.donationAmount]: 200002,
          [SAMFORA_FIELDS.donationDate]: 200003,
          [SAMFORA_FIELDS.donationRef]: 200004,
          [SAMFORA_FIELDS.causeName]: 200005,
        },
      };

      expect(() => samforaPreset.validateConfig(withoutTaxFields)).toThrow(
        /taxYear|totalLifetimeAmount|taxDeductibleAmount/,
      );
    });

    it('does not require the optional currency / donationType fields', () => {
      // TEST_CONFIG omits donationCurrency and donationType — still passes.
      expect(() => samforaPreset.validateConfig(TEST_CONFIG)).not.toThrow();
    });
  });

  // ==========================================================================
  // getRequiredFields
  // ==========================================================================

  describe('getRequiredFields', () => {
    it('returns the core required fields with descriptions', () => {
      const fields = samforaPreset.getRequiredFields();

      expect(fields.length).toBeGreaterThan(0);

      for (const field of fields) {
        expect(field.logicalName).toBeTruthy();
        expect(field.fieldName).toBeTruthy();
        expect(field.description).toBeTruthy();
        expect(
          SAMFORA_FIELDS[field.logicalName as keyof typeof SAMFORA_FIELDS],
        ).toBe(field.fieldName);
      }
    });

    it('includes every field each automation needs to build', () => {
      const logicalNames = samforaPreset.getRequiredFields().map((f) => f.logicalName);

      // Core fields referenced by the confirmation / monthly flows.
      expect(logicalNames).toContain('donorFirstName');
      expect(logicalNames).toContain('donationAmount');
      expect(logicalNames).toContain('donationDate');
      expect(logicalNames).toContain('donationRef');
      expect(logicalNames).toContain('causeName');
      // Tax-summary fields — also required so `getAutomations()` never hands
      // back a tax-summary automation that can't build.
      expect(logicalNames).toContain('totalLifetimeAmount');
      expect(logicalNames).toContain('taxYear');
      expect(logicalNames).toContain('taxDeductibleAmount');
    });

    it('excludes the optional donation and subscriber-extension fields', () => {
      const logicalNames = samforaPreset.getRequiredFields().map((f) => f.logicalName);

      // Donation fields the preset's templates don't reference.
      expect(logicalNames).not.toContain('donationCurrency');
      expect(logicalNames).not.toContain('donationType');
      // Standard Subscriber fields the preset exposes for consumer
      // extensions but doesn't itself render.
      expect(logicalNames).not.toContain('donorLastName');
      expect(logicalNames).not.toContain('donorAddress1');
      expect(logicalNames).not.toContain('donorAddress2');
      expect(logicalNames).not.toContain('donorZipcode');
      expect(logicalNames).not.toContain('donorCity');
      expect(logicalNames).not.toContain('donorCountry');
      expect(logicalNames).not.toContain('donorPhone');
      expect(logicalNames).not.toContain('donorSource');
    });
  });

  // ==========================================================================
  // getAutomations
  // ==========================================================================

  describe('getAutomations', () => {
    it('returns 6 automations', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);

      expect(automations).toHaveLength(6);
    });

    it('returns automations with unique IDs', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const ids = automations.map((a) => a.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('all automations have trigger tags from SAMFORA_TAGS', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const validTags = new Set<string>(Object.values(SAMFORA_TAGS));

      for (const automation of automations) {
        expect(validTags.has(automation.triggerTag)).toBe(true);
      }
    });

    it('the three confirmation variants share a trigger but differ by condition', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const confirmations = automations.filter(
        (a) => a.triggerTag === SAMFORA_TAGS.donationReceived,
      );

      expect(confirmations).toHaveLength(3);

      const conditionSignatures = confirmations.map((a) =>
        JSON.stringify(a.conditions ?? {}),
      );

      expect(new Set(conditionSignatures).size).toBe(3);

      const ids = confirmations.map((a) => a.id);

      expect(ids).toContain('samfora-donation-confirmation-first');
      expect(ids).toContain('samfora-donation-confirmation-second');
      expect(ids).toContain('samfora-donation-confirmation-returning');
    });

    it('confirmation variants gate on donor-lifecycle tags', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;
      const second = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-second',
      )!;
      const returning = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-returning',
      )!;

      expect(first.conditions?.hasTag).toEqual([SAMFORA_TAGS.donorFirstGift]);
      expect(second.conditions?.hasTag).toEqual([SAMFORA_TAGS.donorSecondGift]);
      expect(returning.conditions?.hasTag).toEqual([SAMFORA_TAGS.donorReturning]);
    });

    it('all automations produce valid RCML documents with required fields only', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);

      for (const automation of automations) {
        const doc = automation.templateBuilder({
          theme: TEST_THEME,
          customFields: TEST_CUSTOM_FIELDS,
          websiteUrl: 'https://samfora.org',
        }) as unknown as RcmlDocument;

        assertValidRCMLDocument(doc);
      }
    });

    it('all automations also render with the optional currency / type fields', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG_WITH_OPTIONAL);

      for (const automation of automations) {
        const doc = automation.templateBuilder({
          theme: TEST_THEME,
          customFields: TEST_CUSTOM_FIELDS_WITH_OPTIONAL,
          websiteUrl: 'https://samfora.org',
        }) as unknown as RcmlDocument;

        assertValidRCMLDocument(doc);
      }
    });

    // Note: the tax-summary builder retains an internal `validateCustomFields`
    // call as a defensive backstop, but it's no longer reachable through the
    // resolved `templateBuilder` — `resolveVendorAutomations` merges the outer
    // config's customFields with any override, so required fields always
    // resolve. The upstream `validateConfig` gate is now the only path where
    // missing fields surface, which is covered by the validateConfig tests.

    it('templateBuilder honors TemplateConfigV2 overrides', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      const doc = first.templateBuilder({
        theme: TEST_THEME,
        customFields: {
          ...TEST_CUSTOM_FIELDS,
          [SAMFORA_FIELDS.donationAmount]: 999999,
        },
        websiteUrl: 'https://override.example.com',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      expect(json).toContain('[CustomField:999999]');
      expect(json).not.toContain('[CustomField:200002]');
    });

    it('RCML contains Samfora field placeholders', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      const doc = first.templateBuilder({
        theme: TEST_THEME,
        customFields: TEST_CUSTOM_FIELDS,
        websiteUrl: 'https://samfora.org',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      expect(json).toContain('[CustomField:200001]'); // donorFirstName
      expect(json).toContain('[CustomField:200002]'); // donationAmount
      expect(json).toContain('[CustomField:200005]'); // causeName
    });

    it('every automation leads with the brand logo section', () => {
      // Parity with bookzen/shopify: the logo must be the first body child
      // when the brand style has a logoUrl. Earlier versions silently
      // omitted it, so rendered emails had no header image.
      const automations = samforaPreset.getAutomations(TEST_CONFIG);

      for (const automation of automations) {
        const doc = automation.templateBuilder({
          theme: TEST_THEME,
          customFields: TEST_CUSTOM_FIELDS,
          websiteUrl: 'https://samfora.org',
        }) as unknown as RcmlDocument;
        // The RCML body is the second top-level child (after rc-head).
        const body = doc.children[1];

        expect(body.tagName).toBe('rc-body');
        const firstBodyChild = body.children[0];

        // rc-logo nests inside rc-section > rc-column > rc-logo.
        expect(firstBodyChild.tagName).toBe('rc-section');
        const firstColumn = (firstBodyChild as { children: { tagName: string; children?: { tagName: string }[] }[] }).children[0];

        expect(firstColumn.tagName).toBe('rc-column');
        expect(firstColumn.children?.[0].tagName).toBe('rc-logo');
      }
    });

    it('omits the logo section when the theme has no logo image', () => {
      const noLogo = themeWithoutLogo();
      const automations = samforaPreset.getAutomations({
        ...TEST_CONFIG,
        theme: noLogo,
      });
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      const doc = first.templateBuilder({
        theme: noLogo,
        customFields: TEST_CUSTOM_FIELDS,
        websiteUrl: 'https://samfora.org',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      expect(json).not.toContain('"tagName":"rc-logo"');
    });

    it('default copy is in Swedish', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      expect(first.subject).toContain('Tack');
      const doc = first.templateBuilder({
        theme: TEST_THEME,
        customFields: TEST_CUSTOM_FIELDS,
        websiteUrl: 'https://samfora.org',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      expect(json).toContain('Tack för din första gåva');
      expect(json).toContain('Ändamål');
    });

    it('footer defaults to Swedish when config.footer is omitted', () => {
      const automations = samforaPreset.getAutomations(TEST_CONFIG);
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      const doc = first.templateBuilder({
        theme: TEST_THEME,
        customFields: TEST_CUSTOM_FIELDS,
        websiteUrl: 'https://samfora.org',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      // Swedish footer link text (display strings, not merge-tag names).
      expect(json).toContain('"text":"Öppna i webbläsare"');
      expect(json).toContain('"text":"Avregistrera"');
      // Guard against the generic builder's English display defaults
      // leaking through. (`[Link:Unsubscribe]` merge-tag references are
      // NOT user-visible — Rule.io substitutes them at send time.)
      expect(json).not.toContain('"text":"View in browser"');
      expect(json).not.toContain('"text":"Unsubscribe"');
      // Plain-text fallback is localised too.
      expect(json).toContain('Öppna e-postmeddelandet i webbläsaren');
      expect(json).not.toContain('View this email in your browser');
    });

    it('consumer footer overrides still win over Swedish defaults', () => {
      const automations = samforaPreset.getAutomations({
        ...TEST_CONFIG,
        footer: { viewInBrowserText: 'Open in browser' },
      });
      const first = automations.find(
        (a) => a.id === 'samfora-donation-confirmation-first',
      )!;

      const doc = first.templateBuilder({
        theme: TEST_THEME,
        customFields: TEST_CUSTOM_FIELDS,
        websiteUrl: 'https://samfora.org',
      }) as unknown as RcmlDocument;
      const json = docToString(doc);

      // Override of one field wins; untouched fields fall back to Swedish.
      expect(json).toContain('"text":"Open in browser"');
      expect(json).not.toContain('"text":"Öppna i webbläsare"');
      expect(json).toContain('"text":"Avregistrera"');
    });

    it('throws VendorPresetError for an incomplete config', () => {
      expect(() =>
        samforaPreset.getAutomations({ ...TEST_CONFIG, customFields: {} }),
      ).toThrow(VendorPresetError);
    });
  });

  // ==========================================================================
  // getAutomation
  // ==========================================================================

  describe('getAutomation', () => {
    it('returns a single automation by ID', () => {
      const automation = samforaPreset.getAutomation(
        'samfora-welcome',
        TEST_CONFIG,
      );

      expect(automation).toBeDefined();
      expect(automation!.id).toBe('samfora-welcome');
    });

    it('returns undefined for an unknown ID', () => {
      const automation = samforaPreset.getAutomation('nonexistent', TEST_CONFIG);

      expect(automation).toBeUndefined();
    });
  });
});

// ============================================================================
// Field and tag constants
// ============================================================================

describe('SAMFORA_FIELDS', () => {
  it('all values are non-empty strings', () => {
    for (const value of Object.values(SAMFORA_FIELDS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('splits fields between the flat Subscriber group and the historical Donation group', () => {
    // Rule.io praxis: donor identity on the flat Subscriber.* group
    // (overwritten per sync); per-donation event data on the historical
    // Donation.* group (appended per sync).
    const subscriberFields = [
      SAMFORA_FIELDS.donorFirstName,
      SAMFORA_FIELDS.donorLastName,
      SAMFORA_FIELDS.donorAddress1,
      SAMFORA_FIELDS.donorAddress2,
      SAMFORA_FIELDS.donorZipcode,
      SAMFORA_FIELDS.donorCity,
      SAMFORA_FIELDS.donorCountry,
      SAMFORA_FIELDS.donorPhone,
      SAMFORA_FIELDS.donorSource,
    ];

    for (const value of subscriberFields) {
      expect(value.startsWith('Subscriber.')).toBe(true);
    }

    const donationFields = [
      SAMFORA_FIELDS.donationAmount,
      SAMFORA_FIELDS.donationCurrency,
      SAMFORA_FIELDS.donationDate,
      SAMFORA_FIELDS.donationRef,
      SAMFORA_FIELDS.causeName,
      SAMFORA_FIELDS.donationType,
      SAMFORA_FIELDS.totalLifetimeAmount,
      SAMFORA_FIELDS.taxYear,
      SAMFORA_FIELDS.taxDeductibleAmount,
    ];

    for (const value of donationFields) {
      expect(value.startsWith('Donation.')).toBe(true);
    }
  });

  it('uses Rule.io standard Subscriber field names exactly', () => {
    // These must match Rule.io's pre-seeded standard subscriber field
    // names so consumers don't have to create new custom fields.
    expect(SAMFORA_FIELDS.donorFirstName).toBe('Subscriber.FirstName');
    expect(SAMFORA_FIELDS.donorLastName).toBe('Subscriber.LastName');
    expect(SAMFORA_FIELDS.donorAddress1).toBe('Subscriber.Address1');
    expect(SAMFORA_FIELDS.donorAddress2).toBe('Subscriber.Address2');
    expect(SAMFORA_FIELDS.donorZipcode).toBe('Subscriber.Zipcode');
    expect(SAMFORA_FIELDS.donorCity).toBe('Subscriber.City');
    expect(SAMFORA_FIELDS.donorCountry).toBe('Subscriber.Country');
    expect(SAMFORA_FIELDS.donorPhone).toBe('Subscriber.Number');
    expect(SAMFORA_FIELDS.donorSource).toBe('Subscriber.Source');
  });

  it('every field uses either a Subscriber.* or Donation.* prefix', () => {
    for (const value of Object.values(SAMFORA_FIELDS)) {
      expect(/^(Subscriber|Donation)\./.test(value)).toBe(true);
    }
  });
});

describe('SAMFORA_TAGS', () => {
  it('all values are non-empty strings', () => {
    for (const value of Object.values(SAMFORA_TAGS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('all values are unique', () => {
    const values = Object.values(SAMFORA_TAGS);

    expect(new Set(values).size).toBe(values.length);
  });
});
