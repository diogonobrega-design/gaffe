// Builds the site into _site/: fills every {{page.key}} in src/index.html with the text from
// content/<page>.json (what the team edits in Pages CMS) and copies the assets alongside.
// usage: node build.mjs        (no dependencies)
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, cpSync } from 'node:fs';

const content = {};
for (const f of readdirSync('content').filter((f) => f.endsWith('.json'))) {
  content[f.replace(/\.json$/, '')] = JSON.parse(readFileSync('content/' + f, 'utf8'));
}

const escape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const missing = [];
const html = readFileSync('src/index.html', 'utf8').replace(/\{\{(\w+)\.(\w+)\}\}/g, (m, page, key) => {
  const v = content[page]?.[key];
  if (v === undefined || v === null) { missing.push(m); return ''; }
  return escape(v);
});
if (missing.length) {
  console.error('Missing texts:', [...new Set(missing)].join(', '));
  process.exit(1);
}

rmSync('_site', { recursive: true, force: true });
mkdirSync('_site');
writeFileSync('_site/index.html', html);
for (const dir of ['css', 'js', 'img']) cpSync(dir, '_site/' + dir, { recursive: true });
console.log('Built _site/');
