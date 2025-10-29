import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { lightTheme } from "../../theme";

interface UpdateItem {
  version: string;
  date: string;
  changes: string[];
}

const APP_VERSION = "1.0.0";
const RELEASE_DATE = "Outubro 2025";

const UPDATES: UpdateItem[] = [
  {
    version: "1.0.0",
    date: "29 de Outubro de 2025",
    changes: [
      "Lançamento inicial do aplicativo",
      "Sistema de autenticação com email/senha e Google",
      "Autenticação biométrica (Face ID / Touch ID / Impressão Digital)",
      "Gestão de perfil de usuário com foto",
      "Tela de configurações completa",
      "Sistema de alteração de senha com verificação",
      "Suporte a múltiplos tipos de usuário (Nutricionista e Paciente)",
    ],
  },
];

export function AboutScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info */}
        <View style={styles.appInfoCard}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons
                name="nutrition"
                size={48}
                color={lightTheme.colors.primary}
              />
            </View>
          </View>

          <Text style={styles.appName}>Silvestra</Text>
          <Text style={styles.appTagline}>
            Sua plataforma de nutrição e bem-estar
          </Text>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versão {APP_VERSION}</Text>
          </View>

          <Text style={styles.releaseDate}>{RELEASE_DATE}</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <View style={styles.card}>
            <Text style={styles.descriptionText}>
              Silvestra é uma plataforma moderna e intuitiva que conecta
              nutricionistas e pacientes, facilitando o acompanhamento
              nutricional e promovendo hábitos alimentares saudáveis.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Principais Recursos</Text>
          <View style={styles.card}>
            <FeatureItem
              icon="shield-checkmark"
              title="Segurança"
              description="Autenticação biométrica e proteção de dados"
            />
            <View style={styles.divider} />
            <FeatureItem
              icon="people"
              title="Gestão de Pacientes"
              description="Acompanhamento completo e personalizado"
            />
            <View style={styles.divider} />
            <FeatureItem
              icon="analytics"
              title="Relatórios"
              description="Análises detalhadas e métricas de progresso"
            />
            <View style={styles.divider} />
            <FeatureItem
              icon="calendar"
              title="Agendamento"
              description="Sistema de consultas e lembretes"
            />
          </View>
        </View>

        {/* Updates History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Atualizações</Text>
          {UPDATES.map((update, index) => (
            <View key={index} style={styles.updateCard}>
              <View style={styles.updateHeader}>
                <View>
                  <Text style={styles.updateVersion}>
                    Versão {update.version}
                  </Text>
                  <Text style={styles.updateDate}>{update.date}</Text>
                </View>
                {index === 0 && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NOVO</Text>
                  </View>
                )}
              </View>

              <View style={styles.changesList}>
                {update.changes.map((change, changeIndex) => (
                  <View key={changeIndex} style={styles.changeItem}>
                    <View style={styles.changeBullet} />
                    <Text style={styles.changeText}>{change}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.card}>
            <TouchableOpacity
              onPress={() => Linking.openURL("mailto:suporte@silvestra.com.br")}
              activeOpacity={0.7}
            >
              <LinkItem
                icon="mail-outline"
                title="Suporte"
                subtitle="suporte@silvestra.com.br"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 Silvestra. Todos os direitos reservados.
          </Text>
          <Text style={styles.footerSubtext}>
            Desenvolvido com ❤️ para nutricionistas e pacientes
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

interface FeatureItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIconContainer}>
        <Ionicons name={icon} size={24} color={lightTheme.colors.primary} />
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

interface LinkItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

function LinkItem({ icon, title, subtitle }: LinkItemProps) {
  return (
    <View style={styles.linkItem}>
      <View style={styles.linkIconContainer}>
        <Ionicons name={icon} size={20} color={lightTheme.colors.primary} />
      </View>
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightTheme.colors.gray[50],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lightTheme.spacing.xl,
  },
  appInfoCard: {
    backgroundColor: lightTheme.colors.white,
    paddingVertical: lightTheme.spacing.xl * 2,
    paddingHorizontal: lightTheme.spacing.xl,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.colors.gray[200],
  },
  logoContainer: {
    marginBottom: lightTheme.spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: `${lightTheme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: lightTheme.typography.fontSize["3xl"],
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs,
  },
  appTagline: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.lg,
  },
  versionBadge: {
    paddingHorizontal: lightTheme.spacing.md,
    paddingVertical: lightTheme.spacing.xs,
    backgroundColor: lightTheme.colors.primaryBackground,
    borderRadius: lightTheme.borderRadius.full,
    marginBottom: lightTheme.spacing.xs,
  },
  versionText: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.primary,
  },
  releaseDate: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
  },
  section: {
    paddingHorizontal: lightTheme.spacing.xl,
    marginTop: lightTheme.spacing.xl,
  },
  sectionTitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[600],
    marginBottom: lightTheme.spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    ...lightTheme.shadows.sm,
  },
  descriptionText: {
    fontSize: lightTheme.typography.fontSize.base,
    color: lightTheme.colors.gray[700],
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: `${lightTheme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.semibold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs - 2,
  },
  featureDescription: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    lineHeight: 20,
  },
  updateCard: {
    backgroundColor: lightTheme.colors.white,
    borderRadius: lightTheme.borderRadius.lg,
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.md,
    ...lightTheme.shadows.sm,
  },
  updateHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: lightTheme.spacing.md,
  },
  updateVersion: {
    fontSize: lightTheme.typography.fontSize.lg,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.gray[900],
    marginBottom: lightTheme.spacing.xs - 4,
  },
  updateDate: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  newBadge: {
    paddingHorizontal: lightTheme.spacing.sm,
    paddingVertical: lightTheme.spacing.xs - 2,
    backgroundColor: lightTheme.colors.success,
    borderRadius: lightTheme.borderRadius.sm,
  },
  newBadgeText: {
    fontSize: lightTheme.typography.fontSize.xs,
    fontWeight: lightTheme.typography.fontWeight.bold as any,
    color: lightTheme.colors.white,
    letterSpacing: 0.5,
  },
  changesList: {
    gap: lightTheme.spacing.sm,
  },
  changeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  changeBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: lightTheme.colors.primary,
    marginTop: 8,
    marginRight: lightTheme.spacing.sm,
  },
  changeText: {
    flex: 1,
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[700],
    lineHeight: 22,
  },
  linkItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  linkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: lightTheme.borderRadius.md,
    backgroundColor: `${lightTheme.colors.primary}10`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: lightTheme.spacing.md,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: lightTheme.typography.fontSize.base,
    fontWeight: lightTheme.typography.fontWeight.medium as any,
    color: lightTheme.colors.gray[900],
    marginBottom: 2,
  },
  linkSubtitle: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
  },
  divider: {
    height: 1,
    backgroundColor: lightTheme.colors.gray[200],
    marginVertical: lightTheme.spacing.md,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: lightTheme.spacing.xl,
    paddingTop: lightTheme.spacing.xl * 2,
  },
  footerText: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[600],
    textAlign: "center",
    marginBottom: lightTheme.spacing.xs,
  },
  footerSubtext: {
    fontSize: lightTheme.typography.fontSize.sm,
    color: lightTheme.colors.gray[500],
    textAlign: "center",
  },
  bottomSpacer: {
    height: lightTheme.spacing.xl,
  },
});
