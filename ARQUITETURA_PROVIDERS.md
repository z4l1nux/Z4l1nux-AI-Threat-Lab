# 🏗️ Arquitetura de Providers de IA

## 📊 **Resumo Executivo**

O sistema **Threat Modeling Co-Pilot with AI** agora possui uma **arquitetura extensível e modular** para providers de IA, permitindo adicionar novos modelos de forma simples e padronizada.

---

## ✅ **Sistema Implementado**

### **1. Auto-Registro de Providers**

O `ModelFactory` agora registra automaticamente todos os providers disponíveis:

```typescript
// backend/src/core/models/ModelFactory.ts
static async initialize(): Promise<void> {
  const ollamaProvider = new OllamaProvider();
  const openRouterProvider = new OpenRouterProvider();
  const geminiProvider = new GeminiProvider();

  this.registerProvider(ollamaProvider);
  this.registerProvider(openRouterProvider);
  this.registerProvider(geminiProvider);
}
```

### **2. Detecção Automática**

O sistema detecta automaticamente quais providers estão disponíveis:

```typescript
const availableProviders = await ModelFactory.checkAvailableProviders();
// Retorna: ['ollama', 'openrouter'] se ambos estiverem configurados
```

### **3. Fallback Inteligente**

Se um provider falhar, o sistema automaticamente tenta outro:

```typescript
static async detectBestProvider(): Promise<ModelProvider | null> {
  const priorities = ['ollama', 'gemini', 'openrouter'];
  // Retorna o primeiro disponível
}
```

### **4. Interface Padronizada**

Todos os providers seguem a mesma interface:

```typescript
interface ModelProvider {
  name: string;
  generateContent(prompt: string, model: string, format?: any): Promise<string>;
  generateEmbedding(text: string, model: string): Promise<number[]>;
  isAvailable(): Promise<boolean>;
}
```

---

## 🚀 **Como Adicionar um Novo Provider**

### **Passo a Passo Rápido:**

1. **Copiar o template:**
   ```bash
   cd backend/src/core/models/providers
   cp TemplateProvider.ts AnthropicProvider.ts
   ```

2. **Implementar os 3 métodos obrigatórios:**
   - `isAvailable()` - Verifica se está configurado
   - `generateContent()` - Gera texto
   - `generateEmbedding()` - Gera embeddings (ou lança erro)

3. **Registrar no ModelFactory:**
   ```typescript
   // Em ModelFactory.ts, método initialize()
   const anthropicProvider = new AnthropicProvider();
   this.registerProvider(anthropicProvider);
   ```

4. **Configurar .env:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   MODEL_ANTHROPIC=claude-3-5-sonnet-20241022
   ```

5. **Pronto!** 🎉

---

## 📁 **Estrutura de Arquivos**

```
backend/src/core/models/
├── ModelProvider.ts           # Interface base
├── ModelFactory.ts            # ✨ Sistema de registro (REFATORADO)
└── providers/
    ├── README.md              # 📖 Documentação completa
    ├── TemplateProvider.ts    # 📝 Template para novos providers
    ├── OllamaProvider.ts      # ✅ Provider Ollama (local)
    ├── OpenRouterProvider.ts  # ✅ Provider OpenRouter (nuvem)
    ├── GeminiProvider.ts      # ✅ Provider Gemini (Google)
    └── [Seu novo provider]    # 🆕 Adicione aqui!
```

---

## 🎯 **Providers Disponíveis**

| Provider | Status | Geração | Embeddings | Prioridade |
|----------|--------|---------|------------|------------|
| **Ollama** | ✅ Ativo | ✅ Sim | ✅ Sim | 🥇 Alta (local) |
| **Gemini** | ✅ Ativo | ✅ Sim | ❌ Não | 🥈 Média |
| **OpenRouter** | ✅ Ativo | ✅ Sim | ❌ Não | 🥉 Baixa (nuvem) |
| **Template** | 📖 Exemplo | - | - | - |

---

## 💡 **Recursos Implementados**

### ✅ **Auto-Registro**
- Providers são registrados automaticamente no `ModelFactory`
- Sem necessidade de configuração manual no `server.ts`

### ✅ **Verificação de Disponibilidade**
- Cada provider verifica suas configurações
- Sistema só usa providers disponíveis

### ✅ **Fallback Automático**
- Se um provider falhar, tenta outro
- Ordem de prioridade: Ollama → Gemini → OpenRouter

### ✅ **Logs Informativos**
- Mensagens claras sobre status dos providers
- Debug facilitado com logs estruturados

### ✅ **Template Documentado**
- `TemplateProvider.ts` com exemplos completos
- Comentários explicativos em cada método

### ✅ **Documentação Completa**
- `README.md` com guias e exemplos
- Referência da interface e APIs

### ✅ **Suporte a Structured Output**
- JSON Schema para outputs estruturados
- Compatível com modelos modernos (GPT-4, Claude, etc.)

---

## 📊 **Fluxo de Funcionamento**

```
┌─────────────────────┐
│   Aplicação pede    │
│   geração de texto  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│        ModelFactory.generateContent()       │
│  1. Verifica se provider está disponível   │
│  2. Tenta gerar com provider especificado  │
│  3. Se falhar, tenta fallback automático   │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│           Provider Específico               │
│  - OllamaProvider.generateContent()         │
│  - OpenRouterProvider.generateContent()     │
│  - GeminiProvider.generateContent()         │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────┐
│   API do Modelo     │
│   (Ollama, Claude,  │
│    GPT, Gemini...)  │
└─────────────────────┘
```

---

## 🔧 **Exemplos de Uso**

### **Uso Básico (Detecção Automática)**

```typescript
// O sistema detecta automaticamente o melhor provider
const provider = await ModelFactory.detectBestProvider();
const result = await provider.generateContent("Olá, mundo!", "llama3.1:latest");
```

### **Uso com Provider Específico**

```typescript
const config: ModelConfig = {
  model: 'claude-3-5-sonnet-20241022',
  provider: 'anthropic',
  embedding: 'nomic-embed-text:latest',
  embeddingProvider: 'ollama'
};

const result = await ModelFactory.generateContent(
  "Analise esta ameaça...",
  config,
  jsonSchema
);
```

### **Uso com Fallback**

```typescript
try {
  // Tenta Ollama primeiro
  const result = await ModelFactory.generateContent(prompt, {
    provider: 'ollama',
    model: 'llama3.1:latest',
    ...
  });
} catch (error) {
  // Automaticamente faz fallback para OpenRouter
  console.log('Ollama falhou, usando fallback automático');
}
```

---

## 📝 **Próximos Providers Sugeridos**

### **Alta Prioridade**

1. **OpenAI (GPT-4o, GPT-4 Turbo)**
   - Referência de mercado
   - Excelente structured output
   - Suporte a embeddings

2. **Anthropic (Claude 3.5 Sonnet)**
   - Qualidade de texto superior
   - Bom raciocínio lógico
   - Contexto de 200k tokens

### **Média Prioridade**

3. **Cohere (Command R+)**
   - Otimizado para RAG
   - Bom custo-benefício
   - Suporte a multilingual

4. **Mistral (Mixtral, Mistral Large)**
   - GDPR-friendly (Europa)
   - Bom desempenho
   - Open source disponível

### **Baixa Prioridade**

5. **AWS Bedrock**
   - Acesso a múltiplos modelos
   - Integração AWS
   - Para empresas

6. **Azure OpenAI**
   - GPT via Azure
   - Compliance empresarial
   - Integração Microsoft

---

## 🎯 **Checklist de Implementação**

Ao adicionar um novo provider, verifique:

- [ ] ✅ Implementa interface `ModelProvider`
- [ ] ✅ Define propriedade `name` única
- [ ] ✅ Implementa `isAvailable()`
- [ ] ✅ Implementa `generateContent()`
- [ ] ✅ Implementa `generateEmbedding()` (ou lança erro)
- [ ] ✅ Adiciona logs informativos
- [ ] ✅ Registra no `ModelFactory.ts`
- [ ] ✅ Adiciona variáveis ao `.env.example`
- [ ] ✅ Testa em ambiente local
- [ ] ✅ Documenta no README.md

---

## 📚 **Documentação Adicional**

- **Template de Provider**: `backend/src/core/models/providers/TemplateProvider.ts`
- **Guia Completo**: `backend/src/core/models/providers/README.md`
- **Interface**: `backend/src/core/models/ModelProvider.ts`
- **Factory**: `backend/src/core/models/ModelFactory.ts`

---

## 🎉 **Conclusão**

O sistema agora está **pronto para escalar** com novos providers de IA de forma:

- ✅ **Simples** - Template pronto para usar
- ✅ **Rápida** - 5 passos para adicionar novo provider
- ✅ **Segura** - Interface padronizada e validação automática
- ✅ **Documentada** - Guias e exemplos completos
- ✅ **Testada** - 3 providers funcionando (Ollama, OpenRouter, Gemini)

**Adicione quantos providers quiser!** 🚀

---

**Última atualização**: 2025-10-16  
**Versão**: 2.0.0  
**Status**: ✅ Produção

