# Silvestra App - Mobile Application

Aplicativo mobile do projeto Silvestra, uma plataforma de gestão nutricional para nutricionistas e pacientes.

## 🚀 Tecnologias

- **React Native** 0.81.5
- **Expo** ~54.0.19
- **React Navigation** v7 (Stack + Bottom Tabs)
- **NativeWind** v4 (Tailwind CSS para React Native)
- **Zustand** - State Management
- **React Hook Form** + **Zod** - Formulários e validação
- **Axios** - HTTP Client
- **TypeScript** - Tipagem estática

## 📁 Estrutura do Projeto

```
silvestra-app/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes básicos (Button, Input, Card, Loading)
│   │   └── forms/           # Componentes de formulário (FormInput, FormSelect, etc)
│   ├── screens/             # Telas do aplicativo
│   ├── navigation/          # Configuração de navegação
│   │   ├── AuthNavigator.tsx
│   │   ├── PatientNavigator.tsx
│   │   ├── NutritionistNavigator.tsx
│   │   └── RootNavigator.tsx
│   ├── hooks/               # Custom hooks (useTheme, useApi)
│   ├── services/            # API services (authService, userService)
│   ├── store/               # Zustand stores (authStore, themeStore)
│   ├── types/               # TypeScript types e interfaces
│   ├── theme/               # Sistema de tema (cores, tipografia, spacing)
│   └── utils/               # Funções utilitárias
├── App.tsx                  # Componente raiz
├── global.css               # Estilos globais NativeWind
├── tailwind.config.js       # Configuração do Tailwind
└── package.json
```

## 🎨 Sistema de Tema

O app possui um sistema de tema completo com suporte a modo claro e escuro:

### Cores Principais

- **Primary**: `#572363` (Roxo)
- **Accent**: `#FF6B9D` (Rosa)
- **Secondary**: `#8B4A9D`

### Tipografia

- **Font Family**: Inter (100 → 900)
- **Tamanhos**: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (28), 4xl (32), 5xl (36), 6xl (48)

### Uso do Tema

```typescript
import { useTheme } from "./src/hooks/useTheme";

function MyComponent() {
  const theme = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text
        style={{
          color: theme.colors.text,
          fontFamily: theme.typography.regular,
        }}
      >
        Hello World
      </Text>
    </View>
  );
}
```

## 🧩 Componentes Disponíveis

### UI Base (`src/components/ui`)

#### Button

```typescript
<Button
  variant="primary" // primary | secondary | outline | ghost
  size="md" // sm | md | lg
  onPress={() => {}}
  leftIcon={<Icon />}
  isLoading={false}
>
  Texto do Botão
</Button>
```

#### Input

```typescript
<Input
  label="Email"
  placeholder="seu@email.com"
  value={value}
  onChangeText={setValue}
  error="Mensagem de erro"
  isPassword={false}
  leftIcon={<Icon />}
/>
```

#### Card

```typescript
<Card variant="default">
  {" "}
  {/* default | outlined | elevated */}
  <Text>Conteúdo do card</Text>
</Card>
```

#### Loading

```typescript
<Loading text="Carregando..." fullScreen={true} />
```

### Componentes de Formulário (`src/components/forms`)

#### FormInput

```typescript
import { useForm } from "react-hook-form";

const { control } = useForm();

<FormInput
  name="email"
  control={control}
  label="Email"
  placeholder="seu@email.com"
/>;
```

#### FormSelect

```typescript
<FormSelect
  name="gender"
  control={control}
  label="Gênero"
  options={[
    { label: "Masculino", value: "male" },
    { label: "Feminino", value: "female" },
  ]}
/>
```

#### FormCheckbox

```typescript
<FormCheckbox name="terms" control={control} label="Aceito os termos de uso" />
```

#### FormRadioGroup

```typescript
<FormRadioGroup
  name="role"
  control={control}
  label="Tipo de usuário"
  direction="row" // row | column
  options={[
    { label: "Paciente", value: "patient" },
    { label: "Nutricionista", value: "nutritionist" },
  ]}
/>
```

## 🔐 Autenticação e API

### Auth Store (Zustand)

```typescript
import { useAuthStore } from "./src/store/authStore";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const handleLogin = async () => {
    await login(userData, tokens);
  };
}
```

### API Services

```typescript
import { authService } from "./src/services";

// Login
const response = await authService.login({ email, password });

// Register
const response = await authService.register({
  email,
  password,
  role: "patient",
});

// Get Profile
const profile = await authService.getProfile();
```

### Custom Hooks de API

```typescript
import { useGet, usePost } from "./src/hooks/useApi";

// GET request
const { data, loading, error, execute } = useGet("/users/profile", true);

// POST request
const { execute: createUser } = usePost("/users");
await createUser();
```

## 🧭 Navegação

O app possui 3 navegadores principais:

### AuthNavigator

- Login
- Register
- ForgotPassword

### PatientNavigator (Tab Navigator)

- Home
- Nutrition
- Profile

### NutritionistNavigator (Tab Navigator)

- Dashboard
- Patients
- Schedule
- Profile

### Navegação Condicional

O `RootNavigator` decide qual navegador exibir baseado no estado de autenticação:

- Não autenticado → `AuthNavigator`
- Autenticado como nutricionista → `NutritionistNavigator`
- Autenticado como paciente → `PatientNavigator`

## ⚙️ Configuração e Instalação

### 1. Instalar dependências

```bash
npm install
# ou
yarn install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_ENV=development
```

### 3. Executar o projeto

```bash
# Iniciar o Metro bundler
npx expo start

# Opções:
# - Pressione 'a' para Android
# - Pressione 'i' para iOS
# - Pressione 'w' para Web
```

## 📱 Executar em Dispositivos

### Android

```bash
npx expo run:android
```

### iOS (necessário macOS)

```bash
npx expo run:ios
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar com coverage
npm run test:coverage
```

## 📦 Build de Produção

### Android (APK)

```bash
eas build --platform android
```

### iOS (IPA)

```bash
eas build --platform ios
```

## 🛠️ Scripts Disponíveis

- `npm start` - Inicia o Expo
- `npm run android` - Executa no Android
- `npm run ios` - Executa no iOS
- `npm run web` - Executa no navegador
- `npm test` - Executa testes
- `npm run lint` - Verifica código com ESLint
- `npm run format` - Formata código com Prettier

## 🎯 Próximas Features

- [ ] OAuth Google (Expo Auth Session)
- [ ] Edge-to-Edge no Android
- [ ] Telas de autenticação (Login, Register)
- [ ] Dashboard do nutricionista
- [ ] Lista de pacientes
- [ ] Planos alimentares
- [ ] Chat entre nutricionista e paciente
- [ ] Notificações push

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Time

Desenvolvido por Logicphire

---

**Versão**: 0.1.0  
**Última atualização**: 23 de outubro de 2025
