import * as Haptics from "expo-haptics";

/**
 * Hook para feedback háptico padronizado
 */
export const useHaptics = () => {
  /**
   * Feedback leve (toque suave)
   * Uso: botões secundários, switches
   */
  const light = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  /**
   * Feedback médio (toque normal)
   * Uso: botões primários, navegação
   */
  const medium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  /**
   * Feedback forte (toque intenso)
   * Uso: ações destrutivas, confirmações importantes
   */
  const heavy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  /**
   * Feedback de sucesso
   * Uso: após ações bem-sucedidas
   */
  const success = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  /**
   * Feedback de aviso
   * Uso: validações falharam, atenção necessária
   */
  const warning = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  /**
   * Feedback de erro
   * Uso: erros, falhas
   */
  const error = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  /**
   * Feedback de seleção
   * Uso: mudança de tab, seleção em pickers
   */
  const selection = () => {
    Haptics.selectionAsync();
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
  };
};
