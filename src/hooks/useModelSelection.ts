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
    saveSelection(newSelection);
  }, [selection, saveSelection]);

  const updateEmbedding = useCallback((embedding: string, provider: string) => {
    const newSelection = { ...selection, embedding, provider };
    saveSelection(newSelection);
  }, [selection, saveSelection]);

  const getModelConfig = useCallback(() => {
    return {
      model: selection.model,
      provider: selection.provider,
      embedding: selection.embedding,
      embeddingProvider: selection.embeddingProvider
    };
  }, [selection]);

  return {
    selection,
    updateModel,
    updateEmbedding,
    getModelConfig
  };
};
