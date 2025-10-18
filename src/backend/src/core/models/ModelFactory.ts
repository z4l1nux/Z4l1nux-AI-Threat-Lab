import { ModelProvider, ModelConfig } from './ModelProvider';
import { OllamaProvider } from './providers/OllamaProvider';
import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { GeminiProvider } from './providers/GeminiProvider';

/**
 * ModelFactory - Sistema de gerenciamento de providers de modelos IA
 * 
 * Este factory permite:
 * - Auto-registro de providers disponíveis
 * - Detecção automática do melhor provider
 * - Fallback entre providers
 * - Adição fácil de novos providers
 * 
 * Para adicionar um novo provider:
 * 1. Crie uma classe que implementa ModelProvider em ./providers/
 * 2. Registre-a no método initialize() abaixo
 * 3. Configure as variáveis de ambiente necessárias
 * 
 * Exemplo: AnthropicProvider
 * ```typescript
 * const anthropicProvider = new AnthropicProvider();
 * this.registerProvider(anthropicProvider);
 * ```
 */
export class ModelFactory {
  private static providers: Map<string, ModelProvider> = new Map();
  private static initialized = false;

  /**
   * Inicializa e registra todos os providers disponíveis
   */
  static async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('⚠️  ModelFactory já foi inicializado');
      return;
    }

    console.log('🔧 ModelFactory: Registrando providers...');
    
    try {
      // Registrar providers disponíveis
      const ollamaProvider = new OllamaProvider();
      const openRouterProvider = new OpenRouterProvider();
      const geminiProvider = new GeminiProvider();

      this.registerProvider(ollamaProvider);
      this.registerProvider(openRouterProvider);
      this.registerProvider(geminiProvider);

      // Verificar disponibilidade de cada provider
      const availableProviders = await this.checkAvailableProviders();
      
      console.log(`✅ ModelFactory inicializado com ${this.providers.size} providers`);
      console.log(`📊 Providers disponíveis: ${availableProviders.join(', ') || 'Nenhum'}`);
      
      if (availableProviders.length === 0) {
        console.warn('⚠️  Nenhum provider de IA está disponível! Configure pelo menos um:');
        console.warn('   - Ollama: OLLAMA_BASE_URL + MODEL_OLLAMA');
        console.warn('   - OpenRouter: OPENROUTER_API_KEY + MODEL_OPENROUTER');
        console.warn('   - Gemini: GEMINI_API_KEY + MODEL_GEMINI');
      }

      this.initialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar ModelFactory:', error);
      throw error;
    }
  }

  /**
   * Registra um novo provider no factory
   */
  static registerProvider(provider: ModelProvider): void {
    if (this.providers.has(provider.name)) {
      console.warn(`⚠️  Provider '${provider.name}' já está registrado, substituindo...`);
    }
    
    this.providers.set(provider.name, provider);
    console.log(`   ✅ Provider registrado: ${provider.name}`);
  }

  /**
   * Verifica quais providers estão disponíveis para uso
   */
  private static async checkAvailableProviders(): Promise<string[]> {
    const available: string[] = [];
    
    for (const [name, provider] of this.providers.entries()) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          available.push(name);
        }
      } catch (error) {
        console.warn(`⚠️  Erro ao verificar provider '${name}':`, error);
      }
    }
    
    return available;
  }

  /**
   * Obtém um provider específico pelo nome
   */
  static getProvider(providerName: string): ModelProvider | null {
    return this.providers.get(providerName) || null;
  }

  /**
   * Lista todos os providers registrados
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Detecta e retorna o melhor provider disponível
   * Prioridade: Ollama (local) > Gemini > OpenRouter (nuvem)
   */
  static async detectBestProvider(): Promise<ModelProvider | null> {
    const priorities = ['ollama', 'gemini', 'openrouter'];
    
    for (const providerName of priorities) {
      const provider = this.providers.get(providerName);
      if (provider) {
        try {
          const isAvailable = await provider.isAvailable();
          if (isAvailable) {
            console.log(`✅ Usando provider: ${providerName}`);
            return provider;
          }
        } catch (error) {
          console.warn(`⚠️  Provider '${providerName}' falhou na verificação:`, error);
        }
      }
    }
    
    console.error('❌ Nenhum provider disponível');
    return null;
  }

  /**
   * Gera conteúdo usando o provider especificado (com fallback)
   */
  static async generateContent(
    prompt: string, 
    config: ModelConfig,
    format?: any
  ): Promise<string> {
    const provider = this.providers.get(config.provider);
    
    if (!provider) {
      throw new Error(`Provider '${config.provider}' não encontrado`);
    }

    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new Error(`Provider '${config.provider}' não está disponível`);
      }

      return await provider.generateContent(prompt, config.model, format);
    } catch (error) {
      console.error(`❌ Erro ao gerar conteúdo com ${config.provider}:`, error);
      
      // Tentar fallback para outro provider
      const fallbackProvider = await this.detectBestProvider();
      if (fallbackProvider && fallbackProvider.name !== config.provider) {
        console.log(`🔄 Tentando fallback para ${fallbackProvider.name}...`);
        return await fallbackProvider.generateContent(prompt, config.model, format);
      }
      
      throw error;
    }
  }

  /**
   * Gera embedding usando o provider especificado
   */
  static async generateEmbedding(text: string, config: ModelConfig): Promise<number[]> {
    const provider = this.providers.get(config.embeddingProvider);
    
    if (!provider) {
      throw new Error(`Provider '${config.embeddingProvider}' não encontrado`);
    }

    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new Error(`Provider '${config.embeddingProvider}' não está disponível`);
      }

      return await provider.generateEmbedding(text, config.embedding);
    } catch (error) {
      console.error(`❌ Erro ao gerar embedding com ${config.embeddingProvider}:`, error);
      throw error;
    }
  }
}
