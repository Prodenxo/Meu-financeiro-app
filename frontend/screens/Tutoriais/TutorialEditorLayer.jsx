import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { deleteTutorial, saveTutorial, setTutorialPublished } from '@/lib/tutoriaisApi';
import {
  deleteTutorialMessage,
  publishToast,
  tutorialStatusLabel,
  unpublishTutorialMessage,
} from '@/lib/tutoriais/tutoriaisScreen';
import { BottomSheet, SheetAction } from '../Transactions/BottomSheet';
import { ConfirmSheet } from '../Acessos/AcessosSheets';
import { TutorialFormModal } from './TutorialFormModal';

const fieldErrorsOf = (error) => (error?.errors && Object.keys(error.errors).length ? error.errors : null);

/**
 * Estado e gravações do superadmin: formulário, menu ⋮, publicar/despublicar e excluir com confirmação.
 * `mutate` recarrega a lista depois de gravar (mesmo em falha: o servidor pode ter gravado).
 */
export function useTutorialEditor({ mutate, notify, onDeleted }) {
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(null);
  const busyRef = useRef(false);

  const run = async (label, operation) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(label);
    try {
      await operation();
    } finally {
      busyRef.current = false;
      setBusy(null);
    }
  };

  const close = useCallback(() => {
    if (!busyRef.current) setSheet(null);
  }, []);

  const openCreate = useCallback(() => setSheet({ type: 'form', tutorial: null }), []);
  const openEdit = useCallback((tutorial) => setSheet({ type: 'form', tutorial }), []);
  const openMenu = useCallback((tutorial) => setSheet({ type: 'menu', tutorial }), []);

  const save = (input, { publishing }) =>
    run('save', async () => {
      const current = sheet?.tutorial || null;
      setSheet((s) => (s ? { ...s, serverErrors: null, formError: null } : s));
      try {
        await mutate(() => saveTutorial(current?.id || null, input, { publishing }));
        setSheet(null);
        notify(publishing ? 'Tutorial salvo e publicado.' : 'Rascunho salvo.');
      } catch (error) {
        const fieldErrors = fieldErrorsOf(error);
        setSheet((s) =>
          s?.type === 'form'
            ? { ...s, serverErrors: fieldErrors, formError: fieldErrors ? null : error?.message || 'Não foi possível salvar o tutorial.' }
            : s,
        );
      }
    });

  const publish = (tutorial, published) =>
    run('publish', async () => {
      try {
        await mutate(() => setTutorialPublished(tutorial.id, published));
        setSheet(null);
        notify(publishToast(published));
      } catch (error) {
        const message = error?.message || 'Não foi possível atualizar.';
        if (sheet?.type === 'unpublish') setSheet((s) => (s ? { ...s, error: message } : s));
        else {
          setSheet(null);
          notify(message, 'error');
        }
      }
    });

  const remove = () =>
    run('delete', async () => {
      const tutorial = sheet?.tutorial;
      if (!tutorial) return;
      try {
        await mutate(() => deleteTutorial(tutorial.id));
        setSheet(null);
        notify('Tutorial excluído.');
        onDeleted?.(tutorial);
      } catch (error) {
        setSheet((s) => (s ? { ...s, error: error?.message || 'Não foi possível excluir.' } : s));
      }
    });

  return { sheet, setSheet, busy, close, openCreate, openEdit, openMenu, save, publish, remove };
}

/** Menu ⋮ de um tutorial na gestão. */
function TutorialMenuSheet({ tokens, tutorial, busy, onView, onEdit, onPublish, onUnpublish, onDelete, onClose }) {
  return (
    <BottomSheet visible onClose={busy ? () => {} : onClose} title={tutorial.titulo} tokens={tokens}>
      <Text style={[styles.note, { color: tokens.textSecondary }]}>
        {tutorialStatusLabel(tutorial)} · {tutorial.moduloLabel} · {tutorial.tipoLabel}
      </Text>
      <View style={styles.actions}>
        {onView ? <SheetAction tokens={tokens} icon="eye-outline" label="Ver tutorial" onPress={() => onView(tutorial)} /> : null}
        <SheetAction tokens={tokens} icon="create-outline" label="Editar tutorial" onPress={() => onEdit(tutorial)} />
        {tutorial.publicado ? (
          <SheetAction tokens={tokens} icon="eye-off-outline" label="Despublicar" onPress={() => onUnpublish(tutorial)} disabled={busy} />
        ) : (
          <SheetAction tokens={tokens} icon="cloud-upload-outline" label={busy ? 'Publicando…' : 'Publicar'} tone="accent" onPress={() => onPublish(tutorial)} disabled={busy} />
        )}
        <SheetAction tokens={tokens} icon="trash-outline" label="Excluir tutorial" tone="danger" onPress={() => onDelete(tutorial)} disabled={busy} />
      </View>
    </BottomSheet>
  );
}

export function TutorialEditorLayer({ tokens, editor, onView }) {
  const { sheet, setSheet, busy, close, save, publish, remove, openEdit } = editor;
  if (!sheet) return null;
  const tutorial = sheet.tutorial;

  if (sheet.type === 'form') {
    return (
      <TutorialFormModal
        key={tutorial?.id || 'novo'}
        tokens={tokens}
        tutorial={tutorial}
        saving={busy === 'save'}
        serverErrors={sheet.serverErrors}
        formError={sheet.formError}
        onSubmit={save}
        onClose={close}
      />
    );
  }

  if (sheet.type === 'menu') {
    return (
      <TutorialMenuSheet
        tokens={tokens}
        tutorial={tutorial}
        busy={busy === 'publish'}
        onView={
          onView
            ? (t) => {
                setSheet(null);
                onView(t);
              }
            : undefined
        }
        onEdit={openEdit}
        onPublish={(t) => publish(t, true)}
        onUnpublish={(t) => setSheet({ type: 'unpublish', tutorial: t })}
        onDelete={(t) => setSheet({ type: 'delete', tutorial: t })}
        onClose={close}
      />
    );
  }

  if (sheet.type === 'unpublish') {
    return (
      <ConfirmSheet
        tokens={tokens}
        title="Despublicar tutorial"
        message={unpublishTutorialMessage(tutorial)}
        confirmLabel="Despublicar"
        confirmIcon="eye-off-outline"
        tone="accent"
        busy={busy === 'publish'}
        busyLabel="Despublicando…"
        error={sheet.error}
        onConfirm={() => publish(tutorial, false)}
        onClose={close}
      />
    );
  }

  if (sheet.type === 'delete') {
    return (
      <ConfirmSheet
        tokens={tokens}
        title="Excluir tutorial"
        message={deleteTutorialMessage(tutorial)}
        confirmLabel="Excluir"
        confirmIcon="trash-outline"
        busy={busy === 'delete'}
        busyLabel="Excluindo…"
        error={sheet.error}
        onConfirm={remove}
        onClose={close}
      />
    );
  }

  return null;
}

const styles = StyleSheet.create({
  actions: { gap: 2 },
  note: { fontSize: 13, lineHeight: 18 },
});
