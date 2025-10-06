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

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    console.log(`🔧 OpenRouterProvider: Resposta recebida:`, JSON.stringify(data, null, 2));
    
    if (!data.choices || data.choices.length === 0) {
      console.error(`❌ OpenRouterProvider: Nenhuma escolha na resposta`);
      throw new Error("Nenhuma escolha na resposta do OpenRouter");
    }
    
    const content = data.choices[0].message.content;
    console.log(`🔧 OpenRouterProvider: Content extraído:`, content);
    
    if (!content) {
      console.error(`❌ OpenRouterProvider: Content vazio`);
      throw new Error("Content vazio na resposta do OpenRouter");
    }
    
    return content;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    // OpenRouter não suporta embeddings diretamente
    // Usar Ollama como fallback para embeddings
    throw new Error('OpenRouter não suporta embeddings. Use Ollama para embeddings.');
  }
}
