/**
 * Estilos CSS para os relatórios PDF
 */

export const reportStyles = `
  /* ==================== RESET E BASE ==================== */
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
    font-size: 11px;
    line-height: 1.6;
    color: #1f2937;
    padding: 15mm;
    background: white;
  }

  h1, h2, h3, h4, h5, h6 {
    color: #111827;
    font-weight: 600;
    margin-bottom: 8px;
  }

  h1 { font-size: 28px; }
  h2 { font-size: 22px; }
  h3 { font-size: 18px; margin-top: 20px; }
  h4 { font-size: 15px; margin-top: 15px; }
  h5 { font-size: 13px; margin-top: 10px; }

  p {
    margin-bottom: 8px;
  }

  /* ==================== HEADER ==================== */
  .header {
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 20px;
    margin-bottom: 25px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    page-break-after: avoid;
  }

  .logo-section {
    flex: 0 0 auto;
  }

  .app-name {
    font-size: 36px;
    font-weight: 700;
    color: #3b82f6;
    margin: 0;
    letter-spacing: -0.5px;
  }

  .app-tagline {
    color: #6b7280;
    font-size: 12px;
    margin: 4px 0 0 0;
  }

  .header-info {
    flex: 1;
    text-align: right;
  }

  .report-title {
    font-size: 20px;
    color: #111827;
    margin-bottom: 12px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .info-item {
    font-size: 10px;
  }

  .info-label {
    color: #6b7280;
    font-weight: 500;
  }

  .info-value {
    color: #111827;
    font-weight: 600;
    margin-left: 4px;
  }

  /* ==================== SECTIONS ==================== */
  .section {
    margin-bottom: 30px;
    page-break-inside: avoid;
  }

  .section-title {
    font-size: 18px;
    color: #111827;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 8px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .section-title .icon {
    font-size: 22px;
  }

  /* ==================== SUMMARY CARDS ==================== */
  .summary-grid,
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 15px 0;
  }

  .summary-card,
  .stat-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ffffff;
  }

  .summary-card.positive {
    background-color: #f0fdf4;
    border-color: #86efac;
  }

  .summary-card.negative {
    background-color: #fef2f2;
    border-color: #fca5a5;
  }

  .card-icon,
  .stat-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .card-content,
  .stat-content {
    flex: 1;
  }

  .card-label,
  .stat-label {
    font-size: 9px;
    color: #6b7280;
    margin-bottom: 4px;
    display: block;
  }

  .card-value,
  .stat-value {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
    display: block;
  }

  /* ==================== TREND BOX ==================== */
  .trend-box {
    border: 2px solid;
    border-radius: 10px;
    padding: 15px;
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 15px;
    background: #f9fafb;
  }

  .trend-icon {
    font-size: 32px;
  }

  .trend-content {
    flex: 1;
  }

  .trend-label {
    font-size: 10px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .trend-value {
    font-size: 20px;
    font-weight: 700;
  }

  .trend-change {
    font-size: 18px;
    font-weight: 700;
    padding: 8px 16px;
    border-radius: 6px;
    background: white;
  }

  .trend-change.positive {
    color: #16a34a;
  }

  .trend-change.negative {
    color: #dc2626;
  }

  .trend-change.neutral {
    color: #6b7280;
  }

  .trend-percent {
    font-size: 14px;
    opacity: 0.8;
  }

  /* ==================== CHARTS ==================== */
  .chart-container {
    margin: 20px 0;
    padding: 15px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  .chart-title {
    font-size: 13px;
    color: #374151;
    margin-bottom: 15px;
    text-align: center;
  }

  .weight-chart {
    width: 100%;
    height: auto;
  }

  .chart-error {
    text-align: center;
    color: #9ca3af;
    padding: 40px;
  }

  /* ==================== TABLES ==================== */
  .table-container {
    margin: 20px 0;
  }

  .table-title {
    font-size: 13px;
    color: #374151;
    margin-bottom: 10px;
  }

  .measurements-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    font-size: 10px;
  }

  .measurements-table th,
  .measurements-table td {
    border: 1px solid #e5e7eb;
    padding: 8px;
    text-align: center;
  }

  .measurements-table th {
    background-color: #f3f4f6;
    font-weight: 600;
    color: #374151;
  }

  .measurements-table tr:nth-child(even) {
    background-color: #f9fafb;
  }

  .measurements-table td.highlight {
    font-weight: 700;
    color: #3b82f6;
  }

  .table-note {
    font-size: 9px;
    color: #9ca3af;
    font-style: italic;
    margin-top: 8px;
  }

  /* ==================== GOALS ==================== */
  .goals-summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin: 15px 0;
    padding: 15px;
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 6px;
  }

  .summary-stat {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .summary-icon {
    font-size: 24px;
  }

  .summary-content {
    flex: 1;
  }

  .summary-label {
    font-size: 9px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .summary-value {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .goals-category {
    margin-bottom: 25px;
  }

  .goals-category-title {
    font-size: 14px;
    color: #374151;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-icon {
    font-size: 18px;
  }

  .goals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .goal-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    background: white;
    page-break-inside: avoid;
  }

  .goal-card.achieved {
    background-color: #f0fdf4;
    border-color: #86efac;
  }

  .goal-header {
    margin-bottom: 12px;
  }

  .goal-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .goal-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }

  .status-badge {
    font-size: 9px;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: 600;
  }

  .status-badge.achieved {
    background: #dcfce7;
    color: #166534;
  }

  .status-badge.almost {
    background: #dbeafe;
    color: #1e40af;
  }

  .status-badge.active {
    background: #fef3c7;
    color: #92400e;
  }

  .goal-progress-container {
    display: flex;
    justify-content: center;
    margin: 15px 0;
  }

  .progress-circle {
    max-width: 120px;
    height: auto;
  }

  .goal-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin: 12px 0;
    padding: 12px;
    background: #f9fafb;
    border-radius: 6px;
  }

  .goal-stat {
    font-size: 9px;
  }

  .goal-stat .stat-label {
    color: #6b7280;
    display: block;
    margin-bottom: 2px;
  }

  .goal-stat .stat-value {
    font-weight: 700;
    color: #111827;
    font-size: 11px;
  }

  .goal-stat .stat-value.target {
    color: #3b82f6;
  }

  .goal-stat .stat-value.progress {
    font-size: 13px;
  }

  .goal-timeline {
    margin: 12px 0;
  }

  .timeline-item {
    font-size: 9px;
    color: #6b7280;
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .timeline-icon {
    font-size: 12px;
  }

  .timeline-item.achieved-date {
    color: #16a34a;
    font-weight: 600;
  }

  .deadline-warning {
    color: #dc2626;
    font-weight: 600;
  }

  .deadline-info {
    color: #6b7280;
  }

  .progress-bar-container {
    margin-top: 10px;
  }

  .progress-bar {
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  /* ==================== KPIs DASHBOARD ==================== */
  .kpis-dashboard {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 15px 0;
  }

  .kpi-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
  }

  .kpi-card.positive {
    background: #f0fdf4;
    border-color: #86efac;
  }

  .kpi-card.negative {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .kpi-card.neutral {
    background: #f9fafb;
  }

  .kpi-card.success {
    background: #ecfdf5;
    border-color: #6ee7b7;
  }

  .kpi-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .kpi-content {
    flex: 1;
  }

  .kpi-label {
    font-size: 9px;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .kpi-value {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
    margin-bottom: 4px;
  }

  .kpi-detail {
    font-size: 9px;
    color: #6b7280;
  }

  /* ==================== TEXT SUMMARY ==================== */
  .text-summary {
    margin: 20px 0;
    padding: 20px;
    background: #f9fafb;
    border-radius: 8px;
    border-left: 4px solid #3b82f6;
  }

  .text-summary-title {
    font-size: 14px;
    color: #111827;
    margin-bottom: 12px;
  }

  .summary-paragraph {
    font-size: 10px;
    line-height: 1.7;
    color: #374151;
    margin-bottom: 10px;
    text-align: justify;
  }

  .summary-paragraph.positive {
    color: #166534;
    background: #dcfce7;
    padding: 10px;
    border-radius: 6px;
  }

  .summary-paragraph.negative {
    color: #991b1b;
    background: #fee2e2;
    padding: 10px;
    border-radius: 6px;
  }

  .summary-paragraph.neutral {
    color: #1f2937;
  }

  /* ==================== ACHIEVEMENTS ==================== */
  .achievements {
    margin: 20px 0;
    padding: 15px;
    background: #fffbeb;
    border-radius: 8px;
    border: 2px solid #fde047;
  }

  .achievements-title {
    font-size: 14px;
    color: #92400e;
    margin-bottom: 12px;
  }

  .badges-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
  }

  .badge.gold {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #78350f;
  }

  .badge.silver {
    background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
    color: #374151;
  }

  .badge.bronze {
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    color: #7c2d12;
  }

  .badge-icon {
    font-size: 14px;
  }

  /* ==================== PHOTOS ==================== */
  .photos-section {
    margin: 20px 0;
  }

  .photos-title {
    font-size: 13px;
    color: #374151;
    margin-bottom: 12px;
  }

  .photos-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 15px 0;
  }

  .photo-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
    background: white;
  }

  .photo-placeholder {
    width: 100%;
    aspect-ratio: 3/4;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
  }

  .photo-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }

  .photo-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
  }

  .photo-date,
  .photo-weight {
    font-size: 9px;
    color: #6b7280;
    margin: 2px 0;
  }

  .photo-weight {
    font-weight: 700;
    color: #3b82f6;
  }

  .photos-note {
    font-size: 9px;
    color: #9ca3af;
    font-style: italic;
    text-align: center;
    margin-top: 10px;
  }

  /* ==================== RECOMMENDATIONS ==================== */
  .recommendations-list {
    list-style: none;
    padding: 0;
    margin: 15px 0;
  }

  .recommendations-list li {
    padding: 10px 12px;
    margin: 8px 0;
    background: #fffbeb;
    border-left: 4px solid #fbbf24;
    border-radius: 4px;
    font-size: 10px;
    line-height: 1.6;
  }

  /* ==================== EMPTY STATE ==================== */
  .empty-state {
    text-align: center;
    padding: 40px;
    background: #f9fafb;
    border-radius: 8px;
    border: 2px dashed #d1d5db;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 10px;
  }

  .empty-text {
    font-size: 12px;
    color: #6b7280;
  }

  /* ==================== FOOTER ==================== */
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 2px solid #e5e7eb;
    text-align: center;
    font-size: 9px;
    color: #9ca3af;
  }

  .footer p {
    margin: 4px 0;
  }

  .disclaimer {
    font-style: italic;
    color: #d1d5db;
    margin-top: 8px;
  }

  /* ==================== PRINT STYLES ==================== */
  @media print {
    body {
      padding: 0;
    }

    .section {
      page-break-inside: avoid;
    }

    .goal-card,
    .kpi-card,
    .photo-card {
      page-break-inside: avoid;
    }

    .chart-container {
      page-break-inside: avoid;
    }
  }

  /* ==================== PAGE BREAKS ==================== */
  .page-break {
    page-break-after: always;
  }

  .no-break {
    page-break-inside: avoid;
  }
`;
