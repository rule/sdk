/**
 * Samfora Automation Definitions
 *
 * Swedish charitable-donation automations for the Samfora platform.
 * Each automation assembles its RCML body inline from local helper
 * factories and hands it to `applyTheme` so the consumer's
 * {@link EmailTheme} decorates the head (brand-style id, fonts,
 * social links, colour palette).
 *
 * Default copy ships in Swedish to match Samfora's market. Consumers can
 * still override any field value via the merged `TemplateConfigV2`.
 */

import { randomUUID } from 'node:crypto';
import type { CustomFieldMap, FooterConfig } from '@rule/vendor';
import { VendorPresetError } from '@rule/vendor';
import type { EmailTheme } from '@rule/rcml';
import type { VendorAutomation, VendorConsumerConfig } from '@rule/vendor';
import type {
  Json,
  RcmlBodyChild,
  RcmlButton,
  RcmlDocument,
  RcmlHead,
  RcmlHeading,
  RcmlSection,
  RcmlText,
} from '@rule/rcml';
import { applyTheme } from '@rule/rcml';
import { SAMFORA_FIELDS } from './fields.js';
import { SAMFORA_TAGS } from './tags.js';

// ============================================================================
// Swedish copy fixtures
// ============================================================================

interface DonationConfirmationText {
  readonly preheader: string;
  readonly heading: string;
  readonly intro: string;
  readonly detailsHeading: string;
  readonly amountLabel: string;
  readonly causeLabel: string;
  readonly dateLabel: string;
  readonly referenceLabel: string;
  readonly ctaButton: string;
  readonly signOff: string;
}

const DONATION_CONFIRMATION_FIRST_TEXT: DonationConfirmationText = {
  preheader: 'Tack för din första gåva!',
  heading: 'Tack för din första gåva',
  intro:
    'Din gåva har tagits emot. 100 % av beloppet går direkt till det ändamål du har valt.',
  detailsHeading: 'Gåvans detaljer',
  amountLabel: 'Belopp',
  causeLabel: 'Ändamål',
  dateLabel: 'Datum',
  referenceLabel: 'Referens',
  ctaButton: 'Se mitt konto',
  signOff: 'Varmt välkommen till Samfora — vi är glada att ha dig med oss.',
} as const;

const DONATION_CONFIRMATION_SECOND_TEXT: DonationConfirmationText = {
  preheader: 'Tack för att du ger igen!',
  heading: 'Tack för att du ger igen',
  intro:
    'Det betyder mycket att du väljer att ge en gång till. Din gåva är mottagen och går oavkortat till det ändamål du valt.',
  detailsHeading: 'Gåvans detaljer',
  amountLabel: 'Belopp',
  causeLabel: 'Ändamål',
  dateLabel: 'Datum',
  referenceLabel: 'Referens',
  ctaButton: 'Se mitt konto',
  signOff: 'Tack för att du fortsätter göra skillnad.',
} as const;

const DONATION_CONFIRMATION_RETURNING_TEXT: DonationConfirmationText = {
  preheader: 'Ännu en gåva som gör skillnad',
  heading: 'Ännu en gåva som gör skillnad',
  intro:
    'Tack för ditt fortsatta stöd. Din gåva har mottagits och går direkt till det ändamål du valt.',
  detailsHeading: 'Gåvans detaljer',
  amountLabel: 'Belopp',
  causeLabel: 'Ändamål',
  dateLabel: 'Datum',
  referenceLabel: 'Referens',
  ctaButton: 'Se mitt konto',
  signOff: 'Det är tack vare givare som du som vi kan fortsätta vårt arbete.',
} as const;

const MONTHLY_DONATION_TEXT = {
  preheader: 'Din månadsgåva är mottagen',
  heading: 'Månadsgåva mottagen',
  intro:
    'Din månadsgåva har dragits och skickats vidare till det ändamål du har valt. Tack för att du ger regelbundet.',
  detailsHeading: 'Gåvans detaljer',
  amountLabel: 'Belopp',
  causeLabel: 'Ändamål',
  dateLabel: 'Dragningsdatum',
  referenceLabel: 'Referens',
  ctaButton: 'Hantera månadsgåva',
  signOff: 'Tack för att du är månadsgivare hos Samfora.',
} as const;

const WELCOME_TEXT = {
  preheader: 'Välkommen till Samfora',
  heading: 'Välkommen till Samfora',
  intro:
    'Kul att du är här! Samfora är ditt konto för ditt givande — samla dina gåvor, följ dina ändamål och bidra till en värld som mår bättre.',
  listHeading: 'Så här kommer du igång',
  stepOne: 'Välj ett ändamål som berör dig.',
  stepTwo: 'Ge en engångsgåva eller starta ett månadsgivande.',
  stepThree: 'Följ effekten av ditt givande från ditt konto.',
  ctaButton: 'Utforska ändamål',
  signOff: 'Varmt välkommen — vi ses på plattformen.',
} as const;

const TAX_SUMMARY_TEXT = {
  preheader: 'Din gåvosammanställning för skatteavdrag',
  heading: 'Din gåvosammanställning',
  intro:
    'Här är en sammanställning av dina gåvor under året. Du kan använda den för att göra skatteavdrag för gåvor i din deklaration.',
  detailsHeading: 'Sammanställning',
  yearLabel: 'Skatteår',
  totalLabel: 'Totalt givet',
  deductibleLabel: 'Avdragsgillt belopp',
  ctaButton: 'Ladda ner kvitto',
  disclaimer:
    'Vi rapporterar dina gåvor till Skatteverket enligt gällande regler för gåvoskatteavdrag.',
  signOff: 'Tack för ditt engagemang under året.',
} as const;

// ============================================================================
// Local RCML helpers — terse replacements for the retired brand-template
// builders. They encode the same `rc-class` / layout conventions the Rule.io
// editor expects so the generated documents keep rendering identically
// once `applyTheme` fills in the head from `config.theme`.
// ============================================================================

function genId(): string {
  return randomUUID();
}

interface PlaceholderNode {
  type: 'placeholder';
  attrs: {
    type: 'CustomField';
    value: number;
    name: string;
    original: string;
    'max-length': string | null;
  };
}
interface TextNode {
  type: 'text';
  text: string;
}
type InlineNode = TextNode | PlaceholderNode;

function textNode(text: string): TextNode {
  return { type: 'text', text };
}

function placeholder(fieldName: string, fieldId: number): PlaceholderNode {
  return {
    type: 'placeholder',
    attrs: {
      type: 'CustomField',
      value: fieldId,
      name: fieldName,
      original: `[CustomField:${String(fieldId)}]`,
      'max-length': null,
    },
  };
}

function docWithNodes(nodes: readonly InlineNode[]): Json {
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [...nodes] }],
  } as unknown as Json;
}

function brandHeading(content: Json, level: 1 | 2 | 3 | 4): RcmlHeading {
  return {
    tagName: 'rc-heading',
    id: genId(),
    attributes: { 'rc-class': `rcml-h${String(level)}-style` },
    content,
  };
}

function brandText(
  content: Json,
  options?: { align?: 'left' | 'center' | 'right'; padding?: string }
): RcmlText {
  return {
    tagName: 'rc-text',
    id: genId(),
    attributes: {
      'rc-class': 'rcml-p-style',
      ...(options?.align !== undefined && { align: options.align }),
      ...(options?.padding !== undefined && { padding: options.padding }),
    },
    content,
  };
}

function brandButton(content: Json, href: string): RcmlButton {
  return {
    tagName: 'rc-button',
    id: genId(),
    attributes: {
      href,
      align: 'center',
      border: 'none',
      'border-radius': '8px',
      'inner-padding': '10px 16px',
      padding: '0 0 20px 0',
      'text-align': 'center',
      'vertical-align': 'middle',
      'rc-class': 'rcml-label-style',
    },
    content,
  };
}

function contentSection(children: readonly (RcmlHeading | RcmlText | RcmlButton)[]): RcmlSection {
  return {
    tagName: 'rc-section',
    id: genId(),
    attributes: { padding: '20px 0' },
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [...children],
      },
    ],
  } as unknown as RcmlSection;
}

function logoSection(logoUrl: string): RcmlSection {
  return {
    tagName: 'rc-section',
    id: genId(),
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [
          {
            tagName: 'rc-logo',
            id: genId(),
            attributes: {
              'rc-class': 'rcml-logo-style rc-initial-logo',
              src: logoUrl,
              width: '96px',
              padding: '20px 0',
            },
          },
        ],
      },
    ],
  } as unknown as RcmlSection;
}

function footerSection(config: FooterConfig): RcmlSection {
  const viewText = config.viewInBrowserText ?? 'View in browser';
  const unsubText = config.unsubscribeText ?? 'Unsubscribe';
  const textColor = config.textColor ?? '#666666';
  const fontSize = config.fontSize ?? '10px';

  return {
    tagName: 'rc-section',
    id: genId(),
    attributes: { padding: '20px 0px 20px 0px' },
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [
          {
            tagName: 'rc-text',
            id: genId(),
            attributes: {
              align: 'center',
              padding: '0px 0px 10px 0px',
              'rc-class': 'rcml-p-style',
            },
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: viewText,
                      marks: [
                        {
                          type: 'font',
                          attrs: {
                            'font-size': fontSize,
                            'text-decoration': 'underline',
                            color: textColor,
                          },
                        },
                        {
                          type: 'link',
                          attrs: {
                            href: '[Link:WebBrowser]',
                            target: '_blank',
                            'no-tracked': 'true',
                          },
                        },
                      ],
                    },
                    { type: 'text', text: ' ' },
                    {
                      type: 'text',
                      text: '|',
                      marks: [
                        { type: 'font', attrs: { 'font-size': fontSize, color: textColor } },
                      ],
                    },
                    { type: 'text', text: ' ' },
                    {
                      type: 'text',
                      text: unsubText,
                      marks: [
                        {
                          type: 'font',
                          attrs: {
                            'font-size': fontSize,
                            'text-decoration': 'underline',
                            color: textColor,
                          },
                        },
                        {
                          type: 'link',
                          attrs: {
                            href: '[Link:Unsubscribe]',
                            target: '_blank',
                            'no-tracked': 'true',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            tagName: 'rc-text',
            id: genId(),
            attributes: {
              align: 'center',
              padding: '10px 0px 0px 0px',
              'font-family': "'Helvetica', sans-serif",
              'font-style': 'normal',
              'line-height': '120%',
              'letter-spacing': '0em',
              color: textColor,
              'font-weight': '400',
              'text-decoration': 'none',
              'font-size': fontSize,
            },
            content: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Certified by Rule' }] },
              ],
            },
          },
        ],
      },
    ],
  } as unknown as RcmlSection;
}

/**
 * Require every `fieldNames` logical→rule-io mapping to be present in
 * `customFields`. Throws `VendorPresetError` listing the missing entries.
 */
function validateRequiredFields(
  customFields: CustomFieldMap,
  fieldNames: Record<string, string | undefined>,
  templateName: string,
): void {
  const missing: string[] = [];

  for (const [logical, fieldName] of Object.entries(fieldNames)) {
    if (fieldName === undefined || customFields[fieldName] === undefined) {
      missing.push(logical);
    }
  }

  if (missing.length > 0) {
    throw new VendorPresetError(
      `${templateName}: missing customFields entries for ${missing.join(', ')}`,
    );
  }
}

/**
 * Wrap the built body in an `<rcml>` document and run `applyTheme` so the
 * head gets populated (brand-style id, fonts, social links, colour
 * palette) from `theme`. The optional preheader is prepended to the head
 * as an `<rc-preview>` that survives `applyTheme`'s overlay.
 */
function buildThemedDocument(
  theme: EmailTheme,
  sections: readonly RcmlBodyChild[],
  preheader?: string,
  plainText?: string,
): RcmlDocument {
  const head: RcmlHead = {
    tagName: 'rc-head',
    id: genId(),
    children: [
      ...(preheader !== undefined
        ? ([{ tagName: 'rc-preview', id: genId(), content: preheader }] as RcmlHead['children'])
        : []),
      ...(plainText !== undefined
        ? ([
            {
              tagName: 'rc-plain-text',
              id: genId(),
              content: { type: 'text', text: plainText },
            },
          ] as RcmlHead['children'])
        : []),
    ],
  };

  const baseDoc: RcmlDocument = {
    tagName: 'rcml',
    id: genId(),
    children: [
      head,
      { tagName: 'rc-body', id: genId(), children: [...sections] },
    ],
  };

  return applyTheme(baseDoc, theme);
}

// ============================================================================
// Placeholder helper
// ============================================================================

/**
 * Look up a placeholder for a field name, throwing if it isn't mapped.
 * Callers should pre-validate with {@link validateRequiredFields}; this is
 * a defensive backstop so the non-null assertion doesn't appear inline.
 */
function fieldPlaceholder(customFields: CustomFieldMap, fieldName: string): PlaceholderNode {
  const id = customFields[fieldName];

  if (id === undefined) {
    throw new VendorPresetError(
      `samfora: missing customFields entry for "${fieldName}"`,
    );
  }

  return placeholder(fieldName, id);
}

// ============================================================================
// Footer (Swedish defaults)
// ============================================================================

/**
 * Swedish footer text defaults. Without these, an out-of-the-box Samfora
 * email mixes Swedish body copy with English footer links, which conflicts
 * with the preset's stated Swedish-first intent.
 *
 * Consumer overrides still win per-field because `config.footer` is
 * spread after the defaults.
 */
const SAMFORA_FOOTER_DEFAULTS: FooterConfig = {
  viewInBrowserText: 'Öppna i webbläsare',
  unsubscribeText: 'Avregistrera',
};

function samforaFooterSection(override: FooterConfig | undefined): RcmlBodyChild {
  return footerSection({ ...SAMFORA_FOOTER_DEFAULTS, ...override });
}

/**
 * Produce a zero-or-one-element array with the brand logo as the first
 * body section.
 */
function samforaLogoSection(logoUrl: string | undefined): RcmlBodyChild[] {
  return logoUrl !== undefined && logoUrl !== '' ? [logoSection(logoUrl)] : [];
}

/**
 * Swedish plain-text fallback.
 */
const SAMFORA_PLAIN_TEXT =
  'Öppna e-postmeddelandet i webbläsaren: %Link:WebBrowser%\n\n---\nAvregistrera: %Link:Unsubscribe%';

// ============================================================================
// Shared section builders
// ============================================================================

/**
 * Build a labelled summary row (label on one line, value placeholder below).
 * Kept simple for readability — one row renders as two short paragraphs.
 */
function summaryRow(label: string, valueContent: Json): RcmlBodyChild {
  return contentSection([
    brandText(docWithNodes([textNode(label)]), { padding: '8px 0 2px 0' }),
    brandText(valueContent, { padding: '0 0 8px 0' }),
  ]);
}

function greetingSection(greeting: string, firstNameId: number): RcmlBodyChild {
  return contentSection([
    brandHeading(
      docWithNodes([
        textNode(`${greeting}, `),
        placeholder(SAMFORA_FIELDS.donorFirstName, firstNameId),
      ]),
      1,
    ),
  ]);
}

function paragraphSection(text: string): RcmlBodyChild {
  return contentSection([brandText(docWithNodes([textNode(text)]))]);
}

function ctaSection(label: string, href: string): RcmlBodyChild {
  return contentSection([brandButton(docWithNodes([textNode(label)]), href)]);
}

// ============================================================================
// Template builders
// ============================================================================

function buildDonationConfirmationTemplate(
  config: VendorConsumerConfig,
  text: DonationConfirmationText,
): RcmlDocument {
  validateRequiredFields(
    config.customFields,
    {
      donorFirstName: SAMFORA_FIELDS.donorFirstName,
      donationAmount: SAMFORA_FIELDS.donationAmount,
      donationDate: SAMFORA_FIELDS.donationDate,
      donationRef: SAMFORA_FIELDS.donationRef,
      causeName: SAMFORA_FIELDS.causeName,
    },
    'samforaDonationConfirmation',
  );

  const cf = config.customFields;
  const firstNameId = cf[SAMFORA_FIELDS.donorFirstName]!;

  const sections: RcmlBodyChild[] = [
    ...samforaLogoSection(config.theme.images.logo?.url),
    greetingSection(text.heading, firstNameId),
    paragraphSection(text.intro),
    contentSection([brandHeading(docWithNodes([textNode(text.detailsHeading)]), 3)]),
    summaryRow(
      text.amountLabel,
      docWithNodes([
        fieldPlaceholder(cf, SAMFORA_FIELDS.donationAmount),
        ...(cf[SAMFORA_FIELDS.donationCurrency] !== undefined
          ? [textNode(' '), fieldPlaceholder(cf, SAMFORA_FIELDS.donationCurrency)]
          : []),
      ]),
    ),
    summaryRow(text.causeLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.causeName)])),
    summaryRow(text.dateLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.donationDate)])),
    summaryRow(
      text.referenceLabel,
      docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.donationRef)]),
    ),
    ctaSection(text.ctaButton, config.websiteUrl),
    paragraphSection(text.signOff),
    samforaFooterSection(config.footer),
  ];

  return buildThemedDocument(config.theme, sections, text.preheader, SAMFORA_PLAIN_TEXT);
}

function buildMonthlyDonationTemplate(config: VendorConsumerConfig): RcmlDocument {
  validateRequiredFields(
    config.customFields,
    {
      donorFirstName: SAMFORA_FIELDS.donorFirstName,
      donationAmount: SAMFORA_FIELDS.donationAmount,
      donationDate: SAMFORA_FIELDS.donationDate,
      donationRef: SAMFORA_FIELDS.donationRef,
      causeName: SAMFORA_FIELDS.causeName,
    },
    'samforaMonthlyDonation',
  );

  const cf = config.customFields;
  const firstNameId = cf[SAMFORA_FIELDS.donorFirstName]!;
  const t = MONTHLY_DONATION_TEXT;

  const sections: RcmlBodyChild[] = [
    ...samforaLogoSection(config.theme.images.logo?.url),
    greetingSection(t.heading, firstNameId),
    paragraphSection(t.intro),
    contentSection([brandHeading(docWithNodes([textNode(t.detailsHeading)]), 3)]),
    summaryRow(
      t.amountLabel,
      docWithNodes([
        fieldPlaceholder(cf, SAMFORA_FIELDS.donationAmount),
        ...(cf[SAMFORA_FIELDS.donationCurrency] !== undefined
          ? [textNode(' '), fieldPlaceholder(cf, SAMFORA_FIELDS.donationCurrency)]
          : []),
      ]),
    ),
    summaryRow(t.causeLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.causeName)])),
    summaryRow(t.dateLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.donationDate)])),
    summaryRow(t.referenceLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.donationRef)])),
    ctaSection(t.ctaButton, config.websiteUrl),
    paragraphSection(t.signOff),
    samforaFooterSection(config.footer),
  ];

  return buildThemedDocument(config.theme, sections, t.preheader, SAMFORA_PLAIN_TEXT);
}

function buildWelcomeTemplate(config: VendorConsumerConfig): RcmlDocument {
  validateRequiredFields(
    config.customFields,
    { donorFirstName: SAMFORA_FIELDS.donorFirstName },
    'samforaWelcome',
  );

  const firstNameId = config.customFields[SAMFORA_FIELDS.donorFirstName]!;
  const t = WELCOME_TEXT;

  const sections: RcmlBodyChild[] = [
    ...samforaLogoSection(config.theme.images.logo?.url),
    greetingSection(t.heading, firstNameId),
    paragraphSection(t.intro),
    contentSection([
      brandHeading(docWithNodes([textNode(t.listHeading)]), 3),
      brandText(docWithNodes([textNode(`1. ${t.stepOne}`)])),
      brandText(docWithNodes([textNode(`2. ${t.stepTwo}`)])),
      brandText(docWithNodes([textNode(`3. ${t.stepThree}`)])),
    ]),
    ctaSection(t.ctaButton, config.websiteUrl),
    paragraphSection(t.signOff),
    samforaFooterSection(config.footer),
  ];

  return buildThemedDocument(config.theme, sections, t.preheader, SAMFORA_PLAIN_TEXT);
}

function buildTaxSummaryTemplate(config: VendorConsumerConfig): RcmlDocument {
  validateRequiredFields(
    config.customFields,
    {
      donorFirstName: SAMFORA_FIELDS.donorFirstName,
      taxYear: SAMFORA_FIELDS.taxYear,
      totalLifetimeAmount: SAMFORA_FIELDS.totalLifetimeAmount,
      taxDeductibleAmount: SAMFORA_FIELDS.taxDeductibleAmount,
    },
    'samforaTaxSummary',
  );

  const cf = config.customFields;
  const firstNameId = cf[SAMFORA_FIELDS.donorFirstName]!;
  const t = TAX_SUMMARY_TEXT;

  const sections: RcmlBodyChild[] = [
    ...samforaLogoSection(config.theme.images.logo?.url),
    greetingSection(t.heading, firstNameId),
    paragraphSection(t.intro),
    contentSection([brandHeading(docWithNodes([textNode(t.detailsHeading)]), 3)]),
    summaryRow(t.yearLabel, docWithNodes([fieldPlaceholder(cf, SAMFORA_FIELDS.taxYear)])),
    summaryRow(
      t.totalLabel,
      docWithNodes([
        fieldPlaceholder(cf, SAMFORA_FIELDS.totalLifetimeAmount),
        ...(cf[SAMFORA_FIELDS.donationCurrency] !== undefined
          ? [textNode(' '), fieldPlaceholder(cf, SAMFORA_FIELDS.donationCurrency)]
          : []),
      ]),
    ),
    summaryRow(
      t.deductibleLabel,
      docWithNodes([
        fieldPlaceholder(cf, SAMFORA_FIELDS.taxDeductibleAmount),
        ...(cf[SAMFORA_FIELDS.donationCurrency] !== undefined
          ? [textNode(' '), fieldPlaceholder(cf, SAMFORA_FIELDS.donationCurrency)]
          : []),
      ]),
    ),
    paragraphSection(t.disclaimer),
    ctaSection(t.ctaButton, config.websiteUrl),
    paragraphSection(t.signOff),
    samforaFooterSection(config.footer),
  ];

  return buildThemedDocument(config.theme, sections, t.preheader, SAMFORA_PLAIN_TEXT);
}

// ============================================================================
// Automation definitions
// ============================================================================

/**
 * Create the full set of Samfora automation definitions.
 *
 * Three donation-confirmation variants are differentiated by
 * `conditions.hasTag` against donor-lifecycle tags — same pattern as
 * `shopify-abandoned-cart` uses `conditions.notHasTag`.
 */
export function createSamforaAutomations(): VendorAutomation[] {
  return [
    {
      id: 'samfora-donation-confirmation-first',
      name: 'Samfora Donation Confirmation (first gift)',
      description:
        'Sent to first-time donors after a one-time donation is received',
      triggerTag: SAMFORA_TAGS.donationReceived,
      conditions: { hasTag: [SAMFORA_TAGS.donorFirstGift] },
      subject: 'Tack för din första gåva!',
      preheader: DONATION_CONFIRMATION_FIRST_TEXT.preheader,
      templateBuilder: (config) =>
        buildDonationConfirmationTemplate(config, DONATION_CONFIRMATION_FIRST_TEXT),
    },
    {
      id: 'samfora-donation-confirmation-second',
      name: 'Samfora Donation Confirmation (second gift)',
      description:
        'Sent to returning donors making their second one-time donation',
      triggerTag: SAMFORA_TAGS.donationReceived,
      conditions: { hasTag: [SAMFORA_TAGS.donorSecondGift] },
      subject: 'Tack för att du ger igen!',
      preheader: DONATION_CONFIRMATION_SECOND_TEXT.preheader,
      templateBuilder: (config) =>
        buildDonationConfirmationTemplate(config, DONATION_CONFIRMATION_SECOND_TEXT),
    },
    {
      id: 'samfora-donation-confirmation-returning',
      name: 'Samfora Donation Confirmation (returning donor)',
      description:
        'Sent to loyal donors on their third or later one-time donation',
      triggerTag: SAMFORA_TAGS.donationReceived,
      conditions: { hasTag: [SAMFORA_TAGS.donorReturning] },
      subject: 'Tack för din gåva',
      preheader: DONATION_CONFIRMATION_RETURNING_TEXT.preheader,
      templateBuilder: (config) =>
        buildDonationConfirmationTemplate(
          config,
          DONATION_CONFIRMATION_RETURNING_TEXT,
        ),
    },
    {
      id: 'samfora-monthly-donation-confirmation',
      name: 'Samfora Monthly Donation Confirmation',
      description: 'Sent when a scheduled monthly donation is processed',
      triggerTag: SAMFORA_TAGS.monthlyDonation,
      subject: 'Månadsgåva mottagen',
      preheader: MONTHLY_DONATION_TEXT.preheader,
      templateBuilder: buildMonthlyDonationTemplate,
    },
    {
      id: 'samfora-welcome',
      name: 'Samfora Welcome',
      description: 'Sent when a new donor creates a Samfora account',
      triggerTag: SAMFORA_TAGS.newDonor,
      subject: 'Välkommen till Samfora',
      preheader: WELCOME_TEXT.preheader,
      templateBuilder: buildWelcomeTemplate,
    },
    {
      id: 'samfora-annual-tax-summary',
      name: 'Samfora Annual Tax Summary',
      description:
        'Year-end summary of donations for Swedish gåvoskatteavdrag reporting',
      triggerTag: SAMFORA_TAGS.annualTaxSummary,
      subject: 'Din gåvosammanställning',
      preheader: TAX_SUMMARY_TEXT.preheader,
      templateBuilder: buildTaxSummaryTemplate,
    },
  ];
}
