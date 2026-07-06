/**
 * Unit tests for {@link createDonationConfirmationFirstTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createDonationConfirmationFirstTemplate,
  type DonationConfirmationFirstTemplateContext,
} from './donation-confirmation-first.js'

function fullContext(
  overrides: Partial<DonationConfirmationFirstTemplateContext> = {},
): DonationConfirmationFirstTemplateContext {
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

describe('createDonationConfirmationFirstTemplate', () => {
  it('renders a valid RCML document with first-gift Swedish copy', () => {
    const doc = createDonationConfirmationFirstTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Tack för din första gåva')
    expect(json).toContain('Gåvans detaljer')
    expect(json).toContain('Varmt välkommen till Samfora')
    expect(json).toContain('[CustomField:200001]') // firstName
    expect(json).toContain('[CustomField:200002]') // amount
    expect(json).toContain('[CustomField:200003]') // date
    expect(json).toContain('[CustomField:200004]') // ref
    expect(json).toContain('[CustomField:200005]') // causeName
  })

  it('omits the currency suffix when donation.currency is absent', () => {
    const doc = createDonationConfirmationFirstTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    // amountRow renders, amountRowWithCurrency does not.
    expect(json).toContain('Belopp: ')
    expect(json).not.toContain('[CustomField:200006]') // would-be currency id
  })

  it('renders the currency suffix when donation.currency is supplied', () => {
    const doc = createDonationConfirmationFirstTemplate().render({
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

  it('renders Swedish footer link text', () => {
    const doc = createDonationConfirmationFirstTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Öppna i webbläsare')
    expect(json).toContain('Avregistrera')
  })

  it('applies a partial copy override', () => {
    const doc = createDonationConfirmationFirstTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'View account' },
    })
    const json = docToString(doc)

    expect(json).toContain('View account')
    expect(json).not.toContain('Se mitt konto')
  })
})
