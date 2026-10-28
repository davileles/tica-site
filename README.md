# tica-site

Site público de ofertas e cupons — **ticapromos.com.br**.

Estático, servido pelo GitHub Pages. Não consulta o Railway: lê `dados/feed.json`
e `dados/cupons.json`, mantidos pelo `feed-publico.js` do `baileys-server`.

## Domínio antigo

O `tsp-site` (`www.tudosobrepromos.com`, domínio não renovado) virou só redirect
para cá em out/2026, e o `feed-publico.js` publica apenas neste repositório.
SEO: `canonical` e `og:url` em `index.html`, `robots.txt` e `sitemap.xml` na raiz.

## Blog

`/blog/` publica um produto por dia com mini-review. Fonte da verdade: `blog/posts.json`;
`node blog/gerar.js` regera as páginas e o `sitemap.xml`. Regras e esquema em `blog/README.md`.
