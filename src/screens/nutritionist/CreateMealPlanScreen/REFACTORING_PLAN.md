# Plano de Refatoração - CreateMealPlanScreen

## 🎯 Objetivo

Refatorar o arquivo `CreateMealPlanScreen.tsx` (3685 linhas) em uma estrutura modular, organizada e manutenível, mantendo **100% da funcionalidade** existente.

---

## 📊 Análise do Arquivo Original

### Estrutura Atual (CreateMealPlanScreen.tsx - 3685 linhas)

```
├── Imports (59 linhas)
├── Constantes GOAL_TYPES (26 linhas)
├── Interface Props (3 linhas)
├── Componente Principal (3597 linhas)
│   ├── States (108 linhas)
│   ├── Effects (50 linhas)
│   ├── Cálculos (200 linhas)
│   ├── Handlers (450 linhas)
│   ├── Renderização Step 2 (800 linhas)
│   ├── Renderização Step 1 (800 linhas)
│   ├── Confirm Modals (110 linhas)
│   └── Outros (1079 linhas)
└── Styles (1000+ linhas)
```

---

## 🏗️ Nova Estrutura Proposta

```
CreateMealPlanScreen/
├── index.tsx (50 linhas)                    # Entry point
├── CreateMealPlanScreen.tsx (3685 linhas)   # BACKUP - versão monolítica
│
├── steps/
│   ├── Step1BasicInfo.tsx (~1000 linhas)    # Step 1 completo
│   └── Step2MealBuilder.tsx (~1500 linhas)  # Step 2 completo
│
├── components/
│   ├── step1/
│   │   ├── PatientSelector.tsx (~150 linhas)
│   │   ├── DateRangePicker.tsx (~120 linhas)
│   │   ├── GoalsCalculator.tsx (~300 linhas)
│   │   └── StatusSelector.tsx (~100 linhas)
│   │
│   └── step2/
│       ├── MealCard.tsx (~200 linhas)
│       ├── FoodSearchModal.tsx (~400 linhas)
│       ├── MeasurementSelector.tsx (~150 linhas)
│       ├── NutritionSummary.tsx (~200 linhas)
│       └── MealsList.tsx (~250 linhas)
│
├── hooks/
│   ├── useKeyboardHeight.ts (~30 linhas)
│   ├── useMealPlanWizard.ts (~50 linhas)
│   ├── useMealPlanForm.ts (~200 linhas)
│   ├── useFoodSearch.ts (~150 linhas)
│   └── useMealBuilder.ts (~250 linhas)
│
├── utils/
│   ├── constants.ts (~50 linhas)
│   ├── calculations.ts (~150 linhas)
│   ├── validation.ts (~100 linhas)
│   └── formatters.ts (~80 linhas)
│
└── styles/
    ├── step1.styles.ts (~300 linhas)
    ├── step2.styles.ts (~500 linhas)
    └── shared.styles.ts (~200 linhas)
```

---

## 📝 Plano de Execução (Faseado)

### ✅ Fase 0: Preparação (CONCLUÍDO)

- [x] Criar estrutura de diretórios
- [x] Copiar arquivo original como backup
- [x] Criar README.md com documentação
- [x] Atualizar import no MainDrawerNavigator
- [x] Criar hook useKeyboardHeight
- [x] Criar hook useMealPlanWizard
- [x] Extrair constantes GOAL_TYPES

### 🔄 Fase 1: Extração dos Steps Principais

**Objetivo**: Separar Steps 1 e 2 em arquivos independentes

#### 1.1 Step1BasicInfo.tsx

```typescript
// Responsabilidades:
- Formulário de informações básicas
- Seleção de paciente
- Período (data início/fim)
- Cálculo de metas nutricionais
- Validação e navegação para Step 2

// Componentes internos (inline):
- PatientModal (temp)
- DatePickers (temp)
- GoalsSection (temp)

// Estimativa: ~1000 linhas
```

**Tarefas**:

- [ ] Criar arquivo Step1BasicInfo.tsx
- [ ] Copiar JSX do Step 1 (linhas 1426-2230)
- [ ] Copiar states relacionados ao Step 1
- [ ] Copiar handlers do Step 1
- [ ] Copiar styles do Step 1
- [ ] Testar funcionalidade isolada

#### 1.2 Step2MealBuilder.tsx

```typescript
// Responsabilidades:
- Listagem de refeições
- Adicionar/remover refeições
- Adicionar/remover alimentos
- Modal de busca de alimentos
- Seleção de medidas caseiras
- Resumo nutricional
- Salvamento do plano

// Componentes internos (inline):
- AddMealModal (temp)
- FoodSearchModal (temp)
- MealCards (temp)

// Estimativa: ~1500 linhas
```

**Tarefas**:

- [ ] Criar arquivo Step2MealBuilder.tsx
- [ ] Copiar JSX do Step 2 (linhas 630-1422)
- [ ] Copiar states relacionados ao Step 2
- [ ] Copiar handlers do Step 2
- [ ] Copiar styles do Step 2
- [ ] Testar funcionalidade isolada

---

### 🔄 Fase 2: Extração de Componentes Step 1

**Objetivo**: Componentizar partes do Step 1

#### 2.1 PatientSelector.tsx

```typescript
interface Props {
  selectedPatient: Patient | null;
  patients: Patient[];
  loading: boolean;
  onSelect: (patient: Patient) => void;
  disabled?: boolean;
}
```

**Tarefas**:

- [ ] Extrair modal de seleção de paciente
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step1BasicInfo

#### 2.2 DateRangePicker.tsx

```typescript
interface Props {
  startDate: Date;
  endDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date | undefined) => void;
}
```

**Tarefas**:

- [ ] Extrair seletores de data
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step1BasicInfo

#### 2.3 GoalsCalculator.tsx

```typescript
interface Props {
  selectedPatient: Patient | null;
  selectedGoalType: GoalTypeId;
  onGoalTypeChange: (type: GoalTypeId) => void;
  onGoalsCalculated: (goals: Goals) => void;
}
```

**Tarefas**:

- [ ] Extrair seção de metas
- [ ] Extrair lógica de cálculo
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step1BasicInfo

---

### 🔄 Fase 3: Extração de Componentes Step 2

**Objetivo**: Componentizar partes do Step 2

#### 3.1 MealCard.tsx

```typescript
interface Props {
  meal: MealBuilderItem;
  mealIndex: number;
  onAddFood: (mealIndex: number) => void;
  onRemoveMeal: (mealIndex: number) => void;
  onRemoveFood: (mealIndex: number, itemIndex: number) => void;
}
```

**Tarefas**:

- [ ] Extrair card de refeição
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step2MealBuilder

#### 3.2 FoodSearchModal.tsx

```typescript
interface Props {
  visible: boolean;
  selectedMealIndex: number | null;
  onClose: () => void;
  onFoodAdded: () => void;
}
```

**Tarefas**:

- [ ] Extrair modal de busca
- [ ] Extrair lógica de busca
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step2MealBuilder

#### 3.3 MeasurementSelector.tsx

```typescript
interface Props {
  measurementType: MeasurementType;
  selectedMeasure: HouseholdMeasure | null;
  onTypeChange: (type: MeasurementType) => void;
  onMeasureChange: (measure: HouseholdMeasure) => void;
}
```

**Tarefas**:

- [ ] Extrair seletor de medidas
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no FoodSearchModal

#### 3.4 NutritionSummary.tsx

```typescript
interface Props {
  planNutrition: PlanNutrition;
  targets: Targets;
  progress: Progress;
}
```

**Tarefas**:

- [ ] Extrair resumo nutricional
- [ ] Criar interface Props
- [ ] Extrair styles relacionados
- [ ] Integrar no Step2MealBuilder

---

### 🔄 Fase 4: Extração de Hooks

**Objetivo**: Criar hooks customizados para lógica complexa

#### 4.1 useMealPlanForm.ts

```typescript
export const useMealPlanForm = () => {
  // Estados do formulário
  // Validação
  // Handlers de mudança
  return { ... };
};
```

**Tarefas**:

- [ ] Extrair estados do formulário Step 1
- [ ] Extrair lógica de validação
- [ ] Extrair handlers
- [ ] Integrar no Step1BasicInfo

#### 4.2 useFoodSearch.ts

```typescript
export const useFoodSearch = () => {
  // Estados de busca
  // Lógica de busca
  // Filtros
  return { ... };
};
```

**Tarefas**:

- [ ] Extrair estados de busca
- [ ] Extrair lógica de busca
- [ ] Extrair filtros
- [ ] Integrar no FoodSearchModal

#### 4.3 useMealBuilder.ts

```typescript
export const useMealBuilder = () => {
  // Estados das refeições
  // Handlers add/remove
  // Cálculos
  return { ... };
};
```

**Tarefas**:

- [ ] Extrair estados de refeições
- [ ] Extrair handlers
- [ ] Extrair cálculos
- [ ] Integrar no Step2MealBuilder

---

### 🔄 Fase 5: Extração de Utils

**Objetivo**: Centralizar cálculos e utilidades

#### 5.1 calculations.ts

```typescript
export const calculateGoals = (...) => { ... };
export const calculateMacroDistribution = (...) => { ... };
export const calculatePlanNutrition = (...) => { ... };
```

**Tarefas**:

- [ ] Extrair funções de cálculo
- [ ] Adicionar testes unitários
- [ ] Integrar nos componentes

#### 5.2 validation.ts

```typescript
export const validatePlanData = (...) => { ... };
export const validateMealData = (...) => { ... };
```

**Tarefas**:

- [ ] Extrair funções de validação
- [ ] Adicionar testes unitários
- [ ] Integrar nos componentes

#### 5.3 formatters.ts

```typescript
export const formatCalories = (...) => { ... };
export const formatMacro = (...) => { ... };
export const formatQuantityWithMeasure = (...) => { ... };
```

**Tarefas**:

- [ ] Extrair funções de formatação
- [ ] Adicionar testes unitários
- [ ] Integrar nos componentes

---

### 🔄 Fase 6: Extração de Styles

**Objetivo**: Organizar estilos em arquivos separados

#### 6.1 step1.styles.ts

```typescript
export const step1Styles = StyleSheet.create({ ... });
```

**Tarefas**:

- [ ] Extrair styles do Step 1
- [ ] Organizar por seção
- [ ] Integrar no Step1BasicInfo

#### 6.2 step2.styles.ts

```typescript
export const step2Styles = StyleSheet.create({ ... });
```

**Tarefas**:

- [ ] Extrair styles do Step 2
- [ ] Organizar por seção
- [ ] Integrar no Step2MealBuilder

#### 6.3 shared.styles.ts

```typescript
export const sharedStyles = StyleSheet.create({ ... });
```

**Tarefas**:

- [ ] Extrair styles compartilhados
- [ ] Criar constantes de cores/espaçamentos
- [ ] Integrar em todos os componentes

---

### 🔄 Fase 7: Integração Final

**Objetivo**: Conectar todos os componentes no index.tsx

**Tarefas**:

- [ ] Descomentar código do index.tsx
- [ ] Importar Step1BasicInfo
- [ ] Importar Step2MealBuilder
- [ ] Testar fluxo completo
- [ ] Validar todas as funcionalidades

---

### 🔄 Fase 8: Limpeza e Documentação

**Objetivo**: Finalizar refatoração

**Tarefas**:

- [ ] Remover arquivo monolítico (CreateMealPlanScreen.tsx)
- [ ] Atualizar README.md
- [ ] Adicionar comentários JSDoc
- [ ] Criar testes unitários básicos
- [ ] Validar performance
- [ ] Code review final

---

## 🎯 Métricas de Sucesso

| Métrica                       | Antes | Meta        |
| ----------------------------- | ----- | ----------- |
| **Linhas por arquivo**        | 3685  | <300        |
| **Complexidade ciclomática**  | 250+  | <20         |
| **Nível de aninhamento**      | 8+    | <4          |
| **Componentes reutilizáveis** | 0     | 10+         |
| **Testes unitários**          | 0     | 20+         |
| **Tempo de build**            | -     | Sem impacto |
| **Cobertura de testes**       | 0%    | 60%+        |

---

## ⚠️ Riscos e Mitigações

### Risco 1: Quebra de Funcionalidade

**Mitigação**:

- Manter arquivo original como backup
- Testar cada fase antes de prosseguir
- Usar index.tsx como switch temporário

### Risco 2: Inconsistência de Estado

**Mitigação**:

- Manter stores centralizadas
- Evitar duplicação de estados
- Usar Context API se necessário

### Risco 3: Performance

**Mitigação**:

- Usar React.memo em componentes
- Evitar re-renders desnecessários
- Profilear com React DevTools

---

## 📅 Cronograma Estimado

| Fase                       | Duração         | Prioridade |
| -------------------------- | --------------- | ---------- |
| Fase 0: Preparação         | ✅ Concluído    | Alta       |
| Fase 1: Steps              | 4-6 horas       | Alta       |
| Fase 2: Componentes Step 1 | 3-4 horas       | Média      |
| Fase 3: Componentes Step 2 | 4-5 horas       | Média      |
| Fase 4: Hooks              | 2-3 horas       | Média      |
| Fase 5: Utils              | 2 horas         | Baixa      |
| Fase 6: Styles             | 1-2 horas       | Baixa      |
| Fase 7: Integração         | 2-3 horas       | Alta       |
| Fase 8: Limpeza            | 1-2 horas       | Média      |
| **TOTAL**                  | **19-27 horas** | -          |

---

## 🚀 Próximos Passos Imediatos

1. **[AGORA]** Criar Step1BasicInfo.tsx com JSX do Step 1
2. **[AGORA]** Criar Step2MealBuilder.tsx com JSX do Step 2
3. **[DEPOIS]** Testar ambos os steps isoladamente
4. **[DEPOIS]** Começar extração de componentes menores

---

**Status**: 🟡 Em Progresso (Fase 0 concluída)
**Última Atualização**: 20/11/2025
**Responsável**: Italo Moraes
