let clipboardModule = null;

/** Copia para a área de transferência do aparelho. Devolve `true` se copiou. */
export async function copyText(text) {
  const value = String(text || '');
  if (!value) return false;
  try {
    clipboardModule = clipboardModule || (await import('expo-clipboard'));
    await clipboardModule.setStringAsync(value);
    return true;
  } catch {
    return false;
  }
}
