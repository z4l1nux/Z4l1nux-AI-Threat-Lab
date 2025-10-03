import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ModelProvider } from '../ModelProvider';

export class GeminiProvider implements ModelProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private embeddings: GoogleGenerativeAIEmbeddings | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY,
        model: 'gemini-embedding-001'
      });
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(process.env.GEMINI_API_KEY && this.genAI);
  }

  async generateContent(prompt: string, model: string): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini não configurado');
    }

    const genModel = this.genAI.getGenerativeModel({ model });
    const result = await genModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    if (!this.embeddings) {
      throw new Error('Embeddings Gemini não configurados');
    }

    const result = await this.embeddings.embedQuery(text);
    return result;
  }
}
