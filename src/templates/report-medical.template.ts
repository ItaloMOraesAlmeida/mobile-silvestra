/**
 * Template para Relatório Médico Formal
 * Documento profissional destinado a médicos e outros profissionais de saúde
 */

interface MedicalReportData {
  // Dados do Paciente
  patient: {
    name: string;
    birthDate: string;
    age: number;
    gender?: "M" | "F" | "Outro";
    cpf?: string;
    phone?: string;
    email?: string;
  };

  // Dados do Nutricionista
  nutritionist: {
    name: string;
    crn: string; // Conselho Regional de Nutricionistas
    specialty?: string;
    phone?: string;
    email?: string;
  };

  // Antropometria Atual
  currentMeasurements: {
    date: string;
    weight: number;
    height: number;
    bmi: number;
    bodyFat?: number;
    muscleMass?: number;
    visceralFat?: number;
    waistCircumference?: number;
    hipCircumference?: number;
    waistHipRatio?: number;
  };

  // Evolução Antropométrica
  evolution?: {
    initialDate: string;
    initialWeight: number;
    initialBMI: number;
    currentDate: string;
    currentWeight: number;
    currentBMI: number;
    totalWeightChange: number;
    percentageChange: number;
  };

  // Histórico Clínico
  clinicalHistory?: {
    mainComplaint?: string;
    comorbidities?: string[];
    medications?: string[];
    allergies?: string[];
    familyHistory?: string[];
  };

  // Avaliação Nutricional
  nutritionalAssessment: {
    dietaryRecall?: string;
    eatingHabits?: string[];
    physicalActivity?: string;
    hydration?: string;
    sleepQuality?: string;
    stressLevel?: string;
  };

  // Diagnóstico Nutricional
  diagnosis: {
    anthropometric?: string;
    clinical?: string;
    dietary?: string;
    environmental?: string;
  };

  // Conduta Nutricional
  intervention: {
    objectives: string[];
    dietPlan?: string;
    energyRequirement?: number; // kcal/dia
    macronutrients?: {
      protein: number; // g/dia
      carbs: number; // g/dia
      fat: number; // g/dia
    };
    supplements?: string[];
    followUpPeriod?: string;
  };

  // Observações e Recomendações
  observations?: string[];

  // Metadados
  createdAt: string;
  reportNumber?: string;
}

export function generateMedicalReportTemplate(data: MedicalReportData): string {
  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCPF = (cpf?: string) => {
    if (!cpf) return "-";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const classifyBMI = (bmi: number): string => {
    if (bmi < 18.5) return "Baixo peso";
    if (bmi < 25) return "Eutrofia";
    if (bmi < 30) return "Sobrepeso";
    if (bmi < 35) return "Obesidade Grau I";
    if (bmi < 40) return "Obesidade Grau II";
    return "Obesidade Grau III";
  };

  return `
<div class="medical-report">
  <!-- Cabeçalho Profissional -->
  <div class="report-header medical">
    <div class="letterhead">
      <div class="logo-section">
        <h1>SILVESTRA</h1>
        <p class="subtitle">Sistema de Acompanhamento Nutricional</p>
      </div>
      <div class="report-info">
        ${
          data.reportNumber
            ? `<p><strong>Protocolo:</strong> ${data.reportNumber}</p>`
            : ""
        }
        <p><strong>Data de Emissão:</strong> ${formatDate(data.createdAt)}</p>
      </div>
    </div>
    
    <div class="report-title">
      <h2>RELATÓRIO DE ACOMPANHAMENTO NUTRICIONAL</h2>
    </div>
  </div>

  <!-- Dados do Nutricionista -->
  <div class="section professional-section">
    <h3>DADOS DO PROFISSIONAL</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Nutricionista:</span>
        <span class="value">{data.nutritionist.name}</span>
      </div>
      <div class="info-item">
        <span class="label">CRN:</span>
        <span class="value">${data.nutritionist.crn}</span>
      </div>
      ${
        data.nutritionist.specialty
          ? `
      <div class="info-item">
        <span class="label">Especialidade:</span>
        <span class="value">${data.nutritionist.specialty}</span>
      </div>
      `
          : ""
      }
      ${
        data.nutritionist.phone
          ? `
      <div class="info-item">
        <span class="label">Telefone:</span>
        <span class="value">${data.nutritionist.phone}</span>
      </div>
      `
          : ""
      }
      ${
        data.nutritionist.email
          ? `
      <div class="info-item">
        <span class="label">E-mail:</span>
        <span class="value">${data.nutritionist.email}</span>
      </div>
      `
          : ""
      }
    </div>
  </div>

  <!-- Dados do Paciente -->
  <div class="section patient-section">
    <h3>DADOS DO PACIENTE</h3>
    <div class="info-grid">
      <div class="info-item">
        <span class="label">Nome Completo:</span>
        <span class="value">${data.patient.name}</span>
      </div>
      <div class="info-item">
        <span class="label">Data de Nascimento:</span>
        <span class="value">${formatDate(data.patient.birthDate)} (${
    data.patient.age
  } anos)</span>
      </div>
      ${
        data.patient.gender
          ? `
      <div class="info-item">
        <span class="label">Sexo:</span>
        <span class="value">${
          data.patient.gender === "M"
            ? "Masculino"
            : data.patient.gender === "F"
            ? "Feminino"
            : data.patient.gender
        }</span>
      </div>
      `
          : ""
      }
      ${
        data.patient.cpf
          ? `
      <div class="info-item">
        <span class="label">CPF:</span>
        <span class="value">${formatCPF(data.patient.cpf)}</span>
      </div>
      `
          : ""
      }
      ${
        data.patient.phone
          ? `
      <div class="info-item">
        <span class="label">Telefone:</span>
        <span class="value">${data.patient.phone}</span>
      </div>
      `
          : ""
      }
      ${
        data.patient.email
          ? `
      <div class="info-item">
        <span class="label">E-mail:</span>
        <span class="value">${data.patient.email}</span>
      </div>
      `
          : ""
      }
    </div>
  </div>

  <!-- Histórico Clínico -->
  ${
    data.clinicalHistory
      ? `
  <div class="section clinical-section">
    <h3>HISTÓRICO CLÍNICO</h3>
    
    ${
      data.clinicalHistory.mainComplaint
        ? `
    <div class="subsection">
      <h4>Queixa Principal:</h4>
      <p>${data.clinicalHistory.mainComplaint}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.clinicalHistory.comorbidities &&
      data.clinicalHistory.comorbidities.length > 0
        ? `
    <div class="subsection">
      <h4>Comorbidades:</h4>
      <ul>
        ${data.clinicalHistory.comorbidities
          .map((c) => `<li>${c}</li>`)
          .join("")}
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.clinicalHistory.medications &&
      data.clinicalHistory.medications.length > 0
        ? `
    <div class="subsection">
      <h4>Medicamentos em Uso:</h4>
      <ul>
        ${data.clinicalHistory.medications.map((m) => `<li>${m}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.clinicalHistory.allergies &&
      data.clinicalHistory.allergies.length > 0
        ? `
    <div class="subsection">
      <h4>Alergias e Intolerâncias:</h4>
      <ul>
        ${data.clinicalHistory.allergies.map((a) => `<li>${a}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.clinicalHistory.familyHistory &&
      data.clinicalHistory.familyHistory.length > 0
        ? `
    <div class="subsection">
      <h4>Histórico Familiar:</h4>
      <ul>
        ${data.clinicalHistory.familyHistory
          .map((f) => `<li>${f}</li>`)
          .join("")}
      </ul>
    </div>
    `
        : ""
    }
  </div>
  `
      : ""
  }

  <!-- Avaliação Antropométrica Atual -->
  <div class="section anthropometric-section">
    <h3>AVALIAÇÃO ANTROPOMÉTRICA</h3>
    <p class="assessment-date">Data da Avaliação: ${formatDate(
      data.currentMeasurements.date
    )}</p>
    
    <div class="measurements-table">
      <table>
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>Valor</th>
            <th>Classificação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Peso</td>
            <td>${data.currentMeasurements.weight.toFixed(1)} kg</td>
            <td>-</td>
          </tr>
          <tr>
            <td>Estatura</td>
            <td>${data.currentMeasurements.height.toFixed(2)} m</td>
            <td>-</td>
          </tr>
          <tr class="highlight-row">
            <td><strong>IMC</strong></td>
            <td><strong>${data.currentMeasurements.bmi.toFixed(
              1
            )} kg/m²</strong></td>
            <td><strong>${classifyBMI(
              data.currentMeasurements.bmi
            )}</strong></td>
          </tr>
          ${
            data.currentMeasurements.bodyFat
              ? `
          <tr>
            <td>Percentual de Gordura</td>
            <td>${data.currentMeasurements.bodyFat.toFixed(1)}%</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
          ${
            data.currentMeasurements.muscleMass
              ? `
          <tr>
            <td>Massa Muscular</td>
            <td>${data.currentMeasurements.muscleMass.toFixed(1)} kg</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
          ${
            data.currentMeasurements.visceralFat
              ? `
          <tr>
            <td>Gordura Visceral</td>
            <td>${data.currentMeasurements.visceralFat.toFixed(1)}</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
          ${
            data.currentMeasurements.waistCircumference
              ? `
          <tr>
            <td>Circunferência da Cintura</td>
            <td>${data.currentMeasurements.waistCircumference.toFixed(
              1
            )} cm</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
          ${
            data.currentMeasurements.hipCircumference
              ? `
          <tr>
            <td>Circunferência do Quadril</td>
            <td>${data.currentMeasurements.hipCircumference.toFixed(1)} cm</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
          ${
            data.currentMeasurements.waistHipRatio
              ? `
          <tr>
            <td>Relação Cintura/Quadril</td>
            <td>${data.currentMeasurements.waistHipRatio.toFixed(2)}</td>
            <td>-</td>
          </tr>
          `
              : ""
          }
        </tbody>
      </table>
    </div>
  </div>

  <!-- Evolução Antropométrica -->
  ${
    data.evolution
      ? `
  <div class="section evolution-section">
    <h3>EVOLUÇÃO ANTROPOMÉTRICA</h3>
    
    <div class="evolution-comparison">
      <div class="evolution-column">
        <h4>Avaliação Inicial</h4>
        <p class="evolution-date">${formatDate(data.evolution.initialDate)}</p>
        <div class="evolution-data">
          <p><strong>Peso:</strong> ${data.evolution.initialWeight.toFixed(
            1
          )} kg</p>
          <p><strong>IMC:</strong> ${data.evolution.initialBMI.toFixed(
            1
          )} kg/m²</p>
          <p><strong>Classificação:</strong> ${classifyBMI(
            data.evolution.initialBMI
          )}</p>
        </div>
      </div>
      
      <div class="evolution-arrow">→</div>
      
      <div class="evolution-column">
        <h4>Avaliação Atual</h4>
        <p class="evolution-date">${formatDate(data.evolution.currentDate)}</p>
        <div class="evolution-data">
          <p><strong>Peso:</strong> ${data.evolution.currentWeight.toFixed(
            1
          )} kg</p>
          <p><strong>IMC:</strong> ${data.evolution.currentBMI.toFixed(
            1
          )} kg/m²</p>
          <p><strong>Classificação:</strong> ${classifyBMI(
            data.evolution.currentBMI
          )}</p>
        </div>
      </div>
    </div>
    
    <div class="evolution-summary">
      <p><strong>Variação Total de Peso:</strong> ${
        data.evolution.totalWeightChange > 0 ? "+" : ""
      }${data.evolution.totalWeightChange.toFixed(1)} kg (${
          data.evolution.percentageChange > 0 ? "+" : ""
        }${data.evolution.percentageChange.toFixed(1)}%)</p>
    </div>
  </div>
  `
      : ""
  }

  <!-- Avaliação Nutricional -->
  <div class="section nutritional-section">
    <h3>AVALIAÇÃO NUTRICIONAL</h3>
    
    ${
      data.nutritionalAssessment.dietaryRecall
        ? `
    <div class="subsection">
      <h4>Recordatório Alimentar 24h:</h4>
      <p>${data.nutritionalAssessment.dietaryRecall}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.nutritionalAssessment.eatingHabits &&
      data.nutritionalAssessment.eatingHabits.length > 0
        ? `
    <div class="subsection">
      <h4>Hábitos Alimentares:</h4>
      <ul>
        ${data.nutritionalAssessment.eatingHabits
          .map((h) => `<li>${h}</li>`)
          .join("")}
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.nutritionalAssessment.physicalActivity
        ? `
    <div class="subsection">
      <h4>Atividade Física:</h4>
      <p>${data.nutritionalAssessment.physicalActivity}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.nutritionalAssessment.hydration
        ? `
    <div class="subsection">
      <h4>Hidratação:</h4>
      <p>${data.nutritionalAssessment.hydration}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.nutritionalAssessment.sleepQuality
        ? `
    <div class="subsection">
      <h4>Qualidade do Sono:</h4>
      <p>${data.nutritionalAssessment.sleepQuality}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.nutritionalAssessment.stressLevel
        ? `
    <div class="subsection">
      <h4>Nível de Estresse:</h4>
      <p>${data.nutritionalAssessment.stressLevel}</p>
    </div>
    `
        : ""
    }
  </div>

  <!-- Diagnóstico Nutricional -->
  <div class="section diagnosis-section">
    <h3>DIAGNÓSTICO NUTRICIONAL</h3>
    
    ${
      data.diagnosis.anthropometric
        ? `
    <div class="diagnosis-item">
      <h4>Diagnóstico Antropométrico:</h4>
      <p>${data.diagnosis.anthropometric}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.diagnosis.clinical
        ? `
    <div class="diagnosis-item">
      <h4>Diagnóstico Clínico:</h4>
      <p>${data.diagnosis.clinical}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.diagnosis.dietary
        ? `
    <div class="diagnosis-item">
      <h4>Diagnóstico Dietético:</h4>
      <p>${data.diagnosis.dietary}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.diagnosis.environmental
        ? `
    <div class="diagnosis-item">
      <h4>Diagnóstico Ambiental:</h4>
      <p>${data.diagnosis.environmental}</p>
    </div>
    `
        : ""
    }
  </div>

  <!-- Conduta Nutricional -->
  <div class="section intervention-section">
    <h3>CONDUTA NUTRICIONAL</h3>
    
    <div class="subsection">
      <h4>Objetivos:</h4>
      <ul>
        ${data.intervention.objectives.map((obj) => `<li>${obj}</li>`).join("")}
      </ul>
    </div>
    
    ${
      data.intervention.dietPlan
        ? `
    <div class="subsection">
      <h4>Plano Alimentar:</h4>
      <p>${data.intervention.dietPlan}</p>
    </div>
    `
        : ""
    }
    
    ${
      data.intervention.energyRequirement
        ? `
    <div class="subsection">
      <h4>Necessidades Energéticas:</h4>
      <p>${data.intervention.energyRequirement} kcal/dia</p>
    </div>
    `
        : ""
    }
    
    ${
      data.intervention.macronutrients
        ? `
    <div class="subsection">
      <h4>Distribuição de Macronutrientes:</h4>
      <ul>
        <li>Proteínas: ${data.intervention.macronutrients.protein}g/dia</li>
        <li>Carboidratos: ${data.intervention.macronutrients.carbs}g/dia</li>
        <li>Lipídios: ${data.intervention.macronutrients.fat}g/dia</li>
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.intervention.supplements && data.intervention.supplements.length > 0
        ? `
    <div class="subsection">
      <h4>Suplementação:</h4>
      <ul>
        ${data.intervention.supplements.map((s) => `<li>${s}</li>`).join("")}
      </ul>
    </div>
    `
        : ""
    }
    
    ${
      data.intervention.followUpPeriod
        ? `
    <div class="subsection">
      <h4>Periodicidade de Retorno:</h4>
      <p>${data.intervention.followUpPeriod}</p>
    </div>
    `
        : ""
    }
  </div>

  <!-- Observações -->
  ${
    data.observations && data.observations.length > 0
      ? `
  <div class="section observations-section">
    <h3>OBSERVAÇÕES E RECOMENDAÇÕES</h3>
    <ul>
      ${data.observations.map((obs) => `<li>${obs}</li>`).join("")}
    </ul>
  </div>
  `
      : ""
  }

  <!-- Rodapé com Assinatura -->
  <div class="signature-section">
    <div class="signature-line">
      <p>_____________________________________________</p>
      <p><strong>${data.nutritionist.name}</strong></p>
      <p>CRN: ${data.nutritionist.crn}</p>
      ${
        data.nutritionist.specialty
          ? `<p>${data.nutritionist.specialty}</p>`
          : ""
      }
    </div>
  </div>

  <!-- Disclaimer -->
  <div class="disclaimer">
    <p><strong>DOCUMENTO CONFIDENCIAL:</strong> Este relatório contém informações confidenciais e é destinado exclusivamente ao paciente ${
      data.patient.name
    } e aos profissionais de saúde envolvidos no tratamento. A reprodução ou divulgação não autorizada é proibida por lei.</p>
  </div>
</div>

<style>
  .medical-report {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12px;
    line-height: 1.6;
    color: #000;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px;
  }

  .report-header.medical {
    border-bottom: 3px solid #1e40af;
    padding-bottom: 20px;
    margin-bottom: 30px;
  }

  .letterhead {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
  }

  .logo-section h1 {
    font-size: 28px;
    color: #1e40af;
    margin: 0;
    font-weight: bold;
  }

  .logo-section .subtitle {
    font-size: 11px;
    color: #6b7280;
    margin: 5px 0 0 0;
  }

  .report-info {
    text-align: right;
    font-size: 11px;
  }

  .report-info p {
    margin: 3px 0;
  }

  .report-title h2 {
    text-align: center;
    font-size: 18px;
    font-weight: bold;
    color: #1e3a8a;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .section {
    margin-bottom: 25px;
    page-break-inside: avoid;
  }

  .section h3 {
    font-size: 14px;
    font-weight: bold;
    color: #1e40af;
    border-bottom: 2px solid #3b82f6;
    padding-bottom: 5px;
    margin: 0 0 15px 0;
    text-transform: uppercase;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px 20px;
  }

  .info-item {
    display: flex;
    gap: 8px;
  }

  .info-item .label {
    font-weight: bold;
    min-width: 120px;
  }

  .info-item .value {
    flex: 1;
  }

  .subsection {
    margin-bottom: 15px;
  }

  .subsection h4 {
    font-size: 13px;
    font-weight: bold;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .subsection p {
    margin: 5px 0;
    text-align: justify;
  }

  .subsection ul {
    margin: 5px 0;
    padding-left: 25px;
  }

  .subsection li {
    margin: 5px 0;
  }

  .assessment-date {
    font-style: italic;
    color: #6b7280;
    margin-bottom: 15px;
  }

  .measurements-table {
    overflow-x: auto;
  }

  .measurements-table table {
    width: 100%;
    border-collapse: collapse;
    margin: 15px 0;
  }

  .measurements-table th {
    background: #f3f4f6;
    padding: 10px;
    text-align: left;
    font-weight: bold;
    border: 1px solid #d1d5db;
  }

  .measurements-table td {
    padding: 8px 10px;
    border: 1px solid #d1d5db;
  }

  .measurements-table .highlight-row {
    background: #dbeafe;
  }

  .evolution-comparison {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    gap: 20px;
  }

  .evolution-column {
    flex: 1;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    background: #f9fafb;
  }

  .evolution-column h4 {
    font-size: 13px;
    color: #1e40af;
    margin: 0 0 5px 0;
  }

  .evolution-date {
    font-size: 11px;
    color: #6b7280;
    margin: 0 0 10px 0;
  }

  .evolution-data p {
    margin: 5px 0;
    font-size: 12px;
  }

  .evolution-arrow {
    font-size: 32px;
    color: #3b82f6;
    font-weight: bold;
  }

  .evolution-summary {
    text-align: center;
    padding: 15px;
    background: #dbeafe;
    border-radius: 8px;
    margin-top: 15px;
  }

  .evolution-summary p {
    margin: 0;
    font-size: 13px;
  }

  .diagnosis-item {
    margin-bottom: 15px;
    padding: 12px;
    background: #fffbeb;
    border-left: 4px solid #fbbf24;
    border-radius: 4px;
  }

  .diagnosis-item h4 {
    font-size: 12px;
    font-weight: bold;
    color: #92400e;
    margin: 0 0 8px 0;
  }

  .diagnosis-item p {
    margin: 0;
    text-align: justify;
  }

  .signature-section {
    margin-top: 50px;
    padding-top: 30px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
  }

  .signature-line {
    margin: 0 auto;
    max-width: 400px;
  }

  .signature-line p {
    margin: 8px 0;
    font-size: 12px;
  }

  .disclaimer {
    margin-top: 40px;
    padding: 15px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
  }

  .disclaimer p {
    margin: 0;
    font-size: 10px;
    color: #991b1b;
    text-align: justify;
  }

  @media print {
    .medical-report {
      padding: 20px;
    }

    .section {
      page-break-inside: avoid;
    }
  }
</style>
  `;
}
