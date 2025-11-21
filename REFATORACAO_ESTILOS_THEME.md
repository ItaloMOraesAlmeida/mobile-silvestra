# Refatoração de Estilos - Theme System

## 📋 Resumo das Alterações

Todos os componentes da funcionalidade de Patient Details foram refatorados para utilizar o sistema de tema centralizado (`silvestra-app/src/theme`), removendo valores fixos (hardcoded) de cores, espaçamentos e tipografia.

## 🎨 Sistema de Tema Utilizado

### Estrutura do Tema

```
src/theme/
├── colors.ts       # Paleta de cores (primary, secondary, accent, status, grayscale)
├── spacing.ts      # Sistema de espaçamento (0-32, xs-3xl)
├── typography.ts   # Tipografia (fontSize, fontWeight, lineHeight, fontFamily)
├── borders.ts      # Border radius e shadows
└── index.ts        # Exportação consolidada do tema
```

### Hook Utilizado

```tsx
import { useThemedStyles } from "../hooks/useTheme";
import type { Theme } from "../theme";

const styles = useThemedStyles(createStyles);

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // estilos usando theme.*
  });
```

## 📁 Arquivos Refatorados

### 1. PatientDetailsScreen.tsx

**Antes:**

- Cores fixas: `#6366f1`, `#6b7280`, `#e5e7eb`, `#333`, `white`
- Espaçamentos fixos: `8`, `1`, `3px`
- Font size fixo: `13`
- Font weight fixo: `'600'`

**Depois:**

```tsx
// Cores
theme.colors.primary; // #8b5a9f (roxo principal)
theme.colors.text; // Cor do texto baseada no modo
theme.colors.textSecondary; // Cor do texto secundário
theme.colors.card; // Cor do card
theme.colors.border; // Cor da borda

// Espaçamento
theme.spacing.sm; // 8px
theme.spacing.md; // 16px

// Tipografia
theme.typography.fontSize.sm; // 14
theme.typography.fontWeight.semibold; // '600'
```

### 2-6. Tabs (Overview, Measurements, Health, Goals, Progress)

**Antes:**

- Background: `#f5f5f5`
- Card background: `white`
- Border radius: `12`
- Padding: `16`, `32`
- Font sizes: `24`, `14`
- Colors: `#333`, `#666`

**Depois:**

```tsx
// Cores
theme.colors.surface; // Cor de fundo da tela
theme.colors.card; // Cor de fundo do card
theme.colors.text; // Cor do texto principal
theme.colors.textSecondary; // Cor do texto secundário

// Espaçamento
theme.spacing.md; // 16px (padding do conteúdo)
theme.spacing.xl; // 32px (padding do placeholder)
theme.spacing.sm; // 8px (marginBottom)

// Tipografia
theme.typography.fontSize["2xl"]; // 24
theme.typography.fontSize.sm; // 14
theme.typography.fontWeight.semibold; // '600'

// Bordas e Sombras
theme.borderRadius.md; // 12
theme.shadows.sm; // Sombra suave
```

## ✅ Benefícios da Refatoração

### 1. Consistência Visual

- Todas as telas usam a mesma paleta de cores
- Espaçamentos padronizados em todo o app
- Tipografia uniforme

### 2. Suporte a Dark Mode

- Cores adaptam-se automaticamente ao tema claro/escuro
- `theme.colors.background`, `theme.colors.text`, etc. mudam com o tema

### 3. Manutenibilidade

- Mudanças de design centralizadas no tema
- Não há valores mágicos espalhados pelo código
- Fácil ajustar cores/espaçamentos globalmente

### 4. Type Safety

- TypeScript garante que apenas propriedades válidas do tema sejam usadas
- Autocomplete ajuda a descobrir propriedades disponíveis

### 5. Performance

- `useThemedStyles` usa `useMemo` internamente
- Estilos são recalculados apenas quando o tema muda

## 🎨 Paleta de Cores Aplicada

### Cores Principais

```tsx
primary: "#8b5a9f"; // Roxo principal do Silvestra
primaryLight: "#9b6cb0"; // Roxo claro
primaryDark: "#572363"; // Roxo escuro
```

### Cores de Interface

```tsx
background: "#FFFFFF"(light) / "#121212"(dark);
surface: "#F5F5F5"(light) / "#1E1E1E"(dark);
card: "#FFFFFF"(light) / "#2A2A2A"(dark);
text: "#1A1A1A"(light) / "#FFFFFF"(dark);
textSecondary: "#666666"(light) / "#B3B3B3"(dark);
border: "#E0E0E0"(light) / "#333333"(dark);
```

### Sombras

```tsx
sm: {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 2,
}
```

## 📊 Comparação de Valores

| Propriedade      | Antes (Hardcoded) | Depois (Theme)                         |
| ---------------- | ----------------- | -------------------------------------- |
| Cor primária     | `#6366f1` (azul)  | `#8b5a9f` (roxo)                       |
| Cor de fundo     | `#f5f5f5`         | `theme.colors.surface`                 |
| Cor de card      | `white`           | `theme.colors.card`                    |
| Padding médio    | `16`              | `theme.spacing.md`                     |
| Padding grande   | `32`              | `theme.spacing.xl`                     |
| Border radius    | `12`              | `theme.borderRadius.md`                |
| Font size título | `24`              | `theme.typography.fontSize['2xl']`     |
| Font size body   | `14`              | `theme.typography.fontSize.sm`         |
| Font weight      | `'600'`           | `theme.typography.fontWeight.semibold` |

## 🔄 Padrão de Migração

Para futuros componentes, seguir o padrão:

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useTheme';
import type { Theme } from '@/theme';

export const MyComponent: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    // JSX usando styles.*
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    title: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
    },
  });
```

## ✅ Validação

- ✅ TypeScript: Sem erros de compilação
- ✅ ESLint: Sem warnings ou erros
- ✅ Todos os valores hardcoded removidos
- ✅ Suporte a dark mode ativado
- ✅ Consistência visual mantida

## 📚 Referências

- Theme system: `src/theme/index.ts`
- Hook: `src/hooks/useTheme.ts`
- Cores: `src/theme/colors.ts`
- Espaçamento: `src/theme/spacing.ts`
- Tipografia: `src/theme/typography.ts`
- Bordas: `src/theme/borders.ts`
