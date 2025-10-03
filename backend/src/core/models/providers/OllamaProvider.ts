import { ModelProvider } from '../ModelProvider';

export class OllamaProvider implements ModelProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    console.log(`🔧 OllamaProvider baseUrl: ${this.baseUrl}`);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    console.log(`🔧 OllamaProvider: Gerando conteúdo com modelo ${model}`);
    console.log(`🔧 OllamaProvider: URL: ${this.baseUrl}/api/generate`);
    
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    });

    if (!response.ok) {
      console.error(`❌ OllamaProvider: Erro na resposta: ${response.statusText}`);
      throw new Error(`Erro ao gerar conteúdo com Ollama: ${response.statusText}`);
    }

    const data = await response.json() as { response: string };
    console.log(`🔧 OllamaProvider: Resposta recebida: "${data.response}"`);
    return data.response;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text
      })
    });

    if (!response.ok) {
      throw new Error(`Erro ao gerar embedding com Ollama: ${response.statusText}`);
    }

    const data = await response.json() as { embedding: number[] };
    return data.embedding;
  }
}
