import { ModelProvider } from '../ModelProvider';

/**
 * TemplateProvider - Template para criar novos providers de IA
 * 
 * Este arquivo serve como template/exemplo para criar novos providers.
 * 
 * PASSOS PARA CRIAR UM NOVO PROVIDER:
 * 
 * 1. Copie este arquivo e renomeie para seu provider (ex: AnthropicProvider.ts)
 * 2. Renomeie a classe para o nome do provider (ex: export class AnthropicProvider)
 * 3. Defina o nome do provider no campo `name`
 * 4. Implemente os 3 métodos obrigatórios:
 *    - isAvailable(): verifica se o provider está configurado
 *    - generateContent(): gera texto usando o modelo
 *    - generateEmbedding(): gera embeddings (opcional, pode lançar erro)
 * 5. Configure as variáveis de ambiente necessárias
 * 6. Registre o provider no ModelFactory.ts
 * 
 * EXEMPLO DE USO:
 * 
 * ```typescript
 * // No ModelFactory.ts, adicione:
 * import { AnthropicProvider } from './providers/AnthropicProvider';
 * 
 * // No método initialize():
 * const anthropicProvider = new AnthropicProvider();
 * this.registerProvider(anthropicProvider);
 * ```
 * 
 * VARIÁVEIS DE AMBIENTE:
 * 
 * Adicione ao backend/.env:
 * ```
 * # Anthropic Configuration
 * ANTHROPIC_API_KEY=sk-ant-xxxxx
 * MODEL_ANTHROPIC=claude-3-5-sonnet-20241022
 * ```
 */
export class TemplateProvider implements ModelProvider {
  // Nome único do provider (usado para identificação)
  name = 'template';
  
  // Variáveis de configuração (carregar do .env)
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Carregar configurações do .env
    this.apiKey = process.env.TEMPLATE_API_KEY || '';
    this.baseUrl = process.env.TEMPLATE_BASE_URL || 'https://api.example.com';
    this.timeout = parseInt(process.env.TEMPLATE_TIMEOUT || '60000');
    
    // Log de configuração (útil para debug)
    console.log(`🔧 TemplateProvider: API Key configurada: ${this.apiKey ? 'Sim' : 'Não'}`);
    console.log(`🔧 TemplateProvider: Base URL: ${this.baseUrl}`);
    
    if (!this.apiKey) {
      console.warn(`⚠️  TemplateProvider: TEMPLATE_API_KEY não configurada`);
    }
  }

  /**
   * Verifica se o provider está disponível para uso
   * 
   * Retorna true se todas as configurações necessárias estão presentes.
   * Pode também fazer uma chamada de teste à API para verificar conectividade.
   * 
   * @returns Promise<boolean> - true se disponível, false caso contrário
   */
  async isAvailable(): Promise<boolean> {
    // Verificação básica: API key configurada
    if (!this.apiKey) {
      return false;
    }

    // Verificação avançada (opcional): testar conectividade com a API
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(5000) // Timeout de 5s para verificação
      });
      
      return response.ok;
    } catch (error) {
      console.warn(`⚠️  TemplateProvider: Erro ao verificar disponibilidade:`, error);
      return false;
    }
  }

  /**
   * Gera conteúdo de texto usando o modelo especificado
   * 
   * @param prompt - Prompt de entrada para o modelo
   * @param model - Nome/ID do modelo a usar (ex: "claude-3-5-sonnet-20241022")
   * @param format - (Opcional) JSON Schema para structured output
   * @returns Promise<string> - Texto gerado pelo modelo
   * 
   * EXEMPLO DE STRUCTURED OUTPUT:
   * ```typescript
   * const format = {
   *   type: 'object',
   *   properties: {
   *     threats: { type: 'array', items: { type: 'object' } }
   *   },
   *   required: ['threats']
   * };
   * const result = await provider.generateContent(prompt, model, format);
   * ```
   */
  async generateContent(prompt: string, model: string, format?: any): Promise<string> {
    console.log(`🔧 TemplateProvider: Gerando conteúdo com modelo ${model}`);
    console.log(`🔧 TemplateProvider: Structured output: ${format ? 'Sim' : 'Não'}`);

    try {
      // Preparar corpo da requisição
      const requestBody: any = {
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4096
      };

      // Adicionar structured output se fornecido
      if (format) {
        requestBody.response_format = {
          type: "json_schema",
          json_schema: {
            name: "structured_output",
            strict: true,
            schema: format
          }
        };
        console.log(`🔧 TemplateProvider: Usando structured output`);
      }

      console.log(`🔧 TemplateProvider: Enviando requisição para ${this.baseUrl}/chat/completions...`);

      // Fazer requisição à API
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      console.log(`🔧 TemplateProvider: Status da resposta: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ TemplateProvider: Erro na resposta:`, errorText);
        throw new Error(`Erro ao gerar conteúdo: ${response.statusText}`);
      }

      // Parsear resposta
      const data = await response.json() as {
        choices?: Array<{
          message?: {
            content?: string;
            tool_calls?: Array<{ function?: { arguments?: string } }>;
          }
        }>
      };

      console.log(`✅ TemplateProvider: Resposta recebida`);

      // Extrair conteúdo da resposta
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        
        // Tentar extrair de message.content
        if (choice.message?.content) {
          return choice.message.content;
        }
        
        // Tentar extrair de tool_calls (alguns modelos usam isso para structured output)
        if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
          const toolCall = choice.message.tool_calls[0];
          if (toolCall.function?.arguments) {
            return toolCall.function.arguments;
          }
        }
      }

      throw new Error('Resposta da API não contém conteúdo válido');
    } catch (error) {
      console.error(`❌ TemplateProvider: Erro ao gerar conteúdo:`, error);
      throw error;
    }
  }

  /**
   * Gera embeddings (vetores numéricos) para um texto
   * 
   * Embeddings são representações vetoriais de texto usadas para busca semântica.
   * 
   * @param text - Texto para gerar embedding
   * @param model - Nome/ID do modelo de embedding (ex: "text-embedding-3-small")
   * @returns Promise<number[]> - Vetor de embeddings
   * 
   * NOTA: Se o provider não suporta embeddings, lance um erro:
   * throw new Error('TemplateProvider não suporta geração de embeddings');
   */
  async generateEmbedding(text: string, model: string): Promise<number[]> {
    console.log(`🔧 TemplateProvider: Gerando embedding com modelo ${model}`);

    try {
      // Preparar corpo da requisição
      const requestBody = {
        model,
        input: text
      };

      console.log(`🔧 TemplateProvider: Enviando requisição para ${this.baseUrl}/embeddings...`);

      // Fazer requisição à API
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout)
      });

      console.log(`🔧 TemplateProvider: Status da resposta: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ TemplateProvider: Erro na resposta:`, errorText);
        throw new Error(`Erro ao gerar embedding: ${response.statusText}`);
      }

      // Parsear resposta
      const data = await response.json() as {
        data?: Array<{
          embedding?: number[];
        }>
      };

      console.log(`✅ TemplateProvider: Embedding gerado`);

      // Extrair embedding da resposta
      if (data.data && data.data.length > 0 && data.data[0].embedding) {
        const embedding = data.data[0].embedding;
        console.log(`✅ TemplateProvider: Embedding com ${embedding.length} dimensões`);
        return embedding;
      }

      throw new Error('Resposta da API não contém embedding válido');
    } catch (error) {
      console.error(`❌ TemplateProvider: Erro ao gerar embedding:`, error);
      throw error;
    }
  }
}

/**
 * EXEMPLO DE IMPLEMENTAÇÃO REAL - AnthropicProvider
 * 
 * ```typescript
 * import { ModelProvider } from '../ModelProvider';
 * 
 * export class AnthropicProvider implements ModelProvider {
 *   name = 'anthropic';
 *   private apiKey: string;
 * 
 *   constructor() {
 *     this.apiKey = process.env.ANTHROPIC_API_KEY || '';
 *     console.log(`🔧 AnthropicProvider: API Key: ${this.apiKey ? 'Sim' : 'Não'}`);
 *   }
 * 
 *   async isAvailable(): Promise<boolean> {
 *     return !!this.apiKey;
 *   }
 * 
 *   async generateContent(prompt: string, model: string, format?: any): Promise<string> {
 *     const response = await fetch('https://api.anthropic.com/v1/messages', {
 *       method: 'POST',
 *       headers: {
 *         'x-api-key': this.apiKey,
 *         'anthropic-version': '2023-06-01',
 *         'content-type': 'application/json'
 *       },
 *       body: JSON.stringify({
 *         model,
 *         max_tokens: 4096,
 *         messages: [{ role: 'user', content: prompt }]
 *       })
 *     });
 * 
 *     const data = await response.json();
 *     return data.content[0].text;
 *   }
 * 
 *   async generateEmbedding(text: string, model: string): Promise<number[]> {
 *     // Anthropic não suporta embeddings nativamente
 *     throw new Error('AnthropicProvider não suporta geração de embeddings');
 *   }
 * }
 * ```
 */

