import { ModelProvider } from '../ModelProvider';

export class OpenRouterProvider implements ModelProvider {
  name = 'openrouter';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Z4l1nux AI Threat Lab'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar conteúdo com OpenRouter: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    // OpenRouter não suporta embeddings diretamente
    // Usar Gemini como fallback para embeddings
    throw new Error('OpenRouter não suporta embeddings. Use Gemini para embeddings.');
  }
}
