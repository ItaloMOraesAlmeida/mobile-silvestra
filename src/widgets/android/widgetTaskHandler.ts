import { registerWidgetTaskHandler } from "react-native-android-widget";
import { WaterWidget, WaterWidgetCompact } from "./WaterWidget";

/**
 * Widget Task Handler
 * Processa ações dos widgets Android
 */
export const registerWaterWidgetTask = () => {
  registerWidgetTaskHandler(async (props) => {
    const { widgetAction } = props;

    console.log("[Widget Task] Action:", widgetAction);

    switch (widgetAction) {
      case "WIDGET_CLICK":
        // Ação de clique no widget
        break;

      case "WIDGET_UPDATE":
        // Forçar atualização do widget
        break;

      case "WIDGET_ADDED":
        // Widget adicionado à tela inicial
        break;

      case "WIDGET_DELETED":
        // Widget removido da tela inicial
        break;

      default:
        console.log("[Widget Task] Ação desconhecida:", widgetAction);
    }
  });
};

/**
 * Atualizar todos os widgets
 */
export const updateAllWaterWidgets = async () => {
  try {
    const { requestWidgetUpdate } = await import("react-native-android-widget");

    // Solicitar atualização dos widgets
    await requestWidgetUpdate({
      widgetName: "WaterWidget",
      renderWidget: WaterWidget,
    });

    await requestWidgetUpdate({
      widgetName: "WaterWidgetCompact",
      renderWidget: WaterWidgetCompact,
    });

    console.log("[Widget] Widgets atualizados");
  } catch (error) {
    console.error("[Widget] Erro ao atualizar:", error);
  }
};

/**
 * Configurar intervalo de atualização automática
 */
export const setupWidgetAutoUpdate = () => {
  // Atualizar a cada 30 minutos
  setInterval(() => {
    updateAllWaterWidgets();
  }, 30 * 60 * 1000);
};
