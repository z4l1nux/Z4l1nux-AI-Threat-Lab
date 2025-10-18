import { ModelProvider } from '../ModelProvider';

export class OpenRouterProvider implements ModelProvider {
  name = 'openrouter';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    console.log(`🔧 OpenRouterProvider: API Key configurada: ${this.apiKey ? 'Sim' : 'Não'}`);
    if (!this.apiKey) {
      console.error(`❌ OpenRouterProvider: OPENROUTER_API_KEY não configurada`);
    }
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

    // Adicionar structured output se fornecido
    if (format) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: "threat_analysis",
          strict: true,
          schema: format
        }
      };
      console.log(`🔧 OpenRouterProvider: Usando structured output com JSON schema (strict mode)`);
    }

    console.log(`🔧 OpenRouterProvider: Enviando requisição para OpenRouter...`);
    console.log(`🔧 OpenRouterProvider: Request body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Z4l1nux AI Threat Lab'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`🔧 OpenRouterProvider: Status da resposta: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenRouterProvider: Erro na resposta:`, errorText);
      throw new Error(`Erro ao gerar conteúdo com OpenRouter: ${response.statusText}`);
    }

    // Ler como texto e tentar fazer parse manual para tolerar respostas incompletas
    const rawText = await response.text();
    let content: string | undefined;
    
    try {
      const data = JSON.parse(rawText) as { 
        choices?: Array<{ 
          message?: { 
            content?: string;
            tool_calls?: Array<{ function?: { arguments?: string } }>;
          } 
        }> 
      };
      
      console.log(`🔧 OpenRouterProvider: Resposta recebida:`, JSON.stringify(data, null, 2));
      
      if (data.choices && data.choices.length > 0) {
        const choice = data.choices[0];
        
        // 1. Tentar extrair de `message.content` (padrão)
        if (choice.message?.content) {
          content = choice.message.content;
          console.log(`✅ OpenRouterProvider: Content extraído de message.content`);
        }
        // 2. Tentar extrair de `tool_calls` (alguns modelos como DeepSeek)
        else if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
          const toolCall = choice.message.tool_calls[0];
          if (toolCall.function?.arguments) {
            content = toolCall.function.arguments;
            console.log(`✅ OpenRouterProvider: Content extraído de tool_calls[0].function.arguments`);
          }
        }
        // 3. Fallback: usar corpo bruto
        else {
          console.warn(`⚠️ OpenRouterProvider: choices ausentes. Usando corpo bruto como conteúdo.`);
          content = rawText;
        }
      } else {
        console.warn(`⚠️ OpenRouterProvider: choices ausentes. Usando corpo bruto como conteúdo.`);
        content = rawText;
      }
    } catch (e) {
      console.warn(`⚠️ OpenRouterProvider: JSON inválido. Usando corpo bruto como conteúdo.`);
      content = rawText;
    }
    
    if (!content) {
      console.error(`❌ OpenRouterProvider: Content vazio`);
      throw new Error("Content vazio na resposta do OpenRouter");
    }
    
    console.log(`🔧 OpenRouterProvider: Content extraído (primeiros 500 chars):`, content.substring(0, 500));
    
    return content;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    // OpenRouter não suporta embeddings diretamente
    // Usar Ollama como fallback para embeddings
    throw new Error('OpenRouter não suporta embeddings. Use Ollama para embeddings.');
  }
}
