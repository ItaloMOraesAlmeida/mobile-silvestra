import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemedStyles, useTheme } from "../../hooks/useTheme";
import type { Theme } from "../../theme";
import type {
  BodyMeasurement,
  UpdateBodyMeasurementDto,
} from "../../types/patient-details.types";
import { PhotoPicker } from "../patient/PhotoPicker";

interface EditMeasurementModalProps {
  visible: boolean;
  patientId: string;
  measurement: BodyMeasurement | null;
  onClose: () => void;
  onSubmit: (
    measurementId: string,
    data: UpdateBodyMeasurementDto
  ) => Promise<void>;
}

export const EditMeasurementModal: React.FC<EditMeasurementModalProps> = ({
  visible,
  patientId,
  measurement,
  onClose,
  onSubmit,
}) => {
  const styles = useThemedStyles(createStyles);
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Basic measurements
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  // Circumferences
  const [neck, setNeck] = useState("");
  const [shoulder, setShoulder] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [hip, setHip] = useState("");
  const [rightThigh, setRightThigh] = useState("");
  const [leftThigh, setLeftThigh] = useState("");
  const [rightCalf, setRightCalf] = useState("");
  const [leftCalf, setLeftCalf] = useState("");
  const [rightArm, setRightArm] = useState("");
  const [leftArm, setLeftArm] = useState("");
  const [rightForearm, setRightForearm] = useState("");
  const [leftForearm, setLeftForearm] = useState("");

  // Body composition
  const [bodyFatPercent, setBodyFatPercent] = useState("");
  const [muscleMass, setMuscleMass] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // Photos
  const [frontPhoto, setFrontPhoto] = useState<string>("");
  const [sidePhoto, setSidePhoto] = useState<string>("");
  const [backPhoto, setBackPhoto] = useState<string>("");

  // Pre-fill form when measurement changes
  useEffect(() => {
    if (measurement && visible) {
      setWeight(measurement.weight?.toString() || "");
      setHeight(measurement.height?.toString() || "");
      setNeck(measurement.neckCirc?.toString() || "");
      setShoulder(measurement.shoulderCirc?.toString() || "");
      setChest(measurement.chestCirc?.toString() || "");
      setWaist(measurement.waistCirc?.toString() || "");
      setAbdomen(measurement.abdomenCirc?.toString() || "");
      setHip(measurement.hipCirc?.toString() || "");
      setRightThigh(measurement.thighCirc?.toString() || "");
      setLeftThigh(""); // DTO doesn't have separate left/right
      setRightCalf(measurement.calfCirc?.toString() || "");
      setLeftCalf("");
      setRightArm(measurement.rightArmCirc?.toString() || "");
      setLeftArm(measurement.leftArmCirc?.toString() || "");
      setRightForearm(measurement.forearmCirc?.toString() || "");
      setLeftForearm("");
      setBodyFatPercent(measurement.bodyFatPercent?.toString() || "");
      setMuscleMass(measurement.muscleMass?.toString() || "");
      setNotes(measurement.notes || "");
      setFrontPhoto(measurement.photoFront || "");
      setSidePhoto(measurement.photoSide || "");
      setBackPhoto(measurement.photoBack || "");
    }
  }, [measurement, visible]);

  const handleReset = () => {
    setWeight("");
    setHeight("");
    setNeck("");
    setShoulder("");
    setChest("");
    setWaist("");
    setAbdomen("");
    setHip("");
    setRightThigh("");
    setLeftThigh("");
    setRightCalf("");
    setLeftCalf("");
    setRightArm("");
    setLeftArm("");
    setRightForearm("");
    setLeftForearm("");
    setBodyFatPercent("");
    setMuscleMass("");
    setNotes("");
    setFrontPhoto("");
    setSidePhoto("");
    setBackPhoto("");
  };

  const handleClose = () => {
    if (!loading) {
      handleReset();
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!measurement) {
      Alert.alert("Erro", "Nenhuma medição selecionada");
      return;
    }

    // Validate required fields
    if (!weight || !height) {
      Alert.alert("Campos obrigatórios", "Peso e altura são obrigatórios");
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert("Erro", "Peso deve ser um número válido maior que zero");
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0) {
      Alert.alert("Erro", "Altura deve ser um número válido maior que zero");
      return;
    }

    const data: UpdateBodyMeasurementDto = {
      weight: weightNum,
      height: heightNum,
      neckCirc: neck ? parseFloat(neck) : undefined,
      shoulderCirc: shoulder ? parseFloat(shoulder) : undefined,
      chestCirc: chest ? parseFloat(chest) : undefined,
      waistCirc: waist ? parseFloat(waist) : undefined,
      abdomenCirc: abdomen ? parseFloat(abdomen) : undefined,
      hipCirc: hip ? parseFloat(hip) : undefined,
      thighCirc:
        rightThigh || leftThigh
          ? parseFloat(rightThigh || leftThigh)
          : undefined,
      calfCirc:
        rightCalf || leftCalf ? parseFloat(rightCalf || leftCalf) : undefined,
      rightArmCirc: rightArm ? parseFloat(rightArm) : undefined,
      leftArmCirc: leftArm ? parseFloat(leftArm) : undefined,
      forearmCirc:
        rightForearm || leftForearm
          ? parseFloat(rightForearm || leftForearm)
          : undefined,
      bodyFatPercent: bodyFatPercent ? parseFloat(bodyFatPercent) : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      photoFront: frontPhoto || undefined,
      photoSide: sidePhoto || undefined,
      photoBack: backPhoto || undefined,
      notes: notes.trim() || undefined,
    };

    try {
      setLoading(true);
      await onSubmit(measurement.id, data);
      handleReset();
      onClose();
      Alert.alert("Sucesso", "Medição atualizada com sucesso!");
    } catch (error) {
      console.error("Error updating measurement:", error);
      Alert.alert("Erro", "Não foi possível atualizar a medição");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    required = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="decimal-pad"
        editable={!loading}
      />
    </View>
  );

  const renderSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    content: React.ReactNode
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={24} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {content}
    </View>
  );

  if (!measurement) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Medição</Text>
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Salvando..." : "Salvar"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Measurements */}
          {renderSection(
            "Medições Básicas",
            "fitness",
            <View style={styles.row}>
              {renderInput("Peso (kg)", weight, setWeight, "Ex: 70.5", true)}
              {renderInput("Altura (cm)", height, setHeight, "Ex: 175", true)}
            </View>
          )}

          {/* Circumferences */}
          {renderSection(
            "Circunferências (cm)",
            "ellipse",
            <>
              <View style={styles.row}>
                {renderInput("Pescoço", neck, setNeck, "Ex: 38")}
                {renderInput("Ombro", shoulder, setShoulder, "Ex: 115")}
              </View>
              <View style={styles.row}>
                {renderInput("Tórax", chest, setChest, "Ex: 95")}
                {renderInput("Cintura", waist, setWaist, "Ex: 80")}
              </View>
              <View style={styles.row}>
                {renderInput("Abdômen", abdomen, setAbdomen, "Ex: 85")}
                {renderInput("Quadril", hip, setHip, "Ex: 95")}
              </View>
              <View style={styles.row}>
                {renderInput("Coxa D", rightThigh, setRightThigh, "Ex: 55")}
                {renderInput("Coxa E", leftThigh, setLeftThigh, "Ex: 55")}
              </View>
              <View style={styles.row}>
                {renderInput(
                  "Panturrilha D",
                  rightCalf,
                  setRightCalf,
                  "Ex: 36"
                )}
                {renderInput("Panturrilha E", leftCalf, setLeftCalf, "Ex: 36")}
              </View>
              <View style={styles.row}>
                {renderInput("Braço D", rightArm, setRightArm, "Ex: 32")}
                {renderInput("Braço E", leftArm, setLeftArm, "Ex: 32")}
              </View>
              <View style={styles.row}>
                {renderInput(
                  "Antebraço D",
                  rightForearm,
                  setRightForearm,
                  "Ex: 27"
                )}
                {renderInput(
                  "Antebraço E",
                  leftForearm,
                  setLeftForearm,
                  "Ex: 27"
                )}
              </View>
            </>
          )}

          {/* Body Composition */}
          {renderSection(
            "Composição Corporal",
            "analytics",
            <>
              <View style={styles.row}>
                {renderInput(
                  "Gordura Corporal (%)",
                  bodyFatPercent,
                  setBodyFatPercent,
                  "Ex: 18"
                )}
                {renderInput(
                  "Massa Muscular (kg)",
                  muscleMass,
                  setMuscleMass,
                  "Ex: 55"
                )}
              </View>
            </>
          )}

          {/* Notes */}
          {renderSection(
            "Observações",
            "document-text",
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Adicione observações sobre esta medição..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          )}

          {/* Photos */}
          {renderSection(
            "Fotos Progresso",
            "camera",
            <>
              <PhotoPicker
                label="Foto Frontal"
                value={frontPhoto}
                onPhotoSelected={(url) => {
                  setFrontPhoto(url);
                }}
                onPhotoRemoved={() => setFrontPhoto("")}
                disabled={loading}
                patientId={patientId}
                photoType="front"
                useCloudStorage={true}
              />
              <PhotoPicker
                label="Foto Lateral"
                value={sidePhoto}
                onPhotoSelected={(url) => {
                  setSidePhoto(url);
                }}
                onPhotoRemoved={() => setSidePhoto("")}
                disabled={loading}
                patientId={patientId}
                photoType="side"
                useCloudStorage={true}
              />
              <PhotoPicker
                label="Foto Costas"
                value={backPhoto}
                onPhotoSelected={(url) => {
                  setBackPhoto(url);
                }}
                onPhotoRemoved={() => setBackPhoto("")}
                disabled={loading}
                patientId={patientId}
                photoType="back"
                useCloudStorage={true}
              />
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      ...theme.shadows.sm,
    },
    closeButton: {
      padding: theme.spacing.xs,
      width: 70,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
    },
    submitButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      width: 100,
      alignItems: "center",
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.white,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.md,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text,
    },
    row: {
      flexDirection: "row",
      gap: theme.spacing.md,
    },
    inputContainer: {
      flex: 1,
      marginBottom: theme.spacing.md,
    },
    inputLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    required: {
      color: theme.colors.error,
    },
    input: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 100,
      paddingTop: theme.spacing.sm,
    },
    bottomSpacer: {
      height: theme.spacing.xl,
    },
  });
