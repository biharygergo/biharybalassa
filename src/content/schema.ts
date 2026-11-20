import { z } from 'zod';

export const languages = ['hu', 'en', 'de'] as const;
export type Language = (typeof languages)[number];
const path = z
  .string()
  .regex(/^\/(?:[a-z0-9-]+\/)*$/, 'Use an absolute, trailing-slash path');
const href = z
  .string()
  .refine(
    (value) => /^(?:\/(?!\/)|https?:\/\/|mailto:|tel:|#)/.test(value),
    'Unsupported link URL',
  );
const inline = z.object({
  text: z.string(),
  href: href.optional(),
  strong: z.boolean().optional(),
  emphasis: z.boolean().optional(),
});
export const block = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), content: z.array(inline).min(1) }),
  z.object({ type: z.literal('heading'), content: z.array(inline).min(1) }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.array(inline).min(1)).min(1),
  }),
]);
export type Inline = z.infer<typeof inline>;
export type Block = z.infer<typeof block>;
const body = z.array(block).min(1);
const image = z.string().regex(/^\/images\/.+\.(?:webp|png|jpe?g)$/);
const common = z.object({
  path,
  lang: z.enum(languages),
  title: z.string().min(1),
  seoTitle: z.string().min(1),
  description: z.string().min(1),
  alternates: z.partialRecord(z.enum(languages), path),
});
const fields = common.shape;
export const pageSchema = z.discriminatedUnion('kind', [
  z.object({
    ...fields,
    kind: z.literal('home'),
    home: z.object({
      hero: z.object({
        eyebrow: z.string(),
        heading: z.tuple([z.string(), z.string()]),
        intro: z.string(),
        languageNote: z.string(),
      }),
      about: z.object({
        title: z.string(),
        text: z.string(),
        linkLabel: z.string(),
      }),
      founders: z.object({
        title: z.string(),
        paths: z.array(path).min(1),
        linkLabel: z.string(),
      }),
      art: z.object({ title: z.string(), text: z.string() }),
    }),
  }),
  z.object({ ...fields, kind: z.literal('contact'), intro: z.string() }),
  z.object({ ...fields, kind: z.literal('page'), body }),
  z.object({
    ...fields,
    kind: z.literal('detailed'),
    sections: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          title: z.string(),
          body,
        }),
      )
      .min(1),
  }),
  z.object({ ...fields, kind: z.literal('team'), intro: z.string() }),
  z.object({ ...fields, kind: z.literal('news'), intro: z.string() }),
  z.object({
    ...fields,
    kind: z.literal('profile'),
    role: z.string(),
    group: z.enum(['partners', 'colleagues']),
    image,
    body,
    showArtwork: z.boolean(),
  }),
  z.object({
    ...fields,
    kind: z.literal('article'),
    published: z.iso.date(),
    body,
  }),
  z.object({
    ...fields,
    kind: z.literal('practice'),
    intro: z.string(),
    services: z.array(z.string()).min(1),
    relatedPeople: z.array(path),
    order: z.number().int().nonnegative(),
    body,
  }),
  z.object({ ...fields, kind: z.literal('practice-index'), intro: z.string() }),
]);
export type Page = z.infer<typeof pageSchema>;
export type PageOf<K extends Page['kind']> = Extract<Page, { kind: K }>;
