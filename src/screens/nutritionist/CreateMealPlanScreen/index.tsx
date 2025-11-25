/**
 * CreateMealPlanScreen - Ponto de Entrada (Refatorado)
 *
 * Gerencia navegação entre:
 * - Step 1: Informações Básicas (✅ completo)
 * - Step 2: Montagem das Refeições (⚠️ temporariamente usando versão simplificada)
 *
 * Veja README.md para mais detalhes sobre a refatoração
 */

import React, { useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Step1BasicInfo from "./steps/Step1BasicInfo";
import Step2MealBuilder from "./steps/Step2MealBuilder";
import { useMealPlanWizard } from "./hooks/useMealPlanWizard";
import { useMealPlansStore } from "../../../stores/meal-plans.store";

interface Props {
  navigation: any;
  route?: {
    params?: {
      patientId?: string;
      patientName?: string;
      planId?: string; // Para edição
    };
  };
}

export default function CreateMealPlanScreen({ navigation, route }: Props) {
  const { currentStep, handleNextStep, handlePrevStep } = useMealPlanWizard(
    navigation,
    route || { params: {} }
  );
  const { clearBuilder } = useMealPlansStore();
  const isInitialMount = useRef(true);

  // Limpar builder apenas na primeira montagem da tela (não ao navegar entre steps)
  useFocusEffect(
    React.useCallback(() => {
      const { planId } = route?.params || {};

      // Só limpa se for a primeira montagem E não for edição
      if (isInitialMount.current && !planId) {
        clearBuilder();
        isInitialMount.current = false;
      }

      // Quando a tela perde foco, resetar flag
      return () => {
        isInitialMount.current = true;
      };
    }, [route?.params, clearBuilder])
  );

  if (currentStep === 1) {
    return (
      <Step1BasicInfo
        onNext={handleNextStep}
        navigation={navigation}
        route={route}
      />
    );
  }

  return (
    <Step2MealBuilder onPrevious={handlePrevStep} navigation={navigation} />
  );
}
