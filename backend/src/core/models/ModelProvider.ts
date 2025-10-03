export interface ModelProvider {
  name: string;
  generateContent(prompt: string, model: string): Promise<string>;
  generateEmbedding(text: string, model: string): Promise<number[]>;
  isAvailable(): Promise<boolean>;
}

export interface ModelConfig {
  model: string;
  provider: string;
  embedding: string;
  embeddingProvider: string;
}
