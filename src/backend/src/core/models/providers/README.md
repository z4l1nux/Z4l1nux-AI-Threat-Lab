# 🔌 Guia de Providers de IA

Este diretório contém os **providers de modelos de IA** suportados pelo sistema de Threat Modeling.

## 📋 **Índice**

1. [Providers Disponíveis](#providers-disponíveis)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Como Adicionar um Novo Provider](#como-adicionar-um-novo-provider)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Referência da Interface](#referência-da-interface)

---

## 🎯 **Providers Disponíveis**

| Provider | Arquivo | Suporta Geração | Suporta Embeddings | Status |
|----------|---------|----------------|-------------------|--------|
| **Ollama** | `OllamaProvider.ts` | ✅ Sim | ✅ Sim | ✅ Ativo |
| **OpenRouter** | `OpenRouterProvider.ts` | ✅ Sim | ❌ Não | ✅ Ativo |
| **Gemini** | `GeminiProvider.ts` | ✅ Sim | ❌ Não | ✅ Ativo |
| **Template** | `TemplateProvider.ts` | 📖 Exemplo | 📖 Exemplo | 📖 Template |

---

## 🏗️ **Arquitetura do Sistema**

```
┌─────────────────────────────────────────────────────────┐
│                    ModelFactory                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Auto-registro e gerenciamento de providers      │  │
│  │  - Detecção automática de disponibilidade        │  │
│  │  - Fallback entre providers                      │  │
│  │  - Sistema de prioridades                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────┐  ┌──────────────┐  ┌────────────┐
│ Ollama      │  │ OpenRouter   │  │ Gemini     │
│ Provider    │  │ Provider     │  │ Provider   │
└─────────────┘  └──────────────┘  └────────────┘
      │                 │                 │
      └─────────────────┴─────────────────┘
                        │
                        ▼
           ┌──────────────────────────┐
           │   ModelProvider          │
           │   (Interface)            │
           │   - generateContent()    │
           │   - generateEmbedding()  │
           │   - isAvailable()        │
           └──────────────────────────┘
```

---

## 🚀 **Como Adicionar um Novo Provider**

### **Passo 1: Criar o Provider**

Copie o template e renomeie para seu provider:

```bash
cp TemplateProvider.ts AnthropicProvider.ts
```

### **Passo 2: Implementar a Interface**

Edite `AnthropicProvider.ts`:

```typescript
import { ModelProvider } from '../ModelProvider';

export class AnthropicProvider implements ModelProvider {
  name = 'anthropic'; // ← Nome único do provider
  private apiKey: string;

  constructor() {
    // Carregar configurações do .env
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    console.log(`🔧 AnthropicProvider: API Key: ${this.apiKey ? 'Sim' : 'Não'}`);
  }

  async isAvailable(): Promise<boolean> {
    // Retorna true se o provider está configurado
    return !!this.apiKey;
  }

  async generateContent(prompt: string, model: string, format?: any): Promise<string> {
    // Implementar chamada à API do Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    // Se o provider não suporta embeddings:
    throw new Error('AnthropicProvider não suporta geração de embeddings');
    
    // Ou implemente se suportar:
    // const response = await fetch(...);
    // return embedding;
  }
}
```

### **Passo 3: Registrar no ModelFactory**

Edite `../ModelFactory.ts`:

```typescript
import { AnthropicProvider } from './providers/AnthropicProvider';

// No método initialize(), adicione:
const anthropicProvider = new AnthropicProvider();
this.registerProvider(anthropicProvider);
```

### **Passo 4: Configurar Variáveis de Ambiente**

Adicione ao `backend/.env`:

```env
# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-xxxxx
MODEL_ANTHROPIC=claude-3-5-sonnet-20241022
```

### **Passo 5: Atualizar Prioridades (Opcional)**

No `ModelFactory.ts`, ajuste as prioridades em `detectBestProvider()`:

```typescript
const priorities = ['ollama', 'anthropic', 'gemini', 'openrouter'];
```

### **Passo 6: Testar**

```bash
npm run build:backend
npm start
```

O provider será automaticamente detectado e registrado!

---

## 💡 **Exemplos Práticos**

### **Exemplo 1: Provider Simples (Sem Embeddings)**

Provider para **Cohere** (apenas geração de texto):

```typescript
import { ModelProvider } from '../ModelProvider';

export class CohereProvider implements ModelProvider {
  name = 'cohere';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.COHERE_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    return data.generations[0].text;
  }

  async generateEmbedding(): Promise<number[]> {
    throw new Error('CohereProvider não suporta embeddings (use outro provider)');
  }
}
```

### **Exemplo 2: Provider Completo (Com Embeddings)**

Provider para **OpenAI**:

```typescript
import { ModelProvider } from '../ModelProvider';

export class OpenAIProvider implements ModelProvider {
  name = 'openai';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateContent(prompt: string, model: string, format?: any): Promise<string> {
    const requestBody: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    };

    // Suporte a structured output
    if (format) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: { name: "output", strict: true, schema: format }
      };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, input: text })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

### **Exemplo 3: Provider Local (Ollama-like)**

Provider para **LocalAI** (servidor local compatível com OpenAI):

```typescript
import { ModelProvider } from '../ModelProvider';

export class LocalAIProvider implements ModelProvider {
  name = 'localai';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LOCALAI_BASE_URL || 'http://localhost:8080';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/models`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, input: text })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

---

## 📚 **Referência da Interface**

### **ModelProvider**

Interface que todos os providers devem implementar:

```typescript
export interface ModelProvider {
  // Nome único do provider (ex: 'ollama', 'openrouter', 'anthropic')
  name: string;

  /**
   * Gera conteúdo de texto usando o modelo especificado
   * 
   * @param prompt - Prompt de entrada para o modelo
   * @param model - Nome/ID do modelo (ex: 'gpt-4', 'llama3.1:latest')
   * @param format - (Opcional) JSON Schema para structured output
   * @returns Promise<string> - Texto gerado ou JSON como string
   */
  generateContent(prompt: string, model: string, format?: any): Promise<string>;

  /**
   * Gera embeddings (vetores) para um texto
   * 
   * @param text - Texto para gerar embedding
   * @param model - Nome/ID do modelo de embedding
   * @returns Promise<number[]> - Vetor de embeddings
   * @throws Error se o provider não suporta embeddings
   */
  generateEmbedding(text: string, model: string): Promise<number[]>;

  /**
   * Verifica se o provider está disponível para uso
   * 
   * @returns Promise<boolean> - true se configurado e acessível
   */
  isAvailable(): Promise<boolean>;
}
```

### **ModelConfig**

Configuração de modelos passada ao Factory:

```typescript
export interface ModelConfig {
  model: string;              // Modelo principal (ex: 'llama3.1:latest')
  provider: string;           // Provider principal (ex: 'ollama')
  embedding: string;          // Modelo de embedding (ex: 'nomic-embed-text')
  embeddingProvider: string;  // Provider de embedding (ex: 'ollama')
}
```

---

## 🔍 **Detalhes Técnicos**

### **Structured Output**

Para modelos que suportam structured output (JSON schema), o parâmetro `format` deve seguir o padrão:

```typescript
const format = {
  type: 'object',
  properties: {
    threats: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          elementName: { type: 'string' },
          strideCategory: { type: 'string' },
          threatScenario: { type: 'string' }
        },
        required: ['elementName', 'strideCategory', 'threatScenario']
      }
    }
  },
  required: ['threats'],
  additionalProperties: false
};
```

### **Fallback Automático**

O `ModelFactory` implementa fallback automático:

1. Tenta usar o provider especificado
2. Se falhar, detecta o melhor provider disponível
3. Tenta novamente com o fallback

Prioridade padrão: `Ollama > Gemini > OpenRouter`

### **Timeout e Retry**

Cada provider deve implementar seu próprio mecanismo de timeout e retry. Exemplo:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

const response = await fetch(url, {
  signal: controller.signal
});

clearTimeout(timeoutId);
```

---

## 📝 **Checklist para Novo Provider**

- [ ] Criar arquivo `YourProvider.ts` em `providers/`
- [ ] Implementar interface `ModelProvider`
- [ ] Definir propriedade `name` única
- [ ] Implementar `isAvailable()`
- [ ] Implementar `generateContent()`
- [ ] Implementar `generateEmbedding()` (ou lançar erro)
- [ ] Adicionar logs informativos (`console.log`)
- [ ] Registrar no `ModelFactory.ts`
- [ ] Adicionar variáveis de ambiente ao `.env.example`
- [ ] Testar em ambiente local
- [ ] Documentar no README.md (este arquivo)

---

## 🎯 **Próximos Passos**

Providers sugeridos para implementação futura:

1. **AnthropicProvider** - Claude 3.5 Sonnet (excelente qualidade)
2. **OpenAIProvider** - GPT-4o, GPT-4 Turbo (referência de mercado)
3. **CohereProvider** - Command R+ (bom para RAG)
4. **MistralProvider** - Mixtral, Mistral Large (Europa, GDPR-friendly)
5. **LocalAIProvider** - Self-hosted alternativo ao Ollama
6. **AWSBedrockProvider** - Acesso a múltiplos modelos via AWS
7. **AzureOpenAIProvider** - OpenAI via Azure (empresas)

---

## 📞 **Suporte**

Para dúvidas ou problemas:

1. Consulte o `TemplateProvider.ts` como referência
2. Veja os providers existentes (`OllamaProvider.ts`, `OpenRouterProvider.ts`)
3. Leia a documentação da API do provider que você está integrando
4. Teste com `npm run build:backend && npm start`

---

**Última atualização**: 2025-10-16
**Versão**: 1.0.0

