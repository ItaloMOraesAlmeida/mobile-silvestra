/**
 * Template do cabeçalho do relatório
 */

export interface HeaderTemplateData {
  patientName: string;
  nutritionistName?: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export const generateHeaderTemplate = (data: HeaderTemplateData): string => {
  const periodStart = new Date(data.periodStart).toLocaleDateString("pt-BR");
  const periodEnd = new Date(data.periodEnd).toLocaleDateString("pt-BR");
  const createdAt = new Date(data.createdAt).toLocaleDateString("pt-BR");

  return `
    <div class="header">
      <div class="logo-section">
        <h1 class="app-name">SILVESTRA</h1>
        <p class="app-tagline">Nutrição e Bem-Estar</p>
      </div>
      <div class="header-info">
        <h2 class="report-title">Relatório de Acompanhamento Nutricional</h2>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Paciente:</span>
            <span class="info-value">${data.patientName}</span>
          </div>
          ${
            data.nutritionistName
              ? `
          <div class="info-item">
            <span class="info-label">Nutricionista:</span>
            <span class="info-value">${data.nutritionistName}</span>
          </div>
          `
              : ""
          }
          <div class="info-item">
            <span class="info-label">Período:</span>
            <span class="info-value">${periodStart} a ${periodEnd}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Emitido em:</span>
            <span class="info-value">${createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};
