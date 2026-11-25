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

## Firebase Hosting

Deploy the generated static files to Firebase Hosting (not Firebase App Hosting). No Firebase browser SDK, Functions or database is needed.

```sh
npm run verify
npm run hosting:test
npm run hosting:serve
```

The Hosting emulator serves at `http://127.0.0.1:5177`. Its tests check all canonical pages, all permanent redirects with query strings, slash normalization and genuine 404 responses. It uses a demo project and needs no Firebase account.

### Connect a Firebase project

The project alias in `.firebaserc` points to `biharybalassa-99e15`. Install dependencies and sign in with `npx firebase login` (or `npx firebase login --reauth` if your session has expired). Do not run `firebase init hosting`: the Hosting configuration is already provided.

For a review deployment:

```sh
npm run deploy:preview
```

For the live Hosting channel:

```sh
INDEX_SITE=true npm run deploy
```

Indexing is disabled by default. Both `DEPLOY_ENV=production` and `INDEX_SITE=true` are required to enable it. The deployment scripts rebuild for their destination; `deploy:preview` forces indexing off even if `INDEX_SITE=true` is inherited. `.env.example` documents these settings. The canonical domain remains `https://www.biharybalassa.hu`.

### GitHub deployment

Firebase's generated GitHub integration uses two workflows:

- `firebase-hosting-merge.yml`: every push to `main`, including PR merges, verifies the build and deploys it to the live Hosting channel.
- `firebase-hosting-pull-request.yml`: same-repository pull requests get a temporary preview URL posted by Firebase's action. Forks are not given deployment credentials.

Both use the Node version in `.nvmrc`, run the content/SEO checks and Hosting emulator tests before deploying, and use the pinned Firebase CLI version. Failed checks prevent deployment. Preview builds always have indexing disabled.

Firebase's setup has configured the repository secret `FIREBASE_SERVICE_ACCOUNT_BIHARYBALASSA_99E15`; both workflows reference it for project `biharybalassa-99e15`. Never commit its service-account JSON. If this credential is rotated, update that GitHub secret.

Set the optional repository variable `INDEX_SITE=true` when the live custom domain is ready for search indexing. Live builds otherwise remain noindex. No project-ID repository variable is required.

Add the custom domain and apex-to-www redirect using Firebase Hosting's domain setup when ready to switch DNS. Firebase manages HTTPS certificates.

### Redirects

`firebase.json` is the source of permanent redirects. Each legacy path maps directly to a canonical page with status 301. Keep `trailingSlash: true` to match the site's canonical URLs. No catch-all SPA rewrite is used, so unknown URLs return the generated 404 page. `src/data/retired-paths.json` lists empty WordPress URLs that intentionally remain 404.
