# 🤖 Arquitetura ReAct Agent - Threat Modeling

## 📊 Visão Geral

Este módulo implementa um **Agente ReAct (Reasoning and Acting)** para análise automatizada de ameaças usando a metodologia STRIDE. O agente usa **LangGraph** para orquestrar um fluxo cíclico onde o LLM raciocina, decide usar ferramentas, executa ações e aprende com os resultados.

---

## 🏗️ Arquitetura

### **Padrão ReAct**

```
┌─────────────────────────────────────────────────────────────┐
│                     ReAct Loop                               │
│                                                               │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────┐│
│  │             │      │              │      │             ││
│  │   Thought   │─────▶│   Action     │─────▶│ Observation ││
│  │ (Raciocínio)│      │ (Ferramenta) │      │  (Resultado)││
│  │             │      │              │      │             ││
│  └─────────────┘      └──────────────┘      └──────┬──────┘│
│         ▲                                            │       │
│         │                                            │       │
│         └────────────────────────────────────────────┘       │
│                                                               │
│  Continua até: ✅ Análise completa OU ⏰ Timeout             │
└─────────────────────────────────────────────────────────────┘
```

### **Componentes Principais**

```
backend/src/agents/
├── ThreatModelingAgent.ts       # 🧠 Agente principal (orquestrador)
├── types/
│   └── AgentTypes.ts            # 📋 Tipos e interfaces
├── tools/                       # 🔧 Ferramentas disponíveis
│   ├── SearchCapecTool.ts       # Busca CAPECs no Neo4j
│   ├── SearchOwaspTool.ts       # Busca OWASP Top 10/LLM
│   ├── ValidateUniqueTool.ts    # Valida unicidade de CAPECs
│   ├── AnalyzeDataFlowTool.ts   # Analisa fluxos de dados
│   ├── DetectAIComponentTool.ts # Detecta componentes IA/ML
│   └── index.ts                 # Exporta todas as tools
├── utils/
│   └── PromptTemplates.ts       # 📝 Templates de prompts
└── README.md                    # 📚 Esta documentação
```

---

## 🔧 Ferramentas (Tools)

O agente tem acesso a 5 ferramentas especializadas:

### **1. search_capec**
**Busca CAPECs no Neo4j por categoria STRIDE**

```typescript
// Entrada:
{
  strideCategory: "Spoofing" | "Tampering" | ...,
  keyword?: "injection" | "sql" | "xss",
  limit?: 10
}

// Saída:
{
  found: true,
  count: 5,
  capecs: [
    { id: "CAPEC-242", name: "Code Injection", description: "...", strideCategory: "Tampering" }
  ]
}
```

**Quando usar:**
- Precisa encontrar CAPECs apropriados para uma ameaça
- Quer CAPECs alternativos (se um já foi usado)
- Precisa validar se um CAPEC existe

---

### **2. search_owasp**
**Busca categorias OWASP Top 10 ou OWASP LLM Top 10**

```typescript
// Entrada:
{
  componentType: "ai" | "web" | "api" | "database",
  keyword?: "injection" | "authentication",
  limit?: 5
}

// Saída:
{
  found: true,
  framework: "OWASP LLM Top 10",
  categories: [
    { id: "LLM01", name: "Prompt Injection", description: "..." }
  ]
}
```

**Quando usar:**
- Precisa identificar a categoria OWASP de uma ameaça
- Quer saber se deve usar OWASP LLM ou OWASP Web
- Precisa de contexto sobre riscos específicos

---

### **3. validate_capec_unique**
**Valida se um CAPEC já foi usado (CRÍTICO)**

```typescript
// Entrada:
{
  capecId: "CAPEC-242",
  componentName?: "Web Application"
}

// Saída:
{
  isUnique: false,
  alreadyUsedIn: { component: "Database", strideCategory: "Tampering" },
  suggestion: "Busque um CAPEC alternativo",
  action: "REJEITAR este CAPEC e buscar outro"
}
```

**Quando usar:**
- **SEMPRE** antes de adicionar uma ameaça ao relatório
- Para garantir unicidade de CAPECs (regra crítica)

---

### **4. analyze_data_flow**
**Analisa fluxos de dados entre componentes**

```typescript
// Entrada:
{
  from: "Web Application",
  to: "Database",
  encrypted: false,
  trustBoundary: "internal" | "external-to-internal" | "cross-boundary"
}

// Saída:
{
  flow: "Web Application → Database",
  threatsFound: 3,
  threats: [
    {
      strideCategory: "Information Disclosure",
      scenario: "Interceptação de dados não criptografados",
      suggestedCapecs: ["CAPEC-117", "CAPEC-157"],
      impact: "CRITICAL"
    }
  ]
}
```

**Quando usar:**
- Analisar comunicação entre componentes
- Identificar ameaças em fluxos cross-boundary
- Verificar se dados sensíveis estão protegidos

---

### **5. detect_ai_component**
**Detecta se um componente é relacionado a IA/ML**

```typescript
// Entrada:
{
  componentName: "LLM Model",
  componentDescription?: "GPT-4 for chat"
}

// Saída:
{
  isAI: true,
  confidence: 0.9,
  aiType: ["LLM", "NLP"],
  owaspFramework: "OWASP LLM Top 10",
  specificRisks: ["Prompt Injection (LLM01)", "Model Theft (LLM10)"]
}
```

**Quando usar:**
- Determinar framework OWASP apropriado
- Identificar riscos específicos de IA
- Contextualizar mitigações

---

## 📋 Estado do Agente (ThreatModelingState)

O estado é compartilhado entre todos os nós do grafo:

```typescript
interface ThreatModelingState {
  messages: BaseMessage[];              // Histórico da conversa
  systemInfo: SystemInfo;               // Sistema sendo analisado
  threats: IdentifiedThreat[];          // Ameaças identificadas
  usedCapecs: Set<string>;              // CAPECs já usados (unicidade)
  coveredStrideCategories: Set<string>; // Categorias STRIDE cobertas
  analysisComplete: boolean;            // Se análise está completa
  iteration: number;                    // Iteração atual
  maxIterations: number;                // Limite de iterações
  ragContext?: string;                  // Contexto RAG recuperado
  aiComponents?: string[];              // Componentes IA detectados
  errors: string[];                     // Erros encontrados
}
```

---

## 🔄 Fluxo de Execução

### **1. Inicialização**

```typescript
const agent = new ThreatModelingAgent({
  provider: 'ollama',
  model: 'llama3.1:latest',
  maxIterations: 15,
  temperature: 0.1,
  verbose: true
});
```

### **2. Execução**

```typescript
const result = await agent.analyze(systemInfo, ragContext);
```

### **3. Loop ReAct (Simplificado)**

```
Iteração 1:
  Thought: "Preciso analisar os componentes do sistema"
  Action: detect_ai_component("LLM Model")
  Observation: { isAI: true, owaspFramework: "OWASP LLM Top 10" }

Iteração 2:
  Thought: "Vou buscar ameaças de Tampering para o LLM"
  Action: search_capec({ strideCategory: "Tampering", keyword: "prompt" })
  Observation: { capecs: [{ id: "CAPEC-242", name: "Code Injection" }] }

Iteração 3:
  Thought: "CAPEC-242 parece bom, vou validar unicidade"
  Action: validate_capec_unique({ capecId: "CAPEC-242" })
  Observation: { isUnique: true, action: "Pode prosseguir" }

Iteração 4:
  Thought: "Posso adicionar esta ameaça. Continuando análise..."
  ...

Iteração N:
  Thought: "Completei todas as 6 categorias STRIDE. Finalizando."
  Action: FINISH
  Result: { threats: [...], metrics: {...} }
```

---

## 📊 Resultado da Análise

```typescript
interface AgentAnalysisResult {
  threats: IdentifiedThreat[];        // Ameaças identificadas
  metrics: {
    totalTime: 45000,                 // Tempo total (ms)
    iterations: 12,                   // Iterações do loop
    toolCalls: 24,                    // Chamadas de ferramentas
    threatsGenerated: 15,             // Total de ameaças
    uniqueCapecs: 15,                 // CAPECs únicos
    uniquenessRate: 100,              // Taxa de unicidade (%)
    strideCoverage: 6                 // Categorias STRIDE cobertas
  };
  actionHistory: [...];               // Histórico de ações (debug)
  success: true;
  message: "Análise completa: 15 ameaças identificadas";
  errors: [];
}
```

---

## 🚀 Como Usar

### **Endpoint Backend**

```bash
POST /api/analyze-threats-react
Content-Type: application/json

{
  "systemInfo": {
    "systemName": "HealthConnect",
    "generalDescription": "Plataforma de telemedicina...",
    "components": "Portal Paciente, Portal Médico, API Central...",
    "technologies": "Vue.js, Python, MongoDB, PostgreSQL..."
  },
  "modelConfig": {
    "provider": "ollama",
    "model": "llama3.1:latest"
  },
  "ragContext": "..."
}
```

**Resposta:**

```json
{
  "success": true,
  "threats": [...],
  "metrics": {
    "totalTime": 45000,
    "iterations": 12,
    "threatsGenerated": 15,
    "uniquenessRate": 100
  },
  "message": "Análise completa: 15 ameaças identificadas"
}
```

---

## 🎯 Regras Críticas do Agente

### **✅ STRIDE Completo**
- Gerar ameaças para **TODAS** as 6 categorias STRIDE
- Mínimo 2 ameaças por categoria

### **✅ Unicidade de CAPECs**
- **NUNCA** reutilizar o mesmo CAPEC
- **SEMPRE** usar `validate_capec_unique` antes de adicionar ameaça
- Se CAPEC já usado, buscar alternativo com `search_capec`

### **✅ Componentes e Fluxos**
- Analisar **componentes individuais** (60%)
- Analisar **fluxos de dados** (40%)
- Especialmente fluxos cross-boundary

### **✅ Framework OWASP Correto**
- Componentes IA/ML: **OWASP LLM** (LLM01-LLM10)
- Componentes tradicionais: **OWASP Web** (A01:2021-A10:2021)
- Usar `detect_ai_component` quando incerto

---

## 🔍 Debugging

### **Verbose Mode**

```typescript
const agent = new ThreatModelingAgent({
  ...
  verbose: true // Ativa logging detalhado
});
```

**Output:**
```
🤖 Iteração 1 - Resposta LLM: Thought: Preciso analisar...
🤖 Iteração 2 - Resposta LLM: Action: search_capec...
✅ Análise completa, finalizando
```

### **Action History**

```typescript
result.actionHistory.forEach(action => {
  console.log(`Iteração ${action.iteration}:`);
  console.log(`  Thought: ${action.thought}`);
  console.log(`  Action: ${action.action}`);
  console.log(`  Result: ${JSON.stringify(action.result)}`);
});
```

---

## 📈 Métricas e Performance

### **Benchmarks Típicos**

| Métrica | Valor Médio | Meta |
|---------|-------------|------|
| **Tempo Total** | 30-60s | <90s |
| **Iterações** | 10-15 | <20 |
| **Ameaças Geradas** | 12-18 | ≥12 |
| **Unicidade CAPECs** | 95-100% | ≥85% |
| **STRIDE Coverage** | 6/6 | 6/6 |

---

## 🔧 Extensibilidade

### **Adicionar Nova Ferramenta**

1. **Criar arquivo da ferramenta:**

```typescript
// backend/src/agents/tools/MyNewTool.ts
import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";

const MyNewToolSchema = z.object({
  input: z.string().describe("Descrição do input")
});

export class MyNewTool extends StructuredTool {
  name = "my_new_tool";
  description = "Descrição para o LLM";
  schema = MyNewToolSchema;

  async _call(input: z.infer<typeof MyNewToolSchema>): Promise<string> {
    // Lógica da ferramenta
    return JSON.stringify({ result: "..." });
  }
}
```

2. **Registrar em `tools/index.ts`:**

```typescript
export { MyNewTool, createMyNewTool } from './MyNewTool';

export function createAllTools(state: ThreatModelingState) {
  return [
    // ... ferramentas existentes
    createMyNewTool(state)
  ];
}
```

3. **Pronto!** O agente automaticamente terá acesso à nova ferramenta.

---

## 🆚 Comparação: ReAct vs. Prompt Tradicional

| Aspecto | **ReAct Agent** | **Prompt Tradicional** |
|---------|-----------------|------------------------|
| **Tamanho do Prompt** | 500 linhas | 3.000+ linhas |
| **Adaptabilidade** | ✅ Alta (decide dinamicamente) | ❌ Baixa (fixo) |
| **Validações** | ✅ Em tempo real (loop) | ❌ Apenas no final |
| **Unicidade CAPECs** | ✅ 95-100% | ⚠️ 70-85% |
| **Debugging** | ✅ Fácil (actionHistory) | ❌ Difícil (caixa-preta) |
| **Manutenção** | ✅ Modular (tools) | ❌ Monolítico (prompt) |
| **Tempo de Resposta** | ~45s | ~30s |

---

## 📚 Referências

- **LangGraph**: https://langchain-ai.github.io/langgraph/
- **ReAct Pattern**: https://arxiv.org/abs/2210.03629
- **LangChain Tools**: https://python.langchain.com/docs/modules/agents/tools/

---

## ✅ Checklist de Implementação

- [x] Tipos e interfaces (AgentTypes.ts)
- [x] 5 ferramentas especializadas
- [x] Agente principal com LangGraph
- [x] Templates de prompts
- [x] Endpoint backend (/api/analyze-threats-react)
- [x] Métricas e logging
- [ ] Frontend com toggle ReAct/Tradicional
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Documentação de API

---

**Desenvolvido por Z4l1nux**  
*Threat Modeling Agent com ReAct Pattern*

