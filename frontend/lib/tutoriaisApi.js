/**
 * Central de tutoriais (tabela `tutoriais`).
 * O backend não tem rotas dessa tabela: como o site (`web/lib/data/tutoriais.js` e `tutoriais/actions.js`), lê e grava
 * com o token do usuário. A RLS libera publicados para quem tem vínculo ativo e rascunho/escrita só para superadmin.
 */
import { supabase } from '@/lib/supabase';
import { FinanceApiError } from '@/lib/financeApi';
import { isTutorialId, normalizeTutorial, validateTutorialInput } from '@/lib/tutoriais/tutoriais';

const TABLE = 'tutoriais';
const COLUMNS = 'id, titulo, descricao, modulo, tipo, capa_url, video_url, etapas, ordem, publicado, destaque';

export const TUTORIAIS_UNAVAILABLE_MESSAGE = 'A central de tutoriais ainda não está disponível neste ambiente.';

function missingTable(error) {
  const msg = `${error?.message || ''} ${error?.code || ''} ${error?.details || ''}`;
  return /PGRST205|42P01|schema cache|does not exist/i.test(msg);
}

function tutorialError(error, fallback) {
  const msg = String(error?.message || error?.details || '');
  if (/network request failed|failed to fetch|network/i.test(msg)) {
    return new FinanceApiError('Sem conexão com o servidor. Verifique sua internet e tente de novo.', { kind: 'network' });
  }
  if (/row-level security|permission denied|42501/i.test(`${msg} ${error?.code || ''}`)) {
    return new FinanceApiError('Acesso negado.', { kind: 'http', status: 403 });
  }
  if (/JWT|expired/i.test(msg)) {
    return new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
  }
  if (missingTable(error)) return new FinanceApiError(TUTORIAIS_UNAVAILABLE_MESSAGE, { kind: 'http' });
  return new FinanceApiError(fallback, { kind: 'http' });
}

async function sessionUserIdOrThrow() {
  const { data } = await supabase.auth.getSession();
  const userId = data?.session?.user?.id;
  if (!userId) throw new FinanceApiError('Sua sessão terminou. Entre novamente.', { kind: 'auth', status: 401 });
  return userId;
}

async function readList(builder) {
  const { data, error } = await builder;
  if (!error) return { tutorials: (data || []).map(normalizeTutorial), unavailable: false };
  if (missingTable(error)) return { tutorials: [], unavailable: true };
  throw tutorialError(error, 'Não foi possível carregar os tutoriais.');
}

/** Central: só publicados (também para o superadmin, como no site). */
export async function fetchPublishedTutorials() {
  await sessionUserIdOrThrow();
  return readList(
    supabase.from(TABLE).select(COLUMNS).eq('publicado', true).order('ordem', { ascending: true }).order('titulo', { ascending: true }),
  );
}

/** Gestão: tudo, inclusive rascunhos (a RLS só devolve rascunho para superadmin). */
export async function fetchAllTutorials() {
  await sessionUserIdOrThrow();
  return readList(supabase.from(TABLE).select(COLUMNS).order('ordem', { ascending: true }).order('titulo', { ascending: true }));
}

export async function fetchTutorialById(id) {
  if (!isTutorialId(id)) return { tutorial: null, unavailable: false };
  await sessionUserIdOrThrow();
  const { data, error } = await supabase.from(TABLE).select(COLUMNS).eq('id', id).maybeSingle();
  if (!error) return { tutorial: normalizeTutorial(data), unavailable: false };
  if (missingTable(error)) return { tutorial: null, unavailable: true };
  throw tutorialError(error, 'Não foi possível abrir o tutorial.');
}

/** A RLS não dá erro quando recusa: só não altera nenhuma linha. */
const NOTHING_CHANGED = () =>
  new FinanceApiError('Nada foi alterado. O tutorial pode ter sido excluído ou sua conta não tem permissão.', { kind: 'http', status: 404 });

const validationError = (errors) =>
  new FinanceApiError(errors.form || 'Revise os campos destacados.', { kind: 'http', status: 400, errors });

/**
 * Cria ou edita (igual a `saveTutorialAction`). `publishing` define o status; publicar exige o conteúdo do tipo.
 * @returns {Promise<string>} id gravado
 */
export async function saveTutorial(id, input, { publishing }) {
  if (id && !isTutorialId(id)) throw validationError({ form: 'Tutorial inválido.' });
  const userId = await sessionUserIdOrThrow();
  const parsed = validateTutorialInput(input, { publishing });
  if (!parsed.ok) throw validationError(parsed.errors);

  const payload = { ...parsed.value, atualizado_em: new Date().toISOString() };

  if (payload.destaque && payload.publicado) {
    let clear = supabase.from(TABLE).update({ destaque: false }).eq('destaque', true);
    if (id) clear = clear.neq('id', id);
    const { error: clearError } = await clear;
    if (clearError) throw tutorialError(clearError, 'Não foi possível salvar o tutorial.');
  }

  if (id) {
    const { data, error } = await supabase.from(TABLE).update(payload).eq('id', id).select('id');
    if (error) throw tutorialError(error, 'Não foi possível salvar o tutorial.');
    if (!data?.length) throw NOTHING_CHANGED();
    return id;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, criado_por: userId })
    .select('id')
    .maybeSingle();
  if (error) throw tutorialError(error, 'Não foi possível salvar o tutorial.');
  return data?.id || '';
}

/** Publica ou tira do ar (igual a `setTutorialPublishedAction`): publicar repete a validação do conteúdo. */
export async function setTutorialPublished(id, published) {
  if (!isTutorialId(id)) throw new FinanceApiError('Tutorial inválido.', { kind: 'http', status: 400 });
  await sessionUserIdOrThrow();

  const { data, error: readError } = await supabase
    .from(TABLE)
    .select('id, titulo, descricao, modulo, tipo, capa_url, video_url, etapas, ordem, destaque')
    .eq('id', id)
    .maybeSingle();
  if (readError) throw tutorialError(readError, 'Não foi possível atualizar o tutorial.');
  if (!data) throw new FinanceApiError('Tutorial não encontrado.', { kind: 'http', status: 404 });

  if (published) {
    const parsed = validateTutorialInput(
      {
        titulo: data.titulo,
        descricao: data.descricao,
        modulo: data.modulo,
        tipo: data.tipo,
        capaUrl: data.capa_url,
        videoUrl: data.video_url,
        etapas: data.etapas,
        ordem: data.ordem,
        destaque: data.destaque,
      },
      { publishing: true },
    );
    if (!parsed.ok) {
      const first = Object.values(parsed.errors)[0];
      throw new FinanceApiError(first || 'Complete o tutorial antes de publicar.', { kind: 'http', status: 400 });
    }
  }

  const { data: updated, error } = await supabase
    .from(TABLE)
    .update({
      publicado: published === true,
      destaque: published === true ? data.destaque === true : false,
      atualizado_em: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');
  if (error) throw tutorialError(error, 'Não foi possível atualizar o tutorial.');
  if (!updated?.length) throw NOTHING_CHANGED();
}

export async function deleteTutorial(id) {
  if (!isTutorialId(id)) throw new FinanceApiError('Tutorial inválido.', { kind: 'http', status: 400 });
  await sessionUserIdOrThrow();
  const { data, error } = await supabase.from(TABLE).delete().eq('id', id).select('id');
  if (error) throw tutorialError(error, 'Não foi possível excluir o tutorial.');
  if (!data?.length) throw NOTHING_CHANGED();
}
