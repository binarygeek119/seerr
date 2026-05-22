/**
 * Regenerates server/data/movie3d-theatrical-list.json from 3dmovielist.com HTML.
 *
 * Usage:
 *   npx ts-node server/scripts/update-movie3d-list.ts path/to/list.html
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const htmlPath = process.argv[2];
if (!htmlPath) {
  console.error(
    'Usage: npx ts-node server/scripts/update-movie3d-list.ts <path-to-list.html>'
  );
  process.exit(1);
}

const html = readFileSync(resolve(htmlPath), 'utf-8');
const matches = [
  ...html.matchAll(/!\[poster\]\([^)]+\)\s+([^(|]+?)\((\d{4})\)\s+\d+mins/g),
];

const seen = new Set<string>();
const movies: { title: string; year: number }[] = [];

for (const [, rawTitle, year] of matches) {
  let title = rawTitle.replace(/\s+/g, ' ').trim();
  title = title.replace(/\s*\(aka:.*$/i, '').trim();
  const key = `${title.toLowerCase()}|${year}`;
  if (!seen.has(key)) {
    seen.add(key);
    movies.push({ title, year: Number(year) });
  }
}

const outPath = resolve(__dirname, '../data/movie3d-theatrical-list.json');
writeFileSync(
  outPath,
  JSON.stringify(
    {
      source: 'http://www.3dmovielist.com/list.html',
      updatedAt: new Date().toISOString().slice(0, 10),
      movies,
    },
    null,
    2
  ),
  'utf-8'
);

console.log(`Wrote ${movies.length} entries to ${outPath}`);
