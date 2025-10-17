import React, { useEffect } from 'react';
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

  // Polling: Verificar status periodicamente enquanto está inicializando
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isLoading) {
      // Verificar a cada 2 segundos enquanto está carregando
      intervalId = setInterval(() => {
        console.log('🔄 Verificando status do RAG automaticamente...');
        checkSystemHealth();
      }, 2000);
    } else if (isInitialized) {
      // Quando finalizar o loading, fazer uma última verificação e buscar estatísticas
      console.log('✅ RAG inicializado! Atualizando estatísticas...');
      refreshStatistics();
    }

    // Limpar intervalo quando o componente desmontar ou quando parar de carregar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, isInitialized, checkSystemHealth, refreshStatistics]);

  const handleFileUpload = async (file: File) => {
    try {
      await uploadDocument(file);
    } catch (error) {
      console.error('Erro no upload:', error);
    }
  };



  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-500';
    if (isInitialized) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusText = () => {
    if (isLoading) return 'Processando...';
    if (isInitialized) return 'Ativo';
    return 'Inativo';
  };

  return (
    <div className="bg-custom-blue rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          Retrieval Augmented Generation
        </h2>
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm text-gray-300">
            {getStatusText()}
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

      {/* Not Initialized State */}
      {!isInitialized && !isLoading && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="text-gray-400 mb-2">🚀</div>
            <h3 className="text-lg font-medium text-white">Sistema RAG não inicializado</h3>
            <p className="text-gray-300 mt-2">
              Inicialize o sistema para começar a usar funcionalidades de busca semântica
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Certifique-se de que o backend está rodando: <code className="bg-gray-700 px-1 rounded">npm run dev:backend</code>
            </p>
          </div>
          <button
            onClick={initializeSystem}
            disabled={isLoading}
            className="bg-z4l1nux-primary text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Inicializando...' : 'Inicializar Sistema RAG'}
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
