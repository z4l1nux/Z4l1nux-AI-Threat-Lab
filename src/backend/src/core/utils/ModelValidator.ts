/**
 * Utilitário para validação de compatibilidade entre modelos e embeddings
 */

export interface ModelConfig {
  model: string;
  provider: string;
  embedding: string;
  embeddingProvider: string;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export class ModelValidator {
  /**
   * Valida se a configuração de modelos é compatível
   */
  static validateModelConfig(config: ModelConfig): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Verificar se os provedores estão configurados
    if (!config.provider) {
      errors.push('Provedor do modelo principal não especificado');
    }

    if (!config.embeddingProvider) {
      errors.push('Provedor do modelo de embedding não especificado');
    }

    // Verificar compatibilidade entre provedores
    if (config.provider && config.embeddingProvider) {
      const compatibility = this.checkProviderCompatibility(config.provider, config.embeddingProvider);
      if (!compatibility.isCompatible && compatibility.warning) {
        warnings.push(compatibility.warning);
      }
    }

    // Verificar se os modelos estão disponíveis
    if (config.provider === 'ollama' && !process.env.OLLAMA_BASE_URL) {
      errors.push('OLLAMA_BASE_URL não configurado para usar modelo Ollama');
    }

    if (config.provider === 'openrouter' && !process.env.OPENROUTER_API_KEY) {
      errors.push('OPENROUTER_API_KEY não configurado para usar modelo OpenRouter');
    }

    if (config.embeddingProvider === 'ollama' && !process.env.EMBEDDING_MODEL) {
      warnings.push('EMBEDDING_MODEL não configurado, usando padrão nomic-embed-text:latest');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Verifica compatibilidade entre provedores
   */
  private static checkProviderCompatibility(modelProvider: string, embeddingProvider: string): {
    isCompatible: boolean;
    warning?: string;
  } {
    // Todas as combinações são tecnicamente compatíveis, mas algumas são mais eficientes
    if (modelProvider === embeddingProvider) {
      return { isCompatible: true };
    }

    // Combinações recomendadas
    if (modelProvider === 'ollama' && embeddingProvider === 'ollama') {
      return { isCompatible: true };
    }

    if (modelProvider === 'openrouter' && embeddingProvider === 'ollama') {
      return { isCompatible: true };
    }

    // Combinações que funcionam mas podem ter latência
    if (modelProvider === 'ollama' && embeddingProvider === 'openrouter') {
      return {
        isCompatible: true,
        warning: 'Usando Ollama para geração e OpenRouter para embeddings pode ter latência maior'
      };
    }

    return { isCompatible: true };
  }

  /**
   * Obtém configuração padrão baseada nas variáveis de ambiente
   */
  static getDefaultConfig(): ModelConfig {
    const hasOllama = !!(process.env.OLLAMA_BASE_URL && process.env.MODEL_OLLAMA);
    const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY && process.env.MODEL_OPENROUTER);
    const hasEmbedding = !!process.env.EMBEDDING_MODEL;

    // Prioridade: Ollama > OpenRouter
    let modelProvider = '';
    let model = '';

    if (hasOllama) {
      modelProvider = 'ollama';
      model = process.env.MODEL_OLLAMA || 'llama3.1:latest';
    } else if (hasOpenRouter) {
      modelProvider = 'openrouter';
      model = process.env.MODEL_OPENROUTER || '';
    }

    // Embedding sempre usa Ollama se disponível (mais eficiente)
    const embeddingProvider = hasOllama ? 'ollama' : 'openrouter';
    const embedding = hasEmbedding ? process.env.EMBEDDING_MODEL! : 'nomic-embed-text:latest';

    return {
      model,
      provider: modelProvider,
      embedding,
      embeddingProvider
    };
  }

  /**
   * Valida se pelo menos um provedor está configurado
   */
  static hasAnyProviderConfigured(): boolean {
    const hasOllama = !!(process.env.OLLAMA_BASE_URL && process.env.MODEL_OLLAMA);
    const hasOpenRouter = !!(process.env.OPENROUTER_API_KEY && process.env.MODEL_OPENROUTER);
    
    return hasOllama || hasOpenRouter;
  }

  /**
   * Obtém lista de provedores configurados
   */
  static getConfiguredProviders(): string[] {
    const providers: string[] = [];
    
    if (process.env.OLLAMA_BASE_URL && process.env.MODEL_OLLAMA) {
      providers.push('ollama');
    }
    
    if (process.env.OPENROUTER_API_KEY && process.env.MODEL_OPENROUTER) {
      providers.push('openrouter');
    }
    
    return providers;
  }
}
