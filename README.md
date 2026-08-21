# tica-site

Site público de ofertas e cupons — **ticapromos.com.br**.

Estático, servido pelo GitHub Pages. Não consulta o Railway: lê `dados/feed.json`
e `dados/cupons.json`, mantidos pelo `feed-publico.js` do `baileys-server`.

## Convivência com o tsp-site

Durante a migração de domínio, este repositório e o `tsp-site` rodam em paralelo:

| Repositório | Domínio | Situação |
|---|---|---|
| `tica-site` (este) | `ticapromos.com.br` | domínio novo |
| `tsp-site` | `www.tudosobrepromos.com` | mantido no ar enquanto os anúncios apontarem para lá |

O `feed-publico.js` publica os JSONs nos **dois** repositórios (`GITHUB_REPO_PUBLICO`
aceita lista separada por vírgula), então os dois sites mostram sempre as mesmas
ofertas. Um espelho estático ficaria com o feed congelado no momento da cópia.

Quando o gestor de tráfego migrar os anúncios, o `tsp-site` vira redirect e sai
da lista de publicação.
