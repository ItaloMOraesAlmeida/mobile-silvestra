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

export function PrivacyPolicyScreen() {
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
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
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

            <Text style={styles.sectionTitle}>1. Introdução</Text>
            <Text style={styles.paragraph}>
              A sua privacidade é importante para nós. Esta Política de
              Privacidade explica como coletamos, usamos, divulgamos e
              protegemos suas informações quando você usa o aplicativo
              Silvestra.
            </Text>

            <Text style={styles.sectionTitle}>
              2. Informações que Coletamos
            </Text>
            <Text style={styles.paragraph}>
              Coletamos diferentes tipos de informações para fornecer e melhorar
              nossos serviços:
            </Text>
            <Text style={styles.bulletPoint}>
              • Informações de cadastro: nome, e-mail, telefone, CRN (para
              nutricionistas)
            </Text>
            <Text style={styles.bulletPoint}>
              • Informações de saúde: dados nutricionais, medidas corporais,
              objetivos
            </Text>
            <Text style={styles.bulletPoint}>
              • Informações de uso: interações com o aplicativo, preferências
            </Text>
            <Text style={styles.bulletPoint}>
              • Informações do dispositivo: tipo de dispositivo, sistema
              operacional
            </Text>

            <Text style={styles.sectionTitle}>
              3. Como Usamos suas Informações
            </Text>
            <Text style={styles.paragraph}>
              Utilizamos suas informações para:
            </Text>
            <Text style={styles.bulletPoint}>
              • Fornecer e manter nossos serviços
            </Text>
            <Text style={styles.bulletPoint}>
              • Facilitar a comunicação entre nutricionistas e pacientes
            </Text>
            <Text style={styles.bulletPoint}>
              • Melhorar e personalizar sua experiência
            </Text>
            <Text style={styles.bulletPoint}>
              • Enviar notificações importantes sobre o serviço
            </Text>
            <Text style={styles.bulletPoint}>
              • Garantir a segurança e prevenir fraudes
            </Text>

            <Text style={styles.sectionTitle}>
              4. Compartilhamento de Informações
            </Text>
            <Text style={styles.paragraph}>
              Não vendemos suas informações pessoais. Compartilhamos suas
              informações apenas:
            </Text>
            <Text style={styles.bulletPoint}>
              • Com seu nutricionista (se você for paciente) ou seus pacientes
              (se você for nutricionista)
            </Text>
            <Text style={styles.bulletPoint}>
              • Com provedores de serviços que nos auxiliam na operação do
              aplicativo
            </Text>
            <Text style={styles.bulletPoint}>
              • Quando exigido por lei ou para proteger nossos direitos
            </Text>

            <Text style={styles.sectionTitle}>5. Segurança dos Dados</Text>
            <Text style={styles.paragraph}>
              Implementamos medidas de segurança para proteger suas informações,
              incluindo criptografia de dados, acesso restrito e monitoramento
              contínuo. No entanto, nenhum sistema é 100% seguro.
            </Text>

            <Text style={styles.sectionTitle}>6. Seus Direitos</Text>
            <Text style={styles.paragraph}>
              De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem
              direito a:
            </Text>
            <Text style={styles.bulletPoint}>
              • Acessar suas informações pessoais
            </Text>
            <Text style={styles.bulletPoint}>
              • Corrigir dados incompletos ou desatualizados
            </Text>
            <Text style={styles.bulletPoint}>
              • Solicitar a exclusão de seus dados
            </Text>
            <Text style={styles.bulletPoint}>
              • Revogar seu consentimento a qualquer momento
            </Text>
            <Text style={styles.bulletPoint}>
              • Solicitar a portabilidade de seus dados
            </Text>

            <Text style={styles.sectionTitle}>7. Retenção de Dados</Text>
            <Text style={styles.paragraph}>
              Mantemos suas informações pelo tempo necessário para fornecer
              nossos serviços e cumprir obrigações legais. Quando você excluir
              sua conta, seus dados serão removidos de nossos sistemas ativos,
              exceto quando precisarmos mantê-los por razões legais.
            </Text>

            <Text style={styles.sectionTitle}>
              8. Cookies e Tecnologias Similares
            </Text>
            <Text style={styles.paragraph}>
              Utilizamos tecnologias como cookies e tokens de sessão para
              melhorar sua experiência, lembrar suas preferências e analisar o
              uso do aplicativo.
            </Text>

            <Text style={styles.sectionTitle}>
              9. Alterações nesta Política
            </Text>
            <Text style={styles.paragraph}>
              Podemos atualizar esta Política de Privacidade periodicamente.
              Notificaremos você sobre mudanças significativas através do
              aplicativo ou por e-mail.
            </Text>

            <Text style={styles.sectionTitle}>10. Contato</Text>
            <Text style={styles.paragraph}>
              Para questões sobre privacidade ou para exercer seus direitos,
              entre em contato conosco:
            </Text>
            <Text style={styles.bulletPoint}>
              • E-mail: privacidade@silvestra.com.br
            </Text>
            <Text style={styles.bulletPoint}>
              • Encarregado de Dados (DPO): dpo@silvestra.com.br
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
