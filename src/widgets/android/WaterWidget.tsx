import React from "react";
import {
  FlexWidget,
  TextWidget,
  IconWidget,
} from "react-native-android-widget";
import { getTodaySummary } from "../../services/water/waterService";

/**
 * Widget Android para Home Screen
 * Mostra progresso de hidratação do dia
 */
export async function WaterWidget() {
  try {
    // Buscar dados do dia
    const summary = await getTodaySummary();

    const progressPercent = Math.min(100, Math.round(summary.percent));
    const progressColor = progressPercent >= 100 ? "#4CAF50" : "#2196F3";

    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "space-around",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
        }}
        clickAction="OPEN_APP"
      >
        {/* Header */}
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="💧 Hidratação"
            style={{
              fontSize: 16,
              color: "#1E293B",
              fontWeight: "bold",
            }}
          />
          <IconWidget
            icon="ic_menu_manage"
            size={20}
            font="MaterialIcons"
            style={{
              width: 20,
              height: 20,
            }}
            clickAction="OPEN_SETTINGS"
          />
        </FlexWidget>

        {/* Progress Circle */}
        <FlexWidget
          style={{
            width: 120,
            height: 120,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#F1F5F9",
            borderRadius: 60,
          }}
        >
          <TextWidget
            text={`${progressPercent}%`}
            style={{
              fontSize: 32,
              color: progressColor,
              fontWeight: "bold",
            }}
          />
          <TextWidget
            text={`${summary.consumed}ml`}
            style={{
              fontSize: 14,
              color: "#64748B",
              marginTop: 4,
            }}
          />
        </FlexWidget>

        {/* Goal Info */}
        <FlexWidget
          style={{
            width: "match_parent",
            alignItems: "center",
          }}
        >
          {summary.goalAchieved ? (
            <TextWidget
              text="🎉 Meta alcançada!"
              style={{
                fontSize: 14,
                color: "#4CAF50",
                fontWeight: "600",
              }}
            />
          ) : (
            <TextWidget
              text={`Faltam ${summary.remaining}ml`}
              style={{
                fontSize: 14,
                color: "#64748B",
              }}
            />
          )}
        </FlexWidget>

        {/* Quick Add Buttons */}
        <FlexWidget
          style={{
            width: "match_parent",
            flexDirection: "row",
            justifyContent: "space-around",
            marginTop: 8,
          }}
        >
          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: "#2196F3",
              borderRadius: 8,
              padding: 8,
              marginRight: 4,
              alignItems: "center",
            }}
            clickAction="ADD_200ML"
          >
            <TextWidget
              text="+200ml"
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontWeight: "bold",
              }}
            />
          </FlexWidget>

          <FlexWidget
            style={{
              flex: 1,
              backgroundColor: "#2196F3",
              borderRadius: 8,
              padding: 8,
              marginLeft: 4,
              alignItems: "center",
            }}
            clickAction="ADD_500ML"
          >
            <TextWidget
              text="+500ml"
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontWeight: "bold",
              }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    );
  } catch (error: Error | unknown) {
    console.error("[Widget] Erro ao carregar dados:", error);

    // Widget de erro
    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 16,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="💧"
          style={{
            fontSize: 48,
            marginBottom: 8,
          }}
        />
        <TextWidget
          text="Toque para abrir"
          style={{
            fontSize: 14,
            color: "#64748B",
          }}
        />
      </FlexWidget>
    );
  }
}

/**
 * Widget compacto (2x1)
 */
export async function WaterWidgetCompact() {
  try {
    const summary = await getTodaySummary();
    const progressPercent = Math.min(100, Math.round(summary.percent));
    const progressColor = progressPercent >= 100 ? "#4CAF50" : "#2196F3";

    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: 12,
        }}
        clickAction="OPEN_APP"
      >
        {/* Icon + Progress */}
        <FlexWidget
          style={{
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
          }}
        >
          <TextWidget
            text="💧"
            style={{
              fontSize: 32,
              marginRight: 8,
            }}
          />
          <FlexWidget>
            <TextWidget
              text={`${progressPercent}%`}
              style={{
                fontSize: 20,
                color: progressColor,
                fontWeight: "bold",
              }}
            />
            <TextWidget
              text={`${summary.consumed}ml`}
              style={{
                fontSize: 12,
                color: "#64748B",
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Quick Add */}
        <FlexWidget
          style={{
            backgroundColor: "#2196F3",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
          clickAction="ADD_200ML"
        >
          <TextWidget
            text="+200ml"
            style={{
              fontSize: 12,
              color: "#FFFFFF",
              fontWeight: "bold",
            }}
          />
        </FlexWidget>
      </FlexWidget>
    );
  } catch (error) {
    console.error("[Widget Compacto] Erro ao carregar dados:", error);

    return (
      <FlexWidget
        style={{
          height: "match_parent",
          width: "match_parent",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
        }}
        clickAction="OPEN_APP"
      >
        <TextWidget
          text="💧 Silvestra"
          style={{
            fontSize: 16,
            color: "#64748B",
          }}
        />
      </FlexWidget>
    );
  }
}
