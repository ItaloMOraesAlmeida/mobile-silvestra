/**
 * Exemplo de Uso de Conversão de Unidades
 *
 * Este arquivo demonstra como usar o sistema de conversão de unidades
 * criado na Task 5 do Sprint 6.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSettingsStore } from "../stores/settings.store";
import { useUnitConversion } from "../utils/units.util";
import { lightTheme } from "../theme";

/**
 * Componente de exemplo que mostra peso e altura em diferentes unidades
 */
export function UnitsExample() {
  // Obtém o sistema de unidades atual das configurações
  const units = useSettingsStore((state) => state.settings.units);

  // Hook personalizado que retorna funções de formatação
  const { formatWeight, formatHeight, formatCircumference } =
    useUnitConversion(units);

  // Dados de exemplo (sempre armazenados em métrico no backend)
  const weightKg = 75.5;
  const heightCm = 170;
  const waistCm = 85;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exemplo de Conversão de Unidades</Text>
      <Text style={styles.subtitle}>
        Sistema atual: {units === "metric" ? "Métrico" : "Imperial"}
      </Text>

      <View style={styles.section}>
        <Text style={styles.label}>Peso:</Text>
        <Text style={styles.value}>{formatWeight(weightKg)}</Text>
        <Text style={styles.info}>
          {units === "metric"
            ? "Armazenado: 75.5 kg"
            : "Armazenado: 75.5 kg → Exibido: 166.4 lb"}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Altura:</Text>
        <Text style={styles.value}>{formatHeight(heightCm)}</Text>
        <Text style={styles.info}>
          {units === "metric"
            ? "Armazenado: 170 cm"
            : "Armazenado: 170 cm → Exibido: 5' 7\""}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Circunferência da Cintura:</Text>
        <Text style={styles.value}>{formatCircumference(waistCm)}</Text>
        <Text style={styles.info}>
          {units === "metric"
            ? "Armazenado: 85.0 cm"
            : "Armazenado: 85.0 cm → Exibido: 33.5 in"}
        </Text>
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          💡 Dica: Todos os dados são armazenados em sistema métrico no backend.
          A conversão é feita apenas na exibição, garantindo consistência dos
          dados.
        </Text>
      </View>
    </View>
  );
}

/**
 * Exemplo de uso direto das funções de conversão
 */
export function DirectConversionExample() {
  const units = useSettingsStore((state) => state.settings.units);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversão Direta</Text>

      {units === "imperial" && (
        <>
          <Text style={styles.exampleTitle}>Métrico → Imperial</Text>
          <Text style={styles.example}>
            75 kg = {(75 * 2.20462).toFixed(1)} lb
          </Text>
          <Text style={styles.example}>
            170 cm = {(170 / 2.54).toFixed(1)} in = 5&apos; 7&quot;
          </Text>
          <Text style={styles.example}>
            85 cm = {(85 / 2.54).toFixed(1)} in
          </Text>
        </>
      )}

      {units === "metric" && (
        <>
          <Text style={styles.exampleTitle}>Sem conversão necessária</Text>
          <Text style={styles.example}>
            Os dados já estão em sistema métrico
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: lightTheme.spacing.lg,
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    margin: lightTheme.spacing.md,
    ...lightTheme.shadows.sm,
  },
  title: {
    fontSize: lightTheme.typography.fontSize.xl,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.sm,
  },
  subtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.lg,
  },
  section: {
    marginBottom: lightTheme.spacing.lg,
    paddingBottom: lightTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  label: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.xs,
  },
  value: {
    fontSize: lightTheme.typography.fontSize["2xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.primary,
    marginBottom: lightTheme.spacing.xs,
  },
  info: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[500],
    fontStyle: "italic",
  },
  note: {
    backgroundColor: lightTheme.colors.info + "11",
    padding: lightTheme.spacing.md,
    borderRadius: lightTheme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: lightTheme.colors.info,
  },
  noteText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 20,
  },
  exampleTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[800],
    marginBottom: lightTheme.spacing.sm,
  },
  example: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.xs,
    fontFamily: "monospace",
  },
});
