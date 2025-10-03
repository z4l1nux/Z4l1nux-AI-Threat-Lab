import { ModelProvider } from '../ModelProvider';

export class OllamaProvider implements ModelProvider {
  name = 'ollama';
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
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
      throw new Error(`Erro ao gerar conteúdo com Ollama: ${response.statusText}`);
    }

    const data = await response.json();
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

    const data = await response.json();
    return data.embedding;
  }
}
