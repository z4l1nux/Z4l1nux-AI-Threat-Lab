import React, { useState, useRef, useEffect } from 'react';

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

  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      
      setShowUpload(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          🧠 Sistema RAG (Retrieval-Augmented Generation)
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${state.isInitialized ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {state.isInitialized ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">{state.error}</div>
            </div>
          </div>
        </div>
      )}

      {!state.isInitialized ? (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="text-gray-500 mb-2">🚀</div>
            <h3 className="text-lg font-medium text-gray-900">Sistema RAG não inicializado</h3>
            <p className="text-gray-600 mt-2">
              Inicialize o sistema para começar a usar funcionalidades de busca semântica
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Certifique-se de que o backend está rodando: <code>npm run dev:backend</code>
            </p>
          </div>
          <button
            onClick={initializeSystem}
            disabled={state.isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? 'Inicializando...' : 'Inicializar Sistema RAG'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estatísticas */}
          {state.statistics && (
            <div className="bg-gray-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">📊 Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Documentos:</span>
                  <span className="ml-2 font-medium">{state.statistics.totalDocumentos}</span>
                </div>
                <div>
                  <span className="text-gray-600">Chunks:</span>
                  <span className="ml-2 font-medium">{state.statistics.totalChunks}</span>
                </div>
              </div>
              <div className="mt-2">
                <button
                  onClick={refreshStatistics}
                  className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
                >
                  🔄 Atualizar
                </button>
              </div>
            </div>
          )}

          {/* Upload de Documentos */}
          <div className="border rounded-md p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">📄 Base de Conhecimento</h3>
            
            {/* Aviso sobre Mapeamento STRIDE-CAPEC */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
              <div className="flex items-start">
                <span className="text-yellow-600 text-lg mr-2">⚠️</span>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Mapeamento STRIDE-CAPEC Obrigatório</h4>
                  <p className="text-xs text-yellow-700 mb-2">
                    Para que o sistema funcione, é necessário fazer upload de um documento contendo o mapeamento STRIDE-CAPEC.
                  </p>
                  <p className="text-xs text-yellow-600 mb-1">
                    <strong>Formatos aceitos:</strong> JSON, PDF, MD, TXT, DOCX, DOC
                  </p>
                  <p className="text-xs text-yellow-600">
                    📖 Consulte: <code className="bg-yellow-100 px-1 rounded">MAPEAMENTO_STRIDE_CAPEC.md</code> para exemplos
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mb-3">
              ℹ️ Faça upload de documentos de referência:
            </p>
            <ul className="text-xs text-gray-600 mb-3 ml-4 space-y-1">
              <li>• <strong>Mapeamento STRIDE-CAPEC</strong> (qualquer formato - obrigatório)</li>
              <li>• PDFs sobre threat modeling e segurança</li>
              <li>• Políticas e frameworks (OWASP, NIST, etc.)</li>
              <li>• Documentação técnica</li>
            </ul>
            
            <p className="text-xs text-gray-500 mb-3">
              🔍 A busca semântica acontece automaticamente no backend durante a análise de ameaças.
            </p>
            
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
            >
              📁 {showUpload ? 'Ocultar Upload' : 'Upload de Arquivo'}
            </button>

            {showUpload && (
              <div className="mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,.xml,.json,.csv"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formatos suportados: PDF, DOCX, DOC, TXT, MD, XML, JSON, CSV
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RAGPanel;
