# Story - App etapa 7: Central de tutoriais em JavaScript

**Status:** InReview
**Origem:** `AGENTS.md` → Produto → etapa (7) "tutoriais"; pedido do dono "monte a tela dos tutoriais" (2026-10-08).
**Referências:** site `web/lib/tutoriais/tutoriais.js`, `web/lib/data/tutoriais.js`, `web/app/(app)/tutoriais/*`
(`page.js`, `[id]/page.js`, `gerenciar/*`, `actions.js`) e `web/components/tutoriais/*`; tabela/RLS em
`Meu-financeiro-clone/supabase/migrations/20261001140000_create_tutoriais.sql`.

## Descrição

Central de tutoriais no app, com as mesmas regras do site: banner "Comece por aqui" (só com tutorial publicado em
destaque), busca, filtro por módulo, cards por tipo (vídeo / passo a passo), tutorial aberto com etapas e imagens ou
vídeo, e "Ainda precisa de ajuda?" com o chamado de suporte. O superadmin cria, edita, publica/despublica e exclui.

## Regras preservadas

- Tabela `tutoriais` lida e gravada com o token do usuário (RLS), como o site — o backend não tem rotas dessa tabela.
- Publicados para quem tem vínculo ativo; rascunho, escrita e exclusão só superadmin (`canManageTutorials` + RLS).
- Central mostra só publicados (também para o superadmin); a gestão mostra tudo.
- Destaque único e só se publicado; publicar exige descrição e o conteúdo do tipo (vídeo compatível ou etapa com texto).
- Vídeo: YouTube, Vimeo ou arquivo https; capa e imagens só https.

## Critérios de aceite

- [x] Regras copiadas sem mudança em `lib/tutoriais/tutoriais.js`; extras do app em `lib/tutoriais/tutoriaisScreen.js`.
- [x] Dados em `lib/tutoriaisApi.js` + `hooks/useTutoriaisData.js` (carregando, erro com tentar de novo, dados
      desatualizados, puxar para atualizar, recarga ao voltar para a tela, "ainda não disponível" sem a tabela).
- [x] Rotas `app/(app)/tutoriais/index.jsx`, `[id].jsx` e `gerenciar.jsx` (gestão protegida por `RoleGate`).
- [x] Item "Tutoriais" no menu (abre pelo "Mais"), como o atalho do site.
- [x] Central: banner, busca sem diferenciar acento, chips de módulo, cards com capa (some se a imagem falhar),
      vazio / nada encontrado com limpar filtros, suporte abre o chamado.
- [x] Tutorial aberto: módulo, tipo, rascunho, etapas numeradas com imagem; vídeo abre no navegador do aparelho
      (o app não tem player embutido); tutorial inexistente ou rascunho para quem não pode → "não encontrado".
- [x] Superadmin: novo/editar em tela cheia (módulo, tipo, capa, vídeo ou até 20 etapas, ordem, publicado, destaque),
      validação igual ao site antes de enviar, menu ⋮ com Ver / Editar / Publicar / Despublicar / Excluir, despublicar
      e excluir com confirmação, sem envio duplo.
- [x] Gravação recusada pela RLS (nenhuma linha alterada) vira mensagem clara em vez de sucesso falso.
- [x] Testes: `lib/tutoriais/__tests__/tutoriais.test.js`, `tutoriaisScreen.test.js`, `lib/__tests__/appNavConfig.test.ts`.
- [ ] Teste manual no Android e no iOS (Expo Go), com superadmin e com usuário comum.

## Pendências conhecidas

- Vídeo abre fora do app (sem `react-native-webview`); instalar o player embutido fica para outra etapa se o dono quiser.
- Como no site, a ordem é só o número "Ordem de exibição" (sem arrastar).

## File List

- `frontend/lib/tutoriais/tutoriais.js`, `frontend/lib/tutoriais/tutoriaisScreen.js`, `frontend/lib/tutoriaisApi.js`
- `frontend/hooks/useTutoriaisData.js`
- `frontend/screens/TutoriaisScreen.jsx`, `frontend/screens/TutorialDetailScreen.jsx`, `frontend/screens/TutoriaisAdminScreen.jsx`
- `frontend/screens/Tutoriais/TutoriaisParts.jsx`, `TutorialFormModal.jsx`, `TutorialEditorLayer.jsx`, `tutoriaisRoutes.js`
- `frontend/app/(app)/tutoriais/index.jsx`, `[id].jsx`, `gerenciar.jsx`
- `frontend/lib/appNavConfig.ts`, `frontend/lib/navigationContext.ts`, `frontend/screens/Acessos/AcessosParts.jsx` (prop `style`)
- Testes: `frontend/lib/tutoriais/__tests__/*`, `frontend/lib/__tests__/appNavConfig.test.ts`

## Change Log

- 2026-10-08 — Implementação (@dev).
