/**
 * Unit tests for {@link createDonationConfirmationReturningTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createDonationConfirmationReturningTemplate,
  type DonationConfirmationReturningTemplateContext,
} from './donation-confirmation-returning.js'

function fullContext(
  overrides: Partial<DonationConfirmationReturningTemplateContext> = {},
): DonationConfirmationReturningTemplateContext {
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

describe('createDonationConfirmationReturningTemplate', () => {
  it('renders a valid RCML document with returning-donor Swedish copy', () => {
    const doc = createDonationConfirmationReturningTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Ännu en gåva som gör skillnad')
    expect(json).toContain('Tack för ditt fortsatta stöd')
    expect(json).toContain('vi kan fortsätta vårt arbete')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200005]')
  })
})
