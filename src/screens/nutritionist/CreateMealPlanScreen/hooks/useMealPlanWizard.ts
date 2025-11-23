/**
 * Hook para gerenciar o estado do wizard de criação de plano alimentar
 */

import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useMealPlansStore } from "../../../../stores/meal-plans.store";

export const useMealPlanWizard = (navigation: any, route: any) => {
  // Sempre iniciar no Step 1 (tanto criação quanto edição)
  const [currentStep, setCurrentStep] = useState(1);
  const { clearBuilder } = useMealPlansStore();

  // Sempre resetar para Step 1 quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      // Sempre voltar para Step 1 ao entrar na tela
      setCurrentStep(1);
    }, [])
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
