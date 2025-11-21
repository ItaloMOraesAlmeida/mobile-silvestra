/**
 * Foods Store - State Management para Banco de Alimentos TACO
 * Sprint 7 - Silvestra App
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Food,
  FoodCategory,
  FoodSearchParams,
  FoodFilterParams,
  FoodListResponse,
} from "../types/food.types";
import { foodService } from "../services/food.service";

interface FoodsState {
  // Data
  foods: Food[];
  categories: FoodCategory[];
  selectedFood: Food | null;
  favorites: string[]; // IDs dos alimentos favoritos
  recentSearches: string[];
  comparisonList: string[]; // IDs para comparação

  // UI State
  loading: boolean;
  error: string | null;

  // Pagination & Search
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchTerm: string;
  activeFilters: FoodFilterParams;
  selectedCategoryId: string | null;

  // Cache
  cache: Map<string, { data: Food; timestamp: number }>;
  cacheTimeout: number; // 5 minutos

  // Actions - Search & List
  searchFoods: (params?: FoodSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;

  // Actions - Filters
  setFilters: (filters: FoodFilterParams) => Promise<void>;
  clearFilters: () => void;
  setSelectedCategory: (categoryId: string | null) => void;

  // Actions - Food Details
  getFoodById: (id: string) => Promise<Food>;
  setSelectedFood: (food: Food | null) => void;

  // Actions - Categories
  loadCategories: () => Promise<void>;

  // Actions - Favorites
  toggleFavorite: (foodId: string) => Promise<void>;
  loadFavorites: () => Promise<void>;
  getFavoritesList: () => Promise<Food[]>;

  // Actions - Recent Searches
  addRecentSearch: (term: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;

  // Actions - Comparison
  addToComparison: (foodId: string) => void;
  removeFromComparison: (foodId: string) => void;
  clearComparison: () => void;
  getComparisonList: () => Promise<Food[]>;

  // Actions - Cache
  clearCache: () => void;

  // Actions - Reset
  reset: () => void;
}

const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutos
const MAX_RECENT_SEARCHES = 10;
const MAX_COMPARISON = 5;

const FAVORITES_KEY = "@silvestra:food_favorites";
const RECENT_SEARCHES_KEY = "@silvestra:recent_searches";

export const useFoodsStore = create<FoodsState>((set, get) => ({
  // Initial State
  foods: [],
  categories: [],
  selectedFood: null,
  favorites: [],
  recentSearches: [],
  comparisonList: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  searchTerm: "",
  activeFilters: {},
  selectedCategoryId: null,
  cache: new Map(),
  cacheTimeout: CACHE_TIMEOUT,

  // Search & List
  searchFoods: async (params = {}) => {
    set({ loading: true, error: null });

    try {
      const { searchTerm, selectedCategoryId, activeFilters } = get();

      const searchParams: FoodSearchParams = {
        search: params.search ?? searchTerm,
        categoryId: params.categoryId ?? selectedCategoryId ?? undefined,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        orderBy: params.orderBy ?? "name",
        order: params.order ?? "asc",
      };

      let response: FoodListResponse;

      // Se houver filtros ativos, usar endpoint de filtros
      if (Object.keys(activeFilters).length > 0) {
        const foods = await foodService.filterFoods(
          {
            ...activeFilters,
            categories: selectedCategoryId ? [selectedCategoryId] : undefined,
          },
          // repassar signal se foi fornecido nos params para permitir cancelamento
          (params as any).signal
        );
        response = {
          items: foods,
          total: foods.length,
          page: 1,
          limit: foods.length,
          totalPages: 1,
        };
      } else {
        response = await foodService.searchFoods(searchParams);
      }

      set({
        foods: response.items,
        currentPage: response.page,
        totalPages: response.totalPages,
        totalItems: response.total,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao buscar alimentos",
        loading: false,
      });
    }
  },

  loadMore: async () => {
    const { currentPage, totalPages, loading } = get();

    if (loading || currentPage >= totalPages) return;

    set({ loading: true });

    try {
      const { searchTerm, selectedCategoryId, foods } = get();

      const response = await foodService.searchFoods({
        search: searchTerm || undefined,
        categoryId: selectedCategoryId || undefined,
        page: currentPage + 1,
        limit: 20,
      });

      set({
        foods: [...foods, ...response.items],
        currentPage: response.page,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar mais alimentos",
        loading: false,
      });
    }
  },

  setSearchTerm: (term: string) => {
    set({ searchTerm: term, currentPage: 1 });
  },

  clearSearch: () => {
    set({ searchTerm: "", currentPage: 1 });
    get().searchFoods();
  },

  // Filters
  setFilters: async (filters: FoodFilterParams) => {
    set({ activeFilters: filters, currentPage: 1 });
    await get().searchFoods();
  },

  clearFilters: () => {
    set({ activeFilters: {}, currentPage: 1 });
    get().searchFoods();
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategoryId: categoryId, currentPage: 1 });
    get().searchFoods();
  },

  // Food Details
  getFoodById: async (id: string) => {
    const { cache } = get();
    const now = Date.now();

    // Verificar cache
    const cached = cache.get(id);
    if (cached && now - cached.timestamp < CACHE_TIMEOUT) {
      return cached.data;
    }

    // Buscar da API
    const food = await foodService.getFoodById(id);

    // Atualizar cache
    const newCache = new Map(cache);
    newCache.set(id, { data: food, timestamp: now });
    set({ cache: newCache });

    return food;
  },

  setSelectedFood: (food: Food | null) => {
    set({ selectedFood: food });
  },

  // Categories
  loadCategories: async () => {
    try {
      const response = await foodService.getCategories();

      // Validação defensiva: garante que seja sempre um array
      const categories = Array.isArray(response) ? response : [];

      set({ categories });
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error);
      set({
        error: error.message || "Erro ao carregar categorias",
        categories: [], // Garante array vazio em caso de erro
      });
    }
  },

  // Favorites
  toggleFavorite: async (foodId: string) => {
    const { favorites } = get();
    const isFavorite = favorites.includes(foodId);

    const newFavorites = isFavorite
      ? favorites.filter((id) => id !== foodId)
      : [...favorites, foodId];

    set({ favorites: newFavorites });

    // Salvar no AsyncStorage
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Erro ao salvar favoritos:", error);
    }
  },

  loadFavorites: async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const favorites = JSON.parse(stored);
        set({ favorites });
      }
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
    }
  },

  getFavoritesList: async () => {
    const { favorites } = get();
    if (favorites.length === 0) return [];

    try {
      return await foodService.getFavorites(favorites);
    } catch (error) {
      console.error("Erro ao buscar favoritos:", error);
      return [];
    }
  },

  // Recent Searches
  addRecentSearch: async (term: string) => {
    const { recentSearches } = get();

    if (!term.trim() || term.length < 2) return;

    // Remove duplicatas e adiciona no início
    const filtered = recentSearches.filter((s) => s !== term);
    const newSearches = [term, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    set({ recentSearches: newSearches });

    // Salvar no AsyncStorage
    try {
      await AsyncStorage.setItem(
        RECENT_SEARCHES_KEY,
        JSON.stringify(newSearches)
      );
    } catch (error) {
      console.error("Erro ao salvar buscas recentes:", error);
    }
  },

  clearRecentSearches: async () => {
    set({ recentSearches: [] });
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Erro ao limpar buscas recentes:", error);
    }
  },

  // Comparison
  addToComparison: (foodId: string) => {
    const { comparisonList } = get();

    if (comparisonList.includes(foodId)) return;

    if (comparisonList.length >= MAX_COMPARISON) {
      set({
        error: `Você pode comparar no máximo ${MAX_COMPARISON} alimentos`,
      });
      return;
    }

    set({ comparisonList: [...comparisonList, foodId] });
  },

  removeFromComparison: (foodId: string) => {
    const { comparisonList } = get();
    set({ comparisonList: comparisonList.filter((id) => id !== foodId) });
  },

  clearComparison: () => {
    set({ comparisonList: [] });
  },

  getComparisonList: async () => {
    const { comparisonList } = get();
    if (comparisonList.length === 0) return [];

    try {
      return await foodService.compareFoods(comparisonList);
    } catch (error) {
      console.error("Erro ao buscar comparação:", error);
      return [];
    }
  },

  // Cache
  clearCache: () => {
    set({ cache: new Map() });
  },

  // Reset
  reset: () => {
    set({
      foods: [],
      selectedFood: null,
      loading: false,
      error: null,
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      searchTerm: "",
      activeFilters: {},
      selectedCategoryId: null,
      comparisonList: [],
      cache: new Map(),
    });
  },
}));

// Carregar favoritos e buscas recentes ao inicializar
(async () => {
  try {
    const [favoritesStored, recentSearchesStored] = await Promise.all([
      AsyncStorage.getItem(FAVORITES_KEY),
      AsyncStorage.getItem(RECENT_SEARCHES_KEY),
    ]);

    const updates: Partial<FoodsState> = {};

    if (favoritesStored) {
      updates.favorites = JSON.parse(favoritesStored);
    }

    if (recentSearchesStored) {
      updates.recentSearches = JSON.parse(recentSearchesStored);
    }

    if (Object.keys(updates).length > 0) {
      useFoodsStore.setState(updates);
    }
  } catch (error) {
    console.error("Erro ao carregar dados do AsyncStorage:", error);
  }
})();
