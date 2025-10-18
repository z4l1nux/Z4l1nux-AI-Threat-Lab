import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ModelProvider } from '../ModelProvider';

/**
 * GeminiProvider - Provider para Google Gemini (Gemini 1.5 Pro, Flash, etc.)
 * 
 * Configuração necessária no .env:
 * GEMINI_API_KEY=AIza...
 * MODEL_GEMINI=gemini-1.5-pro
 * 
 * Recursos:
 * - Geração de texto com modelos Gemini (Pro, Flash, Ultra)
 * - Embeddings com gemini-embedding-001
 * - Context window: até 1M tokens (Gemini 1.5 Pro)
 * - Multimodalidade: texto, imagem, vídeo, áudio
 */
export class GeminiProvider implements ModelProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    
    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        console.log('🔧 GeminiProvider: API Key configurada: Sim');
      } catch (error) {
        console.error('❌ GeminiProvider: Erro ao inicializar:', error);
      }
    } else {
      console.log('⚠️  GeminiProvider: GEMINI_API_KEY não configurada');
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!(process.env.GEMINI_API_KEY && this.genAI);
  }

  async generateContent(prompt: string, model: string, format?: any): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini não configurado. Configure GEMINI_API_KEY no .env');
    }

    console.log(`🔧 GeminiProvider: Gerando conteúdo com modelo ${model}`);
    console.log(`🔧 GeminiProvider: Structured output: ${format ? 'Sim' : 'Não'}`);

    try {
      // Configuração do modelo
      const generationConfig: any = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 16384,  // Aumentado para suportar respostas maiores
      };

      // Adicionar structured output se fornecido
      if (format) {
        generationConfig.responseMimeType = 'application/json';
        
        // Limpar o schema para compatibilidade com Gemini (remove additionalProperties)
        const cleanSchema = this.cleanSchemaForGemini(format);
        generationConfig.responseSchema = cleanSchema;
        console.log(`🔧 GeminiProvider: Usando JSON schema para structured output`);
      }

      const genModel = this.genAI.getGenerativeModel({ 
        model,
        generationConfig
      });

      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ GeminiProvider: Conteúdo gerado (${text.length} caracteres)`);
      return text;
    } catch (error) {
      console.error(`❌ GeminiProvider: Erro ao gerar conteúdo:`, error);
      throw error;
    }
  }

  /**
   * Remove campos não suportados pelo Gemini do JSON Schema
   */
  private cleanSchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    const cleaned = { ...schema };
    
    // Remover additionalProperties (não suportado pelo Gemini)
    delete cleaned.additionalProperties;
    
    // Recursivamente limpar propriedades aninhadas
    if (cleaned.properties) {
      cleaned.properties = Object.keys(cleaned.properties).reduce((acc, key) => {
        acc[key] = this.cleanSchemaForGemini(cleaned.properties[key]);
        return acc;
      }, {} as any);
    }
    
    // Limpar items de arrays
    if (cleaned.items) {
      cleaned.items = this.cleanSchemaForGemini(cleaned.items);
    }
    
    return cleaned;
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error('Gemini não configurado. Configure GEMINI_API_KEY no .env');
    }

    // Usar modelo fornecido ou padrão
    const embeddingModel = model || 'text-embedding-004';
    console.log(`🔧 GeminiProvider: Gerando embedding com modelo ${embeddingModel}`);

    try {
      // Criar instância com modelo específico
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: this.apiKey,
        model: embeddingModel
      });

      const result = await embeddings.embedQuery(text);
      console.log(`✅ GeminiProvider: Embedding gerado (${result.length} dimensões)`);
      return result;
    } catch (error) {
      console.error(`❌ GeminiProvider: Erro ao gerar embedding:`, error);
      throw error;
    }
  }
}
