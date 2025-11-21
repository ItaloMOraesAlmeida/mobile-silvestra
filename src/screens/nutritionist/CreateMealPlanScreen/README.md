# CreateMealPlanScreen - Estrutura Refatorada

## 📁 Estrutura de Diretórios

```
CreateMealPlanScreen/
├── index.tsx                          # Ponto de entrada principal (USAR ESTE)
├── CreateMealPlanScreen.tsx           # Versão monolítica original (BACKUP)
├── components/                        # Componentes reutilizáveis
│   ├── PatientSelector.tsx           # Seletor de paciente
│   ├── DateRangePicker.tsx           # Seletor de período
│   ├── GoalsCalculator.tsx           # Calculadora de metas
│   ├── MealCard.tsx                  # Card de refeição
│   ├── FoodSearchModal.tsx           # Modal de busca de alimentos
│   ├── MeasurementSelector.tsx       # Seletor de tipo de medida
│   └── NutritionSummary.tsx          # Resumo nutricional
├── steps/                            # Componentes principais dos steps
│   ├── Step1BasicInfo.tsx            # Step 1: Informações Básicas
│   └── Step2MealBuilder.tsx          # Step 2: Montador de Refeições
├── hooks/                            # Hooks customizados
│   ├── useKeyboardHeight.ts          # Detecta altura do teclado
│   ├── useMealPlanWizard.ts          # Gerencia navegação entre steps
│   ├── useMealPlanForm.ts            # Gerencia formulário Step 1
│   └── useFoodSearch.ts              # Gerencia busca de alimentos
└── utils/                            # Utilidades e constantes
    ├── constants.ts                  # Constantes (GOAL_TYPES, etc)
    ├── calculations.ts               # Cálculos nutricionais
    └── styles.ts                     # Estilos compartilhados
```

## 🎯 Objetivo da Refatoração

### Antes

- ❌ **3685 linhas** em um único arquivo
- ❌ Difícil manutenção
- ❌ Difícil encontrar código específico
- ❌ Componentes não reutilizáveis

### Depois

- ✅ **Múltiplos arquivos menores** (~200-300 linhas cada)
- ✅ Separação clara de responsabilidades
- ✅ Componentes reutilizáveis
- ✅ Fácil manutenção e testes
- ✅ Melhor organização do código

## 🚀 Como Usar

### Importar a Tela

```typescript
// Antes
import CreateMealPlanScreen from "./screens/CreateMealPlanScreen";

// Depois
import CreateMealPlanScreen from "./screens/nutritionist/CreateMealPlanScreen";
```

### Navegação

```typescript
navigation.navigate("CreateMealPlan", {
  planId: "optional-plan-id-for-edit",
});
```

## 📝 Status da Refatoração

### ✅ Concluído

- [x] Estrutura de pastas criada
- [x] Arquivo original copiado como backup
- [x] Hook useKeyboardHeight extraído
- [x] Hook useMealPlanWizard criado
- [x] Constantes GOAL_TYPES extraídas
- [x] Arquivo index.tsx principal criado

### 🔄 Em Progresso

- [ ] Extração do Step1BasicInfo
- [ ] Extração do Step2MealBuilder
- [ ] Extração de componentes individuais
- [ ] Extração de hooks específicos
- [ ] Extração de cálculos e utils

### 📋 Próximas Etapas

1. **Fase 1: Steps Principais**

   - Criar Step1BasicInfo.tsx (~1000 linhas)
   - Criar Step2MealBuilder.tsx (~1500 linhas)

2. **Fase 2: Componentes Step 1**

   - PatientSelector.tsx
   - DateRangePicker.tsx
   - GoalsCalculator.tsx

3. **Fase 3: Componentes Step 2**

   - MealCard.tsx
   - FoodSearchModal.tsx
   - MeasurementSelector.tsx
   - NutritionSummary.tsx

4. **Fase 4: Hooks e Utils**

   - useMealPlanForm.ts
   - useFoodSearch.ts
   - calculations.ts
   - styles.ts

5. **Fase 5: Limpeza**
   - Remover arquivo monolítico original
   - Atualizar importações no projeto
   - Testes finais

## 🔧 Manutenção

### Adicionar Novo Componente

```typescript
// 1. Criar arquivo em /components
export const MyComponent = () => { ... };

// 2. Importar no step correspondente
import { MyComponent } from '../components/MyComponent';
```

### Adicionar Novo Hook

```typescript
// 1. Criar arquivo em /hooks
export const useMyHook = () => { ... };

// 2. Importar onde necessário
import { useMyHook } from '../hooks/useMyHook';
```

## 📊 Métricas de Qualidade

| Métrica                  | Antes   | Depois (Meta) |
| ------------------------ | ------- | ------------- |
| Linhas por arquivo       | 3685    | ~200-300      |
| Complexidade ciclomática | Alta    | Baixa         |
| Reusabilidade            | Baixa   | Alta          |
| Testabilidade            | Difícil | Fácil         |
| Manutenibilidade         | Difícil | Fácil         |

## 🎨 Padrões de Código

### Nomenclatura

- **Componentes**: PascalCase (PatientSelector.tsx)
- **Hooks**: camelCase com prefixo `use` (useMealPlanForm.ts)
- **Utils**: camelCase (calculations.ts)
- **Constantes**: UPPER_SNAKE_CASE

### Estrutura de Arquivo

```typescript
// 1. Imports
import React from 'react';
import { View } from 'react-native';

// 2. Types/Interfaces
interface Props { ... }

// 3. Componente/Hook
export const MyComponent = (props: Props) => {
  // 4. Hooks
  // 5. Handlers
  // 6. Render
};

// 7. Styles
const styles = StyleSheet.create({ ... });
```

## 🔗 Dependências Internas

```
index.tsx
  ├── useMealPlanWizard
  ├── Step1BasicInfo
  │   ├── PatientSelector
  │   ├── DateRangePicker
  │   ├── GoalsCalculator
  │   └── useMealPlanForm
  └── Step2MealBuilder
      ├── MealCard
      ├── FoodSearchModal
      ├── MeasurementSelector
      ├── NutritionSummary
      └── useFoodSearch
```

## 📚 Referências

- [React Component Patterns](https://reactpatterns.com/)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [File Structure Best Practices](https://react.dev/learn/thinking-in-react)

---

**Data de Criação**: 20/11/2025
**Última Atualização**: 20/11/2025
**Responsável**: Italo Moraes
