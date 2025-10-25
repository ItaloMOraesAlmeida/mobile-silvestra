# 🔄 Resolução de Dependência Circular - Auth Store e API Service

## 📋 Problema Identificado

O warning indicava um **ciclo de dependência circular**:

```
WARN  Require cycle: src/stores/auth.store.ts -> src/services/api.service.ts -> src/stores/auth.store.ts
```

### Fluxo do Problema:

1. `auth.store.ts` importa `api` de `api.service.ts`
2. `api.service.ts` importa `useAuthStore` de `auth.store.ts`
3. **CICLO COMPLETO** ⚠️

### Consequências Potenciais:

- Valores não inicializados em runtime
- Comportamento imprevisível durante inicialização
- Dificuldade de manutenção
- Possíveis crashes em prod

---

## ✅ Solução Implementada

### Arquitetura Refatorada

Criamos uma **camada de abstração** usando o padrão **Mediator/Service Layer**:

```
┌─────────────────┐
│  auth.store.ts  │
│                 │
│  - login()      │
│  - logout()     │
│  - register()   │
└────────┬────────┘
         │
         │ usa
         ↓
┌─────────────────┐      sincroniza     ┌──────────────────┐
│  api.service.ts │◄─────────────────────│ token.service.ts │
│                 │                      │                  │
│  - interceptors │                      │  - getTokens()   │
│  - axios config │                      │  - setTokens()   │
└─────────────────┘                      │  - clearTokens() │
         ↑                                └──────────────────┘
         │
         │ registra callbacks
         │
┌────────┴────────┐
│ registerAuth    │
│   Callbacks()   │
└─────────────────┘
```

---

## 🛠️ Arquivos Criados/Modificados

### 1. **token.service.ts** (NOVO)

**Responsabilidade**: Gerenciar tokens sem depender do auth store

```typescript
class TokenService {
  private tokens: AuthTokens | null = null;

  getTokens(): AuthTokens | null;
  setTokens(tokens: AuthTokens | null): void;
  clearTokens(): void;
  subscribe(listener): () => void;
}
```

**Benefícios**:

- ✅ Sem dependências circulares
- ✅ Single Responsibility Principle
- ✅ Pode ser usado por qualquer serviço
- ✅ Testável isoladamente

---

### 2. **api.service.ts** (REFATORADO)

**Antes** (Problemático):

```typescript
import { useAuthStore } from "../stores/auth.store"; // ❌ Dependência circular

api.interceptors.request.use((config) => {
  const { tokens } = useAuthStore.getState(); // ❌ Acesso direto
  // ...
});
```

**Depois** (Solução):

```typescript
import { tokenService } from "./token.service"; // ✅ Sem ciclo

// Callbacks registrados externamente
let refreshTokenCallback: (() => Promise<void>) | null = null;
let logoutCallback: (() => Promise<void>) | null = null;

export function registerAuthCallbacks(
  refreshToken: () => Promise<void>,
  logout: () => Promise<void>
) {
  refreshTokenCallback = refreshToken;
  logoutCallback = logout;
}

api.interceptors.request.use((config) => {
  const tokens = tokenService.getTokens(); // ✅ Usa service
  // ...
});
```

**Mudanças**:

- ✅ Remove import do `useAuthStore`
- ✅ Usa `tokenService` para acessar tokens
- ✅ Callbacks registrados via função pública
- ✅ Inversão de dependência (Dependency Inversion)

---

### 3. **auth.store.ts** (ATUALIZADO)

**Adicionado**:

```typescript
import { tokenService } from "../services/token.service";
import { registerAuthCallbacks } from "../services/api.service";

// Em cada operação que modifica tokens:
login: async (email, password) => {
  // ... lógica de login
  tokenService.setTokens(tokens); // ✅ Sincroniza
};

logout: async () => {
  // ... lógica de logout
  tokenService.clearTokens(); // ✅ Limpa tokens
};

// Registra callbacks ao final do arquivo
registerAuthCallbacks(
  () => useAuthStore.getState().refreshAccessToken(),
  () => useAuthStore.getState().logout()
);

// Sincroniza tokens do storage ao carregar
useAuthStore.subscribe((state) => {
  tokenService.setTokens(state.tokens);
});
```

**Mudanças**:

- ✅ Mantém import do `api` (necessário para chamadas HTTP)
- ✅ Sincroniza tokens com `tokenService` em todas as operações
- ✅ Registra callbacks para o `api.service` usar
- ✅ Subscriber garante sincronização ao carregar do AsyncStorage

---

## 🎯 Fluxo de Execução

### Inicialização do App:

```
1. App.tsx inicia
2. auth.store.ts é carregado
   ├─> Registra callbacks no api.service
   ├─> Subscribe ao store para sincronizar tokens
   └─> Carrega tokens do AsyncStorage (se existir)
3. tokenService recebe tokens via subscriber
4. api.service pode usar tokens via tokenService
✅ Sem dependência circular!
```

### Fluxo de Login:

```
1. LoginScreen → useAuthStore.login(email, password)
2. auth.store.ts:
   ├─> Chama api.post('/auth/login') ✅
   ├─> Recebe { user, tokens }
   ├─> set({ user, tokens, isAuthenticated: true })
   └─> tokenService.setTokens(tokens) ✅
3. api.service.ts:
   └─> Próximas requisições usam tokenService.getTokens() ✅
```

### Fluxo de Refresh Token (401):

```
1. api.service.ts interceptor detecta 401
2. Chama refreshTokenCallback() ✅ (registrado pelo auth.store)
3. auth.store.refreshAccessToken():
   ├─> Chama api.post('/auth/refresh')
   ├─> Recebe novos tokens
   ├─> set({ tokens: newTokens })
   └─> tokenService.setTokens(newTokens) ✅
4. api.service.ts:
   └─> Retry da requisição original com novo token ✅
```

---

## 🧪 Testes Recomendados

### 1. Login Flow

```typescript
// Verificar se tokens são sincronizados
const tokens = tokenService.getTokens();
expect(tokens).not.toBeNull();
```

### 2. Refresh Token

```typescript
// Simular 401 e verificar refresh automático
// Mock api call que retorna 401
// Verificar se callback de refresh foi chamado
```

### 3. Logout

```typescript
// Verificar se tokens são limpos
useAuthStore.getState().logout();
expect(tokenService.getTokens()).toBeNull();
```

---

## 📊 Comparação: Antes vs Depois

| Aspecto                   | Antes                | Depois        |
| ------------------------- | -------------------- | ------------- |
| **Dependência Circular**  | ❌ Sim               | ✅ Não        |
| **Testabilidade**         | ⚠️ Difícil           | ✅ Fácil      |
| **Manutenibilidade**      | ⚠️ Média             | ✅ Alta       |
| **Single Responsibility** | ❌ Violado           | ✅ Respeitado |
| **Acoplamento**           | ❌ Alto              | ✅ Baixo      |
| **Performance**           | ⚠️ Overhead de ciclo | ✅ Otimizado  |

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras:

1. **Token Encryption**: Criptografar tokens no AsyncStorage
2. **Token Expiration Check**: Verificar expiração antes de requisições
3. **Retry Logic**: Implementar exponential backoff em erros 5xx
4. **Monitoring**: Adicionar logs/analytics para tokens expirados

---

## 📚 Padrões de Design Aplicados

1. **Dependency Inversion Principle (DIP)**

   - Alta camada (auth.store) não depende de baixa (api.service)
   - Ambas dependem de abstração (tokenService)

2. **Mediator Pattern**

   - tokenService medeia comunicação entre store e api

3. **Observer Pattern**

   - Subscribe do zustand para sincronização automática

4. **Callback/Dependency Injection**
   - Callbacks registrados externamente evitam import direto

---

## ✅ Resultado Final

```bash
# Antes
WARN  Require cycle: src/stores/auth.store.ts -> src/services/api.service.ts -> src/stores/auth.store.ts

# Depois
✅ Sem warnings de dependência circular!
```

**Status**: ✅ **RESOLVIDO**

---

**Autor**: GitHub Copilot  
**Data**: 25 de outubro de 2025  
**Versão**: 1.0.0
