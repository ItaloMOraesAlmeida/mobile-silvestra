import { useRef, useEffect } from "react";
import { Animated, Easing } from "react-native";

/**
 * Hook para animações de Fade In/Out
 *
 * @param visible - Estado de visibilidade do componente
 * @param duration - Duração da animação em ms (padrão: 300)
 * @returns Animated.Value para usar em opacity
 *
 * Uso:
 * ```tsx
 * const fadeAnim = useFadeAnimation(isVisible);
 *
 * <Animated.View style={{ opacity: fadeAnim }}>
 *   <Text>Conteúdo</Text>
 * </Animated.View>
 * ```
 */
export const useFadeAnimation = (visible: boolean, duration = 300) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
      easing: Easing.inOut(Easing.ease),
    }).start();
  }, [visible, duration, fadeAnim]);

  return fadeAnim;
};

/**
 * Hook para animações de Slide (deslizar para cima/baixo/esquerda/direita)
 *
 * @param visible - Estado de visibilidade
 * @param direction - Direção do slide ('up' | 'down' | 'left' | 'right')
 * @param distance - Distância em pixels (padrão: 50)
 * @param duration - Duração em ms (padrão: 400)
 * @returns Animated.Value para usar em translateX/translateY
 *
 * Uso:
 * ```tsx
 * const slideAnim = useSlideAnimation(isVisible, 'up', 100);
 *
 * <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
 *   <Text>Modal</Text>
 * </Animated.View>
 * ```
 */
export const useSlideAnimation = (
  visible: boolean,
  direction: "up" | "down" | "left" | "right" = "up",
  distance = 50,
  duration = 400
) => {
  const slideAnim = useRef(
    new Animated.Value(visible ? 0 : getInitialValue(direction, distance))
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : getInitialValue(direction, distance),
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();
  }, [visible, direction, distance, slideAnim]);

  return slideAnim;
};

function getInitialValue(
  direction: "up" | "down" | "left" | "right",
  distance: number
): number {
  switch (direction) {
    case "up":
      return distance; // Começa abaixo
    case "down":
      return -distance; // Começa acima
    case "left":
      return distance; // Começa à direita
    case "right":
      return -distance; // Começa à esquerda
  }
}

/**
 * Hook para animações de Scale (zoom in/out)
 *
 * @param visible - Estado de visibilidade
 * @param initialScale - Escala inicial (padrão: 0.8)
 * @param duration - Duração em ms (padrão: 300)
 * @returns Animated.Value para usar em scale
 *
 * Uso:
 * ```tsx
 * const scaleAnim = useScaleAnimation(isVisible);
 *
 * <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
 *   <Text>Botão</Text>
 * </Animated.View>
 * ```
 */
export const useScaleAnimation = (
  visible: boolean,
  initialScale = 0.8,
  duration = 300
) => {
  const scaleAnim = useRef(
    new Animated.Value(visible ? 1 : initialScale)
  ).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: visible ? 1 : initialScale,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [visible, initialScale, scaleAnim]);

  return scaleAnim;
};

/**
 * Hook para animações de Progress (0 a 100%)
 *
 * @param progress - Valor de 0 a 100
 * @param duration - Duração em ms (padrão: 600)
 * @returns Animated.Value para usar em width/height ou interpolação
 *
 * Uso:
 * ```tsx
 * const progressAnim = useProgressAnimation(75);
 *
 * const width = progressAnim.interpolate({
 *   inputRange: [0, 100],
 *   outputRange: ['0%', '100%']
 * });
 *
 * <Animated.View style={{ width }}>
 *   <View style={styles.progressBar} />
 * </Animated.View>
 * ```
 */
export const useProgressAnimation = (progress: number, duration = 600) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration,
      useNativeDriver: false, // width/height não suportam native driver
      easing: Easing.out(Easing.cubic),
    }).start();
  }, [progress, duration, progressAnim]);

  return progressAnim;
};

/**
 * Hook para animações de Rotation (girar)
 *
 * @param rotating - Estado de rotação
 * @param duration - Duração de uma volta completa em ms (padrão: 1000)
 * @param loops - Número de loops (-1 para infinito, padrão: -1)
 * @returns Animated.Value para usar em rotate
 *
 * Uso:
 * ```tsx
 * const rotateAnim = useRotationAnimation(isLoading);
 *
 * const rotate = rotateAnim.interpolate({
 *   inputRange: [0, 1],
 *   outputRange: ['0deg', '360deg']
 * });
 *
 * <Animated.View style={{ transform: [{ rotate }] }}>
 *   <ActivityIndicator />
 * </Animated.View>
 * ```
 */
export const useRotationAnimation = (
  rotating: boolean,
  duration = 1000,
  loops = -1
) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (rotating) {
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
          easing: Easing.linear,
        }),
        { iterations: loops }
      );
      animation.start();

      return () => animation.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [rotating, duration, loops, rotateAnim]);

  return rotateAnim;
};

/**
 * Hook para animações combinadas de Modal (fade + slide + scale)
 *
 * @param visible - Estado de visibilidade
 * @returns { opacity, translateY, scale } para uso combinado
 *
 * Uso:
 * ```tsx
 * const modalAnim = useModalAnimation(isVisible);
 *
 * <Animated.View style={{
 *   opacity: modalAnim.opacity,
 *   transform: [
 *     { translateY: modalAnim.translateY },
 *     { scale: modalAnim.scale }
 *   ]
 * }}>
 *   <Text>Modal</Text>
 * </Animated.View>
 * ```
 */
export const useModalAnimation = (visible: boolean) => {
  const opacity = useFadeAnimation(visible, 200);
  const translateY = useSlideAnimation(visible, "up", 30, 300);
  const scale = useScaleAnimation(visible, 0.95, 300);

  return { opacity, translateY, scale };
};

/**
 * Hook para animações de List Item (entrada sequencial)
 *
 * @param index - Índice do item na lista
 * @param delay - Delay base entre items em ms (padrão: 50)
 * @returns Animated.Value para opacity
 *
 * Uso em FlatList:
 * ```tsx
 * const ListItem = ({ item, index }) => {
 *   const fadeAnim = useListItemAnimation(index);
 *
 *   return (
 *     <Animated.View style={{ opacity: fadeAnim }}>
 *       <Text>{item.name}</Text>
 *     </Animated.View>
 *   );
 * };
 * ```
 */
export const useListItemAnimation = (index: number, delay = 50) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, [index, delay, fadeAnim]);

  return fadeAnim;
};
