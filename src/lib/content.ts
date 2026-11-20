import { getCollection } from 'astro:content';
import type { Language, Page, PageOf } from '../content/schema';
import routes from '../data/routes.json';
import copy from '../data/locales.json';

export { routes, copy };
export async function getPages(): Promise<Page[]> {
  return (await getCollection('pages')).map((entry) => entry.data);
}
export function ofKind<K extends Page['kind']>(
  pages: Page[],
  kind: K,
  lang: Language,
): PageOf<K>[] {
  return pages.filter(
    (page): page is PageOf<K> => page.kind === kind && page.lang === lang,
  );
}
export function practicesFor(pages: Page[], lang: Language) {
  return ofKind(pages, 'practice', lang).sort((a, b) => a.order - b.order);
}
export function articlesFor(pages: Page[], lang: Language) {
  return ofKind(pages, 'article', lang).sort((a, b) =>
    b.published.localeCompare(a.published),
  );
}
export function formatDate(date: string, lang: Language) {
  return new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
export function plainText(blocks: import('../content/schema').Block[]) {
  return blocks.flatMap((block) =>
    block.type === 'list'
      ? block.items.map((item) => item.map((run) => run.text).join(''))
      : [block.content.map((run) => run.text).join('')],
  );
}
