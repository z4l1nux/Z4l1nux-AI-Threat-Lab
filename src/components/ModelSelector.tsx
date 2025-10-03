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

  const loadAvailableModels = async () => {
    try {
      // Verificar quais modelos estão disponíveis baseado nas variáveis de ambiente
      const response = await fetch('http://localhost:3001/api/models/available');
      if (response.ok) {
        const data = await response.json();
        console.log('Modelos carregados do backend:', data);
        setModels(data.models || []);
        setEmbeddings(data.embeddings || []);
      } else {
        console.warn('Falha ao carregar modelos do backend, usando fallback');
        // Fallback: criar lista baseada nas variáveis de ambiente conhecidas
        const availableModels = createModelList();
        const availableEmbeddings = createEmbeddingList();
        setModels(availableModels);
        setEmbeddings(availableEmbeddings);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      // Fallback em caso de erro
      const availableModels = createModelList();
      const availableEmbeddings = createEmbeddingList();
      setModels(availableModels);
      setEmbeddings(availableEmbeddings);
    } finally {
      setIsLoading(false);
    }
  };

  const createModelList = (): ModelConfig[] => {
    // Fallback: sempre incluir Gemini como padrão
    return [
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini',
        available: true
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini',
        available: true
      }
    ];
  };

  const createEmbeddingList = (): EmbeddingConfig[] => {
    // Fallback: sempre incluir Gemini embedding como padrão
    return [
      {
        id: 'gemini-embedding-001',
        name: 'Gemini Embedding 001',
        provider: 'gemini',
        available: true
      }
    ];
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const model = models.find(m => m.id === selectedId);
    if (model) {
      onModelChange(model.id, model.provider);
    }
  };

  const handleEmbeddingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const embedding = embeddings.find(e => e.id === selectedId);
    if (embedding) {
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
            <p className="text-sm text-gray-400 mt-1">
              Nenhum modelo configurado. Configure as variáveis de ambiente.
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
            <p className="text-sm text-gray-400 mt-1">
              Nenhum modelo de embedding configurado.
            </p>
          )}
        </div>

        {/* Status dos Provedores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded ${models.some(m => m.provider === 'gemini') ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
            <span className="font-medium">Gemini:</span> {models.some(m => m.provider === 'gemini') ? 'Configurado' : 'Não configurado'}
          </div>
          <div className={`p-2 rounded ${models.some(m => m.provider === 'ollama') ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
            <span className="font-medium">Ollama:</span> {models.some(m => m.provider === 'ollama') ? 'Configurado' : 'Não configurado'}
          </div>
          <div className={`p-2 rounded ${models.some(m => m.provider === 'openrouter') ? 'bg-green-900/20 text-green-300' : 'bg-red-900/20 text-red-300'}`}>
            <span className="font-medium">OpenRouter:</span> {models.some(m => m.provider === 'openrouter') ? 'Configurado' : 'Não configurado'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
