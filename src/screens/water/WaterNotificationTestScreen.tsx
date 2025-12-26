import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { lightTheme } from "../../theme";
import { showImmediateNotification } from "../../services/water/notifications";
import { getScheduledReminders } from "../../services/water/notifications/notificationService";

export default function WaterNotificationTestScreen() {
  const navigation = useNavigation();
  const [scheduledCount, setScheduledCount] = React.useState(0);

  React.useEffect(() => {
    loadScheduledCount();
  }, []);

  const loadScheduledCount = async () => {
    const reminders = await getScheduledReminders();
    setScheduledCount(reminders.length);
  };

  const handleTestNotification = async () => {
    await showImmediateNotification(
      "💧 Teste de Notificação",
      "Esta é uma notificação de teste do módulo de hidratação!"
    );
  };

  const handleTestQuickAction = async () => {
    await showImmediateNotification(
      "💧 Teste de Quick Actions",
      "Toque nos botões abaixo para testar as Quick Actions!"
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: lightTheme.colors.background },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="arrow-back"
              size={24}
              color={lightTheme.colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: lightTheme.colors.text }]}>
            Testar Notificações
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: lightTheme.colors.card }]}
        >
          <Ionicons
            name="information-circle"
            size={24}
            color={lightTheme.colors.primary}
          />
          <Text style={[styles.infoText, { color: lightTheme.colors.text }]}>
            Use esta tela para testar o sistema de notificações e Quick Actions
          </Text>
        </View>

        {/* Status */}
        <View
          style={[styles.section, { backgroundColor: lightTheme.colors.card }]}
        >
          <Text
            style={[styles.sectionTitle, { color: lightTheme.colors.text }]}
          >
            Status
          </Text>
          <View style={styles.statusRow}>
            <Text
              style={[
                styles.statusLabel,
                { color: lightTheme.colors.textSecondary },
              ]}
            >
              Lembretes agendados:
            </Text>
            <Text
              style={[styles.statusValue, { color: lightTheme.colors.primary }]}
            >
              {scheduledCount}
            </Text>
          </View>
          <TouchableOpacity
            onPress={loadScheduledCount}
            style={[
              styles.refreshButton,
              { backgroundColor: lightTheme.colors.primary },
            ]}
          >
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.refreshButtonText}>Atualizar</Text>
          </TouchableOpacity>
        </View>

        {/* Test Buttons */}
        <View
          style={[styles.section, { backgroundColor: lightTheme.colors.card }]}
        >
          <Text
            style={[styles.sectionTitle, { color: lightTheme.colors.text }]}
          >
            Testes
          </Text>

          <TouchableOpacity
            onPress={handleTestNotification}
            style={[
              styles.testButton,
              { borderColor: lightTheme.colors.primary },
            ]}
          >
            <Ionicons
              name="notifications"
              size={24}
              color={lightTheme.colors.primary}
            />
            <View style={styles.testButtonContent}>
              <Text
                style={[
                  styles.testButtonTitle,
                  { color: lightTheme.colors.text },
                ]}
              >
                Notificação Simples
              </Text>
              <Text
                style={[
                  styles.testButtonDesc,
                  { color: lightTheme.colors.textSecondary },
                ]}
              >
                Enviar uma notificação básica de teste
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={lightTheme.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleTestQuickAction}
            style={[
              styles.testButton,
              { borderColor: lightTheme.colors.primary },
            ]}
          >
            <Ionicons
              name="flash"
              size={24}
              color={lightTheme.colors.primary}
            />
            <View style={styles.testButtonContent}>
              <Text
                style={[
                  styles.testButtonTitle,
                  { color: lightTheme.colors.text },
                ]}
              >
                Quick Actions
              </Text>
              <Text
                style={[
                  styles.testButtonDesc,
                  { color: lightTheme.colors.textSecondary },
                ]}
              >
                Testar botões na notificação (+200ml, +500ml)
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={lightTheme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View
          style={[styles.section, { backgroundColor: lightTheme.colors.card }]}
        >
          <Text
            style={[styles.sectionTitle, { color: lightTheme.colors.text }]}
          >
            Como Testar Quick Actions
          </Text>
          <View style={styles.instructionItem}>
            <Text
              style={[
                styles.instructionNumber,
                { color: lightTheme.colors.primary },
              ]}
            >
              1
            </Text>
            <Text
              style={[
                styles.instructionText,
                { color: lightTheme.colors.textSecondary },
              ]}
            >
              Toque em &quot;Quick Actions&quot; acima
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text
              style={[
                styles.instructionNumber,
                { color: lightTheme.colors.primary },
              ]}
            >
              2
            </Text>
            <Text
              style={[
                styles.instructionText,
                { color: lightTheme.colors.textSecondary },
              ]}
            >
              Arraste a notificação para baixo (iOS) ou expanda (Android)
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text
              style={[
                styles.instructionNumber,
                { color: lightTheme.colors.primary },
              ]}
            >
              3
            </Text>
            <Text
              style={[
                styles.instructionText,
                { color: lightTheme.colors.textSecondary },
              ]}
            >
              Toque nos botões &quot;+200ml&quot; ou &quot;+500ml&quot;
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text
              style={[
                styles.instructionNumber,
                { color: lightTheme.colors.primary },
              ]}
            >
              4
            </Text>
            <Text
              style={[
                styles.instructionText,
                { color: lightTheme.colors.textSecondary },
              ]}
            >
              A água será registrada automaticamente!
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  refreshButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
  },
  testButtonContent: {
    flex: 1,
  },
  testButtonTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  testButtonDesc: {
    fontSize: 14,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  instructionNumber: {
    fontSize: 18,
    fontWeight: "bold",
    width: 28,
    height: 28,
    textAlign: "center",
    lineHeight: 28,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
