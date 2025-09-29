import { useState } from 'react';
import { ThreatModelingForm } from './components/ThreatModelingForm';
import { ThreatReport } from './components/ThreatReport';
import { ThreatModelingClient } from '@shared/services/ThreatModelingClient';
import { ThreatModelingRequest, Threat } from '@shared/types/threat-modeling';

function App() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<ThreatModelingRequest | null>(null);

  const threatModelingClient = new ThreatModelingClient();

  const handleThreatModelingSubmit = async (request: ThreatModelingRequest) => {
    setIsLoading(true);
    setError(null);
    setLastRequest(request);

    try {
      console.log('🔍 Enviando prompt de threat modeling para:', request.modelo);
      const result = await threatModelingClient.generateThreatModeling(request);
      
      if (result.success && result.threats.length > 0) {
        console.log('🎯 Threats processadas:', result.threats);
        setThreats(result.threats);
      } else {
        throw new Error('Falha ao gerar análise de ameaças');
      }
    } catch (error) {
      console.error('❌ Erro na análise de ameaças:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>🛡️ Z4l1nux AI Threat Lab</h1>
        <p>Análise Inteligente de Ameaças de Segurança com IA</p>
      </div>

      <ThreatModelingForm 
        onSubmit={handleThreatModelingSubmit}
        isLoading={isLoading}
      />

      {isLoading && (
        <div className="loading">
          Gerando análise de ameaças no Z4l1nux AI Threat Lab...
        </div>
      )}

      {error && (
        <div className="report-card">
          <div className="report-header">
            <h2 className="report-title">❌ Erro na Análise</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <p><strong>Erro:</strong> {error}</p>
            <p>Verifique se o servidor está rodando e tente novamente.</p>
          </div>
        </div>
      )}

      {threats.length > 0 && lastRequest && (
        <ThreatReport
          threats={threats}
          systemName={lastRequest.systemName}
          systemType={lastRequest.systemType}
          sensitivity={lastRequest.sensitivity}
          description={lastRequest.description}
          assets={lastRequest.assets}
        />
      )}
    </div>
  );
}

export default App;
