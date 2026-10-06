import React from 'react'
import { Text, StyleSheet } from 'react-native'

type AuthEyebrowProps = {
  label: string
  textColor: string
  /** Mantido por compatibilidade; o rótulo do site não tem ponto. */
  dotColor?: string
}

/** Rótulo curto acima do título (`.eyebrow` do site): maiúsculas, cor da marca. */
export function AuthEyebrow ({ label, textColor }: AuthEyebrowProps) {
  return (
    <Text style={[styles.text, { color: textColor }]} accessibilityRole="text">
      {label.toUpperCase()}
    </Text>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.96,
    marginBottom: 8,
  },
})
