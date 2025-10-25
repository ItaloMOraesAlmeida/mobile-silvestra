import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ViewToken,
  Animated,
  StatusBar,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  "Onboarding"
>;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: any;
  gradient: string[]; // Array de cores para gradiente
  imageScale: number; // Multiplicador do tamanho base
}

const slides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Bem-vindo ao Silvestra",
    description:
      "Sua jornada para uma nutrição personalizada e inteligente começa aqui.",
    image: require("../../../assets/images/Onboarding/OnboardingScreen - Step 1.png"),
    gradient: ["#0f2027", "#203a43", "#2c5364"], // Azul petróleo profundo
    imageScale: 1.3,
  },
  {
    id: "2",
    title: "Planos Alimentares",
    description:
      "Crie planos nutricionais personalizados com cálculo automático de macros e micronutrientes.",
    image: require("../../../assets/images/Onboarding/OnboardingScreen - Step 2.png"),
    gradient: ["#134e5e", "#71b280"], // Verde água elegante
    imageScale: 1.1,
  },
  {
    id: "3",
    title: "Avaliações Detalhadas",
    description:
      "Monitore evolução com avaliações antropométricas e fórmulas customizáveis.",
    image: require("../../../assets/images/Onboarding/OnboardingScreen - Step 3.png"),
    gradient: ["#1e3c72", "#2a5298"], // Azul royal profissional
    imageScale: 1.0,
  },
  {
    id: "4",
    title: "Treinos Integrados",
    description:
      "Integre nutrição e exercícios para resultados completos e sustentáveis.",
    image: require("../../../assets/images/Onboarding/OnboardingScreen - Step 4.png"),
    gradient: ["#141e30", "#243b55"], // Azul marinho sofisticado
    imageScale: 1.15,
  },
  {
    id: "5",
    title: "Metas e Resultados",
    description:
      "Defina objetivos, acompanhe progresso e conquiste resultados extraordinários.",
    image: require("../../../assets/images/Onboarding/OnboardingScreen - Step 5.png"),
    gradient: ["#00467f", "#a5cc82"], // Azul para verde vibrante
    imageScale: 1.2,
  },
];

export function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;

  // Criar animações para cada dot
  const dotAnimations = useRef(slides.map(() => new Animated.Value(8))).current;
  const dotOpacities = useRef(
    slides.map(() => new Animated.Value(0.3))
  ).current;

  React.useEffect(() => {
    // Reset e animar a imagem com timing suave
    scaleAnim.setValue(0.85);

    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animar dots
    slides.forEach((_, index) => {
      if (index === currentIndex) {
        // Dot ativo - expandir e aumentar opacidade
        Animated.parallel([
          Animated.spring(dotAnimations[index], {
            toValue: 24,
            tension: 50,
            friction: 7,
            useNativeDriver: false,
          }),
          Animated.timing(dotOpacities[index], {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        // Dots inativos - contrair e diminuir opacidade
        Animated.parallel([
          Animated.spring(dotAnimations[index], {
            toValue: 8,
            tension: 50,
            friction: 7,
            useNativeDriver: false,
          }),
          Animated.timing(dotOpacities[index], {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    });
  }, [currentIndex, scaleAnim, dotAnimations, dotOpacities]);

  const handleContinue = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
    } catch {
      // ignore
    }
    navigation.replace("Welcome");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      scaleAnim.setValue(0);
    } else {
      handleContinue();
    }
  };

  const handleSkip = () => {
    handleContinue();
  };

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken[];
      changed: ViewToken[];
    }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index ?? 0);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderSlide = ({
    item,
    index,
  }: {
    item: OnboardingSlide;
    index: number;
  }) => {
    const isActive = index === currentIndex;

    return (
      <View style={styles.slide}>
        <StatusBar barStyle="light-content" />

        <LinearGradient
          colors={item.gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <View style={styles.contentContainer}>
            {/* Image Container with Animation */}
            <Animated.View
              style={[
                styles.imageContainer,
                {
                  width: SCREEN_WIDTH * 0.9 * item.imageScale,
                  height: SCREEN_WIDTH * 1.2 * item.imageScale,
                  transform: [
                    {
                      scale: isActive ? scaleAnim : 0.85,
                    },
                  ],
                  opacity: isActive
                    ? scaleAnim.interpolate({
                        inputRange: [0.85, 1],
                        outputRange: [0, 1],
                      })
                    : 0,
                },
              ]}
            >
              <Image
                source={item.image}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
      />

      {/* Bottom Navigation - Minimalist Footer */}
      <View style={styles.bottomContainer}>
        <View style={styles.footer}>
          {/* Skip Button */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>
              {currentIndex < slides.length - 1 ? "Pular" : ""}
            </Text>
          </TouchableOpacity>

          {/* Pagination Dots - Center */}
          <View style={styles.pagination}>
            {slides.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width: dotAnimations[index],
                    backgroundColor: dotOpacities[index].interpolate({
                      inputRange: [0.3, 1],
                      outputRange: ["rgba(255, 255, 255, 0.3)", "#FFFFFF"],
                    }),
                  },
                ]}
              />
            ))}
          </View>

          {/* Next/Start Button */}
          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.7}
            >
              <View style={styles.nextButtonCircle}>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleContinue}
              activeOpacity={0.7}
            >
              <View style={styles.startButtonCircle}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 180,
  },
  imageContainer: {
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 15,
    maxWidth: SCREEN_WIDTH - 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 30,
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  skipButton: {
    width: 70,
    paddingVertical: 12,
  },
  skipButtonText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 15,
    fontWeight: "500",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonCircle: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  startButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  startButtonCircle: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
