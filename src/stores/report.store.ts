/**
 * Zustand store para gerenciamento de relatórios
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReportMetadata } from "../types/report.types";

interface ReportState {
  /** Lista de relatórios salvos */
  reports: ReportMetadata[];

  /** Flag indicando se está gerando relatório */
  isGenerating: boolean;

  /** ID do relatório sendo gerado */
  currentReportId: string | null;

  // Ações

  /**
   * Adiciona um novo relatório
   */
  addReport: (report: ReportMetadata) => void;

  /**
   * Remove um relatório
   */
  removeReport: (reportId: string) => void;

  /**
   * Atualiza um relatório
   */
  updateReport: (reportId: string, updates: Partial<ReportMetadata>) => void;

  /**
   * Busca um relatório por ID
   */
  getReportById: (reportId: string) => ReportMetadata | undefined;

  /**
   * Busca relatórios de um paciente
   */
  getReportsByPatient: (patientId: string) => ReportMetadata[];

  /**
   * Define estado de geração
   */
  setGenerating: (isGenerating: boolean, reportId?: string) => void;

  /**
   * Limpa todos os relatórios
   */
  clearReports: () => void;
}

export const reportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      reports: [],
      isGenerating: false,
      currentReportId: null,

      addReport: (report) => {
        set((state) => ({
          reports: [report, ...state.reports],
        }));
        console.log("✅ Relatório adicionado ao store:", report.id);
      },

      removeReport: (reportId) => {
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== reportId),
        }));
        console.log("🗑️ Relatório removido do store:", reportId);
      },

      updateReport: (reportId, updates) => {
        set((state) => ({
          reports: state.reports.map((r) =>
            r.id === reportId ? { ...r, ...updates } : r
          ),
        }));
        console.log("🔄 Relatório atualizado:", reportId);
      },

      getReportById: (reportId) => {
        return get().reports.find((r) => r.id === reportId);
      },

      getReportsByPatient: (patientId) => {
        return get().reports.filter((r) => r.patientId === patientId);
      },

      setGenerating: (isGenerating, reportId) => {
        set({
          isGenerating,
          currentReportId: reportId || null,
        });
      },

      clearReports: () => {
        set({ reports: [] });
        console.log("🧹 Todos os relatórios removidos");
      },
    }),
    {
      name: "silvestra-reports", // Nome da chave no AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persistir apenas a lista de relatórios (não flags de loading)
        reports: state.reports,
      }),
    }
  )
);
