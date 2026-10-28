# Blog do Tica Promos — `ticapromos.com.br/blog/`

Um produto por dia, com mini-review: o que é, o que tem, que problema resolve, pontos de atenção e veredito.
Site estático: a fonte da verdade é `blog/posts.json`; `node blog/gerar.js` regera `blog/index.html`,
`blog/<slug>/index.html` e o `sitemap.xml` da raiz. As pastas de post são descartáveis (sempre regeradas;
pasta sem entrada no `posts.json` é apagada pelo gerador).

**Quem publica:** uma tarefa agendada do Claude (todo dia ~8h36 SP, "Blog Tica Promos — post do dia")
escolhe um produto do `dados/feed.json`, pesquisa na web, acrescenta o post ao `posts.json`, roda o gerador
e faz push na `main`. Ninguém precisa escolher o produto.

## Esquema de um post (`posts.json` é uma lista destes objetos)

```json
{
  "slug": "philco-air-fryer-oven-12l-pfr2200p",
  "data": "2026-10-25",
  "id": "35536",
  "loja": "Amazon",
  "titulo": "Air fryer de 12 litros da Philco por R$ 419: vale para família grande?",
  "produto": "Philco Fritadeira Air Fryer 12L PFR2200P 220V",
  "marca": "Philco",
  "categoria": "Casa e cozinha",
  "imagem": "https://...", "link": "https://...",
  "preco": 419, "precoDe": 1199.9, "desconto": 65, "cupom": null,
  "resumo": "1 a 2 frases: o que é e por que vale olhar hoje.",
  "intro": "1 parágrafo de abertura, tom de quem indica para um amigo.",
  "destaques": ["5 a 8 características reais, uma frase cada"],
  "resolve": "1 a 2 parágrafos (separados por \\n\\n): que problema resolve e para quem faz sentido.",
  "atencao": ["2 a 4 pontos de atenção honestos (voltagem, tamanho, limitações, reclamações recorrentes)"],
  "veredito": "1 parágrafo: para quem compra, para quem não compra, se o preço de hoje é bom.",
  "avaliacao": "4,6 de 5 em 2.300 avaliações (Amazon)",
  "fontes": ["urls consultadas (não aparecem na página)"]
}
```

- `slug`: kebab-case, só `a-z0-9-`, único. `data`: `AAAA-MM-DD` (fuso SP). `categoria`: Casa e cozinha ·
  Eletrônicos · Ferramentas · Bebê e kids · Moda · Beleza · Esporte e lazer · Automotivo · Informática · Brinquedos.
- `id`, `loja`, `imagem`, `link`, `preco`, `precoDe`, `desconto`, `cupom`: copiados do `dados/feed.json` sem alterar.
  Quando há `cupom`, `preco` já é o valor com o cupom aplicado — o texto deve dizer que é preciso aplicá-lo no checkout.
- `avaliacao` pode ser `null`.

## Regras de texto
- Português do Brasil, direto, útil, sem "incrível/imperdível/não perca".
- Não inventar especificação: só o que está na página do produto, no site do fabricante ou em review confiável.
- Não afirmar histórico de preço (não há série de preços aqui).
- Não citar nem linkar outros sites no texto; fontes ficam só no campo `fontes`.
- Voltagem é ponto de atenção obrigatório quando o produto tem voltagem fixa.
- Variar loja e categoria em relação aos últimos posts; não repetir produto já publicado.

## Validação antes do commit
`node --check blog/gerar.js` · `python3 -I -c "import json;json.load(open('blog/posts.json'))"` · `node blog/gerar.js` sem erro.
