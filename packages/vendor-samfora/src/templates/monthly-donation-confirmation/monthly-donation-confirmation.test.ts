/**
 * Unit tests for {@link createMonthlyDonationConfirmationTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createMonthlyDonationConfirmationTemplate,
  type MonthlyDonationConfirmationTemplateContext,
} from './monthly-donation-confirmation.js'

function fullContext(
  overrides: Partial<MonthlyDonationConfirmationTemplateContext> = {},
): MonthlyDonationConfirmationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    donation: {
      amount: customField('Donation', 'Amount', 200002),
      date: customField('Donation', 'Date', 200003),
      ref: customField('Donation', 'Reference', 200004),
      causeName: customField('Donation', 'CauseName', 200005),
    },
    websiteUrl: 'https://samfora.org',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createMonthlyDonationConfirmationTemplate', () => {
  it('renders a valid RCML document with monthly-giver Swedish copy', () => {
    const doc = createMonthlyDonationConfirmationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Månadsgåva mottagen')
    expect(json).toContain('Din månadsgåva har dragits')
    expect(json).toContain('Hantera månadsgåva')
    expect(json).toContain('Dragningsdatum')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200002]')
  })

  it('renders the currency suffix when donation.currency is supplied', () => {
    const doc = createMonthlyDonationConfirmationTemplate().render({
      context: fullContext({
        donation: {
          amount: customField('Donation', 'Amount', 200002),
          currency: customField('Donation', 'Currency', 200006),
          date: customField('Donation', 'Date', 200003),
          ref: customField('Donation', 'Reference', 200004),
          causeName: customField('Donation', 'CauseName', 200005),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200006]')
  })
})
