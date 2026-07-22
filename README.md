# 🎪 Le Cirque de Mariah — site de confirmação de presença

Site de RSVP para o 1º aniversário da Mariah, no tema circo francês.
Preparado para publicar na **Vercel** (páginas estáticas + funções em `api/` + banco Neon Postgres).

## Publicar na Vercel (passo a passo)

1. **Suba esta pasta (`site/`) para um repositório no GitHub** (pode ser privado).
2. Em [vercel.com](https://vercel.com) → **Add New → Project** → importe o repositório.
   - Framework Preset: **Other** (não precisa de build; deixe Build Command vazio).
   - Se o repositório tiver outras coisas além do site, aponte o **Root Directory** para a pasta `site/`.
3. **Crie o banco**: no projeto → aba **Storage** → **Create Database** → **Neon (Postgres)** → plano Free → **Connect**.
   Isso cria automaticamente a variável `DATABASE_URL` no projeto — não precisa configurar nada no código.
4. **Defina a senha do admin**: Settings → Environment Variables → `ADMIN_PASSWORD` = a senha que você quiser.
   (Sem essa variável, a senha é `mariah2026`.)
5. **Redeploy** (Deployments → ⋯ → Redeploy) para aplicar as variáveis.
6. Pronto: o link `https://seu-projeto.vercel.app` já pode ir para o WhatsApp.
   - Convidados: `https://seu-projeto.vercel.app`
   - Admin: `https://seu-projeto.vercel.app/admin`

### Preview bonito no WhatsApp

Depois que souber o domínio final, troque em `public/index.html` a tag:

```html
<meta property="og:image" content="/assets/og.jpg">
```

por

```html
<meta property="og:image" content="https://seu-projeto.vercel.app/assets/og.jpg">
```

## Configurações do conteúdo

| O quê | Onde |
|---|---|
| Data, hora e local da festa | `public/index.html`, objeto `PARTY_INFO` no início do `<script>` (aparece na tela de confirmação) |
| Textos das telas | `public/index.html`, seções `<section class="step">` |
| Senha do admin | variável `ADMIN_PASSWORD` na Vercel |

## Admin

- Totais: pessoas confirmadas, respostas "sim", "não" e total.
- Pesquisa por nome (encontra também acompanhantes).
- **Exportar CSV**: abre direto no Excel (uma linha por pessoa, com quem convidou e quando respondeu).
- Excluir respostas erradas/duplicadas (✕ em cada linha).

## Rodar no seu computador (prévia)

Para ver o site localmente sem Vercel e sem Postgres, existe o `server.js`, que usa um banco SQLite
local (arquivo `data/rsvps.db`, criado sozinho — **separado** do banco da Vercel):

```powershell
cd site
node server.js     # requer Node 22.5+
# http://localhost:3000  |  admin: http://localhost:3000/admin
```

Para testar exatamente como ficará na Vercel (funções + Postgres), use `npx vercel dev` com o
`DATABASE_URL` do Neon num arquivo `.env`.

## Estrutura

```
site/
├── public/            # páginas e imagens (servidas como estáticas)
│   ├── index.html     # página dos convidados (fluxo de confirmação)
│   ├── admin.html     # área administrativa
│   └── assets/        # logo, personagens (fundo removido), preview OG
├── api/               # funções serverless (Vercel)
│   ├── _lib.js        # conexão Neon + helpers
│   ├── rsvp.js        # POST /api/rsvp — grava confirmação
│   └── admin/
│       ├── login.js   # POST /api/admin/login
│       ├── rsvps.js   # GET/DELETE /api/admin/rsvps
│       └── export.js  # GET /api/admin/export — CSV
├── vercel.json        # rewrite /admin → admin.html
├── server.js          # (opcional) prévia local com SQLite
└── package.json
```
