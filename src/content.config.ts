import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const franchises = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/franchises' }),
});

// Only matches files directly in /writeups/ — archive/ subdirectory is excluded automatically
const writeups = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/writeups' }),
});

export const collections = { franchises, writeups };
