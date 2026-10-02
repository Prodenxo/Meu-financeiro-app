# Meu Financeiro — App + API

Repositório do **celular (Expo)** e da **API Express**, com **Supabase** (migrations e Edge Functions).

O site em **Next.js** ficou no repositório separado (`Meu-financeiro-clone`, pasta `web/`). Este repo **não** contém `web/`.

## Começar

```powershell
npm install
npm run dev          # API (:3333) + Expo (celular / web legado :8081)
```

Env:

- `backend/.env` ← `backend/.env.example`
- `frontend/.env` ← `frontend/.env.example`

## Estrutura

```
backend/     API Express (:3333)
frontend/    Expo (iOS, Android, web :8081)
supabase/    migrations e Edge Functions
scripts/     migrate, smoke, dev.ps1
docs/        documentação do produto
```

## Deploy

- **API:** `Dockerfile` na raiz (Easypanel / Docker)
- **App:** EAS / lojas — `frontend/docs/DEPLOY.md`

## Site Next.js

Front web migrado: outro repo, `npm run dev` em `web/` → `:3000`.  
A API e o Supabase deste repo continuam sendo usados pelo site via `MEI_API_URL` e variáveis Supabase.
