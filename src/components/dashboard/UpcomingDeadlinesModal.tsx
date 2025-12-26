/**
 * UpcomingDeadlinesModal - Modal com listagem de metas vencendo agrupadas por paciente
 */

import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

interface GoalDeadline {
  patientId: string;
  patientName: string;
  goalType: string;
  daysUntilDeadline: number;
}

interface PatientGoals {
  patientId: string;
  patientName: string;
  goals: {
    goalType: string;
    daysUntilDeadline: number;
  }[];
}

interface UpcomingDeadlinesModalProps {
  visible: boolean;
  onClose: () => void;
  deadlines: GoalDeadline[];
  onPatientPress: (patientId: string) => void;
}

export default function UpcomingDeadlinesModal({
  visible,
  onClose,
  deadlines,
  onPatientPress,
}: UpcomingDeadlinesModalProps) {
  const colors = lightTheme?.colors || {
    primary: "#10B981",
    background: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    surface: "#F9FAFB",
    error: "#EF4444",
  };

  // Agrupar metas por paciente
  const groupedGoals: PatientGoals[] = React.useMemo(() => {
    const grouped = new Map<string, PatientGoals>();

    deadlines.forEach((deadline) => {
      if (!grouped.has(deadline.patientId)) {
        grouped.set(deadline.patientId, {
          patientId: deadline.patientId,
          patientName: deadline.patientName,
          goals: [],
        });
      }

      grouped.get(deadline.patientId)!.goals.push({
        goalType: deadline.goalType,
        daysUntilDeadline: deadline.daysUntilDeadline,
      });
    });

    return Array.from(grouped.values());
  }, [deadlines]);

  const handlePatientPress = (patientId: string) => {
    onClose();
    onPatientPress(patientId);
  };

  const getGoalTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      WEIGHT: "Peso",
      BODY_FAT: "Gordura Corporal",
      MUSCLE_MASS: "Massa Muscular",
      WAIST_CIRC: "Circunferência da Cintura",
      OTHER: "Outra",
    };
    return labels[type] || type;
  };

  const renderPatientItem = ({ item }: { item: PatientGoals }) => (
    <TouchableOpacity
      style={[styles.patientItem, { backgroundColor: colors.surface }]}
      onPress={() => handlePatientPress(item.patientId)}
      activeOpacity={0.7}
    >
      <View style={styles.patientInfo}>
        <Text style={[styles.patientName, { color: colors.text }]}>
          {item.patientName}
        </Text>

        {/* Lista de metas */}
        {item.goals.map((goal, index) => (
          <View key={index} style={styles.goalRow}>
            <Ionicons name="flag" size={14} color={colors.error} />
            <Text style={[styles.goalText, { color: colors.textSecondary }]}>
              {getGoalTypeLabel(goal.goalType)} - vence em{" "}
              {goal.daysUntilDeadline} dia
              {goal.daysUntilDeadline !== 1 ? "s" : ""}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.badge, { backgroundColor: colors.error + "20" }]}>
        <Text style={[styles.badgeText, { color: colors.error }]}>
          {item.goals.length}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>
                Metas Vencendo
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {groupedGoals.length} paciente
                {groupedGoals.length !== 1 ? "s" : ""} com metas próximas do
                prazo
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.gray?.[100] || "#F3F4F6" },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Lista de pacientes */}
          {groupedGoals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="checkmark-circle-outline"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                Nenhuma meta vencendo
              </Text>
            </View>
          ) : (
            <FlatList
              data={groupedGoals}
              renderItem={renderPatientItem}
              keyExtractor={(item) => item.patientId}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={true}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 20,
  },
  patientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  goalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  goalText: {
    fontSize: 13,
    marginLeft: 6,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
});
