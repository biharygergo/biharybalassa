import { writeFile } from 'node:fs/promises';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import site from './src/data/site.json' with { type: 'json' };
import redirects from './src/data/redirects.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    {
      name: 'cloudflare-redirects',
      hooks: {
        'astro:build:done': async ({ dir }) => {
          await writeFile(
            new URL('_redirects', dir),
            redirects.map(({ from, to }) => `${from} ${to} 301`).join('\n') +
              '\n',
          );
        },
      },
    },
  ],
});
