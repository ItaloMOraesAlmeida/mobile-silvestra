/**
 * Template da seção de evolução de medidas
 */

import { MeasurementStatistics } from "../types/report.types";

export interface EvolutionTemplateData {
  measurements: any[];
  statistics: MeasurementStatistics;
  includeCharts: boolean;
  includePhotos: boolean;
}

export const generateEvolutionTemplate = (
  data: EvolutionTemplateData
): string => {
  const { measurements, statistics, includeCharts, includePhotos } = data;

  // Últimas 15 medições para a tabela
  const recentMeasurements = measurements.slice(-15).reverse();

  // Gerar linhas da tabela
  const measurementRows = recentMeasurements
    .map(
      (m: any) => `
    <tr>
      <td>${new Date(m.date).toLocaleDateString("pt-BR")}</td>
      <td class="highlight">${m.weight.toFixed(1)} kg</td>
      <td>${m.bmi.toFixed(1)}</td>
      <td>${m.bodyFat ? m.bodyFat.toFixed(1) + "%" : "-"}</td>
      <td>${m.muscleMass ? m.muscleMass.toFixed(1) + "%" : "-"}</td>
      <td>${m.waist || "-"}</td>
    </tr>
  `
    )
    .join("");

  // Determinar cor da tendência
  const trendColor =
    statistics.trend === "decreasing"
      ? "#16a34a"
      : statistics.trend === "increasing"
      ? "#dc2626"
      : "#6b7280";

  const trendIcon =
    statistics.trend === "decreasing"
      ? "📉"
      : statistics.trend === "increasing"
      ? "📈"
      : "➡️";

  const trendText =
    statistics.trend === "decreasing"
      ? "Descendente"
      : statistics.trend === "increasing"
      ? "Ascendente"
      : "Estável";

  return `
    <div class="section evolution-section">
      <h3 class="section-title">
        <span class="icon">📊</span>
        Evolução de Medidas Corporais
      </h3>

      <!-- Estatísticas em destaque -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⚖️</div>
          <div class="stat-content">
            <p class="stat-label">Peso Médio</p>
            <p class="stat-value">${statistics.avgWeight.toFixed(1)} kg</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📉</div>
          <div class="stat-content">
            <p class="stat-label">Peso Mínimo</p>
            <p class="stat-value">${statistics.minWeight.toFixed(1)} kg</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <p class="stat-label">Peso Máximo</p>
            <p class="stat-value">${statistics.maxWeight.toFixed(1)} kg</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📏</div>
          <div class="stat-content">
            <p class="stat-label">IMC Médio</p>
            <p class="stat-value">${statistics.avgBMI.toFixed(1)}</p>
          </div>
        </div>
      </div>

      <!-- Tendência -->
      <div class="trend-box" style="border-color: ${trendColor}">
        <div class="trend-icon">${trendIcon}</div>
        <div class="trend-content">
          <p class="trend-label">Tendência Geral</p>
          <p class="trend-value" style="color: ${trendColor}">${trendText}</p>
        </div>
        <div class="trend-change ${
          statistics.weightChange < 0
            ? "positive"
            : statistics.weightChange > 0
            ? "negative"
            : "neutral"
        }">
          ${
            statistics.weightChange > 0 ? "+" : ""
          }${statistics.weightChange.toFixed(1)} kg
          <span class="trend-percent">(${
            statistics.weightChangePercent > 0 ? "+" : ""
          }${statistics.weightChangePercent.toFixed(1)}%)</span>
        </div>
      </div>

      ${
        includeCharts
          ? `
      <!-- Gráfico de Evolução -->
      <div class="chart-container">
        <h4 class="chart-title">Evolução do Peso ao Longo do Tempo</h4>
        ${generateWeightChartSVG(measurements, statistics)}
      </div>
      `
          : ""
      }

      <!-- Tabela de Medições -->
      <div class="table-container">
        <h4 class="table-title">Histórico de Medições</h4>
        <table class="measurements-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Peso</th>
              <th>IMC</th>
              <th>Gordura</th>
              <th>Massa Muscular</th>
              <th>Cintura (cm)</th>
            </tr>
          </thead>
          <tbody>
            ${measurementRows}
          </tbody>
        </table>
        ${
          measurements.length > 15
            ? `<p class="table-note">Mostrando as 15 medições mais recentes de ${measurements.length} no total.</p>`
            : ""
        }
      </div>

      ${
        includePhotos
          ? `
      <!-- Seção de Fotos -->
      <div class="photos-section">
        <h4 class="photos-title">Progresso Fotográfico</h4>
        <div class="photos-grid">
          <div class="photo-card">
            <div class="photo-placeholder">
              <p class="photo-icon">📷</p>
              <p class="photo-label">Foto Inicial</p>
            </div>
            <p class="photo-date">${new Date(
              measurements[0]?.date || Date.now()
            ).toLocaleDateString("pt-BR")}</p>
            <p class="photo-weight">${measurements[0]?.weight.toFixed(1)} kg</p>
          </div>
          <div class="photo-card">
            <div class="photo-placeholder">
              <p class="photo-icon">📷</p>
              <p class="photo-label">Foto Atual</p>
            </div>
            <p class="photo-date">${new Date(
              measurements[measurements.length - 1]?.date || Date.now()
            ).toLocaleDateString("pt-BR")}</p>
            <p class="photo-weight">${measurements[
              measurements.length - 1
            ]?.weight.toFixed(1)} kg</p>
          </div>
        </div>
        <p class="photos-note">Integração com fotos reais será implementada na próxima versão.</p>
      </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Gera SVG do gráfico de linha de peso
 */
function generateWeightChartSVG(
  measurements: any[],
  statistics: MeasurementStatistics
): string {
  if (measurements.length === 0) {
    return '<p class="chart-error">Sem dados suficientes para gerar gráfico.</p>';
  }

  const width = 700;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calcular escala Y (peso)
  const minWeight = statistics.minWeight - 2;
  const maxWeight = statistics.maxWeight + 2;
  const weightRange = maxWeight - minWeight;

  // Gerar pontos do gráfico
  const points = measurements.map((m, i) => {
    const x = padding.left + (i / (measurements.length - 1)) * chartWidth;
    const y =
      padding.top + ((maxWeight - m.weight) / weightRange) * chartHeight;
    return { x, y, weight: m.weight, date: m.date };
  });

  // Gerar path da linha
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  // Gerar área sob a linha
  const areaPath = `${linePath} L ${points[points.length - 1].x},${
    height - padding.bottom
  } L ${padding.left},${height - padding.bottom} Z`;

  // Gerar linhas de grade horizontais
  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map((fraction) => {
      const y = padding.top + fraction * chartHeight;
      const weight = maxWeight - fraction * weightRange;
      return `
      <line x1="${padding.left}" y1="${y}" x2="${
        width - padding.right
      }" y2="${y}" 
            stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4,4"/>
      <text x="${padding.left - 10}" y="${y + 4}" 
            fill="#6b7280" font-size="10" text-anchor="end">${weight.toFixed(
              1
            )}</text>
    `;
    })
    .join("");

  return `
    <svg class="weight-chart" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Grid -->
      ${gridLines}
      
      <!-- Área sob a linha -->
      <path d="${areaPath}" fill="rgba(59, 130, 246, 0.1)" />
      
      <!-- Linha principal -->
      <path d="${linePath}" fill="none" stroke="#3b82f6" stroke-width="2.5" />
      
      <!-- Pontos -->
      ${points
        .map(
          (p) => `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#3b82f6" stroke="white" stroke-width="2"/>
      `
        )
        .join("")}
      
      <!-- Eixo Y label -->
      <text x="${padding.left - 35}" y="${height / 2}" 
            fill="#374151" font-size="11" font-weight="bold" 
            transform="rotate(-90, ${padding.left - 35}, ${height / 2})" 
            text-anchor="middle">Peso (kg)</text>
      
      <!-- Eixo X label -->
      <text x="${width / 2}" y="${height - 5}" 
            fill="#374151" font-size="11" font-weight="bold" text-anchor="middle">Período</text>
    </svg>
  `;
}
