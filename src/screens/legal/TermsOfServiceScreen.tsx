import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

export function TermsOfServiceScreen() {
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <LinearGradient
        colors={["#1a0a2e", "#572363", "#1a0a2e"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Termos de Uso</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.lastUpdated}>
              Última atualização: 25 de outubro de 2025
            </Text>

            <Text style={styles.sectionTitle}>1. Aceitação dos Termos</Text>
            <Text style={styles.paragraph}>
              Ao acessar e usar o aplicativo Silvestra, você concorda em cumprir
              e estar vinculado a estes Termos de Uso. Se você não concordar com
              qualquer parte destes termos, não deve usar nosso aplicativo.
            </Text>

            <Text style={styles.sectionTitle}>2. Descrição do Serviço</Text>
            <Text style={styles.paragraph}>
              O Silvestra é uma plataforma que conecta nutricionistas e
              pacientes, permitindo o gerenciamento de consultas, planos
              alimentares e acompanhamento nutricional de forma digital.
            </Text>

            <Text style={styles.sectionTitle}>3. Cadastro e Conta</Text>
            <Text style={styles.paragraph}>
              Para usar nossos serviços, você deve criar uma conta fornecendo
              informações precisas e completas. Você é responsável por manter a
              confidencialidade de suas credenciais de acesso e por todas as
              atividades que ocorrem em sua conta.
            </Text>

            <Text style={styles.sectionTitle}>4. Uso Aceitável</Text>
            <Text style={styles.paragraph}>
              Você concorda em usar o Silvestra apenas para fins legais e de
              acordo com estes Termos. Você não deve:
            </Text>
            <Text style={styles.bulletPoint}>
              • Usar o aplicativo de maneira que possa danificar, desativar ou
              prejudicar o serviço
            </Text>
            <Text style={styles.bulletPoint}>
              • Tentar obter acesso não autorizado a qualquer parte do
              aplicativo
            </Text>
            <Text style={styles.bulletPoint}>
              • Usar o aplicativo para transmitir conteúdo ilegal, ofensivo ou
              prejudicial
            </Text>

            <Text style={styles.sectionTitle}>
              5. Responsabilidade Profissional
            </Text>
            <Text style={styles.paragraph}>
              Os nutricionistas que utilizam a plataforma são responsáveis por
              suas orientações e recomendações profissionais. O Silvestra atua
              apenas como facilitador da comunicação e não se responsabiliza
              pelas orientações nutricionais fornecidas.
            </Text>

            <Text style={styles.sectionTitle}>6. Privacidade</Text>
            <Text style={styles.paragraph}>
              O uso de suas informações pessoais é regido por nossa Política de
              Privacidade, que você pode acessar separadamente.
            </Text>

            <Text style={styles.sectionTitle}>7. Modificações</Text>
            <Text style={styles.paragraph}>
              Reservamo-nos o direito de modificar estes Termos a qualquer
              momento. Notificaremos você sobre alterações significativas
              através do aplicativo ou por e-mail.
            </Text>

            <Text style={styles.sectionTitle}>8. Rescisão</Text>
            <Text style={styles.paragraph}>
              Podemos suspender ou encerrar sua conta se você violar estes
              Termos. Você também pode encerrar sua conta a qualquer momento
              através das configurações do aplicativo.
            </Text>

            <Text style={styles.sectionTitle}>
              9. Limitação de Responsabilidade
            </Text>
            <Text style={styles.paragraph}>
              O Silvestra é fornecido "como está" e "conforme disponível". Não
              garantimos que o serviço será ininterrupto ou livre de erros.
            </Text>

            <Text style={styles.sectionTitle}>10. Contato</Text>
            <Text style={styles.paragraph}>
              Se você tiver dúvidas sobre estes Termos de Uso, entre em contato
              conosco através do e-mail: contato@silvestra.com.br
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  content: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 24,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: "#e6a4f0",
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
  },
});
