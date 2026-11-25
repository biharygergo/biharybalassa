import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react()],
});
