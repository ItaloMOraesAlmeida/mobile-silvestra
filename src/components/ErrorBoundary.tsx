import React, { Component, ErrorInfo, ReactNode } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Captura erros em qualquer componente filho e exibe uma UI de fallback
 * ao invés de crashar toda a aplicação.
 *
 * Uso:
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 *
 * Com fallback customizado:
 * ```tsx
 * <ErrorBoundary fallback={(error, reset) => <CustomError error={error} onReset={reset} />}>
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para mostrar fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para serviço de monitoramento (Sentry, Firebase Crashlytics, etc)
    console.error("❌ Error Boundary caught an error:", error);
    console.error("📋 Error Info:", errorInfo);

    // TODO: Enviar para Sentry/Firebase Crashlytics
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Fallback padrão
      return (
        <ErrorFallback error={this.state.error} resetError={this.resetError} />
      );
    }

    return this.props.children;
  }
}

/**
 * Componente de Fallback padrão
 */
interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const isDev = __DEV__;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Ícone de Erro */}
        <View style={styles.iconContainer}>
          <Ionicons name="alert-circle" size={80} color="#ef4444" />
        </View>

        {/* Título */}
        <Text style={styles.title}>Ops! Algo deu errado</Text>

        {/* Mensagem */}
        <Text style={styles.message}>
          Ocorreu um erro inesperado. Nossa equipe foi notificada e estamos
          trabalhando para resolver o problema.
        </Text>

        {/* Detalhes do erro (apenas em desenvolvimento) */}
        {isDev && error && (
          <ScrollView style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Detalhes (dev only):</Text>
            <Text style={styles.errorDetailsText}>{error.toString()}</Text>
            {error.stack && (
              <>
                <Text style={styles.errorDetailsTitle}>Stack Trace:</Text>
                <Text style={styles.errorDetailsText}>{error.stack}</Text>
              </>
            )}
          </ScrollView>
        )}

        {/* Botões de ação */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={resetError}
            accessibilityLabel="Tentar novamente"
            accessibilityHint="Recarrega o aplicativo"
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              // TODO: Adicionar navegação para tela de suporte
              console.log("Reportar problema");
            }}
            accessibilityLabel="Reportar problema"
            accessibilityHint="Abre formulário para reportar este erro"
            accessibilityRole="button"
          >
            <Ionicons name="bug-outline" size={20} color="#6b7280" />
            <Text style={styles.secondaryButtonText}>Reportar Problema</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: "100%",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    maxHeight: 200,
    width: "100%",
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991b1b",
    marginBottom: 8,
    marginTop: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: "#7f1d1d",
    fontFamily: "monospace",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#e5e7eb",
  },
  secondaryButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
  },
});
