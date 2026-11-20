import { indexSite, absolute } from '../lib/seo';
export function GET() {
  return new Response(
    indexSite
      ? `User-agent: *\nAllow: /\nSitemap: ${absolute('/sitemap.xml')}\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
}
