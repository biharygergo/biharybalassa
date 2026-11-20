# Bihary Balassa

Static law firm website built with Astro, TypeScript and small React islands using Radix UI. Content is stored in Git in Hungarian, English and German. Production needs no CMS, database or server runtime.

## Development

Use the Node version in `.nvmrc` (22.23.5).

```sh
npm ci
npm run dev
```

`npm run verify` checks formatting, types, the production build, content relationships, rendered SEO metadata, links, anchors, image assets, indexing safeguards and permanent redirects. GitHub Actions runs the checks for production and preview settings. Use `npm run format` after editing.

## Content and design

- `src/content/pages/{hu,en,de}/`: page content and metadata. Each page type has a schema in `src/content/schema.ts`. Rich text uses paragraph, heading and list blocks with explicit links and emphasis.
- `src/data/site.json`: shared contact details, canonical domain and brand assets.
- `src/data/routes.json`: navigation routes by language. English slugs are shared, with `/en/` and `/de/` prefixes for translations.
- `src/data/locales.json`: interface labels.
- `src/templates/`: templates for each page type.
- `src/components/`: shared components, including accessible Radix navigation, language selection and practice accordions. Animations respect reduced-motion preferences.
- `src/styles/`: base styles, page layouts and interactive components.
- `public/images/`: the logo, Tibor’s painting and current team photographs.

For a new page, add a JSON file with a unique trailing-slash `path`, appropriate `kind`, title, SEO title, description and reciprocal `alternates`. Add articles with their original publication date. Historical articles retain their original context; they should not be treated as current legal guidance.

## Cloudflare Pages

Connect the private repository. Build command: `npm run build`. Output directory: `dist`. Node version: `22.23.5`. No adapter or runtime secrets are required.

Indexing is disabled by default. Set `INDEX_SITE=true` for the live production build. On Cloudflare, indexing is additionally restricted to `CF_PAGES_BRANCH=main`, or the branch named by `PRODUCTION_BRANCH`. Preview builds remain noindex and disallow crawling. `.env.example` documents the local defaults.

`src/data/redirects.json` is the permanent redirect source. The build writes Cloudflare’s `dist/_redirects`; Astro preview does not execute these rules. Add redirects when changing an existing URL, pointing directly to a canonical page. `src/data/retired-paths.json` lists obsolete empty WordPress URLs that intentionally return 404.

Before switching the domain, configure HTTPS and apex-to-www redirects in Cloudflare, verify redirects on the deployed preview and confirm the production contact details and translations with the firm. The canonical domain is `https://www.biharybalassa.hu`. Sitemap and robots files are generated from the final content and build environment.
