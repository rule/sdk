# Brand Styles

Brand styles define your visual identity in emails — logo, colours, fonts, and social links. The RCML template builders use brand styles to produce consistently branded emails without you specifying design values in every template.

You can manage brand styles through the API or in the Rule.io UI under **Settings → Brand**.

## Finding the account's default brand style

Use `resolvePreferredBrandStyle()` from `@rule/sdk` — it returns the style flagged `isDefault` on the account, falling back to the first in the list if none is marked default. Do not hardcode brand style IDs; a customer's preferred style can change:

```typescript
import { resolvePreferredBrandStyle } from '@rule/sdk';

const { id: brandStyleId, brandStyle, source } =
  await resolvePreferredBrandStyle(client);

if (source === 'fallback') {
  console.warn('No default brand style set — using first in list');
}
```

If you need to target a specific style (e.g. from an environment variable), pass it as the second argument:

```typescript
const { id } = await resolvePreferredBrandStyle(client, 12345);
```

## Listing brand styles

Returns a summary array. Use `get()` to fetch full details (colours, fonts, links, images) for a specific style.

```typescript
const styles = await client.brandStyles.list();
const defaultStyle = styles.find((s) => s.isDefault);
```

## Fetching a brand style

Returns the full style including all nested collections. Returns `null` if the ID does not exist.

```typescript
const style = await client.brandStyles.get(brandStyleId);
if (style) {
  console.log(style.name, style.isDefault);
  console.log(style.colours, style.fonts, style.links, style.images);
}
```

## Auto-detecting brand from your domain

Rule.io can infer brand colours and logo from a live website. This is the quickest way to create a first brand style.

Returns 409 if a brand style for this domain already exists, 424 if the domain could not be fetched.

```typescript
const style = await client.brandStyles.createFromDomain({ domain: 'example.com' });
const brandStyleId = style.id;
```

*→ [`CreateBrandStyleFromDomainPayload`](/api/client/src/interfaces/CreateBrandStyleFromDomainPayload)*

## Creating a brand style manually

Specify each visual element explicitly. `name` is required; all other fields are optional.

```typescript
const style = await client.brandStyles.createManually({
  name: 'Acme Brand',
  colours: [
    { type: 'brand',  hex: '#0066CC', brightness: 40 },
    { type: 'accent', hex: '#FF5500', brightness: 60 },
    { type: 'dark',   hex: '#1A1A1A', brightness: 10 },
  ],
  fonts: [
    { type: 'title', name: 'Helvetica', origin: 'system' },
    { type: 'body',  name: 'Arial',     origin: 'system' },
  ],
  links: [
    { type: 'website',  link: 'https://example.com' },
    { type: 'linkedin', link: 'https://linkedin.com/company/example' },
  ],
});
const brandStyleId = style.id;
```

Valid colour types: `'accent'`, `'dark'`, `'light'`, `'brand'`, `'side'`.

*→ [`CreateBrandStylePayload`](/api/client/src/interfaces/CreateBrandStylePayload)*

## Updating a brand style

`update()` is a PATCH — only the fields you provide are changed:

```typescript
await client.brandStyles.update(brandStyleId, {
  name: 'Acme Brand v2',
  colours: [
    { type: 'accent', hex: '#003399', brightness: 30 },
  ],
});
```

*→ [`UpdateBrandStylePayload`](/api/client/src/interfaces/UpdateBrandStylePayload)*

## Deleting a brand style

At least one brand style must exist on the account at all times. Deletion fails with 403 if this is the last one — create a replacement first.

```typescript
await client.brandStyles.delete(brandStyleId);
```

## Next steps

- Pass `brandStyleId` to the RCML template builders: [@rule/rcml documentation](/packages/rcml/)
- Build a complete campaign email: [Email Campaigns](./email-campaigns)
