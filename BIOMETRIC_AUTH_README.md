# Autenticação Biométrica com Refresh Token

## 📋 Visão Geral

Sistema completo de autenticação biométrica que gerencia tokens de acesso (7 dias) e refresh tokens (30 dias) automaticamente.

## 🔐 Fluxo de Autenticação

### 1. Login Normal (primeira vez)

```typescript
// O usuário faz login com email/senha
await login(email, password);

// A API retorna:
{
  user: { id, email, role, ... },
  tokens: {
    accessToken: "...", // expira em 7 dias
    refreshToken: "..." // expira em 30 dias
  }
}

// Os tokens são salvos automaticamente no Zustand (persistido)
```

### 2. Prompt de Biometria

Após login bem-sucedido, o app pergunta se o usuário quer habilitar biometria:

```typescript
// Se o usuário ACEITAR:
await BiometricAuthService.saveBiometricCredentials(
  email,
  accessToken,
  refreshToken
);
// Salva no AsyncStorage para uso futuro

// Se o usuário RECUSAR:
// Continua normalmente sem biometria
```

### 3. Auto-Login com Biometria

Na próxima vez que o app abrir:

```typescript
const result = await BiometricAuthService.authenticateWithBiometric();

if (result.success) {
  // ✅ Autenticado! Tokens validados/atualizados
  // Navegar para tela principal
} else if (result.reason === "token_expired") {
  // ❌ Sessão expirou (refresh token também expirou)
  // Mostrar alert: "Sua sessão expirou. Faça login novamente."
} else if (result.reason === "biometric_failed") {
  // ❌ Biometria falhou ou foi cancelada
  // Usuário pode tentar novamente ou usar email/senha
}
```

## 🔄 Gerenciamento Automático de Tokens

### Interceptor Axios (já configurado)

```typescript
// Em api.service.ts
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token expirou
      try {
        await refreshAccessToken(); // Usa refresh token
        // Retry requisição com novo token
      } catch {
        logout(); // Refresh também expirou
      }
    }
  }
);
```

### Fluxo de Refresh Token

1. **Access Token válido (< 7 dias)**

   - ✅ Requisições funcionam normalmente

2. **Access Token expirado, Refresh Token válido (7-30 dias)**

   - 🔄 Interceptor detecta 401
   - 🔄 Chama `refreshAccessToken()` automaticamente
   - ✅ Obtém novo access token
   - ✅ Retry da requisição original
   - 💾 Atualiza tokens salvos no AsyncStorage

3. **Ambos expirados (> 30 dias)**
   - ❌ Refresh retorna erro
   - 🧹 Limpa credenciais biométricas
   - 🚪 Faz logout automático
   - 💬 Mostra alert: "Sessão expirada"

## 📁 Arquivos Criados/Modificados

### 🆕 Novos Arquivos

#### `src/services/biometric-auth.ts`

Gerencia autenticação biométrica com validação de tokens:

```typescript
// Principais métodos:
BiometricAuthService.authenticateWithBiometric();
// Retorna: { success: boolean, reason?: string }

BiometricAuthService.saveBiometricCredentials(email, accessToken, refreshToken);
// Salva tokens para uso com biometria

BiometricAuthService.removeBiometricCredentials();
// Remove credenciais (logout ou desabilitar biometria)
```

### 📝 Arquivos Modificados

#### `src/services/storage.ts`

Adicionados métodos para salvar ambos os tokens:

```typescript
// NOVO (recomendado):
StorageService.saveAuthTokens(email, accessToken, refreshToken);
StorageService.getAuthTokens();
StorageService.clearAuthTokens();

// ANTIGO (deprecated):
StorageService.saveUserCredentials(email, token); // apenas access token
```

#### `src/screens/auth/LoginScreen.tsx`

- Integrado com store do Zustand
- Salva ambos tokens após login
- Auto-login com biometria validando tokens
- Alert quando sessão expira

#### `src/stores/auth.store.ts`

Já tinha `refreshAccessToken()` implementado ✅

#### `src/services/api.service.ts`

Já tinha interceptor para refresh automático ✅

## 🎯 Como Usar

### No Login (já implementado)

```typescript
const onSubmit = async (data) => {
  // 1. Faz login
  await login(data.email, data.password);

  // 2. Obtém tokens
  const { tokens, user } = useAuthStore.getState();

  // 3. Pergunta sobre biometria
  if (await BiometricService.isAvailable()) {
    // Mostra modal
    setPendingAuth({
      email: user.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }
};

const handleBiometricAccept = async () => {
  // Salva tokens para biometria
  await BiometricAuthService.saveBiometricCredentials(
    pendingAuth.email,
    pendingAuth.accessToken,
    pendingAuth.refreshToken
  );
  // Navegar para app
};
```

### No Auto-Login (já implementado)

```typescript
useFocusEffect(
  useCallback(() => {
    const checkBiometric = async () => {
      const result = await BiometricAuthService.authenticateWithBiometric();

      if (result.success) {
        // Auto-login bem-sucedido
        navigation.replace("MainApp");
      } else if (result.reason === "token_expired") {
        Alert.alert("Sessão Expirada", "Faça login novamente");
      }
    };

    checkBiometric();
  }, [])
);
```

### No Logout (precisa implementar)

```typescript
const handleLogout = async () => {
  // 1. Remove credenciais biométricas
  await BiometricAuthService.removeBiometricCredentials();

  // 2. Faz logout no store (já limpa tokens do Zustand)
  await logout();

  // 3. Navegar para login
  navigation.replace("Login");
};
```

## ⚙️ Configuração da API

Certifique-se que sua API está configurada corretamente:

### Access Token (7 dias)

```typescript
// No backend
const accessToken = jwt.sign(payload, secret, { expiresIn: "7d" });
```

### Refresh Token (30 dias)

```typescript
// No backend
const refreshToken = jwt.sign(payload, secret, { expiresIn: "30d" });
```

### Endpoint de Refresh

```typescript
// POST /auth/refresh
// Body: { refreshToken: string }
// Response: { accessToken: string, refreshToken: string }
```

## 🧪 Testando

### Cenário 1: Login com Biometria Habilitada

1. Faça login com email/senha
2. Aceite usar biometria
3. Feche o app completamente
4. Abra o app novamente
5. ✅ Deve aparecer prompt de biometria e entrar automaticamente

### Cenário 2: Token Expirado, Refresh Válido

1. Simule access token expirado (altere data do dispositivo +8 dias)
2. Tente fazer uma requisição
3. ✅ Deve fazer refresh automaticamente e requisição funcionar

### Cenário 3: Ambos Tokens Expirados

1. Simule ambos expirados (altere data +31 dias)
2. Abra o app com biometria
3. ✅ Deve mostrar alert "Sessão Expirada"
4. ✅ Deve limpar credenciais biométricas
5. ✅ Deve voltar para tela de login

### Cenário 4: Recusar Biometria

1. Faça login
2. Recuse biometria
3. Feche o app
4. Abra novamente
5. ✅ Deve mostrar tela de login normal (sem prompt de biometria)

## 🔒 Segurança

- ✅ Tokens nunca são expostos em logs
- ✅ AsyncStorage é criptografado pelo OS (iOS Keychain, Android Keystore)
- ✅ Biometria é gerenciada pelo sistema operacional
- ✅ Refresh automático evita requisições falharem
- ✅ Logout limpa todas as credenciais

## 📱 Plataformas Suportadas

- ✅ **iOS**: Face ID, Touch ID
- ✅ **Android**: Fingerprint, Face Unlock
- ✅ **Web**: Não suporta biometria (usa login normal)

## 🐛 Troubleshooting

### "Sessão expirada" aparece sempre

- Verifique se a data/hora do dispositivo está correta
- Confirme que a API está retornando tokens válidos
- Verifique logs do console para erros de refresh

### Biometria não aparece

- Verifique se o dispositivo tem biometria configurada
- Confirme permissões no AndroidManifest.xml / Info.plist
- Use `BiometricService.isAvailable()` para debug

### Auto-login não funciona

- Verifique se `isBiometricEnabled()` retorna `true`
- Confirme que tokens foram salvos corretamente
- Veja logs do `BiometricAuthService.authenticateWithBiometric()`

## ✅ Checklist de Implementação

- [x] StorageService com saveAuthTokens
- [x] BiometricAuthService criado
- [x] LoginScreen integrado com store
- [x] Auto-login validando tokens
- [x] Alert de sessão expirada
- [x] Interceptor de refresh (já existia)
- [x] Store com refreshAccessToken (já existia)
- [ ] Implementar logout com limpeza de biometria
- [ ] Testar todos os cenários
- [ ] Configurar permissões de biometria no app.json/AndroidManifest

## 🚀 Próximos Passos

1. **Implementar Logout**

   ```typescript
   // Adicionar em alguma tela de perfil/settings
   const handleLogout = async () => {
     await BiometricAuthService.removeBiometricCredentials();
     await useAuthStore.getState().logout();
     navigation.replace("Login");
   };
   ```

2. **Adicionar Opção de Desabilitar Biometria**

   ```typescript
   // Em tela de configurações
   const handleDisableBiometric = async () => {
     await BiometricAuthService.removeBiometricCredentials();
     Alert.alert("Biometria desabilitada");
   };
   ```

3. **Melhorar UX de Erros**

   - Adicionar toast/snackbar para erros
   - Loading states durante refresh
   - Retry automático em caso de erro de rede

4. **Configurar Permissões**

   - Adicionar em `app.json`:
     ```json
     {
       "expo": {
         "plugins": [
           [
             "expo-local-authentication",
             {
               "faceIDPermission": "Permitir que $(PRODUCT_NAME) use Face ID."
             }
           ]
         ]
       }
     }
     ```

5. **Testes End-to-End**
   - Testar em dispositivo real (não simulador)
   - Validar todos os cenários listados acima
   - Testar com diferentes tipos de biometria
