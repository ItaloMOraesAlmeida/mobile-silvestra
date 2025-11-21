/**
 * Hook para gerenciar o estado do wizard de criação de plano alimentar
 */

import { useState, useRef, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useMealPlansStore } from "../../../../stores/meal-plans.store";

export const useMealPlanWizard = (navigation: any, route: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { clearBuilder } = useMealPlansStore();
  const isInitialFocus = useRef(true);

  // Resetar para Step 1 sempre que a tela ganhar foco (nova criação)
  useFocusEffect(
    useCallback(() => {
      const { planId } = route?.params || {};

      // Se for a primeira vez que ganha foco E não for edição, resetar para step 1
      if (isInitialFocus.current && !planId) {
        setCurrentStep(1);
        isInitialFocus.current = false;
      }

      // Quando perder foco, preparar para próxima entrada
      return () => {
        isInitialFocus.current = true;
      };
    }, [route?.params])
  );

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleCancel = () => {
    clearBuilder();
    navigation.goBack();
  };

  return {
    currentStep,
    handleNextStep,
    handlePrevStep,
    handleCancel,
  };
};
