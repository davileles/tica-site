#!/usr/bin/env node
// Gera as páginas estáticas do blog a partir de blog/posts.json.
//   node blog/gerar.js
// Escreve blog/index.html, blog/<slug>/index.html e atualiza sitemap.xml.
// A fonte da verdade é o posts.json; as páginas são descartáveis (sempre regeradas).
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const ARQ_POSTS = path.join(__dirname, 'posts.json');
const SITE = 'https://ticapromos.com.br';
const GRUPO = 'https://ir.ticapromos.com.br/geral?o=blog';
const ARTIGO_LISTA_PREVIEW = 3;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function brl(v) {
  if (typeof v !== 'number' || !isFinite(v)) return '';
  return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dataLonga(iso) {
  const [a, m, d] = String(iso).split('-').map(Number);
  return `${d} de ${MESES[m - 1]}. de ${a}`;
}
function paragrafos(txt) {
  return String(txt || '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${esc(p)}</p>`).join('\n');
}
function lista(itens, cls) {
  if (!Array.isArray(itens) || !itens.length) return '';
  return `<ul${cls ? ` class="${cls}"` : ''}>${itens.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
}
function validarPost(p) {
  const obrig = ['slug', 'data', 'loja', 'titulo', 'produto', 'imagem', 'link', 'preco', 'resumo', 'intro', 'destaques', 'resolve', 'atencao', 'veredito'];
  for (const k of obrig) if (p[k] == null || p[k] === '') throw new Error(`post ${p.slug || '?'}: falta "${k}"`);
  if (!/^[a-z0-9-]+$/.test(p.slug)) throw new Error(`slug inválido: ${p.slug}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.data)) throw new Error(`data inválida em ${p.slug}: ${p.data}`);
}

function cabecalho(ativo) {
  return `<header class="topo">
  <div class="wrap topo-in">
    <a class="marca" href="/">
      <img class="marca-tico" src="/tico-ancora-128.png" alt="Tico" width="40" height="40"/>
      <span class="marca-txt"><b>TICA <em>PROMOS</em></b><small>O Tico tica ✔️</small></span>
    </a>
    <div class="topo-acoes">
      <a class="lnk-topo" href="/">Ofertas</a>
      <a class="lnk-topo" href="/blog/"${ativo === 'blog' ? ' aria-current="page"' : ''}>Blog</a>
      <button class="btn-tema" id="btn-tema" aria-label="Alternar tema" title="Alternar tema">🌙</button>
      <a class="btn-grupo" href="${GRUPO}" target="_blank" rel="noopener">Entrar no grupo</a>
    </div>
  </div>
</header>`;
}
function rodape() {
  return `<footer class="rodape">
  <div class="wrap">
    <p>
      Os textos do blog são opinião do Tica Promos a partir das informações publicadas pela loja e pelo fabricante.
      Preço e estoque mudam a qualquer momento — confira sempre no site da loja antes de fechar a compra.
      Os links são de afiliado: você paga o mesmo preço e o grupo recebe uma comissão da loja.
      Como Associado Amazon, recebemos por compras qualificadas.
      <br/><a href="${GRUPO}" target="_blank" rel="noopener">Entrar no grupo do WhatsApp</a>
    </p>
    <div class="assina">Tica Promos · o Tico tica ✔️</div>
  </div>
</footer>`;
}
const SCRIPT = `<script>
(function(){
  var salvo=null;try{salvo=localStorage.getItem('tsp-tema');}catch(e){}
  var tema=salvo||(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'escuro':'claro');
  function aplicar(t){document.documentElement.setAttribute('data-tema',t);
    var b=document.getElementById('btn-tema');if(b){b.textContent=t==='escuro'?'☀️':'🌙';}
    var m=document.querySelector('meta[name="theme-color"]');if(m){m.setAttribute('content',t==='escuro'?'#12141c':'#ffffff');}}
  aplicar(tema);
  document.addEventListener('click',function(e){
    var b=e.target.closest('#btn-tema');
    if(b){var n=document.documentElement.getAttribute('data-tema')==='escuro'?'claro':'escuro';aplicar(n);
      try{localStorage.setItem('tsp-tema',n);}catch(err){}return;}
    var c=e.target.closest('.cupom[data-codigo]');
    if(c){var cod=c.getAttribute('data-codigo');
      function ok(){c.classList.add('copiado');var em=c.querySelector('em');if(em){em.textContent='COPIADO';}}
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(cod).then(ok,ok);}else{ok();}}
  });
})();
</script>`;

function head(t, desc, url, img, extra) {
  return `<!DOCTYPE html>
<html lang="pt-BR" data-tema="claro">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${esc(t)}</title>
<link rel="canonical" href="${url}"/>
<meta name="description" content="${esc(desc)}"/>
<meta name="theme-color" content="#ffffff"/>
<meta property="og:title" content="${esc(t)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:type" content="${extra && extra.artigo ? 'article' : 'website'}"/>
<meta property="og:image" content="${esc(img)}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:site_name" content="Tica Promos"/>
<meta property="og:locale" content="pt_BR"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800;900&family=Space+Mono:wght@700&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="/blog/estilo.css"/>
${extra && extra.jsonld ? `<script type="application/ld+json">${JSON.stringify(extra.jsonld)}</script>` : ''}
</head>
<body>`;
}

function cardPost(p) {
  const desc = p.desconto ? `<span class="selo">-${p.desconto}%</span>` : '';
  return `<a class="post-card" href="/blog/${p.slug}/">
  <div class="post-foto">${desc}<img src="${esc(p.imagem)}" alt="${esc(p.produto)}" loading="lazy"/></div>
  <div class="post-corpo">
    <div class="post-meta"><span>${esc(p.loja)}</span><i>•</i><span>${dataLonga(p.data)}</span>${p.categoria ? `<i>•</i><span>${esc(p.categoria)}</span>` : ''}</div>
    <h2>${esc(p.titulo)}</h2>
    <p>${esc(p.resumo)}</p>
    <div class="post-preco"><b>${brl(p.preco)}</b>${p.precoDe ? `<s>${brl(p.precoDe)}</s>` : ''}</div>
  </div>
</a>`;
}

function paginaLista(posts) {
  const url = `${SITE}/blog/`;
  const t = 'Blog do Tica Promos — um produto por dia, explicado';
  const desc = 'Todo dia o Tico escolhe um produto que está com preço bom e explica o que ele faz, para quem serve e o que olhar antes de comprar.';
  return `${head(t, desc, url, `${SITE}/tico-ancora.png`)}
${cabecalho('blog')}
<main class="wrap">
  <section class="abertura">
    <h1>Um produto por dia, <span>explicado sem enrolação.</span></h1>
    <p>O Tico escolhe um achado que está com preço bom, conta o que ele faz, para quem serve e o que vale olhar antes de comprar. Sem cadastro.</p>
  </section>
  <section class="lista" aria-label="Posts do blog">
${posts.map(cardPost).join('\n')}
  </section>
</main>
${rodape()}
${SCRIPT}
</body>
</html>
`;
}

function paginaPost(p, outros) {
  const url = `${SITE}/blog/${p.slug}/`;
  const economia = (p.precoDe && p.preco && p.precoDe > p.preco) ? `<span class="economia">economia de ${brl(p.precoDe - p.preco)}</span>` : '';
  const cupom = p.cupom ? `<div class="cupom" data-codigo="${esc(p.cupom)}" role="button" tabindex="0" title="Copiar cupom">${esc(p.cupom)}<em>COPIAR</em></div>` : '';
  const jsonld = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: p.titulo, description: p.resumo, image: p.imagem, datePublished: p.data,
    author: { '@type': 'Organization', name: 'Tica Promos' },
    publisher: { '@type': 'Organization', name: 'Tica Promos', logo: { '@type': 'ImageObject', url: `${SITE}/tico-ancora.png` } },
    mainEntityOfPage: url,
    about: { '@type': 'Product', name: p.produto, image: p.imagem, brand: p.marca || undefined,
      offers: { '@type': 'Offer', price: p.preco, priceCurrency: 'BRL', url: p.link, seller: { '@type': 'Organization', name: p.loja } } }
  };
  return `${head(`${p.titulo} · Blog do Tica Promos`, p.resumo, url, p.imagem, { artigo: true, jsonld })}
${cabecalho('blog')}
<main class="wrap">
<article class="artigo">
  <nav class="migalha" aria-label="Caminho"><a href="/">Tica Promos</a> › <a href="/blog/">Blog</a> › ${esc(p.categoria || p.loja)}</nav>
  <h1>${esc(p.titulo)}</h1>
  <p class="resumo">${esc(p.resumo)}</p>

  <section class="ficha" aria-label="Preço e loja">
    <div class="ficha-foto"><img src="${esc(p.imagem)}" alt="${esc(p.produto)}"/></div>
    <div class="ficha-info">
      <div class="ficha-loja">${esc(p.loja)}${p.marca ? ` · ${esc(p.marca)}` : ''}</div>
      <div class="ficha-nome">${esc(p.produto)}</div>
      <div class="ficha-preco"><b>${brl(p.preco)}</b>${p.precoDe ? `<s>${brl(p.precoDe)}</s>` : ''}${economia}</div>
      ${cupom}
      ${p.avaliacao ? `<div class="ficha-nota">★ ${esc(p.avaliacao)}</div>` : ''}
      <a class="btn-grupo" href="${esc(p.link)}" target="_blank" rel="noopener sponsored">Ver na ${esc(p.loja)}</a>
      <div class="ficha-quando">Preço visto em ${dataLonga(p.data)}${p.cupom ? ', já com o cupom aplicado' : ''}. Pode ter mudado.</div>
    </div>
  </section>

  ${paragrafos(p.intro)}

  <h2>O que ele tem</h2>
  ${lista(p.destaques)}

  <h2>Que problema resolve (e para quem)</h2>
  ${paragrafos(p.resolve)}

  <h2>Fique de olho</h2>
  ${lista(p.atencao, 'atencao')}

  <div class="veredito"><b>Veredito do Tico</b>${paragrafos(p.veredito)}</div>

  <div class="cta-fim">
    <a class="btn-grupo" href="${esc(p.link)}" target="_blank" rel="noopener sponsored">Ver na ${esc(p.loja)}</a>
    <span>Quer saber na hora quando baixar de novo? <a href="${GRUPO}" target="_blank" rel="noopener" style="text-decoration:underline">Entre no grupo</a>.</span>
  </div>

  <p class="aviso">Preço visto em ${dataLonga(p.data)} na ${esc(p.loja)}. Este texto foi escrito com base nas informações da página do produto e do fabricante; não testamos a unidade. Confira voltagem, tamanho e prazo de entrega antes de comprar.</p>
</article>

${outros.length ? `<section class="mais"><h3>Outros achados do blog</h3><div class="lista">${outros.map(cardPost).join('')}</div></section>` : ''}
</main>
${rodape()}
${SCRIPT}
</body>
</html>
`;
}

function sitemap(posts) {
  const hoje = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url><loc>${SITE}/</loc><lastmod>${hoje}</lastmod><changefreq>hourly</changefreq></url>`,
    `  <url><loc>${SITE}/blog/</loc><lastmod>${hoje}</lastmod><changefreq>daily</changefreq></url>`,
    ...posts.map(p => `  <url><loc>${SITE}/blog/${p.slug}/</loc><lastmod>${p.data}</lastmod><changefreq>weekly</changefreq></url>`)
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function main() {
  const posts = JSON.parse(fs.readFileSync(ARQ_POSTS, 'utf8'));
  if (!Array.isArray(posts)) throw new Error('posts.json precisa ser uma lista');
  posts.forEach(validarPost);
  const slugs = new Set();
  for (const p of posts) { if (slugs.has(p.slug)) throw new Error(`slug repetido: ${p.slug}`); slugs.add(p.slug); }
  posts.sort((a, b) => (b.data + b.slug).localeCompare(a.data + a.slug));

  fs.writeFileSync(path.join(__dirname, 'index.html'), paginaLista(posts));
  for (const p of posts) {
    const dir = path.join(__dirname, p.slug);
    fs.mkdirSync(dir, { recursive: true });
    const outros = posts.filter(o => o.slug !== p.slug).slice(0, ARTIGO_LISTA_PREVIEW);
    fs.writeFileSync(path.join(dir, 'index.html'), paginaPost(p, outros));
  }
  // Remove pastas de posts que saíram do posts.json.
  for (const ent of fs.readdirSync(__dirname, { withFileTypes: true })) {
    if (ent.isDirectory() && !slugs.has(ent.name)) fs.rmSync(path.join(__dirname, ent.name), { recursive: true, force: true });
  }
  fs.writeFileSync(path.join(RAIZ, 'sitemap.xml'), sitemap(posts));
  console.log(`blog: ${posts.length} post(s) gerado(s)`);
}

if (require.main === module) main();
module.exports = { main };
