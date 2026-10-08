import { validateTutorialInput } from '../tutoriais';
import {
  adminCounts,
  deleteTutorialMessage,
  formToTutorialInput,
  moduleIonicon,
  sectionSubtitle,
  TUTORIAL_FILTERS,
  tutorialFormInitial,
  videoHostLabel,
  videoLinkFor,
} from '../tutoriaisScreen';

describe('tutoriaisScreen (extras do app)', () => {
  it('filtros começam por "Todos" e seguem os módulos do site', () => {
    expect(TUTORIAL_FILTERS[0]).toEqual({ key: 'todos', label: 'Todos' });
    expect(TUTORIAL_FILTERS.map((f) => f.key)).toContain('conta-global');
    expect(TUTORIAL_FILTERS.some((f) => /mei/i.test(f.label))).toBe(false);
  });

  it('subtítulo da seção acompanha o módulo', () => {
    expect(sectionSubtitle('todos')).toBe('Guias práticos para organizar suas finanças.');
    expect(sectionSubtitle('contas')).toBe('Guias de Contas.');
  });

  it('ícone do módulo com reserva', () => {
    expect(moduleIonicon('agenda')).toBe('calendar-outline');
    expect(moduleIonicon('desconhecido')).toBe('book-outline');
  });

  it('vídeo abre pelo link original e só se for compatível', () => {
    expect(videoLinkFor({ videoUrl: 'https://youtu.be/abcdefghijk' })).toBe('https://youtu.be/abcdefghijk');
    expect(videoLinkFor({ videoUrl: 'http://youtu.be/abcdefghijk' })).toBe('');
    expect(videoLinkFor({ videoUrl: '' })).toBe('');
    expect(videoHostLabel({ videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk' })).toBe('YouTube');
    expect(videoHostLabel({ videoUrl: 'https://vimeo.com/123456789' })).toBe('Vimeo');
    expect(videoHostLabel({ videoUrl: 'https://cdn.exemplo.com/aula.mp4' })).toBe('navegador');
  });

  it('formulário novo começa como rascunho de passo a passo com uma etapa vazia', () => {
    const form = tutorialFormInitial(null);
    expect(form).toMatchObject({ modulo: 'visao-geral', tipo: 'passo-a-passo', publicado: false, destaque: false, ordem: '0' });
    expect(form.etapas).toEqual([{ titulo: '', texto: '', imagemUrl: '' }]);
  });

  it('editar copia as etapas sem mexer no tutorial original', () => {
    const tutorial = { titulo: 'Guia', etapas: [{ titulo: 'Um', texto: 'A', imagemUrl: '' }], ordem: 3, publicado: true, destaque: true };
    const form = tutorialFormInitial(tutorial);
    form.etapas[0].texto = 'mudou';
    expect(tutorial.etapas[0].texto).toBe('A');
    expect(form.ordem).toBe('3');
  });

  it('vídeo não envia etapas, passo a passo não envia vídeo, destaque só publicado', () => {
    const base = { ...tutorialFormInitial(null), titulo: 'Guia', descricao: 'Curto', videoUrl: 'https://youtu.be/abcdefghijk' };
    expect(formToTutorialInput({ ...base, tipo: 'passo-a-passo' }).videoUrl).toBe('');
    expect(formToTutorialInput({ ...base, tipo: 'video' }).etapas).toEqual([]);
    expect(formToTutorialInput({ ...base, publicado: false, destaque: true }).destaque).toBe(false);
  });

  it('publicar passo a passo sem texto em nenhuma etapa é recusado', () => {
    const form = { ...tutorialFormInitial(null), titulo: 'Guia', descricao: 'Curto', publicado: true };
    const result = validateTutorialInput(formToTutorialInput(form), { publishing: true });
    expect(result.ok).toBe(false);
    expect(result.errors.etapas).toBeTruthy();
  });

  it('contagem da gestão e texto de exclusão', () => {
    expect(adminCounts([{ publicado: true }, { publicado: false }, { publicado: true }])).toEqual({ total: 3, publicados: 2, rascunhos: 1 });
    expect(adminCounts(null)).toEqual({ total: 0, publicados: 0, rascunhos: 0 });
    expect(deleteTutorialMessage({ titulo: 'Guia' })).toContain('"Guia"');
  });
});
