# Meu Financeiro - App (Expo)

Repositório do **app de celular** (Expo / React Native).

A **API Express**, o **Supabase** (migrations e Edge Functions) e o **site Next.js** ficam no repositório `Meu-financeiro-clone` (pastas `backend/`, `supabase/` e `web/`). Este repo não tem backend próprio.

## Começar

```powershell
npm install
npm run dev          # sobe a API do Meu-financeiro-clone (:3333) + Expo em modo LAN
```

- Celular: Expo Go no mesmo Wi-Fi, escaneie o QR Code.
- `frontend/.env` (copie de `frontend/.env.example`): no celular, `EXPO_PUBLIC_MEI_API_URL_DEV=http://<IP-do-PC>:3333`.
- API em outra pasta: defina `MF_BACKEND_DIR` antes do `npm run dev`.

## Estrutura

```
frontend/    Expo (iOS, Android, web :8081)
scripts/     dev.ps1
docs/        documentação do produto
```

## Deploy

- **App:** EAS / lojas — `frontend/docs/DEPLOY.md`
- **API e site:** repositório `Meu-financeiro-clone`
