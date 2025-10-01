import { useState, useCallback, useEffect } from 'react';
import { ragService, RAGContext, SystemStatistics, DocumentUploadResult } from '../services/ragService';

export interface RAGSystemState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  statistics: SystemStatistics | null;
  lastSearch: RAGContext | null;
}

export const useRAGSystem = () => {
  const [state, setState] = useState<RAGSystemState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    statistics: null,
    lastSearch: null,
  });

  // Verificar status do sistema
  const checkSystemHealth = useCallback(async () => {
    try {
      const health = await ragService.checkHealth();
      const isRAGInitialized = health.services.rag === 'initialized';
      
      setState(prev => ({
        ...prev,
        isInitialized: isRAGInitialized,
        error: health.services.neo4j === 'disconnected' ? 'Neo4j desconectado' : null
      }));

      return health;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao verificar sistema'
      }));
      return null;
    }
  }, []);

  // Inicializar sistema RAG
  const initializeSystem = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await ragService.initialize();
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        statistics: result.statistics
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao inicializar sistema'
      }));
      throw error;
    }
  }, []);

  // Upload de arquivo
  const uploadDocument = useCallback(async (file: File): Promise<DocumentUploadResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await ragService.uploadDocument(file);
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: result.statistics
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload'
      }));
      throw error;
    }
  }, []);

  // Upload de texto
  const uploadText = useCallback(async (name: string, content: string): Promise<DocumentUploadResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await ragService.uploadText(name, content);
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: result.statistics
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload de texto'
      }));
      throw error;
    }
  }, []);

  // Busca com contexto RAG
  const searchContext = useCallback(async (query: string, limit: number = 5): Promise<RAGContext> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await ragService.searchContext(query, limit);
      const context: RAGContext = {
        context: result.context,
        sources: result.sources,
        totalDocuments: result.totalDocuments,
        confidence: result.confidence
      };
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        lastSearch: context
      }));
      
      return context;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro na busca'
      }));
      throw error;
    }
  }, []);

  // Atualizar estatísticas
  const refreshStatistics = useCallback(async () => {
    try {
      const stats = await ragService.getStatistics();
      setState(prev => ({
        ...prev,
        statistics: stats
      }));
      return stats;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao obter estatísticas'
      }));
      throw error;
    }
  }, []);

  // Limpar cache
  const clearCache = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await ragService.clearCache();
      const stats = await ragService.getStatistics();
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: stats,
        lastSearch: null
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao limpar cache'
      }));
      throw error;
    }
  }, []);

  // Verificar sistema na inicialização
  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  return {
    ...state,
    initializeSystem,
    uploadDocument,
    uploadText,
    searchContext,
    refreshStatistics,
    clearCache,
    checkSystemHealth,
  };
};
