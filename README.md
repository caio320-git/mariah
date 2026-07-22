# 🎪 Le Cirque de Mariah — site de confirmação de presença

Site de RSVP para o 1º aniversário da Mariah, no tema circo francês.
No ar em **https://mariah-alpha.vercel.app** (páginas estáticas + funções em `api/` + banco Neon Postgres).

## Links

- Convidados: https://mariah-alpha.vercel.app
- Local/mapa: https://mariah-alpha.vercel.app/local
- Admin: https://mariah-alpha.vercel.app/admin (senha na variável `ADMIN_PASSWORD` da Vercel)

## Como funciona o deploy

Push na branch `main` do GitHub → a Vercel faz o deploy automático.
O banco é o Neon Postgres conectado pela aba **Storage** da Vercel (variável `DATABASE_URL` criada
automaticamente). As tabelas são criadas sozinhas no primeiro acesso.

> Importante: o servidor de prévia local fica em `dev/server.js` **de propósito**.
> Um `server.js` na raiz faz a Vercel tratá-lo como função catch-all e derruba o site.

## Configurações do conteúdo

| O quê | Onde |
|---|---|
| Data, hora e local da festa | `public/index.html`, objeto `PARTY_INFO` no início do `<script>` |
| Textos das telas | `public/index.html`, seções `<section class="step">` |
| Página do mapa | `public/local.html` |
| Senha do admin | variável `ADMIN_PASSWORD` na Vercel (padrão local: `mariah2026`) |
| Preview do WhatsApp | tags `og:` no `<head>` de `public/index.html` |

## Admin

- Totais: pessoas confirmadas, respostas "sim", "não" e total.
- Pesquisa por nome (encontra também acompanhantes).
- **Exportar CSV**: abre direto no Excel (uma linha por pessoa, com quem convidou e quando respondeu).
- Excluir respostas erradas/duplicadas (✕ em cada linha).

## Easter eggs 🥚

- Clique no palhacinho: o coração da bandeira vira o escudo do Fluminense (clique de novo para voltar).
- Clique na cachorrinha: uma bolinha laranja cai ao lado da menina e ela sai correndo atrás.
- Clique nos balões: eles estouram e vira um mini game com placar e recorde.
- Abrir o site com `#egg` no fim da URL dispara os dois primeiros (para testar).

## Rodar no seu computador (prévia)

```powershell
cd site
node dev/server.js     # requer Node 22.5+; usa SQLite local em data/rsvps.db
# http://localhost:3000  |  admin: http://localhost:3000/admin
```

Os dados locais são separados dos da Vercel. Para testar igual à produção
(funções + Postgres), use `npx vercel dev` com o `DATABASE_URL` do Neon num arquivo `.env`.

## Estrutura

```
site/
├── public/            # páginas e imagens (servidas como estáticas)
│   ├── index.html     # página dos convidados (fluxo de confirmação)
│   ├── local.html     # mapa, endereço, Waze/Google Maps
│   ├── admin.html     # área administrativa
│   ├── styles.css     # estilos compartilhados
│   ├── scenery.js     # cenário animado + mini game + easter eggs
│   └── assets/        # logo, personagens (fundo removido), foto, OG
├── api/               # funções serverless (Vercel)
│   ├── _lib.js        # conexão Neon + helpers
│   ├── rsvp.js        # POST /api/rsvp — grava confirmação
│   └── admin/
│       ├── login.js   # POST /api/admin/login
│       ├── rsvps.js   # GET/DELETE /api/admin/rsvps
│       └── export.js  # GET /api/admin/export — CSV
├── vercel.json        # rewrites /admin e /local
├── dev/server.js      # (opcional) prévia local com SQLite
└── package.json
```
