import { useState, useCallback } from "react";
import { AxiosError, AxiosRequestConfig } from "axios";
import api from "../services/api";
import { ApiResponse } from "../types";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: () => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  config: AxiosRequestConfig,
  immediate = false
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async (): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.request<ApiResponse<T>>(config);
      const data = response.data.data || null;

      setState({
        data,
        loading: false,
        error: null,
      });

      return data;
    } catch (err) {
      const error = err as AxiosError<ApiResponse<any>>;
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Ocorreu um erro inesperado";

      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });

      return null;
    }
  }, [config]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  // Executar imediatamente se solicitado
  useState(() => {
    if (immediate) {
      execute();
    }
  });

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook para requisições GET
export function useGet<T = any>(url: string, immediate = false) {
  return useApi<T>({ method: "GET", url }, immediate);
}

// Hook para requisições POST
export function usePost<T = any>(url: string) {
  return useApi<T>({ method: "POST", url }, false);
}

// Hook para requisições PUT
export function usePut<T = any>(url: string) {
  return useApi<T>({ method: "PUT", url }, false);
}

// Hook para requisições PATCH
export function usePatch<T = any>(url: string) {
  return useApi<T>({ method: "PATCH", url }, false);
}

// Hook para requisições DELETE
export function useDelete<T = any>(url: string) {
  return useApi<T>({ method: "DELETE", url }, false);
}
