# PatientDetailsScreen - Documentação de Uso

## Estrutura de Arquivos Criada

```
src/screens/patient/
├── PatientDetailsScreen.tsx    # Tela principal com navegação por abas
├── index.ts                     # Arquivo de re-exportação
└── tabs/
    ├── OverviewTab.tsx         # Aba 1: Visão Geral (placeholder)
    ├── MeasurementsTab.tsx     # Aba 2: Medidas (placeholder)
    ├── HealthTab.tsx           # Aba 3: Saúde (placeholder)
    ├── GoalsTab.tsx            # Aba 4: Metas (placeholder)
    └── ProgressTab.tsx         # Aba 5: Progresso (placeholder)
```

## Como Usar

### 1. Adicionar a rota no Navigator

No seu `RootNavigator.tsx` ou onde você gerencia as rotas principais:

```tsx
import { PatientDetailsScreen } from "@/screens/patient";

// Adicionar no Stack.Navigator
<Stack.Screen
  name="PatientDetails"
  component={PatientDetailsScreen}
  options={{ headerShown: true }}
/>;
```

### 2. Navegar para a tela

De qualquer lugar do app:

```tsx
import { useNavigation } from "@react-navigation/native";

const navigation = useNavigation();

// Navegar passando os parâmetros necessários
navigation.navigate("PatientDetails", {
  patientId: "123e4567-e89b-12d3-a456-426614174000",
  patientName: "João Silva",
});
```

### 3. Estrutura das Abas

Cada aba renderiza um componente placeholder que será implementado nas próximas tasks:

- **Overview**: KPIs, resumos e mini gráfico
- **Medidas**: Histórico de medições corporais
- **Saúde**: Informações de saúde e estilo de vida
- **Metas**: Gerenciamento de metas e conquistas
- **Progresso**: Gráficos de evolução com D3.js

## Características Implementadas

### Navegação por Abas Material Top Tabs

- ✅ 5 abas com ícones e labels
- ✅ Scroll horizontal habilitado
- ✅ Swipe entre abas habilitado
- ✅ Indicador de aba ativa (linha roxa)
- ✅ Tema customizado (cor primária #6366f1)

### Header Customizado

- ✅ Nome do paciente no título
- ✅ Botão de voltar funcional
- ✅ Ícone do Ionicons

### Estilização

- ✅ Cores consistentes com o tema
- ✅ Border bottom no tab bar
- ✅ Sem elevação/shadow
- ✅ Labels sem uppercase
- ✅ Ícones ao lado dos labels

## Dependências Instaladas

```json
{
  "@react-navigation/material-top-tabs": "^7.x.x",
  "react-native-tab-view": "^3.x.x",
  "react-native-pager-view": "^6.x.x"
}
```

## Type Safety

```tsx
type RootStackParamList = {
  PatientDetails: {
    patientId: string; // UUID do paciente
    patientName: string; // Nome completo para exibir no header
  };
};
```

## Próximos Passos

As seguintes tasks implementarão o conteúdo de cada aba:

1. **Task 4**: Implementar OverviewTab com KPIs e cards
2. **Task 5**: Implementar MeasurementsTab com FlatList paginado
3. **Task 6**: Implementar HealthTab com seções de saúde
4. **Task 7**: Implementar GoalsTab com tabs secundárias
5. **Task 8**: Implementar ProgressTab com gráficos D3.js

## Exemplo Completo de Navegação

```tsx
// Em uma lista de pacientes:
const PatientList: React.FC = () => {
  const navigation = useNavigation();

  const handlePatientPress = (patient: Patient) => {
    navigation.navigate("PatientDetails", {
      patientId: patient.id,
      patientName: patient.fullName,
    });
  };

  return (
    <FlatList
      data={patients}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handlePatientPress(item)}>
          <Text>{item.fullName}</Text>
        </TouchableOpacity>
      )}
    />
  );
};
```
