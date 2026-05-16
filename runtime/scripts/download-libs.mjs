#!/usr/bin/env node
// Downloads the 4 runtime library bundles into runtime/public/libs/.

import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'libs');

// React 18.3.1 is the latest with a published UMD build — React 19 dropped UMD.
// Artifacts that import `react` get the global React 18 here; the host app uses
// React 19 on a separate origin (no conflict).
const FILES = [
  { name: 'react.js',     url: 'https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js' },
  { name: 'react-dom.js', url: 'https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js' },
  { name: 'babel.js',     url: 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.29.0/babel.min.js' },
  { name: 'tailwind.js',  url: 'https://cdn.tailwindcss.com/3.4.16' },
];

await mkdir(OUT, { recursive: true });

for (const { name, url } of FILES) {
  const out = join(OUT, name);
  try {
    const s = await stat(out);
    if (s.size > 1024) { console.log(`✓ ${name} (cached, ${(s.size/1024).toFixed(0)} KB)`); continue; }
  } catch {}
  console.log(`↓ ${name} ← ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log(`  ${(buf.length/1024).toFixed(0)} KB → ${name}`);
}
