import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { pageSchema } from './content/schema';

export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/pages' }),
    schema: pageSchema,
  }),
};
