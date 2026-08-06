import { xmlToRcml, type RcmlBody, type RcmlColumn, type RcmlRaw, type RcmlSection } from '@rule/rcml';
import { createTestClient } from '../helpers/client.js';
import { testName } from '../helpers/test-data.js';

/**
 * Integration test: rc-raw HTML content survives the full XML → JSON → API → fetch round-trip.
 *
 * This test was written to verify the fix for a bug where HTML tags inside
 * <rc-raw> were silently stripped during XML parsing (fast-xml-parser treated
 * them as XML nodes rather than opaque text).
 */

const RC_RAW_XML = `
<rcml>
  <rc-head></rc-head>
  <rc-body>
    <rc-section>
      <rc-column>
        <rc-raw><div style="padding:40px 10px;border:1px solid #cfd4de;text-align:center;font-family:Lato, sans-serif;"><div style="display:inline;font-size:12px;line-height:20px;color:#3F4752;background:#ECEEF2;margin:0 auto;"><span>&lt;</span>/<span>&gt;</span></div><div style="font-size:12px;line-height:20px;color:#3F4752;">HTML block</div></div></rc-raw>
      </rc-column>
    </rc-section>
  </rc-body>
</rcml>
`.trim();

describe('EmailTemplatesClient — rc-raw HTML round-trip', () => {
  const client = createTestClient();
  const createdIds: number[] = [];

  afterAll(async () => {
    await Promise.allSettled(createdIds.map((id) => client.templates.delete(id)));
  });

  it('parses rc-raw XML with HTML tags into the { type, text } content shape', () => {
    const doc = xmlToRcml(RC_RAW_XML);
    const body = doc.children[1] as RcmlBody;
    const rawNode = (body.children[0] as RcmlSection).children[0] as RcmlColumn;
    const raw = rawNode.children[0] as RcmlRaw;

    expect(raw.tagName).toBe('rc-raw');
    expect(raw.content).toEqual(expect.objectContaining({ type: 'html' }));
    expect(raw.content?.text).toContain('<div');
    expect(raw.content?.text).toContain('HTML block');
  });

  it('creates an email template with rc-raw HTML and fetches it back intact', async () => {
    const doc = xmlToRcml(RC_RAW_XML);

    const created = await client.templates.createEmailTemplate({
      name: testName('email-rcraw'),
      content: doc,
    });

    createdIds.push(created.id);

    expect(created.id).toBeGreaterThan(0);

    const fetched = await client.templates.get(created.id);

    expect(fetched).not.toBeNull();

    const fetchedDoc = fetched!.content;
    const body = fetchedDoc.children[1] as RcmlBody;
    const rawNode = (body.children[0] as RcmlSection).children[0] as RcmlColumn;
    const raw = rawNode.children[0] as RcmlRaw;

    expect(raw.tagName).toBe('rc-raw');
    expect(raw.content).toEqual(expect.objectContaining({ type: 'html' }));
    expect(raw.content?.text).toContain('<div');
    expect(raw.content?.text).toContain('HTML block');
  });
});
