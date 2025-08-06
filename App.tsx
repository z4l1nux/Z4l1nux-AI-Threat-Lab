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
    generateThreatModel,
    updateReportMarkdown,
    refineThreatModel
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

  const handleRefineSubmit = (markdown: string) => {
    refineThreatModel(markdown);
  };

  const isApiKeyMissing = !process.env.GEMINI_API_KEY && !process.env.API_KEY;

  return (
    <div className="min-h-screen bg-custom-black text-custom-yellow flex flex-col items-center p-4 md:p-8 selection:bg-custom-yellow selection:text-custom-black">
      <header className="w-full mb-8 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-custom-yellow py-2">
          {APP_TITLE}
        </h1>
        <p className="text-custom-yellow mt-2 text-sm md:text-base">
          Utilize IA para analisar seu sistema, identificar ameaças STRIDE, mapear para CAPEC e sugerir mitigações.
        </p>
        {isApiKeyMissing && (
           <div role="alert" className="mt-4 p-3 bg-custom-yellow/20 border border-custom-yellow text-custom-yellow rounded-md text-xs">
            <strong>Aviso:</strong> {GEMINI_API_KEY_CHECK_MSG} A variável de ambiente <code>GEMINI_API_KEY</code> ou <code>API_KEY</code> não está configurada. As funcionalidades de IA podem não funcionar.
          </div>
        )}
      </header>

      <main className="w-full max-w-full min-h-[calc(100vh-200px)] flex flex-col lg:flex-row items-stretch gap-4">
        <section aria-labelledby="system-input-heading" className="w-full lg:max-w-md lg:w-2/5 h-full flex flex-col mt-6 lg:mt-8">
          <h2 id="system-input-heading" className="sr-only">Entrada de Informações do Sistema</h2>
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
              onEdit={updateReportMarkdown} 
              onRefine={handleRefineSubmit}
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
