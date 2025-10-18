import React, { useState, useEffect } from 'react';

interface ModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'ollama' | 'openrouter';
  available: boolean;
}

interface EmbeddingConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'ollama' | 'openrouter';
  available: boolean;
}

interface ModelSelectorProps {
  onModelChange: (model: string, provider: string) => void;
  onEmbeddingChange: (model: string, provider: string) => void;
  selectedModel?: string;
  selectedEmbedding?: string;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  onModelChange,
  onEmbeddingChange,
  selectedModel,
  selectedEmbedding
}) => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [embeddings, setEmbeddings] = useState<EmbeddingConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async (retryCount = 0) => {
    try {
      console.log(`🔄 Tentativa ${retryCount + 1} de carregar modelos...`);
      // Verificar quais modelos estão disponíveis baseado nas variáveis de ambiente
      const response = await fetch('http://localhost:3001/api/models/available');
      console.log('📡 Resposta do backend:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Modelos carregados do backend:', data);
        setModels(data.models || []);
        setEmbeddings(data.embeddings || []);
      } else {
        console.warn('⚠️ Falha ao carregar modelos do backend, status:', response.status);
        // Tentar novamente se for erro de conexão e ainda não tentou 3 vezes
        if (response.status >= 500 && retryCount < 3) {
          console.log(`🔄 Tentando novamente em 2 segundos... (tentativa ${retryCount + 1}/3)`);
          setTimeout(() => loadAvailableModels(retryCount + 1), 2000);
          return;
        }
        // Fallback: lista vazia - usuário deve configurar .env.local
        setModels([]);
        setEmbeddings([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar modelos:', error);
      // Tentar novamente se for erro de conexão e ainda não tentou 3 vezes
      if (retryCount < 3) {
        console.log(`🔄 Tentando novamente em 2 segundos... (tentativa ${retryCount + 1}/3)`);
        setTimeout(() => loadAvailableModels(retryCount + 1), 2000);
        return;
      }
      // Fallback em caso de erro: lista vazia
      setModels([]);
      setEmbeddings([]);
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setIsLoading(false);
      }
    }
  };

  const createModelList = (): ModelConfig[] => {
    // Fallback: retornar lista vazia, deixar o backend decidir baseado no .env.local
    return [];
  };

  const createEmbeddingList = (): EmbeddingConfig[] => {
    // Fallback: retornar lista vazia, deixar o backend decidir baseado no .env.local
    return [];
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const model = models.find(m => m.id === selectedId);
    if (model) {
      console.log('🔄 Modelo alterado:', { id: model.id, provider: model.provider });
      onModelChange(model.id, model.provider);
    }
  };

  const handleEmbeddingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const embedding = embeddings.find(e => e.id === selectedId);
    if (embedding) {
      console.log('🔄 Embedding alterado:', { id: embedding.id, provider: embedding.provider });
      onEmbeddingChange(embedding.id, embedding.provider);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-custom-blue rounded-lg p-4 mb-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-600 rounded mb-4"></div>
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-custom-blue rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="text-z4l1nux-primary mr-2">🤖</span>
        Configuração de Modelos
      </h3>
      
      <div className="space-y-4">
        {/* Seleção do Modelo Principal */}
        <div>
          <label htmlFor="model-select" className="block text-sm font-medium text-gray-300 mb-2">
            Modelo de IA Principal
          </label>
          <select
            id="model-select"
            value={selectedModel || ''}
            onChange={handleModelChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-z4l1nux-primary focus:border-z4l1nux-primary"
          >
            <option value="">Selecione um modelo...</option>
            {models.map((model) => (
              <option key={model.id} value={model.id} disabled={!model.available}>
                {model.name} {!model.available ? '(Indisponível)' : ''}
              </option>
            ))}
          </select>
          {models.length === 0 && (
            <p className="text-sm text-yellow-400 mt-1">
              ⚠️ Nenhum modelo configurado. Configure OLLAMA_BASE_URL, MODEL_OLLAMA ou OPENROUTER_API_KEY no .env.local
            </p>
          )}
        </div>

        {/* Seleção do Modelo de Embedding */}
        <div>
          <label htmlFor="embedding-select" className="block text-sm font-medium text-gray-300 mb-2">
            Modelo de Embedding
          </label>
          <select
            id="embedding-select"
            value={selectedEmbedding || ''}
            onChange={handleEmbeddingChange}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-z4l1nux-primary focus:border-z4l1nux-primary"
          >
            <option value="">Selecione um modelo de embedding...</option>
            {embeddings.map((embedding) => (
              <option key={embedding.id} value={embedding.id} disabled={!embedding.available}>
                {embedding.name} {!embedding.available ? '(Indisponível)' : ''}
              </option>
            ))}
          </select>
          {embeddings.length === 0 && (
            <p className="text-sm text-yellow-400 mt-1">
              ⚠️ Nenhum modelo de embedding configurado. Configure EMBEDDING_MODEL no .env.local
            </p>
          )}
        </div>

        {/* Status compacto dos Provedores */}
        <div className="flex items-center gap-6 text-xs text-gray-300">
          {(() => {
            const hasOllama = models.some(m => m.provider === 'ollama') || embeddings.some(e => e.provider === 'ollama');
            const hasOpenRouter = models.some(m => m.provider === 'openrouter') || embeddings.some(e => e.provider === 'openrouter');
            const hasGemini = models.some(m => m.provider === 'gemini') || embeddings.some(e => e.provider === 'gemini');
            return (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${hasOllama ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Ollama</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${hasOpenRouter ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>OpenRouter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${hasGemini ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Gemini</span>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
