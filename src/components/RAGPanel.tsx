import React, { useState, useEffect } from 'react';
import DocumentUpload from './DocumentUpload';

interface RAGSystemState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  statistics: {
    totalChunks: number;
    totalDocumentos: number;
  } | null;
}

const RAGPanel: React.FC = () => {
  const [state, setState] = useState<RAGSystemState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    statistics: null,
  });


  const BACKEND_URL = 'http://localhost:3001';

  // Verificar status do sistema ao carregar
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`);
      if (response.ok) {
        const health = await response.json();
        const isRAGInitialized = health.services?.rag === 'initialized';
        setState(prev => ({
          ...prev,
          isInitialized: isRAGInitialized,
          error: health.services?.neo4j === 'disconnected' ? 'Neo4j desconectado' : null
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Backend não disponível. Execute: npm run dev:backend'
      }));
    }
  };

  const initializeSystem = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao inicializar sistema');
      }

      const result = await response.json();
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        statistics: result.statistics
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao inicializar sistema'
      }));
    }
  };

  const handleFileUpload = async (file: File) => {

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const formData = new FormData();
      formData.append('document', file);

      const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha no upload');
      }

      const result = await response.json();
      setState(prev => ({
        ...prev,
        isLoading: false,
        statistics: result.statistics
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro no upload'
      }));
    }
  };

  const refreshStatistics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/statistics`);
      if (response.ok) {
        const stats = await response.json();
        setState(prev => ({ ...prev, statistics: stats }));
      }
    } catch (error) {
      console.error('Erro ao atualizar estatísticas:', error);
    }
  };

  return (
    <div className="bg-custom-blue rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center">
          🧠 Sistema RAG (Retrieval-Augmented Generation)
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${state.isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {state.isInitialized ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {state.error && (
        <div className="bg-red-900/20 border border-red-500 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-300">Erro</h3>
              <div className="mt-2 text-sm text-red-200">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {!state.isInitialized ? (
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
            disabled={state.isLoading}
            className="bg-z4l1nux-primary text-white px-6 py-2 rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? 'Inicializando...' : 'Inicializar Sistema RAG'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estatísticas */}
          {state.statistics && (
            <div className="bg-gray-700 rounded-md p-4">
              <h3 className="text-sm font-medium text-white mb-2">📊 Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-300">Documentos:</span>
                  <span className="ml-2 font-medium text-white">{state.statistics.totalDocumentos}</span>
                </div>
                <div>
                  <span className="text-gray-300">Chunks:</span>
                  <span className="ml-2 font-medium text-white">{state.statistics.totalChunks}</span>
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={refreshStatistics}
                  className="text-xs bg-gray-600 text-gray-200 px-2 py-1 rounded hover:bg-gray-500"
                >
                  🔄 Atualizar
                </button>
              </div>
            </div>
          )}

          {/* Upload de Documentos */}
          <DocumentUpload 
            onFileUpload={handleFileUpload}
            isLoading={state.isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default RAGPanel;
