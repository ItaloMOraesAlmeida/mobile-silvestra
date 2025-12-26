import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LocalWaterLog,
  SyncQueueItem,
  CreateWaterLogDto,
} from "../../types/water";
import { createWaterLog, updateWaterSettings } from "./waterService";
import { format } from "date-fns";

const STORAGE_KEYS = {
  LOCAL_LOGS: "@silvestra:water_logs",
  SYNC_QUEUE: "@silvestra:water_sync_queue",
  LAST_SYNC: "@silvestra:water_last_sync",
};

// ==================== LOCAL STORAGE ====================

export const saveLocalLog = async (log: LocalWaterLog): Promise<void> => {
  const existing = await getLocalLogs();
  existing.push(log);
  await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(existing));
};

export const getLocalLogs = async (): Promise<LocalWaterLog[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_LOGS);
  return data ? JSON.parse(data) : [];
};

export const markLogAsSynced = async (localId: string): Promise<void> => {
  const logs = await getLocalLogs();
  const updated = logs.map((log) =>
    log.localId === localId ? { ...log, synced: true } : log
  );
  await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(updated));
};

export const removeOldSyncedLogs = async (
  daysToKeep: number = 7
): Promise<void> => {
  const logs = await getLocalLogs();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const filtered = logs.filter((log) => {
    if (!log.synced) return true; // Manter não sincronizados
    const logDate = new Date(log.createdAt);
    return logDate > cutoffDate;
  });

  await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(filtered));
};

// ==================== SYNC QUEUE ====================

export const addToSyncQueue = async (
  type: "CREATE_LOG" | "UPDATE_SETTINGS",
  data: any
): Promise<void> => {
  const queue = await getSyncQueue();
  const item: SyncQueueItem = {
    id: `${type}_${Date.now()}`,
    type,
    data,
    attempts: 0,
  };
  queue.push(item);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
};

export const getSyncQueue = async (): Promise<SyncQueueItem[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  return data ? JSON.parse(data) : [];
};

export const removeFromSyncQueue = async (itemId: string): Promise<void> => {
  const queue = await getSyncQueue();
  const filtered = queue.filter((item) => item.id !== itemId);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
};

export const updateSyncQueueAttempt = async (itemId: string): Promise<void> => {
  const queue = await getSyncQueue();
  const updated = queue.map((item) =>
    item.id === itemId
      ? {
          ...item,
          attempts: item.attempts + 1,
          lastAttempt: new Date().toISOString(),
        }
      : item
  );
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updated));
};

// ==================== SYNC LOGIC ====================

export const syncPendingData = async (): Promise<{
  success: number;
  failed: number;
}> => {
  const queue = await getSyncQueue();
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "CREATE_LOG") {
        await createWaterLog(item.data as CreateWaterLogDto);
        if (item.data.localId) {
          await markLogAsSynced(item.data.localId);
        }
      } else if (item.type === "UPDATE_SETTINGS") {
        await updateWaterSettings(item.data);
      }

      await removeFromSyncQueue(item.id);
      success++;
    } catch (error) {
      // Se falhou mais de 5 vezes, remover da fila
      if (item.attempts >= 5) {
        await removeFromSyncQueue(item.id);
        failed++;
      } else {
        await updateSyncQueueAttempt(item.id);
      }

      console.error("Erro ao sincronizar item:", item, error);
    }
  }

  // Atualizar timestamp da última sincronização
  await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

  // Limpar logs antigos sincronizados
  await removeOldSyncedLogs();

  return { success, failed };
};

export const getLastSyncTime = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
};

// ==================== OFFLINE-FIRST OPERATIONS ====================

/**
 * Criar log offline-first
 * Salva localmente e tenta sincronizar em background
 */
export const createWaterLogOffline = async (
  amount: number,
  notes?: string
): Promise<LocalWaterLog> => {
  const localId = `local_${Date.now()}`;
  const now = new Date().toISOString();

  const localLog: LocalWaterLog = {
    localId,
    amount,
    consumedAt: now,
    source: "APP",
    notes,
    synced: false,
    createdAt: now,
  };

  // Salvar localmente
  await saveLocalLog(localLog);

  // Adicionar à fila de sincronização
  await addToSyncQueue("CREATE_LOG", {
    amount,
    consumedAt: now,
    source: "APP",
    notes,
    localId,
  });

  // Tentar sincronizar em background (não bloqueia)
  syncPendingData().catch((err) => console.log("Sync failed:", err));

  return localLog;
};

/**
 * Buscar resumo do dia combinando dados locais e remotos
 */
export const getTodaySummaryOffline = async (
  remoteSummary: any
): Promise<any> => {
  const localLogs = await getLocalLogs();
  const todayLogs = localLogs.filter((log) => {
    const logDate = format(new Date(log.consumedAt), "yyyy-MM-dd");
    const today = format(new Date(), "yyyy-MM-dd");
    return logDate === today && !log.synced;
  });

  // Adicionar logs locais não sincronizados ao total
  const localTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);

  return {
    ...remoteSummary,
    consumed: remoteSummary.consumed + localTotal,
    remaining: Math.max(
      0,
      remoteSummary.goal - (remoteSummary.consumed + localTotal)
    ),
    percent: Math.min(
      100,
      ((remoteSummary.consumed + localTotal) / remoteSummary.goal) * 100
    ),
    goalAchieved: remoteSummary.consumed + localTotal >= remoteSummary.goal,
    logs: [
      ...remoteSummary.logs,
      ...todayLogs.map((log) => ({
        id: log.localId,
        amount: log.amount,
        time: log.consumedAt,
        source: "APP",
      })),
    ],
  };
};
