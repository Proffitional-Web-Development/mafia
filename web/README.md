This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Localization (EN/AR)

This project uses `next-intl` with locale-prefixed routes:

- English: `/en/...`
- Arabic: `/ar/...`

### Translation files

- `locales/en.json`
- `locales/ar.json`

Both files must keep the same key structure.

### Adding new strings

1. Add a new key in `locales/en.json`.
2. Add the same key in `locales/ar.json`.
3. Read it in UI with `useTranslations("namespace")`.
4. Do not hardcode user-facing text in components.

### Direction and RTL/LTR

- Locale direction is derived from locale via `useDirection()` in `hooks/use-direction.ts`.
- `LocaleProvider` updates page direction and syncs `document.documentElement` attributes.
- Use direction-safe styles (logical alignment / spacing) and avoid left/right-specific assumptions.

### Locale switcher

Manual switching is available via `LanguageSwitcher`, which preserves current route and swaps locale.
