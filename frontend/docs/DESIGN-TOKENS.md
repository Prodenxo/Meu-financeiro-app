# Design tokens do app (`frontend/`)

Fonte de verdade visual: o **site** (`..\Meu-financeiro-clone\web\app\globals.css`).
O app espelha esses tokens em `lib/theme.ts`; componentes só consomem o tema — sem hex solto nas telas.

---

## 1. Tema (`lib/theme.ts`)

Consumo: `useMfTheme()` (`components/ui`) → `{ theme, isDarkMode }`, ou `getTheme(isDarkMode)`.

### Superfícies e texto

| Token | CSS do site | Claro | Escuro |
|-------|-------------|-------|--------|
| `background` | `--mf-bg` | `#f5f5fa` | `#0f0f1c` |
| `surface` | `--mf-bg-elevated` | `#ffffff` | `#161628` |
| `card` | `--mf-card` | `#ffffff` | `#181830` |
| `cardMuted` / `backgroundMuted` | `--mf-card-muted` | `#f7f7fb` | `#1e1e36` |
| `border` | `--mf-border` | `#ececf3` | `#262640` |
| `borderStrong` | `--mf-border-strong` | `#dcdce8` | `#33334f` |
| `text` | `--mf-text` | `#16162a` | `#f1f1f7` |
| `textSecondary` | `--mf-text-2` | `#6b6b80` | `#a4a4bd` |
| `textTertiary` | `--mf-text-3` | `#9a9aaf` | `#74748f` |
| `textOnDark` / `textOnDark2` | `--mf-text-on-dark(-2)` | branco / 72 % | idem |

### Marca

| Token | CSS do site | Claro | Escuro |
|-------|-------------|-------|--------|
| `primary` | `--mf-primary` | `#5b4fe9` | `#8b82f2` |
| `primaryHover` (= `primaryDark`) | `--mf-primary-hover` | `#4d42d6` | `#a19af5` |
| `primarySoft` (= `primaryLight`) | `--mf-primary-soft` | `#eeedfb` | `rgba(139,130,242,.16)` |
| `primarySoft2` | `--mf-primary-soft-2` | `#e3e1fa` | `rgba(139,130,242,.26)` |
| `primaryRing` | `--mf-primary-ring` | `rgba(91,79,233,.35)` | `rgba(139,130,242,.45)` |
| `navy` / `navy2` | `--mf-navy(-2)` (card de saldo) | `#14142b` / `#1e1e3f` | `#23234a` / `#2d2d5c` |

### Semântica

| Token | CSS do site | Uso |
|-------|-------------|-----|
| `success` / `successLight` | `--mf-success(-soft)` | recebido, ok |
| `error` / `errorLight` | `--mf-danger(-soft)` | atraso, erro, excluir |
| `warning` / `warningLight` | `--mf-warning(-soft)` | atenção |
| `info` / `infoLight` | `--mf-info(-soft)` | em aberto, compromisso |

Semântica financeira (`FinanceSemantic`): `open` → `info`, `received` → `success`, `overdue` → `error`,
`forecast` → `primary`. Helpers: `getFinanceSemanticColor`, `getFinanceSemanticTint`.

### Layout (iguais nos dois modos)

```ts
mfRadius      // sm 8, md 12, lg 16, xl 20, pill 999  (= --r-*)
mfSpacing     // xs 4, sm 8, md 16, lg 24, xl 32, xxl 48
mfTypography  // caption, body, bodyStrong, subtitle, title, titleLarge, money, moneyLarge
```

### Sombras

| Função | CSS do site | Uso |
|--------|-------------|-----|
| `mfCardShadow(theme, dark)` | `--mf-shadow` | card padrão (nativo) |
| `mfCardElevation(theme, dark)` | `--mf-shadow-pop` | menus, modais, `MfCard variant="elevated"` |
| `mfWebShadow(dark, 'card' \| 'pop')` | idem | `boxShadow` no web |

---

## 2. Tokens "tech" (`lib/techDesign.ts`) — legado

As telas antigas ainda usam `getTechTokens`, `mfTechPanelChrome`, `mfTechKpiCardStyle` etc.
Desde a etapa 1 esses helpers **derivam do tema** (acento = `primary`, painel = `card`, fundo liso, sem grade nem
vidro translúcido), para as telas não ficarem com duas identidades. Não usar em código novo — preferir `components/ui`.

---

## 3. Componentes (`components/ui/`)

| Componente | Props principais | Equivalente no site |
|------------|------------------|---------------------|
| `MfButton` | `label`, `onPress`, `variant` primary \| outline \| ghost \| danger, `size` md (40) \| sm (32), `block`, `loading`, `disabled`, `icon`, `iconRight` | `.btn`, `.btnPrimary`, `.btnOutline`, `.btnGhost`, `.btnSm`, `.btnBlock` |
| `MfCard` | `variant` default \| elevated \| outline \| muted, `padding`, `title`, `subtitle`, `right` | `.card`, `.cardHeader`, `.cardTitle` |
| `MfPage` | `scroll`, `maxWidth`, `contentPadding` | `.content` |
| `MfMetricTile` | `label`, `value`, `semantic`, `icon?` | KPI |
| `MfPeriodNav` | `label`, `onPrevious`, `onNext` | `< Maio 2026 >` |
| `MfSegmented` | `options`, `value`, `onChange` | `.segmented` |
| `MfDonutChart` | `segments`, `centerLabel?` | — |
| `MfAppHeader` | `title`, `onMenuPress`, `right` | `.mobileBar` |

Barrel: `import { MfButton, MfCard, useMfTheme } from '@/components/ui'`.

### Menu inferior (`components/shell/AppBottomNav.tsx`)

Renderizado pelo `AppShell` no celular e no web estreito (< 768 px): **Início, Transações, Contas, Agenda, Mais**.
"Mais" abre o menu lateral; telas sem aba própria (Categorias, Orçamentos, Conta global, Configurações…) deixam
"Mais" ativo. Item ativo = ícone sobre `primarySoft` + rótulo `primary` (igual ao item ativo da sidebar do site).
Lista das abas em `lib/appNavConfig.ts` (`getBottomNavItems`). Sem aba MEI.

Quando o menu inferior está visível, o `AppShell` zera o inset de baixo (`SafeAreaInsetsContext`) para o conteúdo
não ganhar espaço vazio acima do menu.

---

## 4. Regras

1. Telas novas e refactors: `components/ui/*` + tokens do tema; nada de hex solto.
2. Botões: `MfButton`. Cards: `MfCard`. Fundo da página: `theme.background` (liso).
3. Vender benefício, não tecnologia, nos textos (ver `AGENTS.md`).
4. Testes: `lib/__tests__/theme.test.ts`, `lib/__tests__/appNavConfig.test.ts`, `components/__tests__/MfButton.test.tsx`.

## 5. Etapas (ver `AGENTS.md`)

1. **Base visual** — cores, botões, cards, menu inferior ✅
2. Login · 3. Visão geral · 4. Contas + sincronização bancária · 5. Transações ·
6. Categorias, orçamentos, agenda · 7. Conta global, configurações, tutoriais, acessos.
