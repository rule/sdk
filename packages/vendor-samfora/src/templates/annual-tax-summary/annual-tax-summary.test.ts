/**
 * Unit tests for {@link createAnnualTaxSummaryTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createAnnualTaxSummaryTemplate,
  type AnnualTaxSummaryTemplateContext,
} from './annual-tax-summary.js'

function fullContext(
  overrides: Partial<AnnualTaxSummaryTemplateContext> = {},
): AnnualTaxSummaryTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    tax: {
      year: customField('Donation', 'TaxYear', 200009),
      totalLifetimeAmount: customField('Donation', 'TotalLifetime', 200008),
      taxDeductibleAmount: customField('Donation', 'TaxDeductible', 200010),
    },
    websiteUrl: 'https://samfora.org',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createAnnualTaxSummaryTemplate', () => {
  it('renders a valid RCML document with Swedish tax-summary copy', () => {
    const doc = createAnnualTaxSummaryTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('gåvosammanställning')
    expect(json).toContain('Sammanställning')
    expect(json).toContain('gåvoskatteavdrag')
    expect(json).toContain('Ladda ner kvitto')
    expect(json).toContain('[CustomField:200001]') // firstName
    expect(json).toContain('[CustomField:200009]') // year
    expect(json).toContain('[CustomField:200008]') // total
    expect(json).toContain('[CustomField:200010]') // deductible
  })

  it('omits the currency markers when tax.currency is absent', () => {
    const doc = createAnnualTaxSummaryTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('[CustomField:200006]') // would-be currency id
  })

  it('renders the currency suffix on both total and deductible rows when tax.currency is supplied', () => {
    const doc = createAnnualTaxSummaryTemplate().render({
      context: fullContext({
        tax: {
          year: customField('Donation', 'TaxYear', 200009),
          totalLifetimeAmount: customField('Donation', 'TotalLifetime', 200008),
          taxDeductibleAmount: customField('Donation', 'TaxDeductible', 200010),
          currency: customField('Donation', 'Currency', 200006),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    // Currency placeholder appears at least twice — once per gated row.
    const matches = json.match(/\[CustomField:200006\]/g) ?? []

    expect(matches.length).toBeGreaterThanOrEqual(2)
  })
})
