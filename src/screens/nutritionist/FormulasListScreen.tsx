import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { lightTheme } from "../../theme";
import { formulaService } from "../../services";
import type { CustomFormula } from "../../types/formula.types";
import {
  FormulaOutputTypeLabels,
  FormulaCategories,
} from "../../types/formula.types";

interface FormulasListScreenProps {
  navigation: any;
}

export default function FormulasListScreen({
  navigation,
}: FormulasListScreenProps) {
  const [formulas, setFormulas] = useState<CustomFormula[]>([]);
  const [filteredFormulas, setFilteredFormulas] = useState<CustomFormula[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");

  // Carrega as fórmulas
  const loadFormulas = async () => {
    try {
      const response = await formulaService.getAll();

      // A API pode retornar { success: true, data: [...] } ou [...] diretamente
      const data = (response as any).data || response;

      // Garantir que data é um array
      const formulasArray = Array.isArray(data) ? data : [];

      setFormulas(formulasArray);
      setFilteredFormulas(formulasArray);
    } catch (error: any) {
      console.error("Erro ao carregar fórmulas:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível carregar as fórmulas",
      });
      // Em caso de erro, garantir que os arrays estejam vazios
      setFormulas([]);
      setFilteredFormulas([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFormulas();
    }, [])
  );

  // Filtra fórmulas por busca e categoria
  useEffect(() => {
    // Garantir que formulas é sempre um array
    const formulasArray = Array.isArray(formulas) ? formulas : [];
    let filtered = formulasArray;

    // Filtro por busca
    if (searchQuery && filtered.length > 0) {
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por categoria
    if (selectedCategory !== "Todas" && filtered.length > 0) {
      filtered = filtered.filter((f) => f.category === selectedCategory);
    }

    setFilteredFormulas(filtered);
  }, [searchQuery, selectedCategory, formulas]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFormulas();
  };

  const handleDelete = (formula: CustomFormula) => {
    if (formula.isPublic) {
      Toast.show({
        type: "info",
        text1: "Fórmula Pública",
        text2: "Fórmulas públicas não podem ser excluídas",
      });
      return;
    }

    Alert.alert(
      "Excluir Fórmula",
      `Tem certeza que deseja excluir "${formula.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await formulaService.delete(formula.id);
              Toast.show({
                type: "success",
                text1: "Sucesso",
                text2: "Fórmula excluída com sucesso",
              });
              loadFormulas();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Erro",
                text2: error.message || "Não foi possível excluir a fórmula",
              });
            }
          },
        },
      ]
    );
  };

  const handleClone = async (formula: CustomFormula) => {
    if (!formula.isPublic) {
      Toast.show({
        type: "info",
        text1: "Fórmula Privada",
        text2: "Apenas fórmulas públicas podem ser clonadas",
      });
      return;
    }

    try {
      await formulaService.clonePublicFormula(formula.id);
      Toast.show({
        type: "success",
        text1: "Sucesso",
        text2: "Fórmula clonada com sucesso",
      });
      loadFormulas();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Não foi possível clonar a fórmula",
      });
    }
  };

  const renderFormulaCard = ({ item }: { item: CustomFormula }) => (
    <TouchableOpacity
      style={styles.formulaCard}
      onPress={() =>
        navigation.navigate("FormulaDetails", { formulaId: item.id })
      }
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Ionicons
            name="calculator"
            size={20}
            color={lightTheme.colors.primary}
            style={styles.cardIcon}
          />
          <Text style={styles.formulaName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>

        {item.isPublic && (
          <View style={styles.publicBadge}>
            <Ionicons
              name="globe-outline"
              size={12}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.publicBadgeText}>Pública</Text>
          </View>
        )}
      </View>

      {/* Descrição */}
      {item.description && (
        <Text style={styles.formulaDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      {/* Info Row */}
      <View style={styles.infoRow}>
        {/* Categoria */}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}

        {/* Output Type */}
        <View style={styles.outputBadge}>
          <Text style={styles.outputText}>
            {FormulaOutputTypeLabels[item.outputType]}
          </Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Ionicons
            name="play-circle-outline"
            size={16}
            color={lightTheme.colors.gray[600]}
          />
          <Text style={styles.statText}>{item.usageCount} usos</Text>
        </View>

        <View style={styles.stat}>
          <Ionicons
            name="analytics-outline"
            size={16}
            color={lightTheme.colors.gray[600]}
          />
          <Text style={styles.statText}>
            {item._count?.results || 0} resultados
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        {item.isPublic && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleClone(item)}
          >
            <Ionicons
              name="copy-outline"
              size={18}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Clonar</Text>
          </TouchableOpacity>
        )}

        {!item.isPublic && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("FormulaEditor", { formulaId: item.id })
            }
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={lightTheme.colors.primary}
            />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("CalculateFormula", { formulaId: item.id })
          }
        >
          <Ionicons
            name="calculator-outline"
            size={18}
            color={lightTheme.colors.success}
          />
          <Text
            style={[
              styles.actionButtonText,
              { color: lightTheme.colors.success },
            ]}
          >
            Calcular
          </Text>
        </TouchableOpacity>

        {!item.isPublic && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={lightTheme.colors.error}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="calculator-outline"
        size={80}
        color={lightTheme.colors.gray[300]}
      />
      <Text style={styles.emptyTitle}>Nenhuma fórmula encontrada</Text>
      <Text style={styles.emptyText}>
        {searchQuery || selectedCategory !== "Todas"
          ? "Tente ajustar os filtros de busca"
          : "Crie sua primeira fórmula customizada"}
      </Text>
      {!searchQuery && selectedCategory === "Todas" && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate("FormulaEditor")}
        >
          <Ionicons name="add" size={24} color={lightTheme.colors.white} />
          <Text style={styles.emptyButtonText}>Criar Fórmula</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={lightTheme.colors.primary} />
          <Text style={styles.loadingText}>Carregando fórmulas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={lightTheme.colors.background}
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={lightTheme.colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar fórmulas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={lightTheme.colors.gray[400]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons
                name="close-circle"
                size={20}
                color={lightTheme.colors.gray[400]}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === "Todas" && styles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategory("Todas")}
        >
          <Text
            style={[
              styles.categoryChipText,
              selectedCategory === "Todas" && styles.categoryChipTextActive,
            ]}
          >
            Todas ({formulas.length})
          </Text>
        </TouchableOpacity>

        {[...FormulaCategories].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive,
              ]}
            >
              {category} (
              {formulas.filter((f) => f.category === category).length})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Lista de Fórmulas */}
      <FlatList
        data={filteredFormulas}
        renderItem={renderFormulaCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[lightTheme.colors.primary]}
            tintColor={lightTheme.colors.primary}
          />
        }
      />

      {/* FAB - Floating Action Button */}
      {filteredFormulas.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("FormulaEditor")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color={lightTheme.colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: lightTheme.colors.gray[600],
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: lightTheme.colors.background,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.gray[100],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,

    color: lightTheme.colors.text,
  },
  categoryScroll: {
    maxHeight: 50,
    backgroundColor: lightTheme.colors.background,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: lightTheme.colors.gray[100],
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: lightTheme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,

    color: lightTheme.colors.gray[600],
  },
  categoryChipTextActive: {
    color: lightTheme.colors.white,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formulaCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  cardIcon: {
    marginRight: 8,
  },
  formulaName: {
    flex: 1,
    fontSize: 16,

    color: lightTheme.colors.text,
  },
  publicBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${lightTheme.colors.primary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  publicBadgeText: {
    fontSize: 11,

    color: lightTheme.colors.primary,
  },
  formulaDescription: {
    fontSize: 14,

    color: lightTheme.colors.gray[600],
    marginBottom: 12,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: lightTheme.colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,

    color: lightTheme.colors.gray[700],
  },
  outputBadge: {
    backgroundColor: `${lightTheme.colors.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outputText: {
    fontSize: 12,

    color: lightTheme.colors.success,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 13,

    color: lightTheme.colors.gray[600],
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: lightTheme.colors.gray[200],
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    fontSize: 13,

    color: lightTheme.colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,

    color: lightTheme.colors.gray[700],
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,

    color: lightTheme.colors.gray[500],
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: lightTheme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: lightTheme.colors.white,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
