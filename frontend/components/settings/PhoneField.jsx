import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ALL_PHONE_COUNTRIES, buildInternationalPhone, splitInternationalPhone } from '@/lib/phoneCountries';
import { formatNationalPhoneInput } from '@/lib/internationalPhone';
import { CountryFlagImage } from '@/components/settings/CountryFlagImage';
import { TOUCH_MIN } from '@/screens/Dashboard/overview/overviewTokens';

/**
 * Telefone internacional: código do país + número nacional formatado.
 * `value` e `onChange` usam só dígitos com DDI (ex.: 5511999999999).
 */
export function PhoneField({ tokens, value, onChange, editable = true, error }) {
  const initial = useMemo(() => splitInternationalPhone(value || ''), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(formatNationalPhoneInput(initial.country.iso, initial.nationalDigits));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const lastEmitted = useRef(value || '');

  useEffect(() => {
    if ((value || '') === lastEmitted.current) return;
    const next = splitInternationalPhone(value || '');
    lastEmitted.current = value || '';
    setCountry(next.country);
    setNational(formatNationalPhoneInput(next.country.iso, next.nationalDigits));
  }, [value]);

  const emit = (nextCountry, nextNational) => {
    const built = buildInternationalPhone(nextCountry, nextNational);
    lastEmitted.current = built;
    onChange(built);
  };

  const handleNational = (text) => {
    const formatted = formatNationalPhoneInput(country.iso, text);
    setNational(formatted);
    emit(country, formatted);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setQuery('');
  };

  const selectCountry = (next) => {
    setCountry(next);
    const formatted = formatNationalPhoneInput(next.iso, national);
    setNational(formatted);
    closePicker();
    emit(next, formatted);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_PHONE_COUNTRIES;
    return ALL_PHONE_COUNTRIES.filter((c) => `${c.name} ${c.dialCode} ${c.iso}`.toLowerCase().includes(q));
  }, [query]);

  const borderColor = error ? tokens.expense : tokens.cardBorder;

  return (
    <>
      <View style={[styles.row, { borderColor, backgroundColor: tokens.canvas }, !editable && { opacity: 0.6 }]}>
        <Pressable
          onPress={() => setPickerOpen(true)}
          disabled={!editable}
          style={[styles.countryBtn, { borderRightColor: tokens.cardBorder }]}
          accessibilityRole="button"
          accessibilityLabel={`Código do país: ${country.name}, mais ${country.dialCode}. Toque para trocar`}
        >
          <CountryFlagImage iso={country.iso} height={16} label={country.name} />
          <Text style={[styles.dial, { color: tokens.text }]}>+{country.dialCode}</Text>
          <Ionicons name="chevron-down" size={14} color={tokens.textTertiary} />
        </Pressable>
        <TextInput
          style={[styles.input, { color: tokens.text }]}
          value={national}
          onChangeText={handleNational}
          editable={editable}
          placeholder={country.iso === 'br' ? '(11) 99999-9999' : 'Número com DDD'}
          placeholderTextColor={tokens.textTertiary}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          accessibilityLabel="Número de telefone"
        />
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={closePicker} presentationStyle="pageSheet">
        <SafeAreaView style={[styles.modal, { backgroundColor: tokens.card }]} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: tokens.text }]} accessibilityRole="header">
              Código do país
            </Text>
            <Pressable onPress={closePicker} hitSlop={8} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fechar">
              <Ionicons name="close" size={22} color={tokens.textSecondary} />
            </Pressable>
          </View>
          <View style={[styles.search, { borderColor: tokens.cardBorder, backgroundColor: tokens.canvas }]}>
            <Ionicons name="search" size={16} color={tokens.textTertiary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar país"
              placeholderTextColor={tokens.textTertiary}
              style={[styles.searchInput, { color: tokens.text }]}
              accessibilityLabel="Buscar país"
              autoCorrect={false}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.iso}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            renderItem={({ item }) => {
              const selected = item.iso === country.iso;
              return (
                <Pressable
                  onPress={() => selectCountry(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${item.name}, mais ${item.dialCode}`}
                  style={({ pressed }) => [
                    styles.countryRow,
                    { borderBottomColor: tokens.cardBorder },
                    selected && { backgroundColor: tokens.primarySoft },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <CountryFlagImage iso={item.iso} height={18} label={item.name} />
                  <Text style={[styles.countryName, { color: tokens.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.countryDial, { color: tokens.textSecondary }]}>+{item.dialCode}</Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={[styles.empty, { color: tokens.textSecondary }]}>Nenhum país encontrado</Text>}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', borderWidth: 1, borderRadius: 12, minHeight: TOUCH_MIN + 4, overflow: 'hidden' },
  countryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRightWidth: StyleSheet.hairlineWidth, minWidth: TOUCH_MIN },
  dial: { fontSize: 15, fontWeight: '600' },
  input: { flex: 1, fontSize: 16, paddingHorizontal: 12, paddingVertical: 10 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { width: TOUCH_MIN, height: TOUCH_MIN, alignItems: 'center', justifyContent: 'center' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12, minHeight: TOUCH_MIN },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 8 },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: TOUCH_MIN + 4, borderBottomWidth: StyleSheet.hairlineWidth },
  countryName: { flex: 1, fontSize: 15 },
  countryDial: { fontSize: 14, fontWeight: '600' },
  empty: { textAlign: 'center', padding: 24, fontSize: 14 },
});
