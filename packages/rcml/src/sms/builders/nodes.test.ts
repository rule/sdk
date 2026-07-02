import { describe, it, expect } from 'vitest'
import { createContent, createLinkNode, createMessageNode, createUnsubscribeNodes } from './nodes.js'
import { validateSmsJson } from '../validate-sms-json.js'
import type { SmsContentJson, SmsLinkNode, SmsMessageNode, SmsPlaceholderNode } from '../content/json-validator/types.js'

describe('createMessageNode', () => {
  it('produces a message node with the given text', () => {
    expect(createMessageNode({ text: 'Hello' })).toEqual<SmsMessageNode>({
      type: 'message',
      text: 'Hello',
    })
  })

  it('preserves embedded newlines in text', () => {
    expect(createMessageNode({ text: 'Line one\nLine two' })).toEqual<SmsMessageNode>({
      type: 'message',
      text: 'Line one\nLine two',
    })
  })
})

describe('createLinkNode', () => {
  it('produces a link node with url as text and boolean attrs', () => {
    expect(
      createLinkNode({ url: 'https://example.com', track: true, shorten: true }),
    ).toEqual<SmsLinkNode>({
      type: 'link',
      text: 'https://example.com',
      attrs: { track: true, shorten: true },
    })
  })

  it('boolean flags are stored as booleans (not stringified)', () => {
    const node = createLinkNode({ url: 'https://example.com', track: false, shorten: true })

    expect(typeof node.attrs.track).toBe('boolean')
    expect(typeof node.attrs.shorten).toBe('boolean')
  })
})

describe('createContent', () => {
  it('wraps nodes in an sms document', () => {
    const content = createContent({
      nodes: [createMessageNode({ text: 'Hello' })],
    })

    expect(content).toEqual<SmsContentJson>({
      type: 'sms',
      content: [{ type: 'message', text: 'Hello' }],
    })
  })

  it('preserves multi-node order', () => {
    const content = createContent({
      nodes: [
        createMessageNode({ text: 'First' }),
        createMessageNode({ text: 'Second' }),
      ],
    })

    expect(content.content).toHaveLength(2)
    expect(content.content[0]).toMatchObject({ text: 'First' })
    expect(content.content[1]).toMatchObject({ text: 'Second' })
  })

  it('accepts an empty nodes array', () => {
    const content = createContent({ nodes: [] })

    expect(content).toEqual<SmsContentJson>({ type: 'sms', content: [] })
  })
})

describe('createUnsubscribeNodes', () => {
  it('returns exactly two nodes', () => {
    expect(createUnsubscribeNodes()).toHaveLength(2)
  })

  it('first node is the stop-word message with is-unsubscribe', () => {
    const [msg] = createUnsubscribeNodes()

    expect(msg).toEqual<SmsMessageNode>({
      type: 'message',
      text: '[Subscriber:unsubscribe_text]',
      attrs: { 'is-unsubscribe': true },
    })
  })

  it('second node is the unsubscribe Link placeholder with is-unsubscribe', () => {
    const [, placeholder] = createUnsubscribeNodes()

    expect(placeholder).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'Link',
        name: 'Unsubscribe',
        original: '[Link:Unsubscribe]',
        value: null,
        'is-unsubscribe': true,
      },
    })
  })

  it('spreads into createContent and passes validateSmsJson', () => {
    const content = createContent({
      nodes: [
        createMessageNode({ text: 'Your order has shipped.' }),
        ...createUnsubscribeNodes(),
      ],
    })

    expect(() => validateSmsJson(content)).not.toThrow()
  })
})
