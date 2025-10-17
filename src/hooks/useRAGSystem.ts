import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ragService, RAGContext, SystemStatistics, DocumentUploadResult } from '../services/ragService';

export interface RAGSystemState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  statistics: SystemStatistics | null;
  lastSearch: RAGContext | null;
  cacheStats: { size: number; entries: string[] };
}

export interface UseRAGSystemReturn extends RAGSystemState {
  initializeSystem: () => Promise<any>;
  uploadDocument: (file: File) => Promise<DocumentUploadResult>;
  uploadText: (name: string, content: string) => Promise<DocumentUploadResult>;
  searchContext: (query: string, limit?: number) => Promise<RAGContext>;
  refreshStatistics: () => Promise<SystemStatistics>;
  clearCache: () => Promise<void>;
  checkSystemHealth: () => Promise<any>;
  clearLocalCache: () => void;
  retryLastAction: () => Promise<void>;
}

export const useRAGSystem = (): UseRAGSystemReturn => {
  const [state, setState] = useState<RAGSystemState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    statistics: null,
    lastSearch: null,
    cacheStats: { size: 0, entries: [] }
  });

  // Refs para controlar operações
  const lastActionRef = useRef<(() => Promise<any>) | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Debounce para buscas
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar estatísticas do cache
  const updateCacheStats = useCallback(() => {
    const cacheStats = ragService.getCacheStats();
    setState(prev => ({ ...prev, cacheStats }));
  }, []);

  // Verificar status do sistema (com latch para evitar logs repetidos)
  const lastHealthStatusRef = useRef<string | null>(null);
  const checkSystemHealth = useCallback(async () => {
    try {
      const health = await ragService.checkHealth();
      const currentStatus: string = health.services.rag;
      const isRAGInitialized = currentStatus === 'initialized' || currentStatus === 'initializing';
      const isRAGInitializing = currentStatus === 'initializing';
      
      setState(prev => ({
        ...prev,
        isInitialized: isRAGInitialized,
        isLoading: isRAGInitializing,
        error: health.services.neo4j === 'disconnected' ? 'Neo4j desconectado' : null
      }));

      // Logar apenas quando status mudar
      if (lastHealthStatusRef.current !== currentStatus) {
        if (currentStatus === 'initializing') {
          console.log('⏳ Aguardando RAG inicializar...');
        } else if (currentStatus === 'initialized') {
          console.log('✅ RAG inicializado! Pronto para buscar mapeamento STRIDE-CAPEC.');
        }
        lastHealthStatusRef.current = currentStatus;
      }

      updateCacheStats();
      return health;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao verificar sistema'
      }));
      return null;
    }
  }, [updateCacheStats]);

  // Inicializar sistema RAG
  const initializeSystem = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const action = async () => {
      const result = await ragService.initialize();
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        statistics: {
          ...result.statistics,
          cacheValid: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      updateCacheStats();
      return result;
    };

    lastActionRef.current = action;
    retryCountRef.current = 0;

    try {
      return await action();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao inicializar sistema'
      }));
      throw error;
    }
  }, [updateCacheStats]);

  // Upload de arquivo
  const uploadDocument = useCallback(async (file: File): Promise<DocumentUploadResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const action = async () => {
      const result = await ragService.uploadDocument(file);
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: {
          ...result.statistics,
          cacheValid: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      updateCacheStats();
      return result;
    };

    lastActionRef.current = action;
    retryCountRef.current = 0;

    try {
      return await action();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload'
      }));
      throw error;
    }
  }, [updateCacheStats]);

  // Upload de texto
  const uploadText = useCallback(async (name: string, content: string): Promise<DocumentUploadResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const action = async () => {
      const result = await ragService.uploadText(name, content);
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: {
          ...result.statistics,
          cacheValid: true,
          timestamp: new Date().toISOString()
        }
      }));
      
      updateCacheStats();
      return result;
    };

    lastActionRef.current = action;
    retryCountRef.current = 0;

    try {
      return await action();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload de texto'
      }));
      throw error;
    }
  }, [updateCacheStats]);

  // Busca com contexto RAG (com debounce)
  const searchContext = useCallback(async (query: string, limit: number = 5): Promise<RAGContext> => {
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    return new Promise((resolve, reject) => {
      searchTimeoutRef.current = setTimeout(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const action = async () => {
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
          
          updateCacheStats();
          return context;
        };

        lastActionRef.current = action;
        retryCountRef.current = 0;

        try {
          const result = await action();
          resolve(result);
        } catch (error) {
          setState(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erro na busca'
          }));
          reject(error);
        }
      }, 300); // Debounce de 300ms
    });
  }, [updateCacheStats]);

  // Atualizar estatísticas
  const refreshStatistics = useCallback(async () => {
    const action = async () => {
      const stats = await ragService.getStatistics();
      setState(prev => ({
        ...prev,
        statistics: stats
      }));
      
      updateCacheStats();
      return stats;
    };

    lastActionRef.current = action;
    retryCountRef.current = 0;

    try {
      return await action();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao obter estatísticas'
      }));
      throw error;
    }
  }, [updateCacheStats]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const action = async () => {
      await ragService.clearCache();
      const stats = await ragService.getStatistics();
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: stats,
        lastSearch: null
      }));
      
      updateCacheStats();
    };

    lastActionRef.current = action;
    retryCountRef.current = 0;

    try {
      await action();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro ao limpar cache'
      }));
      throw error;
    }
  }, [updateCacheStats]);

  // Limpar cache local
  const clearLocalCache = useCallback(() => {
    ragService.clearLocalCache();
    updateCacheStats();
  }, [updateCacheStats]);

  // Retry da última ação
  const retryLastAction = useCallback(async () => {
    if (!lastActionRef.current || retryCountRef.current >= maxRetries) {
      return;
    }

    retryCountRef.current++;
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await lastActionRef.current();
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro na operação'
      }));
    }
  }, [maxRetries]);

  // Verificar sistema na inicialização
  useEffect(() => {
    checkSystemHealth();
  }, [checkSystemHealth]);

  // Atualizar estatísticas do cache periodicamente
  useEffect(() => {
    const interval = setInterval(updateCacheStats, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [updateCacheStats]);

  // Cleanup do timeout de busca
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoizar o retorno para evitar re-renders desnecessários
  const returnValue = useMemo(() => ({
    ...state,
    initializeSystem,
    uploadDocument,
    uploadText,
    searchContext,
    refreshStatistics,
    clearCache,
    checkSystemHealth,
    clearLocalCache,
    retryLastAction,
  }), [
    state,
    initializeSystem,
    uploadDocument,
    uploadText,
    searchContext,
    refreshStatistics,
    clearCache,
    checkSystemHealth,
    clearLocalCache,
    retryLastAction,
  ]);

  return returnValue;
};