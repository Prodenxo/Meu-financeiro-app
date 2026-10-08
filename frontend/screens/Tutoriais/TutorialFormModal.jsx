import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TUTORIAL_MODULES, TUTORIAL_TYPES, moduleById, typeById, validateTutorialInput } from '@/lib/tutoriais/tutoriais';
import { MAX_STEPS, emptyStep, formToTutorialInput, tutorialFormInitial } from '@/lib/tutoriais/tutoriaisScreen';
import { FormGroup, FormShell, SelectField, SwitchField, TextField } from '../Acessos/AcessosForm';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';

const MODULE_OPTIONS = TUTORIAL_MODULES.map((item) => ({ key: item.id, label: item.label }));
const TYPE_OPTIONS = TUTORIAL_TYPES.map((item) => ({ key: item.id, label: item.label }));

function FieldError({ tokens, message }) {
  if (!message) return null;
  return (
    <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

/**
 * Criar/editar tutorial (só superadmin). Valida no aparelho com as mesmas regras do site antes de enviar;
 * `serverErrors` (por campo) e `formError` vêm da gravação.
 */
export function TutorialFormModal({ tokens, tutorial, saving, serverErrors, formError, onSubmit, onClose }) {
  const [form, setForm] = useState(() => tutorialFormInitial(tutorial));
  const [localErrors, setLocalErrors] = useState(null);
  const [picker, setPicker] = useState(null);
  const errors = localErrors || serverErrors || {};

  const set = (patch) => setForm((current) => ({ ...current, ...patch }));
  const updateStep = (index, patch) =>
    setForm((current) => ({ ...current, etapas: current.etapas.map((step, i) => (i === index ? { ...step, ...patch } : step)) }));
  const removeStep = (index) => setForm((current) => ({ ...current, etapas: current.etapas.filter((_, i) => i !== index) }));
  const addStep = () => setForm((current) => ({ ...current, etapas: [...current.etapas, emptyStep()] }));

  const submit = () => {
    const input = formToTutorialInput(form);
    const result = validateTutorialInput(input, { publishing: form.publicado });
    if (!result.ok) {
      setLocalErrors(result.errors);
      return;
    }
    setLocalErrors(null);
    onSubmit(input, { publishing: form.publicado });
  };

  const pickerConfig =
    picker === 'modulo'
      ? {
          title: 'Módulo',
          options: MODULE_OPTIONS,
          selected: form.modulo,
          onSelect: (key) => {
            set({ modulo: key });
            setPicker(null);
          },
        }
      : picker === 'tipo'
        ? {
            title: 'Tipo',
            options: TYPE_OPTIONS,
            selected: form.tipo,
            onSelect: (key) => {
              set({ tipo: key });
              setPicker(null);
            },
          }
        : null;

  const isVideo = form.tipo === 'video';

  return (
    <FormShell
      tokens={tokens}
      title={tutorial ? 'Editar tutorial' : 'Novo tutorial'}
      saving={saving}
      submitLabel={form.publicado ? 'Salvar e publicar' : 'Salvar rascunho'}
      onSubmit={submit}
      onClose={onClose}
      picker={pickerConfig}
      onClosePicker={() => setPicker(null)}
      formError={errors.form || formError || (localErrors ? 'Revise os campos destacados.' : null)}
    >
      <FormGroup tokens={tokens} title="Conteúdo">
        <View>
          <TextField
            tokens={tokens}
            label="Título"
            value={form.titulo}
            onChangeText={(titulo) => set({ titulo })}
            maxLength={120}
            editable={!saving}
          />
          <FieldError tokens={tokens} message={errors.titulo} />
        </View>
        <View>
          <TextField
            tokens={tokens}
            label="Descrição curta"
            value={form.descricao}
            onChangeText={(descricao) => set({ descricao })}
            maxLength={280}
            multiline
            style={[styles.multiline, { color: tokens.text, borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }]}
            editable={!saving}
          />
          <FieldError tokens={tokens} message={errors.descricao} />
        </View>
        <View>
          <SelectField
            tokens={tokens}
            label="Módulo"
            value={moduleById(form.modulo)?.label}
            placeholder="Escolha o módulo"
            onPress={() => setPicker('modulo')}
            disabled={saving}
          />
          <FieldError tokens={tokens} message={errors.modulo} />
        </View>
        <View>
          <SelectField
            tokens={tokens}
            label="Tipo"
            value={typeById(form.tipo)?.label}
            placeholder="Escolha o tipo"
            onPress={() => setPicker('tipo')}
            disabled={saving}
          />
          <FieldError tokens={tokens} message={errors.tipo} />
        </View>
        <View>
          <TextField
            tokens={tokens}
            label="Capa"
            optional
            value={form.capaUrl}
            onChangeText={(capaUrl) => set({ capaUrl })}
            placeholder="https://"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!saving}
          />
          <FieldError tokens={tokens} message={errors.capaUrl} />
        </View>
      </FormGroup>

      {isVideo ? (
        <FormGroup tokens={tokens} title="Vídeo">
          <View>
            <TextField
              tokens={tokens}
              label="Link do vídeo"
              value={form.videoUrl}
              onChangeText={(videoUrl) => set({ videoUrl })}
              placeholder="https://www.youtube.com/watch?v=..."
              hint="YouTube, Vimeo ou arquivo .mp4, .webm ou .ogg (https)."
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!saving}
            />
            <FieldError tokens={tokens} message={errors.videoUrl} />
          </View>
        </FormGroup>
      ) : (
        <View style={styles.steps}>
          <Text style={[styles.groupTitle, { color: tokens.textSecondary }]} accessibilityRole="header">
            ETAPAS
          </Text>
          <FieldError tokens={tokens} message={errors.etapas} />
          {form.etapas.map((step, index) => (
            <FormGroup key={index} tokens={tokens}>
              <View style={styles.stepHead}>
                <Text style={[styles.stepTitle, { color: tokens.text }]}>Etapa {index + 1}</Text>
                {form.etapas.length > 1 ? (
                  <Pressable
                    onPress={() => removeStep(index)}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={`Remover etapa ${index + 1}`}
                    hitSlop={6}
                    style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.6 }]}
                  >
                    <Ionicons name="trash-outline" size={18} color={tokens.expense} />
                    <Text style={[styles.removeText, { color: tokens.expense }]}>Remover</Text>
                  </Pressable>
                ) : null}
              </View>
              <TextField
                tokens={tokens}
                label="Título da etapa"
                value={step.titulo}
                onChangeText={(titulo) => updateStep(index, { titulo })}
                maxLength={120}
                editable={!saving}
              />
              <TextField
                tokens={tokens}
                label="Texto da etapa"
                value={step.texto}
                onChangeText={(texto) => updateStep(index, { texto })}
                maxLength={2000}
                multiline
                style={[styles.multilineTall, { color: tokens.text, borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }]}
                editable={!saving}
              />
              <TextField
                tokens={tokens}
                label="Imagem da etapa"
                optional
                value={step.imagemUrl}
                onChangeText={(imagemUrl) => updateStep(index, { imagemUrl })}
                placeholder="https://"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saving}
              />
            </FormGroup>
          ))}
          {form.etapas.length < MAX_STEPS ? (
            <Pressable
              onPress={addStep}
              disabled={saving}
              accessibilityRole="button"
              style={({ pressed }) => [styles.addStep, { borderColor: tokens.cardBorder, backgroundColor: tokens.card }, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="add" size={20} color={tokens.primary} />
              <Text style={[styles.addStepText, { color: tokens.primary }]}>Adicionar etapa</Text>
            </Pressable>
          ) : null}
        </View>
      )}

      <FormGroup tokens={tokens} title="Publicação">
        <TextField
          tokens={tokens}
          label="Ordem de exibição"
          value={form.ordem}
          onChangeText={(ordem) => set({ ordem: ordem.replace(/\D/g, '').slice(0, 4) })}
          keyboardType="number-pad"
          hint="Números menores aparecem primeiro (0 a 9999)."
          editable={!saving}
        />
        <SwitchField
          tokens={tokens}
          label="Publicado"
          hint="Desligado, fica como rascunho e só o super admin vê."
          value={form.publicado}
          onValueChange={(publicado) => set({ publicado, destaque: publicado ? form.destaque : false })}
          disabled={saving}
        />
        <SwitchField
          tokens={tokens}
          label="Destacar no banner"
          hint={'Aparece em "Comece por aqui". Só um tutorial publicado fica em destaque.'}
          value={form.publicado && form.destaque}
          onValueChange={(destaque) => set({ destaque })}
          disabled={saving || !form.publicado}
        />
      </FormGroup>

      <Text style={[styles.note, { color: tokens.textSecondary }]}>
        Rascunho guarda o título. Publicar exige a descrição e o vídeo ou as etapas.
      </Text>
    </FormShell>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 13, fontWeight: '600', marginTop: -6, marginBottom: 8 },
  multiline: { minHeight: 80, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, fontSize: 16, textAlignVertical: 'top' },
  multilineTall: { minHeight: 120, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, fontSize: 16, textAlignVertical: 'top' },
  steps: { gap: 10 },
  groupTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginLeft: 4 },
  stepHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: TOUCH_MIN },
  stepTitle: { fontSize: 16, fontWeight: '800' },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: TOUCH_MIN },
  removeText: { fontSize: 14, fontWeight: '700' },
  addStep: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 50, borderWidth: 1, borderRadius: 14, borderStyle: 'dashed' },
  addStepText: { fontSize: 15, fontWeight: '700' },
  note: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
