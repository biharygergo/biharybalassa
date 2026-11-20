import { getPages } from '../lib/content';
import { absolute } from '../lib/seo';
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export async function GET() {
  const pages = await getPages();
  const urls = pages
    .map(
      (page) =>
        `<url><loc>${escape(absolute(page.path))}</loc>${Object.entries(
          page.alternates,
        )
          .map(
            ([lang, path]) =>
              `<xhtml:link rel="alternate" hreflang="${lang}" href="${escape(absolute(path!))}"/>`,
          )
          .join('')}</url>`,
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
