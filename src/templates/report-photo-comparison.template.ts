/**
 * Template para Relatório de Comparação de Fotos
 * Exibe fotos antes/depois em grade comparativa
 */

interface PhotoComparisonData {
  patientName: string;
  photos: {
    before: {
      uri: string;
      date: string;
      weight?: number;
      measurements?: {
        chest?: number;
        waist?: number;
        hip?: number;
        arm?: number;
        thigh?: number;
      };
    };
    after: {
      uri: string;
      date: string;
      weight?: number;
      measurements?: {
        chest?: number;
        waist?: number;
        hip?: number;
        arm?: number;
        thigh?: number;
      };
    };
  }[];
  periodStart: string;
  periodEnd: string;
  totalWeightLoss?: number;
  totalDays: number;
}

export function generatePhotoComparisonTemplate(
  data: PhotoComparisonData
): string {
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMeasurement = (value?: number) => {
    return value ? `${value.toFixed(1)} cm` : "-";
  };

  return `
<div class="section photo-comparison-section">
  <div class="section-header">
    <h2>🖼️ Comparação de Fotos - Evolução Visual</h2>
    <p class="period-info">
      Período: ${formatDate(data.periodStart)} até ${formatDate(
    data.periodEnd
  )} 
      (${data.totalDays} dias)
    </p>
  </div>

  ${
    data.totalWeightLoss
      ? `
  <div class="summary-box highlight">
    <h3>Resultado Total</h3>
    <div class="result-metric">
      <span class="metric-value">${
        data.totalWeightLoss > 0 ? "-" : "+"
      }${Math.abs(data.totalWeightLoss).toFixed(1)} kg</span>
      <span class="metric-label">Variação de Peso</span>
    </div>
  </div>
  `
      : ""
  }

  <div class="photo-comparison-grid">
    ${data.photos
      .map(
        (photoSet, index) => `
    <div class="comparison-card" style="page-break-inside: avoid;">
      <h3 class="comparison-title">Comparação ${index + 1}</h3>
      
      <div class="photo-pair">
        <!-- Foto ANTES -->
        <div class="photo-column before">
          <div class="photo-label">ANTES</div>
          <div class="photo-container">
            <img src="${
              photoSet.before.uri
            }" alt="Foto antes" class="comparison-photo" />
          </div>
          <div class="photo-details">
            <p class="photo-date">📅 ${formatDate(photoSet.before.date)}</p>
            ${
              photoSet.before.weight
                ? `<p class="photo-weight">⚖️ ${photoSet.before.weight.toFixed(
                    1
                  )} kg</p>`
                : ""
            }
          </div>
          
          ${
            photoSet.before.measurements
              ? `
          <div class="measurements-box">
            <h4>Medidas:</h4>
            <ul class="measurements-list">
              ${
                photoSet.before.measurements.chest
                  ? `<li>Tórax: ${formatMeasurement(
                      photoSet.before.measurements.chest
                    )}</li>`
                  : ""
              }
              ${
                photoSet.before.measurements.waist
                  ? `<li>Cintura: ${formatMeasurement(
                      photoSet.before.measurements.waist
                    )}</li>`
                  : ""
              }
              ${
                photoSet.before.measurements.hip
                  ? `<li>Quadril: ${formatMeasurement(
                      photoSet.before.measurements.hip
                    )}</li>`
                  : ""
              }
              ${
                photoSet.before.measurements.arm
                  ? `<li>Braço: ${formatMeasurement(
                      photoSet.before.measurements.arm
                    )}</li>`
                  : ""
              }
              ${
                photoSet.before.measurements.thigh
                  ? `<li>Coxa: ${formatMeasurement(
                      photoSet.before.measurements.thigh
                    )}</li>`
                  : ""
              }
            </ul>
          </div>
          `
              : ""
          }
        </div>

        <!-- Seta de comparação -->
        <div class="comparison-arrow">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M10 20 L30 20 M25 15 L30 20 L25 25" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <!-- Foto DEPOIS -->
        <div class="photo-column after">
          <div class="photo-label success">DEPOIS</div>
          <div class="photo-container">
            <img src="${
              photoSet.after.uri
            }" alt="Foto depois" class="comparison-photo" />
          </div>
          <div class="photo-details">
            <p class="photo-date">📅 ${formatDate(photoSet.after.date)}</p>
            ${
              photoSet.after.weight
                ? `<p class="photo-weight">⚖️ ${photoSet.after.weight.toFixed(
                    1
                  )} kg</p>`
                : ""
            }
          </div>
          
          ${
            photoSet.after.measurements
              ? `
          <div class="measurements-box">
            <h4>Medidas:</h4>
            <ul class="measurements-list">
              ${
                photoSet.after.measurements.chest
                  ? `<li>Tórax: ${formatMeasurement(
                      photoSet.after.measurements.chest
                    )}</li>`
                  : ""
              }
              ${
                photoSet.after.measurements.waist
                  ? `<li>Cintura: ${formatMeasurement(
                      photoSet.after.measurements.waist
                    )}</li>`
                  : ""
              }
              ${
                photoSet.after.measurements.hip
                  ? `<li>Quadril: ${formatMeasurement(
                      photoSet.after.measurements.hip
                    )}</li>`
                  : ""
              }
              ${
                photoSet.after.measurements.arm
                  ? `<li>Braço: ${formatMeasurement(
                      photoSet.after.measurements.arm
                    )}</li>`
                  : ""
              }
              ${
                photoSet.after.measurements.thigh
                  ? `<li>Coxa: ${formatMeasurement(
                      photoSet.after.measurements.thigh
                    )}</li>`
                  : ""
              }
            </ul>
          </div>
          `
              : ""
          }
        </div>
      </div>

      ${
        photoSet.before.weight && photoSet.after.weight
          ? `
      <div class="change-summary">
        <div class="change-item ${
          photoSet.after.weight < photoSet.before.weight
            ? "success"
            : photoSet.after.weight > photoSet.before.weight
            ? "warning"
            : "neutral"
        }">
          <span class="change-label">Variação de Peso:</span>
          <span class="change-value">
            ${
              photoSet.after.weight < photoSet.before.weight
                ? "-"
                : photoSet.after.weight > photoSet.before.weight
                ? "+"
                : ""
            }${Math.abs(photoSet.after.weight - photoSet.before.weight).toFixed(
              1
            )} kg
            (${(
              (Math.abs(photoSet.after.weight - photoSet.before.weight) /
                photoSet.before.weight) *
              100
            ).toFixed(1)}%)
          </span>
        </div>
        
        ${
          photoSet.before.measurements?.waist &&
          photoSet.after.measurements?.waist
            ? `
        <div class="change-item ${
          photoSet.after.measurements.waist < photoSet.before.measurements.waist
            ? "success"
            : "neutral"
        }">
          <span class="change-label">Variação de Cintura:</span>
          <span class="change-value">
            ${
              photoSet.after.measurements.waist <
              photoSet.before.measurements.waist
                ? "-"
                : "+"
            }${Math.abs(
                photoSet.after.measurements.waist -
                  photoSet.before.measurements.waist
              ).toFixed(1)} cm
          </span>
        </div>
        `
            : ""
        }
      </div>
      `
          : ""
      }
    </div>
    `
      )
      .join("")}
  </div>

  <div class="notes-section">
    <h3>📝 Observações Importantes</h3>
    <ul>
      <li>As fotos foram tiradas nas mesmas condições de iluminação e posição sempre que possível</li>
      <li>As mudanças visuais podem não corresponder exatamente aos números, pois a recomposição corporal envolve ganho de massa magra e perda de gordura</li>
      <li>Continue documentando seu progresso com fotos regulares para melhor acompanhamento</li>
      <li>Fotos são uma ferramenta poderosa de motivação - compare com fotos anteriores, não com outras pessoas</li>
    </ul>
  </div>
</div>

<style>
  .photo-comparison-section {
    padding: 20px;
  }

  .section-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 3px solid #3b82f6;
  }

  .section-header h2 {
    color: #1e40af;
    font-size: 24px;
    margin: 0 0 10px 0;
  }

  .period-info {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }

  .summary-box.highlight {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    border-left: 4px solid #3b82f6;
    padding: 20px;
    margin-bottom: 30px;
    border-radius: 8px;
  }

  .result-metric {
    text-align: center;
  }

  .metric-value {
    display: block;
    font-size: 36px;
    font-weight: bold;
    color: #16a34a;
    margin-bottom: 5px;
  }

  .metric-label {
    display: block;
    font-size: 14px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .photo-comparison-grid {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  .comparison-card {
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    background: #ffffff;
  }

  .comparison-title {
    font-size: 18px;
    color: #374151;
    margin: 0 0 20px 0;
    text-align: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #e5e7eb;
  }

  .photo-pair {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;
  }

  .photo-column {
    flex: 1;
    text-align: center;
  }

  .photo-label {
    font-size: 12px;
    font-weight: bold;
    color: #6b7280;
    background: #f3f4f6;
    padding: 6px 12px;
    border-radius: 20px;
    display: inline-block;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .photo-label.success {
    background: #d1fae5;
    color: #16a34a;
  }

  .photo-container {
    border: 3px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 15px;
    background: #f9fafb;
  }

  .comparison-photo {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: contain;
    display: block;
  }

  .photo-details {
    margin-bottom: 15px;
  }

  .photo-date, .photo-weight {
    font-size: 13px;
    color: #4b5563;
    margin: 5px 0;
  }

  .measurements-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 12px;
    text-align: left;
  }

  .measurements-box h4 {
    font-size: 13px;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .measurements-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .measurements-list li {
    font-size: 12px;
    color: #6b7280;
    padding: 4px 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .measurements-list li:last-child {
    border-bottom: none;
  }

  .comparison-arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .change-summary {
    background: #f9fafb;
    border-top: 2px solid #e5e7eb;
    padding: 15px;
    border-radius: 0 0 8px 8px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .change-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-radius: 6px;
  }

  .change-item.success {
    background: #d1fae5;
  }

  .change-item.warning {
    background: #fed7aa;
  }

  .change-item.neutral {
    background: #e5e7eb;
  }

  .change-label {
    font-size: 13px;
    color: #374151;
    font-weight: 500;
  }

  .change-value {
    font-size: 15px;
    font-weight: bold;
    color: #1f2937;
  }

  .notes-section {
    margin-top: 30px;
    padding: 20px;
    background: #fffbeb;
    border-left: 4px solid #fbbf24;
    border-radius: 8px;
  }

  .notes-section h3 {
    font-size: 16px;
    color: #92400e;
    margin: 0 0 15px 0;
  }

  .notes-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .notes-section li {
    font-size: 13px;
    color: #78350f;
    padding: 8px 0 8px 25px;
    position: relative;
  }

  .notes-section li:before {
    content: "•";
    position: absolute;
    left: 10px;
    color: #fbbf24;
    font-weight: bold;
  }
</style>
  `;
}
