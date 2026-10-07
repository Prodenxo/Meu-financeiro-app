import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fetchCotacoesBrl, fetchMoedasCatalog } from '@/lib/financeApi';
import { formatBrl } from '@/lib/finance/format';
import { POPULAR_MOEDAS, filterCurrencyOptions, formatCotacaoBrl, getMoedaNomePt } from '@/lib/finance/moedas';
import {
  APELIDO_MAX,
  moedaFormInitial,
  moedaFractionDigits,
  parseMoedaInput,
  sanitizeMoedaInput,
  validateMoedaForm,
} from '@/lib/finance/contaGlobalScreen';
import { TOUCH_MIN } from '../Dashboard/overview/overviewTokens';
import { MoedaFlag } from './MoedaFlag';

let catalogCache = null;

/** Catálogo do servidor; a lista local (servidor fora) não fica em cache para tentar de novo depois. */
async function loadCatalog() {
  if (catalogCache) return { catalog: catalogCache, fromServer: true };
  const result = await fetchMoedasCatalog();
  if (result.fromServer) catalogCache = result.catalog;
  return result;
}

const TITLES = { create: 'Adicionar moeda', edit: 'Editar moeda', balance: 'Atualizar saldo' };

function FieldError({ tokens, message }) {
  if (!message) return null;
  return (
    <Text style={[styles.error, { color: tokens.expense }]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

function IconButton({ tokens, icon, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.iconBtn, pressed && { backgroundColor: tokens.track }, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={24} color={tokens.text} />
    </Pressable>
  );
}

function CurrencyOption({ tokens, option, selected, used, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${option.code}, ${option.name}${used ? ', já cadastrada' : ''}`}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: selected ? tokens.primarySoft : 'transparent' },
        pressed && { backgroundColor: tokens.track },
      ]}
    >
      <MoedaFlag moeda={option.code} size={32} t={tokens} />
      <View style={styles.optionText}>
        <Text style={[styles.optionCode, { color: tokens.text }]}>{option.code}</Text>
        <Text style={[styles.optionName, { color: tokens.textSecondary }]} numberOfLines={1}>
          {option.name}
        </Text>
      </View>
      {used ? (
        <Text style={[styles.usedTag, { color: tokens.textSecondary, backgroundColor: tokens.track }]}>Já cadastrada</Text>
      ) : null}
      {selected ? <Ionicons name="checkmark-circle" size={22} color={tokens.primary} /> : null}
    </Pressable>
  );
}

/** Lista de moedas do catálogo; moeda já cadastrada pode ser escolhida de novo (outro saldo, ex.: outra conta). */
function CurrencyPicker({ tokens, catalog, catalogError, selected, usedCodes, onSelect, onRetry }) {
  const [search, setSearch] = useState('');
  const items = useMemo(() => {
    if (!catalog) return [];
    const options = filterCurrencyOptions(catalog, search, { exclude: ['BRL'] });
    if (search.trim()) return options;
    const popularCount = options.filter((o) => POPULAR_MOEDAS.includes(o.code)).length;
    return [
      { header: 'Mais usadas', key: 'h-pop' },
      ...options.slice(0, popularCount),
      { header: 'Todas as moedas', key: 'h-all' },
      ...options.slice(popularCount),
    ];
  }, [catalog, search]);

  return (
    <View style={styles.picker}>
      <View style={[styles.search, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
        <Ionicons name="search" size={18} color={tokens.textTertiary} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nome ou código (ex.: dólar, EUR)"
          placeholderTextColor={tokens.textTertiary}
          style={[styles.searchInput, { color: tokens.text }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Buscar moeda"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={tokens.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      {catalogError ? (
        <View style={[styles.catalogNote, { backgroundColor: tokens.warningSoft }]}>
          <Text style={[styles.catalogNoteText, { color: tokens.text }]}>
            Não conseguimos a lista do servidor agora. Mostrando as moedas conhecidas pelo app.
          </Text>
          <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={6}>
            <Text style={[styles.link, { color: tokens.primary }]}>Tentar de novo</Text>
          </Pressable>
        </View>
      ) : null}
      {!catalog ? (
        <View style={styles.center} accessibilityLabel="Carregando moedas">
          <ActivityIndicator color={tokens.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key || item.code}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          accessibilityRole="radiogroup"
          ListEmptyComponent={
            <Text style={[styles.emptySearch, { color: tokens.textSecondary }]}>Nenhuma moeda encontrada para “{search}”.</Text>
          }
          renderItem={({ item }) =>
            item.header ? (
              <Text style={[styles.groupLabel, { color: tokens.textTertiary }]} accessibilityRole="header">
                {item.header}
              </Text>
            ) : (
              <CurrencyOption
                tokens={tokens}
                option={item}
                selected={item.code === selected}
                used={usedCodes.includes(item.code) && item.code !== selected}
                onPress={() => onSelect(item.code)}
              />
            )
          }
        />
      )}
    </View>
  );
}

/**
 * Formulário da Conta global (tela cheia): moeda, apelido e saldo — os campos de `contas_moeda_global`.
 * `mode`: 'create' | 'edit' | 'balance' (mesmo formulário, foco no saldo). `rates` = cotações já carregadas na lista.
 */
export function MoedaFormModal({ tokens, mode, row, usedCodes, rates, saving, serverErrors, formError, onSubmit, onClose }) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState(() => moedaFormInitial(row));
  const [errors, setErrors] = useState(null);
  const [picking, setPicking] = useState(false);
  const [catalog, setCatalog] = useState(catalogCache);
  const [catalogError, setCatalogError] = useState(false);
  const [extraRates, setExtraRates] = useState({});
  const valorRef = useRef(null);

  const fetchCatalog = () =>
    loadCatalog().then(({ catalog: c, fromServer }) => {
      setCatalog(c);
      setCatalogError(!fromServer);
    });
  const retryCatalog = () => {
    setCatalogError(false);
    void fetchCatalog();
  };
  useEffect(() => {
    if (!catalogCache) void fetchCatalog();
  }, []);

  const moeda = form.moeda;
  const rate = moeda ? (rates?.[moeda] ?? extraRates[moeda]) : undefined;

  useEffect(() => {
    if (!moeda || rates?.[moeda] != null || extraRates[moeda] !== undefined) return;
    let alive = true;
    fetchCotacoesBrl([moeda])
      .then(({ rates: r }) => alive && setExtraRates((prev) => ({ ...prev, [moeda]: r[moeda] ?? null })))
      .catch(() => alive && setExtraRates((prev) => ({ ...prev, [moeda]: null })));
    return () => {
      alive = false;
    };
  }, [moeda, rates, extraRates]);

  const shownErrors = { ...(serverErrors || {}), ...(errors || {}) };
  const digits = moeda ? moedaFractionDigits(moeda) : 2;
  const parsed = parseMoedaInput(form.valor);
  const preview = rate && Number.isFinite(parsed.value) && parsed.value >= 0 ? parsed.value * rate : null;

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    if (errors) setErrors((e) => (e ? Object.fromEntries(Object.entries(e).filter(([k]) => !(k in patch))) : e));
  };

  const selectMoeda = (code) => {
    set({ moeda: code, valor: sanitizeMoedaInput(form.valor, code) });
    setPicking(false);
  };

  /** No editar, a moeda atual vale mesmo se o catálogo (lista mínima) não a tiver. */
  const validationCatalog = useMemo(() => {
    if (!catalog) return undefined;
    return row ? { ...catalog, [row.moeda]: catalog[row.moeda] || getMoedaNomePt(row.moeda) } : catalog;
  }, [catalog, row]);

  const submit = () => {
    if (saving) return;
    const { errors: errs, payload } = validateMoedaForm(form, { catalog: validationCatalog });
    setErrors(errs);
    if (payload) onSubmit(payload);
  };

  const requestClose = () => {
    if (picking) setPicking(false);
    else if (!saving) onClose();
  };

  const title = picking ? 'Escolher moeda' : TITLES[mode] || TITLES.create;
  const moedaName = moeda ? catalog?.[moeda] || getMoedaNomePt(moeda) : null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={requestClose} statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: tokens.canvas, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <IconButton tokens={tokens} icon="chevron-back" label={picking ? 'Voltar ao formulário' : 'Voltar'} onPress={requestClose} disabled={saving && !picking} />
          <Text style={[styles.headerTitle, { color: tokens.text }]} accessibilityRole="header" numberOfLines={1}>
            {title}
          </Text>
          <IconButton tokens={tokens} icon="close" label="Fechar" onPress={() => !saving && onClose()} disabled={saving} />
        </View>

        {picking ? (
          <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
            <CurrencyPicker
              tokens={tokens}
              catalog={catalog}
              catalogError={catalogError}
              selected={moeda}
              usedCodes={usedCodes}
              onSelect={selectMoeda}
              onRetry={retryCatalog}
            />
          </View>
        ) : (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.intro}>
                <View style={[styles.globe, { backgroundColor: tokens.primarySoft }]}>
                  <Ionicons name="globe-outline" size={28} color={tokens.primary} />
                </View>
                <Text style={[styles.introText, { color: tokens.textSecondary }]}>
                  {mode === 'balance'
                    ? 'Informe o saldo atual dessa moeda.'
                    : 'Registre um saldo que você tem em outra moeda, como dólar ou euro.'}
                </Text>
              </View>

              <View style={[styles.group, { backgroundColor: tokens.card, borderColor: tokens.cardBorder }]}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: tokens.text }]}>Moeda</Text>
                  <Pressable
                    onPress={() => setPicking(true)}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel={moeda ? `Moeda: ${moeda}, ${moedaName}. Toque para trocar` : 'Selecionar moeda'}
                    style={({ pressed }) => [
                      styles.select,
                      { borderColor: shownErrors.moeda ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.canvas },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    {moeda ? <MoedaFlag moeda={moeda} size={28} t={tokens} /> : <Ionicons name="cash-outline" size={22} color={tokens.textTertiary} />}
                    <Text style={[styles.selectText, { color: moeda ? tokens.text : tokens.textTertiary }]} numberOfLines={1}>
                      {moeda ? `${moeda} — ${moedaName}` : 'Selecione a moeda'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={tokens.textSecondary} />
                  </Pressable>
                  {moeda && usedCodes.includes(moeda) && moeda !== row?.moeda ? (
                    <Text style={[styles.hint, { color: tokens.textSecondary }]}>
                      Você já tem saldo em {moeda}. Este será um saldo separado — use o apelido para diferenciar.
                    </Text>
                  ) : null}
                  <FieldError tokens={tokens} message={shownErrors.moeda} />
                </View>

                <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} />

                <View style={styles.field}>
                  <Text style={[styles.label, { color: tokens.text }]}>
                    Apelido <Text style={{ color: tokens.textTertiary, fontWeight: '500' }}>(opcional)</Text>
                  </Text>
                  <TextInput
                    value={form.nome}
                    onChangeText={(nome) => set({ nome })}
                    placeholder="Ex.: Wise, PayPal, conta EUA"
                    placeholderTextColor={tokens.textTertiary}
                    maxLength={APELIDO_MAX}
                    editable={!saving}
                    returnKeyType="next"
                    onSubmitEditing={() => valorRef.current?.focus()}
                    accessibilityLabel="Apelido, opcional"
                    style={[styles.input, { color: tokens.text, borderColor: shownErrors.nome ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.canvas }]}
                  />
                  <FieldError tokens={tokens} message={shownErrors.nome} />
                </View>

                <View style={[styles.divider, { backgroundColor: tokens.cardBorder }]} />

                <View style={styles.field}>
                  <Text style={[styles.label, { color: tokens.text }]}>Saldo</Text>
                  <View
                    style={[styles.amountBox, { borderColor: shownErrors.valor ? tokens.expense : tokens.cardBorder, backgroundColor: tokens.canvas }]}
                  >
                    <Text style={[styles.prefix, { color: tokens.primary, backgroundColor: tokens.primarySoft }]}>{moeda || '---'}</Text>
                    <TextInput
                      ref={valorRef}
                      value={form.valor}
                      onChangeText={(v) => set({ valor: sanitizeMoedaInput(v, moeda) })}
                      placeholder={digits === 0 ? '0' : `0,${'0'.repeat(digits)}`}
                      placeholderTextColor={tokens.textTertiary}
                      keyboardType={digits === 0 ? 'number-pad' : 'decimal-pad'}
                      inputMode={digits === 0 ? 'numeric' : 'decimal'}
                      autoFocus={mode === 'balance'}
                      selectTextOnFocus={mode === 'balance'}
                      editable={!saving}
                      returnKeyType="done"
                      onSubmitEditing={submit}
                      accessibilityLabel={`Saldo em ${moeda || 'moeda selecionada'}`}
                      style={[styles.amountInput, { color: tokens.text }]}
                    />
                  </View>
                  <Text style={[styles.hint, { color: tokens.textSecondary }]}>
                    {digits === 0
                      ? `${moeda} não tem centavos. Zero é permitido.`
                      : `Use vírgula para centavos (até ${digits} casas). Zero é permitido.`}
                  </Text>
                  <FieldError tokens={tokens} message={shownErrors.valor} />
                  {moeda ? (
                    <Text style={[styles.preview, { color: tokens.textSecondary }]} accessibilityLiveRegion="polite">
                      {rate
                        ? `${preview != null ? `≈ ${formatBrl(preview)} · ` : ''}1 ${moeda} ≈ ${formatCotacaoBrl(rate)}`
                        : rate === null || extraRates[moeda] === null
                          ? 'Cotação indisponível agora; o saldo é salvo mesmo assim.'
                          : 'Consultando cotação…'}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.notice, { backgroundColor: tokens.primarySoft }]}>
                <Ionicons name="information-circle-outline" size={18} color={tokens.primary} />
                <Text style={[styles.noticeText, { color: tokens.text }]}>
                  Valor de referência. Não entra no saldo da Visão geral.
                </Text>
              </View>

              {formError ? (
                <Text style={[styles.formError, { color: tokens.expense, backgroundColor: tokens.expenseSoft }]} accessibilityRole="alert">
                  {formError}
                </Text>
              ) : null}
            </ScrollView>

            <View style={[styles.footer, { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas, paddingBottom: Math.max(insets.bottom, 12) }]}>
              <Pressable
                onPress={submit}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: Boolean(saving), busy: Boolean(saving) }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: tokens.primary }, (pressed || saving) && { opacity: 0.85 }]}
              >
                {saving ? <ActivityIndicator color="#ffffff" /> : null}
                <Text style={styles.primaryText}>{saving ? 'Salvando…' : mode === 'create' ? 'Salvar moeda' : 'Salvar alterações'}</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                disabled={saving}
                accessibilityRole="button"
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }, saving && { opacity: 0.4 }]}
              >
                <Text style={[styles.secondaryText, { color: tokens.primary }]}>Cancelar</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, gap: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  iconBtn: { width: TOUCH_MIN, height: TOUCH_MIN, borderRadius: TOUCH_MIN / 2, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  intro: { alignItems: 'center', gap: 10 },
  globe: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  introText: { fontSize: 15, lineHeight: 21, textAlign: 'center', paddingHorizontal: 12 },
  group: { borderRadius: 18, borderWidth: 1, paddingHorizontal: 16 },
  divider: { height: StyleSheet.hairlineWidth },
  field: { paddingVertical: 14, gap: 8 },
  label: { fontSize: 15, fontWeight: '700' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  selectText: { flex: 1, fontSize: 16, fontWeight: '600' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 16 },
  amountBox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, borderWidth: 1, borderRadius: 14, paddingLeft: 8, paddingRight: 14 },
  prefix: { fontSize: 15, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, overflow: 'hidden' },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'], paddingVertical: 8 },
  hint: { fontSize: 13, lineHeight: 18 },
  preview: { fontSize: 14, fontWeight: '600', fontVariant: ['tabular-nums'] },
  error: { fontSize: 13, fontWeight: '600' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 19 },
  formError: { fontSize: 14, fontWeight: '600', padding: 12, borderRadius: 12, overflow: 'hidden' },
  footer: { paddingHorizontal: 16, paddingTop: 12, gap: 4, borderTopWidth: StyleSheet.hairlineWidth },
  primaryBtn: { flexDirection: 'row', gap: 8, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { minHeight: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '700' },
  picker: { flex: 1, paddingHorizontal: 16, gap: 10 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12 },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 10 },
  catalogNote: { borderRadius: 12, padding: 12, gap: 6 },
  catalogNoteText: { fontSize: 13, lineHeight: 18 },
  link: { fontSize: 14, fontWeight: '700' },
  center: { paddingVertical: 32, alignItems: 'center' },
  groupLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 8, borderRadius: 12 },
  optionText: { flex: 1, minWidth: 0 },
  optionCode: { fontSize: 15, fontWeight: '800' },
  optionName: { fontSize: 14 },
  usedTag: { fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  emptySearch: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
});
