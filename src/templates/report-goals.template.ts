/**
 * Template da seção de metas
 */

import { GoalProgress } from "../types/report.types";

export interface GoalsTemplateData {
  goals: GoalProgress[];
  totalGoals: number;
  achievedGoals: number;
}

export const generateGoalsTemplate = (data: GoalsTemplateData): string => {
  const { goals, totalGoals, achievedGoals } = data;

  const successRate =
    totalGoals > 0 ? ((achievedGoals / totalGoals) * 100).toFixed(0) : 0;

  // Separar metas ativas e alcançadas
  const achievedGoalsList = goals.filter((g) => g.achieved);
  const activeGoalsList = goals.filter((g) => !g.achieved);

  return `
    <div class="section goals-section">
      <h3 class="section-title">
        <span class="icon">🎯</span>
        Progresso de Metas
      </h3>

      <!-- Resumo de metas -->
      <div class="goals-summary">
        <div class="summary-stat">
          <div class="summary-icon">🎯</div>
          <div class="summary-content">
            <p class="summary-label">Total de Metas</p>
            <p class="summary-value">${totalGoals}</p>
          </div>
        </div>
        <div class="summary-stat">
          <div class="summary-icon">✅</div>
          <div class="summary-content">
            <p class="summary-label">Metas Alcançadas</p>
            <p class="summary-value">${achievedGoals}</p>
          </div>
        </div>
        <div class="summary-stat">
          <div class="summary-icon">📊</div>
          <div class="summary-content">
            <p class="summary-label">Taxa de Sucesso</p>
            <p class="summary-value">${successRate}%</p>
          </div>
        </div>
        <div class="summary-stat">
          <div class="summary-icon">🔥</div>
          <div class="summary-content">
            <p class="summary-label">Metas Ativas</p>
            <p class="summary-value">${totalGoals - achievedGoals}</p>
          </div>
        </div>
      </div>

      ${
        achievedGoalsList.length > 0
          ? `
      <!-- Metas Alcançadas -->
      <div class="goals-category">
        <h4 class="goals-category-title">
          <span class="category-icon">✅</span>
          Metas Alcançadas (${achievedGoalsList.length})
        </h4>
        <div class="goals-grid">
          ${achievedGoalsList
            .map((goal) => generateGoalCard(goal, true))
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      ${
        activeGoalsList.length > 0
          ? `
      <!-- Metas em Progresso -->
      <div class="goals-category">
        <h4 class="goals-category-title">
          <span class="category-icon">🔥</span>
          Metas em Progresso (${activeGoalsList.length})
        </h4>
        <div class="goals-grid">
          ${activeGoalsList
            .map((goal) => generateGoalCard(goal, false))
            .join("")}
        </div>
      </div>
      `
          : ""
      }

      ${
        totalGoals === 0
          ? `
      <div class="empty-state">
        <p class="empty-icon">🎯</p>
        <p class="empty-text">Nenhuma meta cadastrada no período selecionado.</p>
      </div>
      `
          : ""
      }
    </div>
  `;
};

/**
 * Gera um card individual de meta
 */
function generateGoalCard(goal: GoalProgress, isAchieved: boolean): string {
  const progressColor = isAchieved
    ? "#16a34a"
    : goal.progress >= 75
    ? "#3b82f6"
    : goal.progress >= 50
    ? "#fbbf24"
    : "#dc2626";

  const statusBadge = isAchieved
    ? '<span class="status-badge achieved">✅ Alcançada</span>'
    : goal.progress >= 75
    ? '<span class="status-badge almost">🔥 Quase lá!</span>'
    : '<span class="status-badge active">📈 Em progresso</span>';

  const deadlineWarning =
    !isAchieved && goal.deadline
      ? new Date(goal.deadline) < new Date()
        ? '<p class="deadline-warning">⚠️ Prazo expirado</p>'
        : `<p class="deadline-info">📅 Prazo: ${new Date(
            goal.deadline
          ).toLocaleDateString("pt-BR")}</p>`
      : "";

  return `
    <div class="goal-card ${isAchieved ? "achieved" : ""}">
      <!-- Header -->
      <div class="goal-header">
        <div class="goal-title-row">
          <h5 class="goal-title">${goal.type}</h5>
          ${statusBadge}
        </div>
      </div>

      <!-- Progress Circle -->
      <div class="goal-progress-container">
        ${generateProgressCircleSVG(goal.progress, progressColor)}
      </div>

      <!-- Stats -->
      <div class="goal-stats">
        <div class="goal-stat">
          <span class="stat-label">Valor Atual:</span>
          <span class="stat-value">${goal.current} ${goal.unit}</span>
        </div>
        <div class="goal-stat">
          <span class="stat-label">Meta:</span>
          <span class="stat-value target">${goal.target} ${goal.unit}</span>
        </div>
        <div class="goal-stat">
          <span class="stat-label">Progresso:</span>
          <span class="stat-value progress" style="color: ${progressColor}">${
    goal.progress
  }%</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="goal-timeline">
        <p class="timeline-item">
          <span class="timeline-icon">📅</span>
          Criada em ${new Date(goal.createdAt).toLocaleDateString("pt-BR")}
        </p>
        ${
          isAchieved && goal.achievedAt
            ? `
        <p class="timeline-item achieved-date">
          <span class="timeline-icon">🎉</span>
          Alcançada em ${new Date(goal.achievedAt).toLocaleDateString("pt-BR")}
        </p>
        `
            : ""
        }
        ${deadlineWarning}
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${
            goal.progress
          }%; background-color: ${progressColor}"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Gera SVG do círculo de progresso
 */
function generateProgressCircleSVG(progress: number, color: string): string {
  const size = 120;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return `
    <svg class="progress-circle" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <!-- Background circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="#e5e7eb"
        stroke-width="${strokeWidth}"
      />
      
      <!-- Progress circle -->
      <circle
        cx="${size / 2}"
        cy="${size / 2}"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${offset}"
        stroke-linecap="round"
        transform="rotate(-90 ${size / 2} ${size / 2})"
      />
      
      <!-- Center text -->
      <text
        x="${size / 2}"
        y="${size / 2 + 8}"
        text-anchor="middle"
        fill="${color}"
        font-size="28"
        font-weight="bold"
      >${progress}%</text>
    </svg>
  `;
}
