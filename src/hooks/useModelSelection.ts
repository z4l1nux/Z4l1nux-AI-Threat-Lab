import { useState, useEffect, useCallback } from 'react';

interface ModelSelection {
  model: string;
  provider: string;
  embedding: string;
  embeddingProvider: string;
}

export const useModelSelection = () => {
  const [selection, setSelection] = useState<ModelSelection>({
    model: '',
    provider: '',
    embedding: '',
    embeddingProvider: ''
  });

  // Carregar seleção salva do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('model-selection');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelection(parsed);
      } catch (error) {
        console.error('Erro ao carregar seleção de modelos:', error);
      }
    }
  }, []);

  // Salvar seleção no localStorage
  const saveSelection = useCallback((newSelection: ModelSelection) => {
    localStorage.setItem('model-selection', JSON.stringify(newSelection));
    setSelection(newSelection);
  }, []);

  const updateModel = useCallback((model: string, provider: string) => {
    const newSelection = { ...selection, model, provider };
    console.log('💾 Salvando nova seleção de modelo:', newSelection);
    saveSelection(newSelection);
  }, [selection, saveSelection]);

  const updateEmbedding = useCallback((embedding: string, provider: string) => {
    const newSelection = { ...selection, embedding, embeddingProvider: provider };
    console.log('💾 Salvando nova seleção de embedding:', newSelection);
    saveSelection(newSelection);
  }, [selection, saveSelection]);

  const getModelConfig = useCallback(() => {
    const config = {
      model: selection.model,
      provider: selection.provider,
      embedding: selection.embedding,
      embeddingProvider: selection.embeddingProvider
    };
    console.log('📋 getModelConfig retornando:', config);
    return config;
  }, [selection]);

  return {
    selection,
    updateModel,
    updateEmbedding,
    getModelConfig
  };
};
