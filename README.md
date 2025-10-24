# 📱 Silvestra App - App MobileEsta aplicação é voltada para a criação de um app de nutrição para nutricionistas e sesu clientes, mas também o usuário não necessáriamente precisa de um nutricionista para ter acesso ao app, porem ele terá limitações de acessoas a determinadas funiocnalidades por conta disso.

Aplicativo mobile de gerenciamento nutricional desenvolvido com React Native + Expo.As tecnologias utilizadas neste aplicativo serão nativewind para estilização do app, hook form, para validação de formulários integrado com o zod, utilizaremos também o zustand para controle de estado global, para facilitar. Usaremos também o Oauth do google para a questão da autenticação dos clientes e nutricionistas, porem para o nutricionista poder atuar no app como nutricionista ativo ele deve ir para uam tela onde irá cadastrar seu CRN, após isso todas as funcioanlidades de nutricionista erão ativadas e estaram visiveis ao usuário nutricionista. Como icones utilize o Expo icons e crie os própios componentes inclusive os de formulários utilizando o nativewind. E muito importante, para não ter que ter cores separadas em toda a aplicação, sempre utilize o tema, onde fique armazenadado todas as cores, tamanhos, dimenções, forma, fontes de texto entre outras informações que poderam ser compartlhadas em toda a aplicação. COm isso exclua também arquivos e pastas que não serão utilizadas ou que serão movidas para outra pasta, por conta da nova arquitetura que será implementada.

## 🚀 TecnologiasO layout da aplicação deverá ser moderno e agradável ao ususário, ele precisa ser robusto e utilizar tecnologias atuais além de ter animações suaves para melhorar a experiencia do ususário, a cor predominante da aplicação é um roxo "#572363". Lembre-se de utilizar a nova vuncionalidade do Expo a "react-native-edge-to-edge", pois alguns celulares possuem a barra de ações a baixo que pode ficar por cima da aplicação. Para mais inforamções esses são os links das documentações:

- **React Native** 0.81.5https://developer.android.com/develop/ui/views/layout/edge-to-edge?hl=pt-br

- **Expo** ~54.0.19https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android

- **TypeScript** 5.3.3

- **NativeWind** v4 (Tailwind CSS)Toda a aplicação será componentizada para facilitar a manutenção, ela deverá ser organizada em arquivo de tela, com a aprte do layout e estilo com o tailwind (nativewind), o arquivo de hook, com todas as ações e funções que serão realizadas na tela.

- **React Navigation** v7

- **Zustand** (State Management)Iremos utilizar o react navigation em vez do expo navigation que vem po padrão.

- **React Hook Form** + **Zod** (Formulários e validação)

- **Axios** (HTTP Client)Crie uam pasta global de hooks, onde nela derão ter todos os hooks que serão utilizados globalmente pela aplicação, como por exemplo o hook de requisições a api, nele deverá ter as funções de cada requisição, como GET, POST, PUT, DELETE e PATCH.

## 📦 InstalaçãoA primeira etapa do projeto será jsutamente a organização da arquittura da aplicação, digamos será a etapa ZERO, logo em seguida teremos as outras etapas, mas para isso utilize a documentação que está na raiz do projeto para entender exatamente como será cada módulo, com isso crie um documento que separe cada módulo, suas etapa e subetapas, para facilitar o desenvolvimento e criação da aplicação.

```bashTemso 2 projetos para a mesma aplicação dentro da pasta, que seria:

# Instalar dependências

npm install/api-silvestra -> Onde é a api que será responsável por realizar todas as ações de requisição com bando, aramazenamento de arquivos e outras funcionalidadaes do app



# Copiar arquivo de ambiente/silvestra-app -> Este é o projeto do aplicativop expo com react-native.

cp .env.example .env

Agora vamso para a parte da api:

# Editar .env com suas configurações

# EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1A arquitetura da api será bem diferente, pois ela irá utilizar o prisma JS para se comunicar com o banco de dados postgres, irá utilizar o "Cloud Storage" da "Backblaze" para os armazenamentos de arquivos, irá utilizar também o zod, para realizar o validação dos dadaos que serão trafegados entre a API e a aplicação mobile, terá o swagger como documentação da api, irá utilizar JWT para as autenticações do ususário que não quiserem utilizar o login social, e o principal que segirá utilizando a arquitetura SOLID, de forma que fique facil o entendimento e utilização de cada um dos serviços e módulos da aplicação da API.

```

Da mesma forma que o app, adicione a documentação os módulos, etapas e sub etapas de cada implementação da API, de forma que seja implemebntado sempre em paralelo ou prioridade a API e ao App mobile.

## 🏃 Como rodar

Antes de começar, foque em contruir o documento com todos os módulo, etapas e subetapas da API e do app mobile, para facilitar no desenvolvimento.

```bash

# Desenvolvimento (escolher plataforma)Lembre-se de deixar a aplicação com um layput unico, robusto, atraente, facil entendimento, minimalista e com cores que não afetem a visão dos ususários, implemente também uma funcionalidade no app de tema escuro.

npm start

Para entender por completo as funcionalidades e módulos da aplicação, o documento está na raiz do projeto com o nome de "documentacao.md"

# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Button, Input, Card, Loading
│   ├── forms/          # FormInput, FormSelect, FormCheckbox
│   └── SafeAreaView.tsx
├── navigation/         # AuthNavigator, PatientNavigator, NutritionistNavigator
├── screens/            # Telas da aplicação
├── services/           # API services (api, auth, user)
├── store/              # Zustand stores (auth, theme)
├── hooks/              # Custom hooks (useApi, useGoogleAuth, useTheme)
├── theme/              # Sistema de tema (colors, typography, spacing)
├── types/              # TypeScript types
└── utils/              # Utilitários
```

## 🎨 Sistema de Tema

Cores principais:

- **Primary**: `#572363` (Roxo)
- **Accent**: `#FF6B9D` (Rosa)

```tsx
import { useTheme } from "@/hooks/useTheme";

const { colors, isDark, toggleTheme } = useTheme();
```

## 🔐 Autenticação

### Login Email/Senha

```tsx
import { authService } from "@/services/authService";

const response = await authService.login(email, password);
```

### Login Google OAuth

```tsx
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const { signInWithGoogle, isLoading, authResult } = useGoogleAuth();
```

## 🌐 API Client

```tsx
import { useGet, usePost } from "@/hooks/useApi";

const { data, loading } = useGet("/users/profile");
const { execute } = usePost("/auth/login");
```

## 📱 Componentes

- **Button**: 4 variantes, 3 tamanhos
- **Input**: Com label, erro, ícones
- **Card**: 3 variantes
- **Loading**: Spinner customizável
- **FormInput, FormSelect, FormCheckbox**: Integrados com React Hook Form

## 📚 Documentação Completa

Veja `README_NEW.md` para documentação detalhada.

---

**Status**: ✅ Arquitetura 100% completa  
**Versão**: 1.0.0
