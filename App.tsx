import React from 'react';
import SystemInputForm from './components/SystemInputForm';
import ReportDisplay from './components/ReportDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import { useThreatModeler } from './hooks/useThreatModeler';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { APP_TITLE, INITIAL_SYSTEM_INFO, GEMINI_API_KEY_CHECK_MSG } from './constants';
import { SystemInfo } from './types';

const App: React.FC = () => {
  const {
    reportData,
    isLoading,
    error,
    generateThreatModel
  } = useThreatModeler();

  const handleFormSubmit = (data: { fullDescription: string, systemVersion?: string }) => {
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
      systemVersion: data.systemVersion || 'Não informado',
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

  const isApiKeyMissing = !process.env.GEMINI_API_KEY && !process.env.API_KEY;

  return (
    <div className="min-h-screen bg-custom-black text-custom-yellow">
      <header className="bg-black border-b border-custom-yellow/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-custom-yellow mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h1 className="text-2xl font-bold text-custom-yellow">{APP_TITLE}</h1>
            </div>
            <div className="text-sm text-gray-400">
              Powered by Google Gemini AI
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="space-y-8">
          <SystemInputForm onSubmit={handleFormSubmit} isLoading={isLoading} />

          {error && (
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-400">Erro</h3>
                  <div className="mt-2 text-sm text-red-300">
                    <pre className="whitespace-pre-wrap">{error}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isApiKeyMissing && (
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-400">Chave da API não configurada</h3>
                  <div className="mt-2 text-sm text-yellow-300">
                    <p>{GEMINI_API_KEY_CHECK_MSG}</p>
                  </div>
                </div>
              </div>
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

      <footer className="w-full mt-12 pt-8 border-t border-custom-yellow/30 text-center text-custom-yellow text-sm">
        <p>&copy; {new Date().getFullYear()} {APP_TITLE}. Análise de segurança aprimorada por IA.</p>
        <p className="mt-1 text-custom-yellow">Esta é uma ferramenta conceitual. Sempre valide o conteúdo gerado por IA com especialistas em segurança.</p>
      </footer>
    </div>
  );
};

export default App;
