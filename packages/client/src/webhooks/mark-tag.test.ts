import { describe, expect, it } from 'vitest';

import { RuleClientError } from '../errors.js';
import { markTagDirection } from './mark-tag.js';
import type { SubscriberTagChangedEvent, WebhookEvent } from './types.js';

const TAG_CHANGED: SubscriberTagChangedEvent = {
  type: 'subscriber.tag-changed',
  tag: { id: 111111, name: 'tag-name' },
  subscriber: { id: 222222, email: 'jane@example.com', phoneNumber: '+46705555555' },
};

describe('markTagDirection', () => {
  it("returns subscriber.added-to-tag when direction is 'added'", () => {
    const event = markTagDirection(TAG_CHANGED, 'added');

    expect(event).toEqual({
      type: 'subscriber.added-to-tag',
      tag: TAG_CHANGED.tag,
      subscriber: TAG_CHANGED.subscriber,
    });
  });

  it("returns subscriber.removed-from-tag when direction is 'removed'", () => {
    const event = markTagDirection(TAG_CHANGED, 'removed');

    expect(event).toEqual({
      type: 'subscriber.removed-from-tag',
      tag: TAG_CHANGED.tag,
      subscriber: TAG_CHANGED.subscriber,
    });
  });

  it('preserves the original tag and subscriber objects by reference', () => {
    const event = markTagDirection(TAG_CHANGED, 'added');

    expect(event.tag).toBe(TAG_CHANGED.tag);
    expect(event.subscriber).toBe(TAG_CHANGED.subscriber);
  });

  it('throws RuleClientError for any non-tag-changed event', () => {
    const optedIn: WebhookEvent = {
      type: 'subscriber.opted-in',
      subscriber: { id: 1 },
    };

    expect(() =>
      markTagDirection(optedIn as unknown as SubscriberTagChangedEvent, 'added'),
    ).toThrow(RuleClientError);
    expect(() =>
      markTagDirection(optedIn as unknown as SubscriberTagChangedEvent, 'added'),
    ).toThrow(/subscriber\.opted-in/);
  });
});
