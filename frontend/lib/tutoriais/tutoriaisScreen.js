/** Extras do app para a Central de tutoriais. As regras ficam em `tutoriais.js` (cópia do site, não editar). */
import { TUTORIAL_MODULES, isSafeHttpsUrl, moduleById, parseVideoSource } from './tutoriais';

/** Ícones Ionicons equivalentes aos do menu do app para cada módulo. */
export const MODULE_IONICONS = {
  'visao-geral': 'home-outline',
  transacoes: 'swap-horizontal-outline',
  contas: 'card-outline',
  orcamentos: 'wallet-outline',
  categorias: 'apps-outline',
  agenda: 'calendar-outline',
  'conta-global': 'globe-outline',
};

export function moduleIonicon(modulo) {
  return MODULE_IONICONS[modulo] || 'book-outline';
}

export const TUTORIAL_FILTERS = [
  { key: 'todos', label: 'Todos' },
  ...TUTORIAL_MODULES.map((item) => ({ key: item.id, label: item.label })),
];

export function sectionSubtitle(modulo) {
  const selected = moduleById(modulo);
  return selected ? `Guias de ${selected.label}.` : 'Guias práticos para organizar suas finanças.';
}

/** Endereço aberto no navegador: o link original (o app não tem player embutido). */
export function videoLinkFor(tutorial) {
  const raw = String(tutorial?.videoUrl || '').trim();
  if (!raw || !parseVideoSource(raw) || !isSafeHttpsUrl(raw)) return '';
  return raw;
}

export function videoHostLabel(tutorial) {
  const source = parseVideoSource(tutorial?.videoUrl);
  if (!source) return '';
  if (source.src.includes('youtube')) return 'YouTube';
  if (source.src.includes('vimeo')) return 'Vimeo';
  return 'navegador';
}

export const emptyStep = () => ({ titulo: '', texto: '', imagemUrl: '' });

export const MAX_STEPS = 20;

export function tutorialFormInitial(tutorial) {
  return {
    titulo: tutorial?.titulo || '',
    descricao: tutorial?.descricao || '',
    modulo: tutorial?.modulo || 'visao-geral',
    tipo: tutorial?.tipo || 'passo-a-passo',
    capaUrl: tutorial?.capaUrl || '',
    videoUrl: tutorial?.videoUrl || '',
    etapas: tutorial?.etapas?.length ? tutorial.etapas.map((step) => ({ ...step })) : [emptyStep()],
    ordem: String(tutorial?.ordem ?? 0),
    publicado: tutorial?.publicado === true,
    destaque: tutorial?.destaque === true,
  };
}

/** Mesmos campos que o formulário do site envia para `validateTutorialInput`. */
export function formToTutorialInput(form) {
  const isVideo = form.tipo === 'video';
  return {
    titulo: form.titulo,
    descricao: form.descricao,
    modulo: form.modulo,
    tipo: form.tipo,
    capaUrl: form.capaUrl,
    videoUrl: isVideo ? form.videoUrl : '',
    etapas: isVideo ? [] : form.etapas,
    ordem: form.ordem,
    destaque: form.publicado && form.destaque,
  };
}

export function tutorialStatusLabel(tutorial) {
  return tutorial?.publicado ? 'Publicado' : 'Rascunho';
}

export function adminCounts(list) {
  const items = list || [];
  const publicados = items.filter((item) => item.publicado).length;
  return { total: items.length, publicados, rascunhos: items.length - publicados };
}

export function deleteTutorialMessage(tutorial) {
  const titulo = tutorial?.titulo || 'este tutorial';
  return `"${titulo}" será excluído para todos os usuários. Essa ação não pode ser desfeita.`;
}

export function unpublishTutorialMessage(tutorial) {
  const titulo = tutorial?.titulo || 'Este tutorial';
  return `"${titulo}" volta a ser rascunho e deixa de aparecer para os outros usuários.`;
}

export function publishToast(published) {
  return published ? 'Tutorial publicado.' : 'Tutorial despublicado. Ele não aparece mais para os outros usuários.';
}
