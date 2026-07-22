# ðŸŽª Le Cirque de Mariah â€” site de confirmaÃ§Ã£o de presenÃ§a

Site de RSVP para o 1Âº aniversÃ¡rio da Mariah, no tema circo francÃªs.
Preparado para publicar na **Vercel** (pÃ¡ginas estÃ¡ticas + funÃ§Ãµes em `api/` + banco Neon Postgres).

## Publicar na Vercel (passo a passo)

1. **Suba esta pasta (`site/`) para um repositÃ³rio no GitHub** (pode ser privado).
2. Em [vercel.com](https://vercel.com) â†’ **Add New â†’ Project** â†’ importe o repositÃ³rio.
   - Framework Preset: **Other** (nÃ£o precisa de build; deixe Build Command vazio).
   - Se o repositÃ³rio tiver outras coisas alÃ©m do site, aponte o **Root Directory** para a pasta `site/`.
3. **Crie o banco**: no projeto â†’ aba **Storage** â†’ **Create Database** â†’ **Neon (Postgres)** â†’ plano Free â†’ **Connect**.
   Isso cria automaticamente a variÃ¡vel `DATABASE_URL` no projeto â€” nÃ£o precisa configurar nada no cÃ³digo.
4. **Defina a senha do admin**: Settings â†’ Environment Variables â†’ `ADMIN_PASSWORD` = a senha que vocÃª quiser.
   (Sem essa variÃ¡vel, a senha Ã© `mariah2026`.)
5. **Redeploy** (Deployments â†’ â‹¯ â†’ Redeploy) para aplicar as variÃ¡veis.
6. Pronto: o link `https://seu-projeto.vercel.app` jÃ¡ pode ir para o WhatsApp.
   - Convidados: `https://seu-projeto.vercel.app`
   - Admin: `https://seu-projeto.vercel.app/admin`

### Preview bonito no WhatsApp

Depois que souber o domÃ­nio final, troque em `public/index.html` a tag:

```html
<meta property="og:image" content="/assets/og.jpg">
```

por

```html
<meta property="og:image" content="https://seu-projeto.vercel.app/assets/og.jpg">
```

## ConfiguraÃ§Ãµes do conteÃºdo

| O quÃª | Onde |
|---|---|
| Data, hora e local da festa | `public/index.html`, objeto `PARTY_INFO` no inÃ­cio do `<script>` (aparece na tela de confirmaÃ§Ã£o) |
| Textos das telas | `public/index.html`, seÃ§Ãµes `<section class="step">` |
| Senha do admin | variÃ¡vel `ADMIN_PASSWORD` na Vercel |

## Admin

- Totais: pessoas confirmadas, respostas "sim", "nÃ£o" e total.
- Pesquisa por nome (encontra tambÃ©m acompanhantes).
- **Exportar CSV**: abre direto no Excel (uma linha por pessoa, com quem convidou e quando respondeu).
- Excluir respostas erradas/duplicadas (âœ• em cada linha).

## Rodar no seu computador (prÃ©via)

Para ver o site localmente sem Vercel e sem Postgres, existe o `server.js`, que usa um banco SQLite
local (arquivo `data/rsvps.db`, criado sozinho â€” **separado** do banco da Vercel):

```powershell
cd site
node dev/server.js     # requer Node 22.5+
# http://localhost:3000  |  admin: http://localhost:3000/admin
```

Para testar exatamente como ficarÃ¡ na Vercel (funÃ§Ãµes + Postgres), use `npx vercel dev` com o
`DATABASE_URL` do Neon num arquivo `.env`.

## Estrutura

```
site/
â”œâ”€â”€ public/            # pÃ¡ginas e imagens (servidas como estÃ¡ticas)
â”‚   â”œâ”€â”€ index.html     # pÃ¡gina dos convidados (fluxo de confirmaÃ§Ã£o)
â”‚   â”œâ”€â”€ admin.html     # Ã¡rea administrativa
â”‚   â””â”€â”€ assets/        # logo, personagens (fundo removido), preview OG
â”œâ”€â”€ api/               # funÃ§Ãµes serverless (Vercel)
â”‚   â”œâ”€â”€ _lib.js        # conexÃ£o Neon + helpers
â”‚   â”œâ”€â”€ rsvp.js        # POST /api/rsvp â€” grava confirmaÃ§Ã£o
â”‚   â””â”€â”€ admin/
â”‚       â”œâ”€â”€ login.js   # POST /api/admin/login
â”‚       â”œâ”€â”€ rsvps.js   # GET/DELETE /api/admin/rsvps
â”‚       â””â”€â”€ export.js  # GET /api/admin/export â€” CSV
â”œâ”€â”€ vercel.json        # rewrite /admin â†’ admin.html
â”œâ”€â”€ server.js          # (opcional) prÃ©via local com SQLite
â””â”€â”€ package.json
```
