import { ModelProvider, ModelConfig } from './ModelProvider';

export class ModelFactory {
  private static providers: Map<string, ModelProvider> = new Map();

  static async initialize(): Promise<void> {
    // Por enquanto, apenas log - implementação simplificada
    console.log('🔧 ModelFactory inicializado (implementação simplificada)');
  }

  static getProvider(providerName: string): ModelProvider | null {
    return this.providers.get(providerName) || null;
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  static async generateContent(prompt: string, config: ModelConfig): Promise<string> {
    // Implementação simplificada - usar configuração do .env.local
    throw new Error('ModelFactory.generateContent não implementado ainda');
  }

  static async generateEmbedding(text: string, config: ModelConfig): Promise<number[]> {
    // Implementação simplificada - usar configuração do .env.local
    throw new Error('ModelFactory.generateEmbedding não implementado ainda');
  }
}
