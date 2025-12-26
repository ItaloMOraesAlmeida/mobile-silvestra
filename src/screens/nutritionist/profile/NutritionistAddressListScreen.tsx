import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { ConfirmModal } from "../../../components/ui/confirm-modal";
import { nutritionistAddressService } from "../../../services/nutritionist/address.service";
import type { NutritionistAddress } from "../../../types/nutritionist/address";

interface NutritionistAddressListScreenProps {
  navigation: any;
}

export function NutritionistAddressListScreen({
  navigation,
}: NutritionistAddressListScreenProps) {
  const [addresses, setAddresses] = useState<NutritionistAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [addressToDelete, setAddressToDelete] =
    useState<NutritionistAddress | null>(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const data = await nutritionistAddressService.findAll();
      setAddresses(data);
    } catch (error: any) {
      console.error("Erro ao carregar endereços:", error);
      setAddresses([]);
      // Apenas mostrar erro para problemas reais de servidor/rede
      const status = error.response?.status;
      if (status && status >= 500) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível carregar os endereços. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  const handleEdit = (address: NutritionistAddress) => {
    navigation.navigate("NutritionistAddressForm", { addressId: address.id });
  };

  const handleDelete = (address: NutritionistAddress) => {
    setAddressToDelete(address);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete) return;

    try {
      setDeleting(addressToDelete.id);
      setDeleteModalVisible(false);
      await nutritionistAddressService.remove(addressToDelete.id);
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Endereço excluído com sucesso",
      });
      loadAddresses();
    } catch (error: any) {
      console.error("Erro ao excluir endereço:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message ||
          "Não foi possível excluir o endereço",
      });
    } finally {
      setDeleting(null);
      setAddressToDelete(null);
    }
  };

  const handleTogglePrimary = async (address: NutritionistAddress) => {
    if (address.isPrimary) {
      Toast.show({
        type: "info",
        text1: "Informação",
        text2: "Este já é o endereço principal",
      });
      return;
    }

    try {
      await nutritionistAddressService.update(address.id, { isPrimary: true });
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Endereço principal atualizado",
      });
      loadAddresses();
    } catch (error: any) {
      console.error("Erro ao atualizar endereço principal:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message ||
          "Não foi possível atualizar o endereço",
      });
    }
  };

  const handleToggleServiceLocation = async (address: NutritionistAddress) => {
    try {
      await nutritionistAddressService.update(address.id, {
        isServiceLocation: !address.isServiceLocation,
      });
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: address.isServiceLocation
          ? "Endereço removido dos locais de atendimento"
          : "Endereço adicionado aos locais de atendimento",
      });
      loadAddresses();
    } catch (error: any) {
      console.error("Erro ao atualizar local de atendimento:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          error.response?.data?.message ||
          "Não foi possível atualizar o endereço",
      });
    }
  };

  const renderAddress = ({ item }: { item: NutritionistAddress }) => (
    <View style={styles.addressCard}>
      <View style={styles.cardHeader}>
        <View style={styles.addressHeader}>
          <View style={styles.addressTitleRow}>
            <Ionicons name="location" size={20} color="#8b5a9f" />
            <Text style={styles.addressStreet}>
              {item.street}, {item.number}
            </Text>
          </View>
          <View style={styles.addressBadges}>
            {item.isPrimary && (
              <View style={[styles.badge, styles.primaryBadge]}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.badgeText}>Principal</Text>
              </View>
            )}
            {item.isServiceLocation && (
              <View style={[styles.badge, styles.serviceBadge]}>
                <Ionicons name="medical" size={12} color="#fff" />
                <Text style={styles.badgeText}>Atendimento</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.iconActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleEdit(item)}
          >
            <Ionicons name="pencil" size={20} color="#8b5a9f" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleDelete(item)}
            disabled={deleting === item.id}
          >
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#d32f2f" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#d32f2f" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.addressDetails}>
        {item.complement && (
          <Text style={styles.addressText}>Complemento: {item.complement}</Text>
        )}
        <Text style={styles.addressText}>
          {item.neighborhood} - {item.city}/{item.state}
        </Text>
        <Text style={styles.addressText}>CEP: {item.zipCode}</Text>
      </View>

      {(!item.isPrimary || !item.isServiceLocation) && (
        <View style={styles.addressActions}>
          {!item.isPrimary && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => handleTogglePrimary(item)}
            >
              <Ionicons name="star-outline" size={16} color="#8b5a9f" />
              <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
                Tornar Principal
              </Text>
            </TouchableOpacity>
          )}

          {!item.isServiceLocation && (
            <TouchableOpacity
              style={[styles.actionButton, styles.serviceButton]}
              onPress={() => handleToggleServiceLocation(item)}
            >
              <Ionicons name="medical-outline" size={16} color="#8b5a9f" />
              <Text style={[styles.actionButtonText, styles.serviceButtonText]}>
                Marcar como Local de Atendimento
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5a9f" />
          <Text style={styles.loadingText}>Carregando endereços...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {addresses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>Nenhum endereço cadastrado</Text>
          <Text style={styles.emptySubtitle}>
            Cadastre endereços para realizar atendimentos presenciais
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("NutritionistAddressForm")}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>
              Cadastrar Primeiro Endereço
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          renderItem={renderAddress}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <ConfirmModal
        visible={deleteModalVisible}
        title="Confirmar Exclusão"
        message={`Deseja realmente excluir o endereço:\n${addressToDelete?.street}, ${addressToDelete?.number}?`}
        icon="trash-outline"
        iconColor="#d32f2f"
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmColor="#d32f2f"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setAddressToDelete(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  listContent: {
    padding: 16,
  },
  separator: {
    height: 16,
  },
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  addressHeader: {
    flex: 1,
    marginRight: 8,
  },
  addressTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressStreet: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  iconActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  addressBadges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  primaryBadge: {
    backgroundColor: "#f59e0b",
  },
  serviceBadge: {
    backgroundColor: "#8b5a9f",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  addressDetails: {
    gap: 4,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  addressActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#f3e8f7",
    borderWidth: 1,
    borderColor: "#8b5a9f",
  },
  primaryButton: {
    backgroundColor: "#f3e8f7",
    borderColor: "#8b5a9f",
  },
  primaryButtonText: {
    color: "#8b5a9f",
  },
  serviceButton: {
    backgroundColor: "#f3e8f7",
    borderColor: "#8b5a9f",
  },
  serviceButtonText: {
    color: "#8b5a9f",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#8b5a9f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
