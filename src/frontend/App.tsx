import React, { useState } from 'react';
import SystemInputForm from './src/components/SystemInputForm';
import ReportDisplay from './src/components/ReportDisplay';
import LoadingSpinner from './src/components/LoadingSpinner';
import RAGPanel from './src/components/RAGPanel';
import ModelSelector from './src/components/ModelSelector';
import { VisualEditor } from './src/components/VisualEditor/VisualEditor';
import { useThreatModeler } from './src/hooks/useThreatModeler';
import { useModelSelection } from './src/hooks/useModelSelection';
import { APP_TITLE } from './constants';
import { SystemInfo } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'form' | 'visual'>('form');
  
  const {
    reportData,
    isLoading,
    error,
    generateThreatModel,
    resetThreatModel
  } = useThreatModeler();

  const {
    selection,
    updateModel,
    updateEmbedding
  } = useModelSelection();


  const handleFormSubmit = (data: { fullDescription: string }) => {
    // Extrair nome do sistema da descrição completa
    let systemName = 'Sistema Informado';
    const match = data.fullDescription.match(/Nome do Sistema\s*[:\-–]?\s*(.+)/i);
    if (match && match[1]) {
      systemName = match[1].split('\n')[0].trim();
    } else {
      // fallback: primeira linha não vazia
      const firstLine = data.fullDescription.split('\n').map(l => l.trim()).find(l => l.length > 0);
      if (firstLine) systemName = firstLine;
    }
    const fakeSystemInfo = {
      systemName,
      systemVersion: new Date().toISOString().split('T')[0], // Data atual como versão interna
      generalDescription: data.fullDescription,
      components: '',
      sensitiveData: '',
      technologies: '',
      authentication: '',
      userProfiles: '',
      externalIntegrations: '',
    };
    generateThreatModel(fakeSystemInfo);
  };

  const handleVisualAnalyze = (systemInfo: SystemInfo) => {
    // Trocar para a aba do formulário para mostrar o relatório
    setActiveTab('form');
    generateThreatModel(systemInfo);
  };

  return (
    <div className="min-h-screen bg-custom-black text-custom-yellow flex flex-col items-center p-4 md:p-8 selection:bg-custom-yellow selection:text-custom-black">
      <header className="w-full mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold py-2 text-z4l1nux-primary">
          {APP_TITLE}
        </h1>
        <p className="text-z4l1nux-primary mt-2 text-sm md:text-base">
          Utilize IA para analisar seu sistema, identificar ameaças STRIDE, mapear para CAPEC e sugerir mitigações.
        </p>
        
        {/* Tabs de navegação e botão de reset */}
        <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'form'
                ? 'bg-z4l1nux-primary text-custom-black'
                : 'bg-gray-800 text-z4l1nux-primary hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('form')}
          >
            📝 Formulário de Texto
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'visual'
                ? 'bg-z4l1nux-primary text-custom-black'
                : 'bg-gray-800 text-z4l1nux-primary hover:bg-gray-700'
            }`}
            onClick={() => setActiveTab('visual')}
          >
            🎨 Editor Visual de Diagramas
          </button>
          
          {/* Botão Nova Modelagem - apenas visível quando há um relatório */}
          {reportData && (
            <button
              className="px-6 py-3 rounded-lg font-semibold transition-all bg-orange-600 text-white hover:bg-orange-700 border-2 border-orange-500"
              onClick={resetThreatModel}
              title="Limpar modelagem atual e começar uma nova análise"
            >
              🔄 Nova Modelagem
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo principal com tabs - ambas montadas, apenas uma visível */}
      <main className={`w-full max-w-full min-h-[calc(100vh-200px)] flex flex-col lg:flex-row items-stretch gap-4 ${activeTab !== 'form' ? 'hidden' : ''}`}>
        <section aria-labelledby="system-input-heading" className="w-full lg:w-1/3 xl:w-1/4 h-full flex flex-col space-y-4 mt-2 lg:mt-6">
          <h2 id="system-input-heading" className="sr-only">Entrada de Informações do Sistema</h2>
          
          {/* Seletor de Modelos */}
          <ModelSelector
            onModelChange={updateModel}
            onEmbeddingChange={updateEmbedding}
            selectedModel={selection.model}
            selectedEmbedding={selection.embedding}
          />
          
          
          {/* Painel RAG */}
          <div className="bg-gray-900 rounded-lg p-4">
            <RAGPanel />
          </div>
          
          {/* Formulário do Sistema */}
          <SystemInputForm
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        </section>

        <section aria-labelledby="report-output-heading" className="w-full space-y-8 h-full flex flex-col flex-1">
           <h2 id="report-output-heading" className="sr-only">Saída do Relatório de Ameaças</h2>
          {error && (
            <div role="alert" className="p-4 bg-red-800 border border-red-700 text-red-200 rounded-md shadow-lg">
              <h3 className="font-semibold text-lg mb-2">Ocorreu um Erro:</h3>
              <pre className="text-sm whitespace-pre-wrap break-all">{error}</pre>
            </div>
          )}

          {isLoading && !reportData && <LoadingSpinner message="Gerando modelo de ameaças, por favor aguarde..." />}
          
          {reportData ? (
            <ReportDisplay 
              reportData={reportData} 
              isLoading={isLoading}
            />
          ) : (!isLoading && !error && (
            <div className="p-10 bg-gray-800 rounded-lg shadow-xl text-center">
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-xl text-gray-400">
                Seu relatório de modelo de ameaças aparecerá aqui.
              </p>
              <p className="text-sm text-gray-500">
                Preencha as informações do sistema e clique em "Gerar Modelo de Ameaças" para começar.
              </p>
            </div>
          ))}
        </section>
      </main>

      {/* Editor Visual - mantém montado mas oculto quando não ativo */}
      <div className={`w-full ${activeTab !== 'visual' ? 'hidden' : ''}`} style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
        <VisualEditor 
          onAnalyze={handleVisualAnalyze}
          isAnalyzing={isLoading}
        />
      </div>

      <footer className="w-full mt-12 pt-8 border-t border-z4l1nux-primary/30 text-center text-z4l1nux-primary text-sm">
        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. Análise de segurança aprimorada por IA.</p>
        <p className="mt-1 text-z4l1nux-primary">Esta é uma ferramenta conceitual. Sempre valide o conteúdo gerado por IA com especialistas em segurança.</p>
      </footer>
    </div>
  );
};

export default App;
