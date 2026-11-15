// Builds the site into _site/ from src/index.html and the texts the team edits in Pages CMS
// (content/*.json). No dependencies:  node build.mjs
//
// In the template:
//   {{page.group.key}}   text from content/page.json, with the light formatting below
//   {{=page.group.key}}  plain text, for attribute values
//   {{> name}}           a generated part (project list, project pages, services list)
//
// Formatting people can type: ==word== yellow highlight, ~~word~~ red strike, **word** bold,
// Enter for a new line; in long texts a blank line starts a new paragraph.
import { readFileSync, writeFileSync, readdirSync, rmSync, mkdirSync, cpSync } from 'node:fs';

const content = {};
for (const f of readdirSync('content').filter((f) => f.endsWith('.json'))) {
  content[f.replace(/\.json$/, '')] = JSON.parse(readFileSync('content/' + f, 'utf8'));
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (s) => esc(s)
  .replace(/==(.+?)==/g, '<span class="mark" style="--c:var(--yellow)">$1</span>')
  .replace(/~~(.+?)~~/g, '<span class="xl">$1</span>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\r?\n/g, '<br>');
const paras = (s, cls = '') => String(s ?? '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean)
  .map((p) => `<p${cls ? ` class="${cls}"` : ''}>${fmt(p)}</p>`).join('\n');
const src = (p) => esc(String(p || '').replace(/^\/+/, ''));
const COLOR = { amarelo: 'var(--yellow)', vermelho: 'var(--red)', azul: 'var(--blue)', preto: 'var(--ink)', agua: 'var(--teal)', branco: 'var(--paper)' };
const BG = { amarelo: ' on-yellow', azul: ' on-blue' };

const T = content.geral.projetos;
// these three have hand-made pages in src/index.html; every other project is built from blocks
const HANDMADE = ['ara', 'sanjo', 'aquainn'];
const RESERVED = ['top', 'home', 'work', 'contact', 'services', 'about', 'story', 'idea', 'how'];

const seen = new Set();
const projects = content.projetos.map((p) => {
  let slug = String(p.endereco || p.nome || 'projeto').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'projeto';
  if (RESERVED.includes(slug)) slug = 'p-' + slug;
  while (seen.has(slug)) slug += '-2';
  seen.add(slug);
  return { ...p, slug, live: p.estado !== 'brevemente', title: String(p.nome || '').replace(/\.\s*$/, '') };
});
const live = projects.filter((p) => p.live);

function preview(p) {
  const v = p.preview || {};
  const style = ` style="--c:${COLOR[v.fundo] || 'var(--ink)'}"`;
  if (!v.imagem) return `<span class="cl__pv cl__pv--soon"${style} aria-hidden="true"><b class="strip">${esc(T.brevemente)}!</b></span>`;
  const kind = v.ajuste === 'cobrir' ? 'cl__pv--img' : 'cl__pv--logo';
  return `<span class="cl__pv ${kind}"${style} aria-hidden="true"><img${v.rodar ? ' class="spin"' : ''} src="${src(v.imagem)}" alt="" loading="lazy"></span>`;
}

function projectList() {
  return projects.map((p, i) => {
    const n = String(i + 1).padStart(2, '0');
    const inner = `
          <span class="cl__n lbl">${n}</span>
          <span class="cl__txt"><b>${esc(p.nome)}</b> <i>${esc(p.frase)}</i></span>
          <span class="cl__tag lbl soft">${esc(p.setor)}</span>
          ${p.live ? '<span class="cl__arr" aria-hidden="true">→</span>' : `<span class="cl__soon strip strip--red">${esc(T.brevemente)}</span>`}
          ${preview(p)}
        `;
    return p.live
      ? `        <li><a class="cl__row" href="#${p.slug}" data-go="${p.slug}">${inner}</a></li>`
      : `        <li><div class="cl__row cl__row--soon">${inner}</div></li>`;
  }).join('\n');
}

function serviceList() {
  return (content.servicos.lista || []).map((s) => {
    const title = esc(s.titulo).replace(/ \+ /g, ' <b class="plus">+</b> ');
    return `        <li class="svc__row" style="--hl:${s.cor === 'vermelho' ? 'var(--red)' : 'var(--yellow)'}">
          <h3><span class="hl">${title}</span>${s.complemento ? `<small>${esc(s.complemento)}</small>` : ''}</h3>
          <p>${fmt(s.descricao)}</p>
        </li>`;
  }).join('\n');
}

const BLOCKS = {
  secao: (b) => `  <section class="sec${BG[b.fundo] || ''}">
    <div class="wrap beat">
      <h2 class="bigb">${fmt(b.titulo)}</h2>
      <div class="beat__body">
        ${b.destaque ? `<p class="t-l d">${fmt(b.destaque)}</p>` : ''}
        ${paras(b.texto)}
      </div>
    </div>
  </section>`,
  obvio: (b) => `  <section class="sec turn" data-in>
    <div class="wrap beat">
      <h2 class="bigb">${fmt(b.titulo_obvio || T.titulo_obvio)}</h2>
      <p class="obvious"><span class="xl">${fmt(b.obvio)}</span></p>
    </div>
    <div class="wrap beat">
      <h2 class="bigb red">${fmt(b.titulo_gaffe || T.titulo_gaffe)}</h2>
      <p class="d t-mega">${fmt(b.gaffe)}</p>
    </div>
  </section>`,
  citacao: (b) => `  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <p class="quote">${fmt(b.texto)}</p>
      ${b.traducao ? `<p class="gloss" style="margin-top:16px">${fmt(b.traducao)}</p>` : ''}
    </div>
  </section>`,
  numeros: (b) => `  <section class="sec" style="padding-top:0">
    <div class="wrap"><div class="facts">
      ${(b.itens || []).map((x) => `<p><b>${esc(x.numero)}</b>${fmt(x.texto)}</p>`).join('\n      ')}
    </div></div>
  </section>`,
  texto: (b) => `  <section class="sec" style="padding-top:0">
    <div class="wrap"><div class="beat__body measure">
      ${paras(b.texto)}
    </div></div>
  </section>`,
  imagem: (b) => b.imagem ? `  <figure class="sec kv" style="margin:0">
    <div class="wrap"${b.largura === 'normal' ? ' style="max-width:900px"' : ''}>
      <img src="${src(b.imagem)}" alt="${esc(b.legenda)}" loading="lazy">
      ${b.legenda ? `<figcaption class="gloss" style="margin-top:10px">${fmt(b.legenda)}</figcaption>` : ''}
    </div>
  </figure>` : '',
  galeria: (b) => {
    const imgs = (b.imagens || []).filter((x) => x.imagem);
    return imgs.length ? `  <section class="sec" style="padding-top:0">
    <div class="wrap"><div class="shots">
      ${imgs.map((x, i) => {
        const wide = imgs.length % 2 === 1 && i === imgs.length - 1;
        return `<figure class="shot ${wide ? 's-12 r-c' : 's-6 r-a'}"><img src="${src(x.imagem)}" alt="${esc(x.legenda)}" loading="lazy">${x.legenda ? `<figcaption>${esc(x.legenda)}</figcaption>` : ''}</figure>`;
      }).join('\n      ')}
    </div></div>
  </section>` : '';
  },
};

const renderBlocks = (p) => (p.blocos || []).map((b) => (BLOCKS[b.tipo] || (() => ''))(b)).filter(Boolean).join('\n\n');

function projectPages() {
  return live.filter((p) => !HANDMADE.includes(p.slug)).map((p) => {
    const i = live.indexOf(p);
    const next = live.length > 1 ? live[(i + 1) % live.length] : null;
    const h = p.cabecalho || {};
    const meta = [[T.cliente, h.cliente], [T.setor, h.setor], [T.fizemos, h.fizemos], [T.formato, h.formato]].filter(([, v]) => v);
    const blocks = renderBlocks(p);
    return `<!-- ================= PROJECT: ${esc(p.title)} (built from Pages CMS blocks) ================= -->
<article class="case" id="${p.slug}" hidden>
  <header class="sec case__head" data-in>
    <div class="wrap">
      <a class="lbl case__back" href="#work" data-go="work">← ${esc(T.voltar)}</a>
      <div class="case__title">
        <div>
          <h1 class="d">${esc(p.title)}</h1>
          ${h.subtitulo ? `<p>${fmt(h.subtitulo)}</p>` : ''}
        </div>
        ${h.imagem ? `<div class="case__cg"><img src="${src(h.imagem)}" alt="" loading="lazy"></div>` : ''}
      </div>
      ${meta.length ? `<dl class="meta">${meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${fmt(v)}</dd></div>`).join('')}</dl>` : ''}
    </div>
  </header>

${blocks}

  <section class="sec on-yellow next">
    <div>${next ? `<p class="lbl" style="margin-bottom:8px">${esc(T.proximo)}</p><a class="d" href="#${next.slug}" data-go="${next.slug}">${esc(next.title)} →</a>` : ''}</div>
    <a class="btn" href="#work" data-go="work">${esc(T.todos)}</a>
  </section>
</article>`;
  }).join('\n\n');
}

// the third object in the story: the uploaded Viagra photo, or the blue pill until there is one
function viagra() {
  const img = content.historia.objetos?.viagra_imagem;
  return img
    ? `<div class="pc" style="--x:16%;--y:14%;--w:70%;--r:-4deg" data-hspeed=".07"><img class="lift" src="${src(img)}" alt="" loading="lazy"></div>`
    : '<div class="pc" style="--x:40%;--y:22%;--w:40%" data-hspeed=".07"><div class="pill lift"></div></div>';
}

const PARTS = {
  viagra,
  contagem_projetos: () => projects.length + ' ' + esc(content.home.trabalho.contagem),
  lista_projetos: projectList,
  lista_servicos: serviceList,
  paginas_projetos: projectPages,
};

const missing = [];
const html = readFileSync('src/index.html', 'utf8')
  .replace(/\{\{>\s*(\w+)\s*\}\}/g, (m, name) => (PARTS[name] ? PARTS[name]() : (missing.push(m), '')))
  .replace(/\{\{(=?)([\w.]+)\}\}/g, (m, plain, path) => {
    const v = path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), content);
    if (v === undefined || v === null) { missing.push(m); return ''; }
    return plain ? esc(v) : fmt(v);
  });
// the hand-made cases take extra blocks too: they go right before the yellow "Next client" band
let page = html;
for (const p of projects.filter((p) => HANDMADE.includes(p.slug) && (p.blocos || []).length)) {
  const start = page.indexOf(`<article class="case" id="${p.slug}"`);
  const at = start < 0 ? -1 : page.indexOf('<section class="sec on-yellow next">', start);
  if (at > 0) page = page.slice(0, at) + renderBlocks(p) + '\n\n  ' + page.slice(at);
}
if (missing.length) {
  console.error('Missing texts:', [...new Set(missing)].join(', '));
  process.exit(1);
}

rmSync('_site', { recursive: true, force: true });
mkdirSync('_site');
writeFileSync('_site/index.html', page);
for (const dir of ['css', 'js', 'img']) cpSync(dir, '_site/' + dir, { recursive: true });
console.log('Built _site/ with', projects.length, 'projects');
