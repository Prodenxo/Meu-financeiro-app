export const TUTORIAIS_ROUTES = {
  central: '/(app)/tutoriais',
  manage: '/(app)/tutoriais/gerenciar',
  detail: (id) => `/(app)/tutoriais/${encodeURIComponent(id)}`,
};

/** Volta pela pilha quando dá; aberto por link direto, cai na central. */
export function goBackToTutoriais(router) {
  if (router.canGoBack()) router.back();
  else router.replace(TUTORIAIS_ROUTES.central);
}
