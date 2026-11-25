import type { Page } from '../content/schema';
import routes from '../data/routes.json';
import copy from '../data/locales.json';
import site from '../data/site.json';
export const absolute = (path: string) => new URL(path, site.url).href;
export { serializeJsonLd } from './json-ld';
import { shouldIndex } from './indexing';
export const indexSite = shouldIndex({
  INDEX_SITE: import.meta.env.INDEX_SITE,
  DEPLOY_ENV: import.meta.env.DEPLOY_ENV,
});
const firmId = absolute('/#firm');
const firm = {
  '@type': 'LegalService',
  '@id': firmId,
  name: site.name,
  url: site.url,
  logo: absolute(site.logo),
  image: absolute(site.logo),
  telephone: site.telephone,
  email: site.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: site.address.street,
    postalCode: site.address.postalCode,
    addressLocality: site.address.city,
    addressCountry: site.address.country,
  },
};
export function structuredData(page?: Page): Record<string, unknown> {
  const graph: Record<string, unknown>[] = [firm];
  if (page?.kind === 'practice') {
    graph.push({
      '@type': 'Service',
      name: page.title,
      description: page.description,
      serviceType: page.title,
      provider: { '@id': firmId },
      areaServed: { '@type': 'City', name: site.address.city },
      url: absolute(page.path),
    });
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: site.shortName,
          item: absolute(routes[page.lang].home),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: copy[page.lang].expertise,
          item: absolute(routes[page.lang].expertise),
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: page.title,
          item: absolute(page.path),
        },
      ],
    });
  }
  if (page?.kind === 'profile')
    graph.push({
      '@type': 'Person',
      name: page.title,
      jobTitle: page.role,
      url: absolute(page.path),
      worksFor: { '@id': firmId },
      image: absolute(page.image),
    });
  if (page?.kind === 'article')
    graph.push({
      '@type': 'Article',
      headline: page.title,
      description: page.description,
      url: absolute(page.path),
      inLanguage: page.lang,
      datePublished: page.published,
      publisher: { '@id': firmId },
    });
  return { '@context': 'https://schema.org', '@graph': graph };
}
