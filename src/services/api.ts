/**
 * Re-exporta a API do api.service para centralizar imports
 */
export { api } from "./api.service";

// Re-exportar patient-details services diretamente
export {
  bodyMeasurementsService,
  healthInfoService,
  goalsService,
} from "./patient-details.service";

// Re-exportar formula service
export { formulaService } from "./formula.service";

// Nota: foodService NÃO é re-exportado para evitar ciclo de dependência
// Importar diretamente de './food.service' quando necessário
