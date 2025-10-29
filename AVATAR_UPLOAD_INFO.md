# 📸 Sistema de Upload de Avatar - Silvestra

## ✨ Funcionalidades Implementadas

### 🎯 Captura de Foto

- **Câmera Frontal por Padrão**: Perfeito para selfies
- **Editor Nativo**: Interface de edição integrada do iOS/Android
- **Crop 1:1**: Formato quadrado para avatares
- **Qualidade 0.8**: Equilíbrio entre qualidade e tamanho

### 🖼️ Edição de Fotos

Quando você tira uma foto ou escolhe da galeria, o sistema **automaticamente abre um editor** que permite:

#### iOS (iPhone/iPad)

- ✅ **Zoom**: Pinça para ampliar/reduzir
- ✅ **Mover**: Arraste para reposicionar
- ✅ **Rotacionar**: Gire a imagem
- ✅ **Crop**: Ajuste o enquadramento
- ✅ **Cancelar**: Botão para descartar
- ✅ **Confirmar**: Botão "Choose" ou "✓"

#### Android

- ✅ **Zoom**: Pinça para ampliar/reduzir
- ✅ **Mover**: Arraste para reposicionar
- ✅ **Rotacionar**: Gire a imagem
- ✅ **Crop**: Ajuste o enquadramento
- ✅ **Cancelar**: Botão "Cancel"
- ✅ **Confirmar**: Botão "OK" ou "✓"

### 📋 Como Funciona

1. **Abrir Modal**

   - Toque no avatar no ProfileScreen
   - Escolha entre "Usar Câmera" ou "Escolher da Galeria"

2. **Tirar/Escolher Foto**

   - **Câmera**: Abre câmera frontal (selfie)
   - **Galeria**: Abre galeria de fotos

3. **Editar Foto (AUTOMÁTICO)**

   - Sistema abre editor nativo
   - Você pode:
     - Zoom in/out
     - Mover a imagem
     - Rotacionar
     - Ajustar o crop
   - Formato forçado: 1:1 (quadrado)

4. **Confirmar**

   - Toque em "Choose" (iOS) ou "OK" (Android)
   - Sistema faz upload automático
   - Avatar atualizado em tempo real

5. **Cancelar**
   - Toque em "Cancel"
   - Volta para o modal de opções

### 🔧 Configurações Técnicas

```typescript
// Câmera
launchCameraAsync({
  mediaTypes: ["images"],
  allowsEditing: true, // ✅ Habilita editor nativo
  aspect: [1, 1], // ✅ Crop quadrado
  quality: 0.8, // ✅ 80% qualidade
  exif: false, // ✅ Remove metadados
  cameraType: CameraType.front, // ✅ Câmera frontal
});

// Galeria
launchImageLibraryAsync({
  mediaTypes: ["images"],
  allowsEditing: true, // ✅ Habilita editor nativo
  aspect: [1, 1], // ✅ Crop quadrado
  quality: 0.8, // ✅ 80% qualidade
  exif: false, // ✅ Remove metadados
});
```

### 📱 Interface de Edição

#### Exemplo iOS:

```
┌─────────────────────────┐
│      [Cancel]   [Choose]│
│                         │
│  ┌─────────────────┐   │
│  │                 │   │
│  │   [SUA FOTO]    │   │  ← Zoom, move, rotaciona
│  │                 │   │
│  └─────────────────┘   │
│                         │
│  [Crop] [Rotate] [...]  │  ← Ferramentas
└─────────────────────────┘
```

#### Exemplo Android:

```
┌─────────────────────────┐
│                         │
│  ┌─────────────────┐   │
│  │                 │   │
│  │   [SUA FOTO]    │   │  ← Zoom, move, rotaciona
│  │                 │   │
│  └─────────────────┘   │
│                         │
│   [Cancel]     [OK]     │
└─────────────────────────┘
```

### 🎨 Sobre o "Espelhamento"

A câmera frontal geralmente mostra uma **pré-visualização espelhada** (como um espelho), mas:

✅ **A foto salva NÃO fica espelhada**

- O sistema operacional corrige automaticamente
- A imagem final é salva na orientação correta
- É assim que todas as câmeras frontais funcionam

Se você ver a pré-visualização espelhada, **é normal**! A foto final estará correta.

### 🔄 Fluxo Completo

```
1. Toque no Avatar
   ↓
2. Modal: "Usar Câmera" ou "Galeria"
   ↓
3. Câmera/Galeria abre
   ↓
4. Tire/escolha a foto
   ↓
5. ✨ EDITOR ABRE AUTOMATICAMENTE ✨
   ├─ Zoom in/out
   ├─ Mover
   ├─ Rotacionar
   └─ Ajustar crop
   ↓
6. Toque "Choose"/"OK"
   ↓
7. Upload para Backblaze B2
   ↓
8. Salva URL no banco
   ↓
9. Avatar atualizado ✅
```

### 📝 Notas Importantes

1. **Editor Nativo é Automático**

   - Não precisa instalar nada extra
   - É a interface padrão do iOS/Android
   - Usuário já está familiarizado

2. **Formato Forçado**

   - Sempre 1:1 (quadrado)
   - Ideal para avatares
   - Consistência visual

3. **Qualidade Otimizada**

   - 80% de qualidade
   - Tamanho reduzido
   - Upload mais rápido

4. **Sem Metadados**
   - `exif: false` remove dados GPS/câmera
   - Privacidade do usuário
   - Arquivo menor

### 🚀 Benefícios

✅ **Experiência Nativa**: Editor familiar do sistema
✅ **Sem Dependências**: Não precisa de lib extra
✅ **Performance**: Interface otimizada do OS
✅ **Consistência**: Mesma experiência de outros apps
✅ **Simplicidade**: Um clique e edita tudo

### 🔗 Documentação Oficial

- [Expo ImagePicker - allowsEditing](https://docs.expo.dev/versions/latest/sdk/imagepicker/#imagepickeroptions)
- [iOS UIImagePickerController](https://developer.apple.com/documentation/uikit/uiimagepickercontroller)
- [Android ACTION_PICK](https://developer.android.com/reference/android/content/Intent#ACTION_PICK)

---

**Resumo**: O editor de fotos já está funcionando! É a interface nativa do iOS/Android que abre automaticamente quando você tira/escolhe uma foto. Basta usar zoom, mover, rotacionar e confirmar. 📸✨
