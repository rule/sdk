/**
 * Unit tests for {@link createDonationConfirmationSecondTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createDonationConfirmationSecondTemplate,
  type DonationConfirmationSecondTemplateContext,
} from './donation-confirmation-second.js'

function fullContext(
  overrides: Partial<DonationConfirmationSecondTemplateContext> = {},
): DonationConfirmationSecondTemplateContext {
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

describe('createDonationConfirmationSecondTemplate', () => {
  it('renders a valid RCML document with second-gift Swedish copy', () => {
    const doc = createDonationConfirmationSecondTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Tack för att du ger igen')
    expect(json).toContain('Det betyder mycket att du väljer att ge en gång till')
    expect(json).toContain('fortsätter göra skillnad')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200002]')
  })

  it('renders the currency suffix when donation.currency is supplied', () => {
    const doc = createDonationConfirmationSecondTemplate().render({
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
