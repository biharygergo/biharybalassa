import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { test } from 'node:test';
import { parse } from 'parse5';
import { pageSchema } from '../src/content/schema.ts';
import { serializeJsonLd } from '../src/lib/json-ld.ts';
import { shouldIndex } from '../src/lib/indexing.ts';

const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(`${dir}/${entry.name}`)
          : `${dir}/${entry.name}`,
      ),
    )
  ).flat();
}
const pages = await Promise.all((await files('src/content/pages')).map(json));
const byPath = new Map(pages.map((page) => [page.path, page]));
const redirects = await json('src/data/redirects.json');
const site = await json('src/data/site.json');
const origin = new URL(site.url).origin;
const nodes = (node) => [node, ...(node.childNodes || []).flatMap(nodes)];
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
const text = (node) => node.value || (node.childNodes || []).map(text).join('');
const htmlPath = (path) => `dist${path}index.html`;
const docs = new Map(
  await Promise.all(
    pages.map(async (page) => [
      page.path,
      nodes(parse(await readFile(htmlPath(page.path), 'utf8'))),
    ]),
  ),
);

test('content conforms to each page type and language links are reciprocal', () => {
  assert.equal(byPath.size, pages.length);
  for (const page of pages) {
    pageSchema.parse(page);
    assert.equal(page.alternates[page.lang], page.path);
    for (const [lang, path] of Object.entries(page.alternates)) {
      const translated = byPath.get(path);
      assert.ok(translated, `${page.path}: missing ${path}`);
      assert.equal(translated.lang, lang);
      assert.equal(translated.alternates[page.lang], page.path);
      assert.equal(translated.kind, page.kind);
    }
    for (const path of page.relatedPeople || page.home?.founders.paths || []) {
      assert.equal(
        byPath.get(path)?.kind,
        'profile',
        `${page.path}: missing person ${path}`,
      );
    }
  }
});

test('JSON-LD escapes HTML without changing its values', () => {
  const value = {
    title: '</script><script>alert("test")</script>',
    name: 'Ágnes & Tibor',
  };
  const serialized = serializeJsonLd(value);
  assert.ok(!serialized.includes('<'));
  assert.deepEqual(JSON.parse(serialized), value);
});

test('only explicitly enabled production builds can be indexed', () => {
  assert.equal(shouldIndex({}), false);
  assert.equal(shouldIndex({ INDEX_SITE: 'true' }), true);
  assert.equal(
    shouldIndex({
      INDEX_SITE: 'false',
      CF_PAGES: '1',
      CF_PAGES_BRANCH: 'main',
    }),
    false,
  );
  assert.equal(
    shouldIndex({
      INDEX_SITE: 'true',
      CF_PAGES: '1',
      CF_PAGES_BRANCH: 'preview',
    }),
    false,
  );
  assert.equal(
    shouldIndex({ INDEX_SITE: 'true', CF_PAGES: '1', CF_PAGES_BRANCH: 'main' }),
    true,
  );
  assert.equal(
    shouldIndex({
      INDEX_SITE: 'true',
      CF_PAGES: '1',
      CF_PAGES_BRANCH: 'release',
      PRODUCTION_BRANCH: 'release',
    }),
    true,
  );
});

test('built pages have one H1, accurate metadata, languages and valid structured data', () => {
  const expectedIndex = process.env.EXPECT_INDEX === 'true';
  for (const page of pages) {
    const all = docs.get(page.path);
    const select = (tag, name, value) =>
      all.filter(
        (n) => n.tagName === tag && (!name || attr(n, name) === value),
      );
    assert.equal(select('h1').length, 1, page.path);
    assert.equal(select('title').length, 1, page.path);
    assert.equal(
      text(select('title')[0]),
      `${page.seoTitle} | ${site.shortName}`,
      page.path,
    );
    assert.equal(
      attr(select('meta', 'name', 'description')[0], 'content'),
      page.description,
      page.path,
    );
    assert.equal(
      attr(select('link', 'rel', 'canonical')[0], 'href'),
      new URL(page.path, origin).href,
      page.path,
    );
    assert.equal(attr(select('html')[0], 'lang'), page.lang, page.path);
    assert.equal(
      attr(select('meta', 'name', 'robots')[0], 'content').includes('noindex'),
      !expectedIndex,
      page.path,
    );
    for (const [lang, path] of Object.entries(page.alternates)) {
      assert.ok(
        select('link', 'hreflang', lang).some(
          (n) => attr(n, 'href') === new URL(path, origin).href,
        ),
        page.path,
      );
    }
    const graph = JSON.parse(
      text(select('script', 'type', 'application/ld+json')[0]),
    )['@graph'];
    assert.ok(
      graph.some((n) => n['@type'] === 'LegalService'),
      page.path,
    );
    const type = { practice: 'Service', article: 'Article', profile: 'Person' }[
      page.kind
    ];
    if (type)
      assert.ok(
        graph.some((n) => n['@type'] === type),
        page.path,
      );
  }
});

test('all rendered local links, anchors and image assets resolve', async () => {
  for (const [path, all] of docs) {
    for (const node of all) {
      const link =
        node.tagName === 'a'
          ? attr(node, 'href')
          : node.tagName === 'img'
            ? attr(node, 'src')
            : null;
      if (!link || /^(mailto:|tel:)/.test(link)) continue;
      const url = new URL(link, new URL(path, origin));
      if (url.origin !== origin) continue;
      if (byPath.has(url.pathname)) {
        if (url.hash)
          assert.ok(
            docs
              .get(url.pathname)
              .some(
                (n) => attr(n, 'id') === decodeURIComponent(url.hash.slice(1)),
              ),
            `${path}: missing anchor ${link}`,
          );
      } else {
        assert.ok(
          (
            await stat(`dist${decodeURIComponent(url.pathname)}`).catch(
              () => null,
            )
          )?.isFile(),
          `${path}: broken ${link}`,
        );
      }
    }
  }
});

test('permanent redirects have no loops, chains or canonical collisions', async () => {
  assert.equal(new Set(redirects.map((r) => r.from)).size, redirects.length);
  for (const rule of redirects) {
    assert.ok(
      !byPath.has(rule.from),
      `Canonical redirect collision: ${rule.from}`,
    );
    assert.ok(byPath.has(rule.to), `Unknown destination: ${rule.to}`);
    assert.notEqual(rule.from, rule.to);
  }
  const output = await readFile('dist/_redirects', 'utf8');
  assert.equal(
    output,
    redirects.map(({ from, to }) => `${from} ${to} 301`).join('\n') + '\n',
  );
  for (const path of await json('src/data/retired-paths.json'))
    assert.ok(!byPath.has(path) && !redirects.some((r) => r.from === path));
});

test('sitemap includes all canonical pages and robots follows indexing setting', async () => {
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(
    new Set(urls),
    new Set(pages.map((p) => new URL(p.path, origin).href)),
  );
  const robots = await readFile('dist/robots.txt', 'utf8');
  assert.equal(
    robots.includes('Disallow: /'),
    process.env.EXPECT_INDEX !== 'true',
  );
});

test('editorial regressions: continuous biographies, real lists and valid email domains', () => {
  const biography = byPath.get('/people/daniel-kurcz/').body;
  assert.equal(biography.length, 1);
  assert.match(
    biography[0].content.map((span) => span.text).join(''),
    /Állam- és Jogtudományi Karán/,
  );
  for (const page of pages) {
    const visit = (value) => {
      if (typeof value === 'string') {
        assert.ok(!/[\r\n\t]/.test(value), `${page.path}: imported line break`);
        assert.ok(
          !value.includes('biharybalasssa.hu'),
          `${page.path}: misspelled email domain`,
        );
      } else if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object')
        Object.values(value).forEach(visit);
    };
    visit(page);
    if (page.path.endsWith('/careers/')) {
      assert.equal(page.body.filter((b) => b.type === 'list').length, 2);
      assert.ok(!JSON.stringify(page.body).includes('II.'));
    }
    if (page.kind === 'profile' || page.kind === 'article')
      assert.notEqual(page.body[0].type, 'heading', page.path);
  }
});
