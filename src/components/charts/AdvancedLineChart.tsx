import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Svg, {
  Path,
  Circle,
  Line,
  Text as SvgText,
  G,
  Rect,
} from "react-native-svg";
import * as d3 from "d3";
import { useThemedStyles } from "../../hooks/useTheme";

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface DataSeries {
  id: string;
  label: string;
  data: DataPoint[];
  color: string;
  unit?: string;
}

export interface AdvancedLineChartProps {
  series: DataSeries[];
  width?: number;
  height?: number;
  showDots?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  showLegend?: boolean;
  formatValue?: (value: number, unit?: string) => string;
  onDataPointPress?: (seriesId: string, point: DataPoint) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const DEFAULT_WIDTH = SCREEN_WIDTH - 48; // padding horizontal
const DEFAULT_HEIGHT = 280;

export function AdvancedLineChart({
  series,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  showDots = true,
  showGrid = true,
  showLabels = true,
  showLegend = true,
  formatValue = (v, unit) => `${v.toFixed(1)}${unit ? ` ${unit}` : ""}`,
  onDataPointPress,
}: AdvancedLineChartProps) {
  const styles = useThemedStyles(createStyles);
  const [selectedPoint, setSelectedPoint] = useState<{
    seriesId: string;
    point: DataPoint;
    x: number;
    y: number;
  } | null>(null);

  const { paths, allPoints, yTicks, xTicks, hasData } = useMemo(() => {
    // Verificar se há dados
    const hasData = series.some((s) => s.data && s.data.length > 0);
    if (!hasData) {
      return {
        paths: [],
        allPoints: [],
        yTicks: [],
        xTicks: [],
        hasData: false,
      };
    }

    // Margens
    const marginTop = 30;
    const marginRight = 20;
    const marginBottom = 50;
    const marginLeft = 55;

    const innerWidth = width - marginLeft - marginRight;
    const innerHeight = height - marginTop - marginBottom;

    // Coletar todos os dados para calcular domínios
    const allDataPoints = series.flatMap((s) => s.data);
    const allDates = allDataPoints.map((d) => d.date);
    const allValues = allDataPoints.map((d) => d.value);

    // Escalas
    const xScale = d3
      .scaleTime()
      .domain([d3.min(allDates)!, d3.max(allDates)!] as [Date, Date])
      .range([0, innerWidth]);

    const yMin = d3.min(allValues) || 0;
    const yMax = d3.max(allValues) || 100;
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Gerar linhas e pontos para cada série
    const paths: { seriesId: string; path: string; color: string }[] = [];
    const allPoints: {
      seriesId: string;
      x: number;
      y: number;
      point: DataPoint;
      color: string;
    }[] = [];

    series.forEach((dataSeries) => {
      if (!dataSeries.data || dataSeries.data.length === 0) return;

      // Gerar linha
      const line = d3
        .line<DataPoint>()
        .x((d) => xScale(d.date) + marginLeft)
        .y((d) => yScale(d.value) + marginTop)
        .curve(d3.curveMonotoneX);

      const pathData = line(dataSeries.data) || "";
      paths.push({
        seriesId: dataSeries.id,
        path: pathData,
        color: dataSeries.color,
      });

      // Gerar pontos
      dataSeries.data.forEach((dataPoint) => {
        allPoints.push({
          seriesId: dataSeries.id,
          x: xScale(dataPoint.date) + marginLeft,
          y: yScale(dataPoint.value) + marginTop,
          point: dataPoint,
          color: dataSeries.color,
        });
      });
    });

    // Y-axis ticks
    const yTicks = yScale.ticks(5).map((tick) => ({
      value: tick,
      y: yScale(tick) + marginTop,
    }));

    // X-axis ticks
    // Se os dados possuem labels customizados, usar esses labels ao invés de datas
    const firstSeriesWithData = series.find((s) => s.data && s.data.length > 0);
    const hasCustomLabels = firstSeriesWithData?.data.some((d) => d.label);

    let xTicks: { date: Date; x: number; label?: string }[];

    if (hasCustomLabels && firstSeriesWithData) {
      // Usar os labels customizados dos pontos de dados
      xTicks = firstSeriesWithData.data.map((dataPoint) => ({
        date: dataPoint.date,
        x: xScale(dataPoint.date) + marginLeft,
        label: dataPoint.label,
      }));
    } else {
      // Usar ticks de data padrão
      xTicks = xScale.ticks(4).map((tick) => ({
        date: tick,
        x: xScale(tick) + marginLeft,
      }));
    }

    return {
      paths,
      allPoints,
      yTicks,
      xTicks,
      hasData: true,
    };
  }, [series, width, height]);

  const handlePointPress = (
    seriesId: string,
    point: DataPoint,
    x: number,
    y: number
  ) => {
    setSelectedPoint({ seriesId, point, x, y });
    if (onDataPointPress) {
      onDataPointPress(seriesId, point);
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}/${month}`;
  };

  if (!hasData) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.emptyText}>Sem dados para exibir</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Legenda */}
      {showLegend && (
        <View style={styles.legend}>
          {series.map((dataSeries) => (
            <View key={dataSeries.id} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: dataSeries.color },
                ]}
              />
              <Text style={styles.legendLabel}>{dataSeries.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Gráfico SVG */}
      <Svg width={width} height={height}>
        {/* Grid horizontal */}
        {showGrid &&
          yTicks.map((tick, index) => (
            <Line
              key={`grid-h-${index}`}
              x1={55}
              y1={tick.y}
              x2={width - 20}
              y2={tick.y}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          ))}

        {/* Grid vertical */}
        {showGrid &&
          xTicks.map((tick, index) => (
            <Line
              key={`grid-v-${index}`}
              x1={tick.x}
              y1={30}
              x2={tick.x}
              y2={height - 50}
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
          ))}

        {/* Y-axis labels */}
        {showLabels &&
          yTicks.map((tick, index) => (
            <SvgText
              key={`label-y-${index}`}
              x={50}
              y={tick.y + 4}
              fontSize="11"
              fill="#6B7280"
              textAnchor="end"
              fontWeight="500"
            >
              {tick.value.toFixed(0)}
            </SvgText>
          ))}

        {/* X-axis labels */}
        {showLabels &&
          xTicks.map((tick, index) => (
            <SvgText
              key={`label-x-${index}`}
              x={tick.x}
              y={height - 30}
              fontSize="11"
              fill="#6B7280"
              textAnchor="middle"
              fontWeight="500"
            >
              {tick.label || formatDate(tick.date)}
            </SvgText>
          ))}

        {/* Linhas das séries */}
        {paths.map((pathData, index) => (
          <Path
            key={`path-${index}`}
            d={pathData.path}
            stroke={pathData.color}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Pontos clicáveis */}
        {showDots &&
          allPoints.map((point, index) => (
            <G key={`point-group-${index}`}>
              {/* Área de toque maior (invisível) */}
              <Circle
                cx={point.x}
                cy={point.y}
                r="15"
                fill="transparent"
                onPress={() =>
                  handlePointPress(
                    point.seriesId,
                    point.point,
                    point.x,
                    point.y
                  )
                }
              />
              {/* Ponto visual */}
              <Circle
                cx={point.x}
                cy={point.y}
                r={selectedPoint?.point === point.point ? "7" : "5"}
                fill={point.color}
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </G>
          ))}

        {/* Tooltip para ponto selecionado */}
        {selectedPoint && (
          <G>
            {/* Fundo do tooltip */}
            <Rect
              x={selectedPoint.x - 40}
              y={selectedPoint.y - 45}
              width="80"
              height="35"
              fill="#1F2937"
              rx="6"
              opacity="0.95"
            />
            {/* Valor */}
            <SvgText
              x={selectedPoint.x}
              y={selectedPoint.y - 28}
              fontSize="13"
              fill="#FFFFFF"
              textAnchor="middle"
              fontWeight="bold"
            >
              {formatValue(
                selectedPoint.point.value,
                series.find((s) => s.id === selectedPoint.seriesId)?.unit
              )}
            </SvgText>
            {/* Data */}
            <SvgText
              x={selectedPoint.x}
              y={selectedPoint.y - 14}
              fontSize="10"
              fill="#D1D5DB"
              textAnchor="middle"
            >
              {formatDate(selectedPoint.point.date)}
            </SvgText>
          </G>
        )}
      </Svg>

      {/* Botão para fechar tooltip */}
      {selectedPoint && (
        <TouchableOpacity
          style={styles.closeTooltip}
          onPress={() => setSelectedPoint(null)}
          activeOpacity={0.7}
        >
          <Text style={styles.closeTooltipText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.md,
      ...theme.shadows.sm,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.gray[400],
      fontSize: theme.typography.fontSize.sm,
      flex: 1,
      textAlignVertical: "center",
    },
    legend: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: theme.spacing.md,
      gap: theme.spacing.md,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.gray[700],
      fontWeight: theme.typography.fontWeight.medium,
    },
    closeTooltip: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    closeTooltipText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
    },
  });
