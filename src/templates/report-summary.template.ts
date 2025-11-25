/**
 * Template do resumo executivo
 */

import { MeasurementStatistics } from "../types/report.types";

export interface SummaryTemplateData {
  patientName: string;
  totalMeasurements: number;
  totalGoals: number;
  achievedGoals: number;
  statistics: MeasurementStatistics;
  periodStart: string;
  periodEnd: string;
}

export const generateSummaryTemplate = (data: SummaryTemplateData): string => {
  const {
    totalMeasurements,
    totalGoals,
    achievedGoals,
    statistics,
    periodStart,
    periodEnd,
  } = data;

  // Calcular dias do período
  const days = Math.ceil(
    (new Date(periodEnd).getTime() - new Date(periodStart).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // Determinar classificação do IMC
  const bmiClass =
    statistics.currentBMI < 18.5
      ? "Abaixo do peso"
      : statistics.currentBMI < 25
      ? "Peso normal"
      : statistics.currentBMI < 30
      ? "Sobrepeso"
      : "Obesidade";

  const bmiClassColor =
    statistics.currentBMI < 18.5
      ? "#fbbf24"
      : statistics.currentBMI < 25
      ? "#16a34a"
      : statistics.currentBMI < 30
      ? "#f97316"
      : "#dc2626";

  // Gerar resumo textual
  const textSummary = generateTextSummary(data);

  return `
    <div class="section summary-section">
      <h3 class="section-title">
        <span class="icon">📋</span>
        Resumo Executivo
      </h3>

      <!-- KPIs Dashboard -->
      <div class="kpis-dashboard">
        <!-- KPI: Variação de Peso -->
        <div class="kpi-card ${
          statistics.weightChange < 0
            ? "positive"
            : statistics.weightChange > 0
            ? "negative"
            : "neutral"
        }">
          <div class="kpi-icon">${
            statistics.weightChange < 0
              ? "📉"
              : statistics.weightChange > 0
              ? "📈"
              : "➡️"
          }</div>
          <div class="kpi-content">
            <p class="kpi-label">Variação de Peso</p>
            <p class="kpi-value">
              ${
                statistics.weightChange > 0 ? "+" : ""
              }${statistics.weightChange.toFixed(1)} kg
            </p>
            <p class="kpi-detail">
              ${
                statistics.weightChangePercent > 0 ? "+" : ""
              }${statistics.weightChangePercent.toFixed(1)}% no período
            </p>
          </div>
        </div>

        <!-- KPI: Peso Atual -->
        <div class="kpi-card">
          <div class="kpi-icon">⚖️</div>
          <div class="kpi-content">
            <p class="kpi-label">Peso Atual</p>
            <p class="kpi-value">${statistics.currentWeight.toFixed(1)} kg</p>
            <p class="kpi-detail">De ${statistics.initialWeight.toFixed(
              1
            )} kg inicial</p>
          </div>
        </div>

        <!-- KPI: IMC -->
        <div class="kpi-card">
          <div class="kpi-icon">📏</div>
          <div class="kpi-content">
            <p class="kpi-label">IMC Atual</p>
            <p class="kpi-value">${statistics.currentBMI.toFixed(1)}</p>
            <p class="kpi-detail" style="color: ${bmiClassColor}">${bmiClass}</p>
          </div>
        </div>

        <!-- KPI: Medições -->
        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-content">
            <p class="kpi-label">Medições Realizadas</p>
            <p class="kpi-value">${totalMeasurements}</p>
            <p class="kpi-detail">Em ${days} dias (${(
    totalMeasurements / days
  ).toFixed(1)} por dia)</p>
          </div>
        </div>

        <!-- KPI: Metas -->
        <div class="kpi-card ${
          achievedGoals === totalGoals && totalGoals > 0 ? "success" : ""
        }">
          <div class="kpi-icon">🎯</div>
          <div class="kpi-content">
            <p class="kpi-label">Metas Alcançadas</p>
            <p class="kpi-value">${achievedGoals}/${totalGoals}</p>
            <p class="kpi-detail">
              ${
                totalGoals > 0
                  ? `${((achievedGoals / totalGoals) * 100).toFixed(
                      0
                    )}% de sucesso`
                  : "Nenhuma meta cadastrada"
              }
            </p>
          </div>
        </div>

        <!-- KPI: Consistência -->
        <div class="kpi-card">
          <div class="kpi-icon">🔥</div>
          <div class="kpi-content">
            <p class="kpi-label">Consistência</p>
            <p class="kpi-value">${
              totalMeasurements > days * 0.7
                ? "Alta"
                : totalMeasurements > days * 0.4
                ? "Média"
                : "Baixa"
            }</p>
            <p class="kpi-detail">
              ${
                totalMeasurements > days * 0.7
                  ? "Excelente acompanhamento!"
                  : totalMeasurements > days * 0.4
                  ? "Bom acompanhamento"
                  : "Aumentar frequência"
              }
            </p>
          </div>
        </div>
      </div>

      <!-- Resumo Textual -->
      <div class="text-summary">
        <h4 class="text-summary-title">Análise do Período</h4>
        ${textSummary}
      </div>

      <!-- Badges de Conquistas -->
      ${generateAchievementBadges(data)}
    </div>
  `;
};

/**
 * Gera resumo textual automático
 */
function generateTextSummary(data: SummaryTemplateData): string {
  const {
    patientName,
    statistics,
    totalMeasurements,
    achievedGoals,
    totalGoals,
  } = data;

  const paragraphs: string[] = [];

  // Parágrafo 1: Introdução
  paragraphs.push(`
    <p class="summary-paragraph">
      Durante o período analisado, <strong>${patientName}</strong> registrou 
      <strong>${totalMeasurements} medições corporais</strong>, demonstrando 
      ${
        totalMeasurements > 20
          ? "excelente"
          : totalMeasurements > 10
          ? "boa"
          : "razoável"
      } 
      consistência no acompanhamento nutricional.
    </p>
  `);

  // Parágrafo 2: Peso
  if (statistics.weightChange < -2) {
    paragraphs.push(`
      <p class="summary-paragraph positive">
        ✅ O peso teve uma <strong>redução significativa de ${Math.abs(
          statistics.weightChange
        ).toFixed(1)} kg</strong> 
        (${Math.abs(statistics.weightChangePercent).toFixed(
          1
        )}%), saindo de ${statistics.initialWeight.toFixed(1)} kg 
        para ${statistics.currentWeight.toFixed(
          1
        )} kg. Este é um resultado muito positivo que demonstra 
        eficácia do plano alimentar e comprometimento do paciente.
      </p>
    `);
  } else if (statistics.weightChange > 2) {
    paragraphs.push(`
      <p class="summary-paragraph negative">
        ⚠️ O peso teve um <strong>aumento de ${statistics.weightChange.toFixed(
          1
        )} kg</strong> 
        (${statistics.weightChangePercent.toFixed(
          1
        )}%), saindo de ${statistics.initialWeight.toFixed(1)} kg 
        para ${statistics.currentWeight.toFixed(
          1
        )} kg. Recomenda-se revisar o plano alimentar e 
        investigar possíveis fatores que possam estar contribuindo para este ganho.
      </p>
    `);
  } else {
    paragraphs.push(`
      <p class="summary-paragraph neutral">
        ℹ️ O peso permaneceu relativamente <strong>estável</strong>, com variação de 
        ${
          statistics.weightChange > 0 ? "+" : ""
        }${statistics.weightChange.toFixed(1)} kg 
        (${statistics.weightChangePercent.toFixed(
          1
        )}%). Esta estabilidade pode ser positiva 
        dependendo dos objetivos estabelecidos.
      </p>
    `);
  }

  // Parágrafo 3: IMC
  paragraphs.push(`
    <p class="summary-paragraph">
      O IMC variou de <strong>${statistics.initialBMI.toFixed(1)}</strong> para 
      <strong>${statistics.currentBMI.toFixed(
        1
      )}</strong>, com uma alteração de 
      ${statistics.bmiChange > 0 ? "+" : ""}${statistics.bmiChange.toFixed(
    1
  )} pontos. 
      ${
        statistics.currentBMI >= 18.5 && statistics.currentBMI < 25
          ? "O IMC atual encontra-se na faixa de <strong>peso normal</strong>, o que é muito positivo."
          : statistics.currentBMI < 18.5
          ? "O IMC atual está <strong>abaixo do ideal</strong>, sugerindo atenção para ganho de peso saudável."
          : "O IMC atual indica <strong>necessidade de atenção</strong> para redução de peso."
      }
    </p>
  `);

  // Parágrafo 4: Metas
  if (totalGoals > 0) {
    const successRate = ((achievedGoals / totalGoals) * 100).toFixed(0);
    paragraphs.push(`
      <p class="summary-paragraph">
        Das <strong>${totalGoals} metas estabelecidas</strong>, 
        <strong>${achievedGoals} foram alcançadas</strong>, representando 
        uma taxa de sucesso de ${successRate}%. 
        ${
          achievedGoals === totalGoals
            ? "🎉 <strong>Parabéns!</strong> Todas as metas foram conquistadas!"
            : achievedGoals >= totalGoals * 0.5
            ? "Este é um resultado positivo que demonstra progresso consistente."
            : "Recomenda-se revisar as metas para garantir que sejam realistas e alcançáveis."
        }
      </p>
    `);
  }

  return paragraphs.join("");
}

/**
 * Gera badges de conquistas
 */
function generateAchievementBadges(data: SummaryTemplateData): string {
  const badges: string[] = [];

  // Badge: Perda de peso significativa
  if (data.statistics.weightChange <= -5) {
    badges.push(`
      <div class="badge gold">
        <span class="badge-icon">🏆</span>
        <span class="badge-text">Perda de Peso Excelente</span>
      </div>
    `);
  }

  // Badge: Consistência
  if (data.totalMeasurements >= 30) {
    badges.push(`
      <div class="badge silver">
        <span class="badge-icon">📊</span>
        <span class="badge-text">Acompanhamento Consistente</span>
      </div>
    `);
  }

  // Badge: Todas as metas
  if (data.achievedGoals === data.totalGoals && data.totalGoals > 0) {
    badges.push(`
      <div class="badge gold">
        <span class="badge-icon">🎯</span>
        <span class="badge-text">Todas as Metas Alcançadas</span>
      </div>
    `);
  }

  // Badge: IMC normal
  if (data.statistics.currentBMI >= 18.5 && data.statistics.currentBMI < 25) {
    badges.push(`
      <div class="badge bronze">
        <span class="badge-icon">💪</span>
        <span class="badge-text">IMC Saudável</span>
      </div>
    `);
  }

  if (badges.length === 0) {
    return "";
  }

  return `
    <div class="achievements">
      <h4 class="achievements-title">🏅 Conquistas do Período</h4>
      <div class="badges-container">
        ${badges.join("")}
      </div>
    </div>
  `;
}
