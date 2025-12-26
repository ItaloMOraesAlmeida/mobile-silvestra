import { NativeModules, Platform } from "react-native";

const { LiveActivityModule } = NativeModules;

export interface WaterLiveActivityState {
  consumed: number;
  goal: number;
  percent: number;
  remaining: number;
  goalAchieved: boolean;
}

/**
 * Serviço para iOS Live Activities
 * Mostra progresso de hidratação na Dynamic Island e Lock Screen
 */
class LiveActivityService {
  private activityId: string | null = null;

  /**
   * Verificar se Live Activities estão disponíveis
   */
  isAvailable(): boolean {
    if (Platform.OS !== "ios") return false;
    if (!LiveActivityModule) return false;

    // Live Activities disponíveis no iOS 16.1+
    const version = parseInt(Platform.Version as string, 10);
    return version >= 16;
  }

  /**
   * Iniciar Live Activity
   */
  async start(state: WaterLiveActivityState): Promise<string | null> {
    if (!this.isAvailable()) {
      console.log("[LiveActivity] Não disponível nesta versão do iOS");
      return null;
    }

    try {
      const attributes = {
        dailyGoal: state.goal,
      };

      const contentState = {
        consumed: state.consumed,
        remaining: state.remaining,
        percent: state.percent,
        goalAchieved: state.goalAchieved,
      };

      this.activityId = await LiveActivityModule.startActivity(
        "WaterTracking",
        attributes,
        contentState
      );

      console.log("[LiveActivity] Iniciada:", this.activityId);
      return this.activityId;
    } catch (error) {
      console.error("[LiveActivity] Erro ao iniciar:", error);
      return null;
    }
  }

  /**
   * Atualizar Live Activity
   */
  async update(state: WaterLiveActivityState): Promise<boolean> {
    if (!this.activityId || !this.isAvailable()) return false;

    try {
      const contentState = {
        consumed: state.consumed,
        remaining: state.remaining,
        percent: state.percent,
        goalAchieved: state.goalAchieved,
      };

      await LiveActivityModule.updateActivity(this.activityId, contentState);
      console.log("[LiveActivity] Atualizada");
      return true;
    } catch (error) {
      console.error("[LiveActivity] Erro ao atualizar:", error);
      return false;
    }
  }

  /**
   * Finalizar Live Activity
   */
  async end(): Promise<void> {
    if (!this.activityId || !this.isAvailable()) return;

    try {
      await LiveActivityModule.endActivity(this.activityId);
      console.log("[LiveActivity] Finalizada");
      this.activityId = null;
    } catch (error) {
      console.error("[LiveActivity] Erro ao finalizar:", error);
    }
  }

  /**
   * Obter ID da atividade atual
   */
  getActivityId(): string | null {
    return this.activityId;
  }

  /**
   * Verificar se há atividade ativa
   */
  isActive(): boolean {
    return this.activityId !== null;
  }
}

export const liveActivityService = new LiveActivityService();
