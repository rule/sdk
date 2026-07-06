/**
 * Unit tests for {@link createFeedbackRequestTemplate}.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createFeedbackRequestTemplate,
  type FeedbackRequestTemplateContext,
} from './feedback-request.js'

function fullContext(
  overrides: Partial<FeedbackRequestTemplateContext> = {},
): FeedbackRequestTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    feedbackUrl: 'https://hotel.example.com/feedback',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createFeedbackRequestTemplate', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createFeedbackRequestTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Leave Feedback')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('https://hotel.example.com/feedback')
    expect(json).toContain('wonderful experience')
  })

  it('applies a partial copy override', () => {
    const doc = createFeedbackRequestTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Share your thoughts' },
    })
    const json = docToString(doc)

    expect(json).toContain('Share your thoughts')
    expect(json).not.toContain('Leave Feedback')
  })
})
