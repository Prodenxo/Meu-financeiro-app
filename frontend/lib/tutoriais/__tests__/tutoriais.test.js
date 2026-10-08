/** Mesmos casos de `web/lib/tutoriais/tutoriais.test.js` (o arquivo de regras é cópia do site). */
import {
  canManageTutorials,
  canReadTutorial,
  filterTutorials,
  normalizeTutorial,
  parseVideoSource,
  pickFeatured,
  plainText,
  validateTutorialInput,
} from '../tutoriais';

const video = {
  id: '1',
  titulo: 'Como registrar entradas e saídas',
  descricao: 'Registre receitas e despesas do dia a dia.',
  modulo: 'transacoes',
  tipo: 'video',
  publicado: true,
  destaque: false,
};

const guia = {
  id: '2',
  titulo: 'Como cadastrar sua primeira conta',
  descricao: 'Cadastre suas contas e organize seus saldos.',
  modulo: 'contas',
  tipo: 'passo-a-passo',
  publicado: true,
  destaque: true,
};

describe('tutoriais (regras do site)', () => {
  it('só o super admin administra tutoriais', () => {
    expect(canManageTutorials('superadmin')).toBe(true);
    expect(canManageTutorials('admin')).toBe(false);
    expect(canManageTutorials('usuario')).toBe(false);
    expect(canManageTutorials(null)).toBe(false);
  });

  it('usuário comum lê publicado e não lê rascunho', () => {
    expect(canReadTutorial({ publicado: true }, 'usuario')).toBe(true);
    expect(canReadTutorial({ publicado: false }, 'usuario')).toBe(false);
    expect(canReadTutorial({ publicado: false }, 'admin')).toBe(false);
    expect(canReadTutorial({ publicado: false }, 'superadmin')).toBe(true);
    expect(canReadTutorial(null, 'superadmin')).toBe(false);
  });

  it('busca e filtro de módulo funcionam juntos, sem diferenciar acento', () => {
    const list = [video, guia];
    expect(filterTutorials(list, { query: 'conta', modulo: 'transacoes' })).toEqual([]);
    expect(filterTutorials(list, { query: 'conta', modulo: 'contas' }).map((i) => i.id)).toEqual(['2']);
    expect(filterTutorials(list, { query: 'entradas', modulo: 'todos' }).map((i) => i.id)).toEqual(['1']);
    expect(filterTutorials(list, { query: 'saidas' }).map((i) => i.id)).toEqual(['1']);
    expect(filterTutorials(list, { query: 'orçamento' })).toHaveLength(0);
  });

  it('banner só aponta para tutorial publicado em destaque', () => {
    expect(pickFeatured([video, guia])?.id).toBe('2');
    expect(pickFeatured([{ ...guia, publicado: false }])).toBeNull();
    expect(pickFeatured([video])).toBeNull();
  });

  it('aceita YouTube, Vimeo e arquivo https; recusa o resto', () => {
    expect(parseVideoSource('https://www.youtube.com/watch?v=abcdefghijk')?.kind).toBe('iframe');
    expect(parseVideoSource('https://youtu.be/abcdefghijk')?.src).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk');
    expect(parseVideoSource('https://vimeo.com/123456789')?.src).toBe('https://player.vimeo.com/video/123456789');
    expect(parseVideoSource('https://cdn.exemplo.com/aula.mp4')?.kind).toBe('file');
    expect(parseVideoSource('http://www.youtube.com/watch?v=abcdefghijk')).toBeNull();
    expect(parseVideoSource('javascript:alert(1)')).toBeNull();
    expect(parseVideoSource('https://evil.example/watch?v=abcdefghijk')).toBeNull();
  });

  it('rascunho pede título; publicar pede o conteúdo do tipo', () => {
    expect(validateTutorialInput({ titulo: 'Oi' }, { publishing: false }).ok).toBe(false);

    const saved = validateTutorialInput({ titulo: 'Primeiros passos' }, { publishing: false });
    expect(saved.ok).toBe(true);
    expect(saved.value.publicado).toBe(false);
    expect(saved.value.destaque).toBe(false);

    const semVideo = validateTutorialInput(
      { titulo: 'Como lançar', descricao: 'Um vídeo curto.', modulo: 'transacoes', tipo: 'video', destaque: true },
      { publishing: true },
    );
    expect(semVideo.ok).toBe(false);
    expect(semVideo.errors.videoUrl).toBeTruthy();

    const imagemRuim = validateTutorialInput(
      {
        titulo: 'Como lançar',
        descricao: 'Um vídeo curto.',
        modulo: 'transacoes',
        tipo: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
        etapas: [{ texto: 'ignorar', imagemUrl: 'nota-url' }],
      },
      { publishing: true },
    );
    expect(imagemRuim.ok).toBe(false);

    const ok = validateTutorialInput(
      {
        titulo: 'Como lançar <script>',
        descricao: 'Um vídeo curto.',
        modulo: 'transacoes',
        tipo: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
        destaque: '1',
      },
      { publishing: true },
    );
    expect(ok.ok).toBe(true);
    expect(ok.value.titulo).toBe('Como lançar');
    expect(ok.value.destaque).toBe(true);
    expect(ok.value.publicado).toBe(true);
  });

  it('texto rico vira texto puro', () => {
    expect(plainText('<img src=x onerror=alert(1)>Olá', 20)).toBe('Olá');
  });

  it('normaliza a linha do banco: capa insegura some e destaque exige publicado', () => {
    const t = normalizeTutorial({
      id: 'x',
      titulo: 'Guia',
      modulo: 'agenda',
      tipo: 'passo-a-passo',
      capa_url: 'http://inseguro/capa.png',
      etapas: [{ titulo: 'Um', texto: 'Faça isso', imagem_url: 'https://img.exemplo.com/1.png' }, {}],
      publicado: false,
      destaque: true,
    });
    expect(t.capaUrl).toBe('');
    expect(t.destaque).toBe(false);
    expect(t.moduloLabel).toBe('Agenda');
    expect(t.etapas).toEqual([{ titulo: 'Um', texto: 'Faça isso', imagemUrl: 'https://img.exemplo.com/1.png' }]);
  });
});
