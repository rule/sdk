/**
 * Unit tests for {@link createReservationCancellationTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  TEST_THEME_WITH_SOCIALS,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createReservationCancellationTemplate,
  type ReservationCancellationTemplateContext,
} from './reservation-cancellation.js'

function fullContext(
  overrides: Partial<ReservationCancellationTemplateContext> = {},
): ReservationCancellationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    reservation: {
      bookingRef: customField('Reservation', 'BookingRef', 200100),
    },
    websiteUrl: 'https://hotel.example.com',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createReservationCancellationTemplate', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createReservationCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Reservation Cancelled')
    expect(json).toContain('Book Again')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200100]')
    expect(json).toContain('https://hotel.example.com')
  })

  it('applies a partial copy override', () => {
    const doc = createReservationCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Find another stay' },
    })
    const json = docToString(doc)

    expect(json).toContain('Find another stay')
    expect(json).not.toContain('Book Again')
  })

  it('renders the social section from theme.links', () => {
    const doc = createReservationCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createReservationCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
