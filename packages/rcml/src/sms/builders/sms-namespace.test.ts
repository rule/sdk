import { describe, it, expect } from 'vitest'
import { sms } from './sms-namespace.js'
import { createContent, createLinkNode, createMessageNode, createUnsubscribeNodes } from './nodes.js'
import {
  createCustomFieldPlaceholder,
  createDatePlaceholder,
  createPlaceholderNode,
  createRemoteContentPlaceholder,
  createSubscriberPlaceholder,
  createUserPlaceholder,
} from './placeholders.js'
import { createSmsDocument } from '../create-sms-document.js'
import { jsonToSmsRfm } from '../json-to-sms-rfm.js'

describe('sms namespace identity', () => {
  it('exposes every builder as a property pointing at the underlying function', () => {
    // Nodes
    expect(sms.createContent).toBe(createContent)
    expect(sms.createMessageNode).toBe(createMessageNode)
    expect(sms.createLinkNode).toBe(createLinkNode)
    expect(sms.createUnsubscribeNodes).toBe(createUnsubscribeNodes)

    // Placeholders
    expect(sms.createPlaceholderNode).toBe(createPlaceholderNode)
    expect(sms.createSubscriberPlaceholder).toBe(createSubscriberPlaceholder)
    expect(sms.createUserPlaceholder).toBe(createUserPlaceholder)
    expect(sms.createCustomFieldPlaceholder).toBe(createCustomFieldPlaceholder)
    expect(sms.createDatePlaceholder).toBe(createDatePlaceholder)
    expect(sms.createRemoteContentPlaceholder).toBe(createRemoteContentPlaceholder)
  })

  it('exposes exactly the documented set of keys (no orphan exports)', () => {
    expect(Object.keys(sms).sort()).toEqual([
      'createContent',
      'createCustomFieldPlaceholder',
      'createDatePlaceholder',
      'createLinkNode',
      'createMessageNode',
      'createPlaceholderNode',
      'createRemoteContentPlaceholder',
      'createSubscriberPlaceholder',
      'createUnsubscribeNodes',
      'createUserPlaceholder',
    ])
  })
})

describe('sms namespace through createSmsDocument', () => {
  it('builds a complete document and round-trips cleanly', () => {
    const content = sms.createContent({
      nodes: [
        sms.createMessageNode({ text: 'Hi ' }),
        sms.createSubscriberPlaceholder({ field: 'email' }),
        sms.createMessageNode({ text: ', your order ' }),
        sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Id' }),
        sms.createMessageNode({ text: ' has shipped.\n' }),
        sms.createLinkNode({ url: 'https://example.com/orders/[CustomField:Order.Id]', track: true, shorten: true }),
        ...sms.createUnsubscribeNodes(),
      ],
    })

    // Document factory accepts the builder output without throwing.
    const doc = createSmsDocument({ content })

    expect(doc.tagName).toBe('rc-sms')
    expect(doc.content).toBe(content)

    // Serializing the result back to SMS RFM produces a well-formed string
    // exercising every node kind we built.
    const rfm = jsonToSmsRfm(content)

    expect(rfm).toContain('[Subscriber:email]')
    expect(rfm).toContain('[CustomField:Order.Id]')
    expect(rfm).toContain('::unsubscribe')
    expect(rfm).toContain(':link[https://example.com/orders/[CustomField:Order.Id]]{track="true" shorten="true"}')
  })
})
