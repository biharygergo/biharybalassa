import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';

const json = async (path) => JSON.parse(await readFile(path, 'utf8'));
const { hosting, emulators } = await json('firebase.json');
const origin = `http://${emulators.hosting.host}:${emulators.hosting.port}`;
async function pages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? pages(`${dir}/${entry.name}`)
          : json(`${dir}/${entry.name}`),
      ),
    )
  ).flat();
}
const request = (path) => fetch(new URL(path, origin), { redirect: 'manual' });

test('Firebase serves every canonical page without a redirect', async () => {
  for (const page of await pages('src/content/pages')) {
    const response = await request(page.path);
    assert.equal(response.status, 200, page.path);
    assert.match(await response.text(), /<h1[\s>]/, page.path);
  }
});

test('Firebase executes all legacy 301 redirects and preserves query strings', async () => {
  for (const { source, destination } of hosting.redirects) {
    const response = await request(`${source}?ref=legacy&lang=hu`);
    assert.equal(response.status, 301, source);
    const location = new URL(response.headers.get('location'), origin);
    assert.equal(location.pathname, destination, source);
    assert.equal(location.search, '?ref=legacy&lang=hu', source);
  }
});

test('Firebase normalizes canonical slashes and keeps missing pages as real 404s', async () => {
  const response = await request('/expertise/competition');
  assert.equal(response.status, 301);
  assert.equal(
    new URL(response.headers.get('location'), origin).pathname,
    '/expertise/competition/',
  );
  for (const path of [
    ...(await json('src/data/retired-paths.json')),
    '/this-page-does-not-exist/',
  ]) {
    const missing = await request(path);
    assert.equal(missing.status, 404, path);
    assert.match(await missing.text(), /noindex/, path);
  }
  for (const path of ['/robots.txt', '/sitemap.xml', '/images/logo.png']) {
    assert.equal((await request(path)).status, 200, path);
  }
});
