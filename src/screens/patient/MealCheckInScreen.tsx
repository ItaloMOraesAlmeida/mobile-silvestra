/**
 * MealCheckInScreen
 * Feature #4 - App do Paciente
 *
 * Tela para registrar consumo de refeição
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightTheme } from "../../theme";
import { createMealConsumption } from "../../services/meal-consumption.service";

interface MealCheckInScreenProps {
  navigation: any;
  route: any;
}

export function MealCheckInScreen({
  navigation,
  route,
}: MealCheckInScreenProps) {
  const { mealId, mealName, patientId } = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = React.useState(false);
  const [consumedAt, setConsumedAt] = React.useState(new Date());
  const [notes, setNotes] = React.useState("");
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "success"
  );
  const toastAnimation = React.useRef(new Animated.Value(0)).current;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(consumedAt);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setConsumedAt(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(consumedAt);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setConsumedAt(newDate);
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    Animated.sequence([
      Animated.timing(toastAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleSubmit = async () => {
    if (!mealId || !patientId) {
      showToast("Dados inválidos. Tente novamente.", "error");
      return;
    }

    setLoading(true);

    try {
      await createMealConsumption({
        mealId,
        patientId,
        consumedAt: consumedAt.toISOString(),
        notes: notes.trim() || undefined,
      });

      showToast(
        "🎉 Refeição registrada com sucesso! Continue assim!",
        "success"
      );

      // Voltar para a tela anterior após 1.5 segundos
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      console.error("Erro ao registrar consumo:", err);
      const errorMessage =
        err?.response?.data?.message ||
        "Erro ao registrar consumo. Tente novamente.";

      // Tratamento especial para erro de duplicata
      if (
        errorMessage.includes("duplicado") ||
        errorMessage.includes("já foi registrado")
      ) {
        showToast("⚠️ Você já registrou esta refeição hoje", "error");
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      } else {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={lightTheme.colors.success}
        translucent={false}
      />
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[lightTheme.colors.success, "#2ea043"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={lightTheme.colors.white} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={lightTheme.colors.white}
              />
            </View>
            <Text style={styles.headerTitle}>Check-in de Refeição</Text>
            <Text style={styles.headerSubtitle}>{mealName}</Text>
          </View>
        </LinearGradient>

        {/* Form */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            {/* Data e Hora */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quando você consumiu?</Text>

              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <View style={styles.dateTimeTextContainer}>
                    <Text style={styles.dateTimeLabel}>Data</Text>
                    <Text style={styles.dateTimeValue}>
                      {formatDate(consumedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons
                    name="time-outline"
                    size={24}
                    color={lightTheme.colors.primary}
                  />
                  <View style={styles.dateTimeTextContainer}>
                    <Text style={styles.dateTimeLabel}>Hora</Text>
                    <Text style={styles.dateTimeValue}>
                      {formatTime(consumedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={consumedAt}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={consumedAt}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Notas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observações (opcional)</Text>
              <Text style={styles.sectionDescription}>
                Como foi a refeição? Alguma modificação?
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Ex: Estava delicioso! Adicionei um pouco mais de legumes..."
                placeholderTextColor={lightTheme.colors.gray[400]}
                multiline
                numberOfLines={4}
                value={notes}
                onChangeText={setNotes}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {notes.length}/500 caracteres
              </Text>
            </View>

            {/* Dicas */}
            <View style={styles.tipsContainer}>
              <View style={styles.tipHeader}>
                <Ionicons
                  name="bulb-outline"
                  size={20}
                  color={lightTheme.colors.warning}
                />
                <Text style={styles.tipTitle}>Dicas</Text>
              </View>
              <Text style={styles.tipText}>
                • Registre suas refeições logo após consumi-las
              </Text>
              <Text style={styles.tipText}>
                • Anote como se sentiu após a refeição
              </Text>
              <Text style={styles.tipText}>
                • Compartilhe qualquer alteração que fez
              </Text>
            </View>

            {/* Action Button */}
            <View
              style={[
                styles.footer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={lightTheme.colors.white} />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={lightTheme.colors.white}
                    />
                    <Text style={styles.submitButtonText}>
                      Confirmar Check-in
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            toastType === "success" ? styles.toastSuccess : styles.toastError,
            {
              opacity: toastAnimation,
              transform: [
                {
                  translateY: toastAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Ionicons
            name={toastType === "success" ? "checkmark-circle" : "alert-circle"}
            size={24}
            color={lightTheme.colors.white}
          />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    alignItems: "center",
    marginTop: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: lightTheme.colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: lightTheme.colors.white,
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  formContainer: {
    gap: 24,
  },
  section: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: lightTheme.colors.gray[600],
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
  },
  dateTimeTextContainer: {
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.gray[900],
  },
  textArea: {
    minHeight: 100,
    padding: 12,
    fontSize: 16,
    color: lightTheme.colors.gray[900],
    backgroundColor: lightTheme.colors.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.colors.gray[200],
    textAlignVertical: "top",
  },
  characterCount: {
    marginTop: 8,
    fontSize: 12,
    color: lightTheme.colors.gray[500],
    textAlign: "right",
  },
  tipsContainer: {
    backgroundColor: lightTheme.colors.warning + "10",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: lightTheme.colors.warning + "30",
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: lightTheme.colors.gray[900],
  },
  tipText: {
    fontSize: 14,
    color: lightTheme.colors.gray[700],
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    marginTop: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: lightTheme.colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: lightTheme.colors.white,
  },
  toast: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: lightTheme.colors.success,
  },
  toastError: {
    backgroundColor: lightTheme.colors.error,
  },
  toastText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: lightTheme.colors.white,
    lineHeight: 20,
  },
});
