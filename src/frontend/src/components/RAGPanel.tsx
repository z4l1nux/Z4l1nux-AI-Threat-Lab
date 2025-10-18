import React, { useEffect, useRef, useState } from 'react';
import DocumentUpload from './DocumentUpload';
import { useRAGSystem } from '../hooks/useRAGSystem';

const RAGPanel: React.FC = () => {
  const {
    isInitialized,
    isLoading,
    error,
    statistics,
    initializeSystem,
    uploadDocument,
    refreshStatistics,
    checkSystemHealth,
    retryLastAction
  } = useRAGSystem();



  // Verificar status do sistema ao carregar (imediatamente e repetidamente)
  useEffect(() => {
    // Verificação inicial imediata
    checkSystemHealth();

    // Verificar novamente após 1 segundo (caso o backend ainda esteja inicializando)
    const timeoutId = setTimeout(() => {
      checkSystemHealth();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [checkSystemHealth]);

  // Polling com backoff: verifica status enquanto está inicializando
  const [pollMs, setPollMs] = useState(1000);
  const maxPollMs = 10000;
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const tick = async () => {
      await checkSystemHealth();
    };

    const status = isInitialized ? 'initialized' : (isLoading ? 'initializing' : 'idle');
    const statusChanged = lastStatusRef.current !== status;
    lastStatusRef.current = status;

    if (isLoading) {
      if (statusChanged) {
        setPollMs(2000); // reset backoff quando status muda
      } else {
        setPollMs(prev => Math.min(prev + 1000, maxPollMs)); // aumentar gradual até 10s
      }
      intervalId = setInterval(tick, pollMs);
    } else if (isInitialized) {
      refreshStatistics();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLoading, isInitialized, pollMs, checkSystemHealth, refreshStatistics]);

  const handleFileUpload = async (file: File) => {
    try {
      await uploadDocument(file);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };




  return (
    <div className="bg-custom-blue rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          🤖 ReAct Agent + RAG
        </h2>
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-green-300 font-medium">
            ReAct Agent Ativo
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-md p-4 mb-4">
          <div className="flex items-start">
            <div className="text-red-400 mr-3">⚠️</div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-300">Erro</h3>
              <div className="mt-2 text-sm text-red-200">{error}</div>
              <button
                onClick={retryLastAction}
                className="mt-2 text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500"
              >
                🔄 Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-900/20 border border-blue-500 rounded-md p-4 mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-3"></div>
            <span className="text-blue-200">Processando...</span>
          </div>
        </div>
      )}

      {/* ReAct Agent Status */}
      <div className="bg-green-900/20 border border-green-500 rounded-md p-4 mb-4">
        <div className="flex items-center">
          <div className="text-green-400 mr-3">🤖</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-300">ReAct Agent Sempre Ativo</h3>
            <p className="text-sm text-green-200 mt-1">
              Análise de ameaças funciona independentemente do RAG. Use o formulário ou editor visual para começar!
            </p>
          </div>
        </div>
      </div>

      {/* RAG Status */}
      {!isInitialized && !isLoading && (
        <div className="text-center py-4">
          <div className="mb-4">
            <div className="text-gray-400 mb-2">📚</div>
            <h3 className="text-lg font-medium text-white">RAG Opcional</h3>
            <p className="text-gray-300 mt-2">
              O RAG melhora a análise, mas não é obrigatório. O ReAct Agent funciona perfeitamente sem ele.
            </p>
          </div>
          <button
            onClick={initializeSystem}
            disabled={isLoading}
            className="bg-z4l1nux-primary text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Inicializando...' : 'Inicializar RAG (Opcional)'}
          </button>
        </div>
      )}

      {/* Initialized State */}
      {isInitialized && (
        <div className="space-y-6">
          {/* Statistics */}
          {statistics && (
            <div className="bg-gray-700 rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">📊 Estatísticas</h3>
                <button
                  onClick={refreshStatistics}
                  className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded hover:bg-gray-500"
                >
                  🔄 Atualizar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-300">Documentos:</span>
                  <span className="ml-2 font-medium text-white">{statistics.totalDocumentos}</span>
                </div>
                <div>
                  <span className="text-gray-300">Chunks:</span>
                  <span className="ml-2 font-medium text-white">{statistics.totalChunks}</span>
                </div>
              </div>
            </div>
          )}


          {/* Upload de Documentos */}
          <DocumentUpload 
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
          />

        </div>
      )}
    </div>
  );
};

export default RAGPanel;
