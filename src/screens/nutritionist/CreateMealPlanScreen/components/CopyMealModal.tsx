/**
 * CopyMealModal - Modal para copiar refeições entre dias
 *
 * Lista apenas dias da semana que já foram preenchidos
 * Permite copiar todas as refeições de um dia para o dia atual
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { DayOfWeek } from "../../../../types/meal-plan.types";
import { DAY_FULL_LABELS } from "../../../../utils/dayOfWeek.utils";
import { lightTheme } from "../../../../theme";

interface Props {
  visible: boolean;
  currentDay: DayOfWeek;
  filledDays: DayOfWeek[];
  mealCountByDay: Record<DayOfWeek, number>;
  onClose: () => void;
  onCopy: (sourceDay: DayOfWeek) => Promise<void>;
}

export default function CopyMealModal({
  visible,
  currentDay,
  filledDays,
  mealCountByDay,
  onClose,
  onCopy,
}: Props) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
  const [copying, setCopying] = useState(false);
  const insets = useSafeAreaInsets();

  // Filtrar dias preenchidos (excluindo o dia atual)
  const availableDays = filledDays.filter((day) => day !== currentDay);

  const handleCopy = async () => {
    if (!selectedDay) return;

    setCopying(true);
    try {
      await onCopy(selectedDay);
      setSelectedDay(null);
      onClose();
    } catch (error) {
      console.error("Erro ao copiar refeições:", error);
    } finally {
      setCopying(false);
    }
  };

  const handleClose = () => {
    if (!copying) {
      setSelectedDay(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            { paddingBottom: Math.max(insets.bottom, lightTheme.spacing[6]) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons
                name="copy-outline"
                size={24}
                color={lightTheme.colors.primary}
              />
              <Text style={styles.title}>Copiar Refeições</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={copying}>
              <Ionicons
                name="close"
                size={24}
                color={lightTheme.colors.gray[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Selecione o dia de origem para copiar todas as refeições para{" "}
            <Text style={styles.descriptionBold}>
              {DAY_FULL_LABELS[currentDay]}
            </Text>
          </Text>

          {/* Days List */}
          <ScrollView
            style={styles.daysList}
            showsVerticalScrollIndicator={false}
          >
            {availableDays.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={lightTheme.colors.gray[400]}
                />
                <Text style={styles.emptyText}>
                  Nenhum dia com refeições disponível
                </Text>
                <Text style={styles.emptyHint}>
                  Preencha outros dias para poder copiar
                </Text>
              </View>
            ) : (
              availableDays.map((day) => {
                const isSelected = selectedDay === day;
                const mealCount = mealCountByDay[day] || 0;

                return (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayItem,
                      isSelected && styles.dayItemSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                    disabled={copying}
                  >
                    <View style={styles.dayItemLeft}>
                      <View
                        style={[
                          styles.radio,
                          isSelected && styles.radioSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.dayLabel,
                            isSelected && styles.dayLabelSelected,
                          ]}
                        >
                          {DAY_FULL_LABELS[day]}
                        </Text>
                        <Text style={styles.mealCount}>
                          {mealCount}{" "}
                          {mealCount === 1 ? "refeição" : "refeições"}
                        </Text>
                      </View>
                    </View>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={lightTheme.colors.success}
                    />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={copying}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.copyButton,
                (!selectedDay || copying) && styles.copyButtonDisabled,
              ]}
              onPress={handleCopy}
              disabled={!selectedDay || copying}
            >
              {copying ? (
                <ActivityIndicator
                  size="small"
                  color={lightTheme.colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={lightTheme.colors.white}
                  />
                  <Text style={styles.copyButtonText}>Copiar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: lightTheme.colors.white,
    borderTopLeftRadius: lightTheme.borderRadius.xl,
    borderTopRightRadius: lightTheme.borderRadius.xl,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[2],
  },
  title: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  description: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    padding: lightTheme.spacing[4],
    paddingBottom: lightTheme.spacing[2],
  },
  descriptionBold: {
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.gray[900],
  },
  daysList: {
    maxHeight: 300,
    paddingHorizontal: lightTheme.spacing[4],
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: lightTheme.spacing[8],
  },
  emptyText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
    marginTop: lightTheme.spacing[3],
  },
  emptyHint: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    marginTop: lightTheme.spacing[1],
  },
  dayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    backgroundColor: lightTheme.colors.white,
    marginBottom: lightTheme.spacing[2],
  },
  dayItemSelected: {
    borderColor: lightTheme.colors.primary,
    backgroundColor: lightTheme.colors.primaryBackground,
  },
  dayItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: lightTheme.spacing[3],
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: lightTheme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: lightTheme.colors.primary,
  },
  dayLabel: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[900],
  },
  dayLabelSelected: {
    color: lightTheme.colors.primary,
  },
  mealCount: {
    fontSize: lightTheme.typography.fontSize.xs,
    color: lightTheme.colors.gray[600],
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: lightTheme.spacing[3],
    paddingHorizontal: lightTheme.spacing[4],
    paddingTop: lightTheme.spacing[4],
  },
  cancelButton: {
    flex: 1,
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[300],
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium,
    color: lightTheme.colors.gray[700],
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    padding: lightTheme.spacing[4],
    borderRadius: lightTheme.borderRadius.lg,
    backgroundColor: lightTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    gap: lightTheme.spacing[2],
  },
  copyButtonDisabled: {
    backgroundColor: lightTheme.colors.gray[300],
    opacity: 0.6,
  },
  copyButtonText: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold,
    color: lightTheme.colors.white,
  },
});
