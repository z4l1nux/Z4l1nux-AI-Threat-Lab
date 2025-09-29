import React, { useState, useEffect } from 'react';

interface KnowledgeBaseStatusProps {
  onStatusChange?: (status: KnowledgeBaseStatus) => void;
}

interface KnowledgeBaseStatus {
  status: 'not_initialized' | 'empty' | 'ready' | 'error';
  message: string;
  documents?: number;
  chunks?: number;
  capecChunks?: number;
  hasCAPEC?: boolean;
}

export const KnowledgeBaseStatus: React.FC<KnowledgeBaseStatusProps> = ({ onStatusChange }) => {
  const [status, setStatus] = useState<KnowledgeBaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/knowledge-base-status');
      const data = await response.json();
      setStatus(data);
      setLastChecked(new Date());
      onStatusChange?.(data);
    } catch (error) {
      console.error('Erro ao verificar status da base de conhecimento:', error);
      setStatus({
        status: 'error',
        message: 'Erro ao verificar base de conhecimento'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Verificar a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    if (isLoading) return '🔄';
    if (!status) return '❓';
    
    switch (status.status) {
      case 'ready': return '✅';
      case 'empty': return '⚠️';
      case 'not_initialized': return '⏳';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = () => {
    if (isLoading) return 'rgba(59, 130, 246, 0.2)';
    if (!status) return 'rgba(148, 163, 184, 0.2)';
    
    switch (status.status) {
      case 'ready': return 'rgba(34, 197, 94, 0.2)';
      case 'empty': return 'rgba(245, 158, 11, 0.2)';
      case 'not_initialized': return 'rgba(59, 130, 246, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(148, 163, 184, 0.2)';
    }
  };

  const getBorderColor = () => {
    if (isLoading) return 'rgba(59, 130, 246, 0.3)';
    if (!status) return 'rgba(148, 163, 184, 0.3)';
    
    switch (status.status) {
      case 'ready': return 'rgba(34, 197, 94, 0.3)';
      case 'empty': return 'rgba(245, 158, 11, 0.3)';
      case 'not_initialized': return 'rgba(59, 130, 246, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(148, 163, 184, 0.3)';
    }
  };

  return (
    <div 
      className="knowledge-base-status"
      style={{
        background: getStatusColor(),
        border: `1px solid ${getBorderColor()}`,
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>
          {getStatusIcon()} Status da Base de Conhecimento
        </h4>
        <button
          onClick={checkStatus}
          disabled={isLoading}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#93c5fd',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '🔄' : '🔄 Atualizar'}
        </button>
      </div>

      {status && (
        <>
          <p style={{ margin: '0 0 10px 0', color: '#94a3b8', fontSize: '14px' }}>
            {status.message}
          </p>

          {status.status === 'ready' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#22c55e' }}>
                  {status.documents || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Documentos</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#22c55e' }}>
                  {status.chunks || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Chunks</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: status.hasCAPEC ? '#22c55e' : '#ef4444' }}>
                  {status.capecChunks || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>CAPEC</div>
              </div>
            </div>
          )}

          {status.status === 'empty' && (
            <div style={{ 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: '8px', 
              padding: '10px',
              marginTop: '10px'
            }}>
              <p style={{ margin: 0, color: '#fcd34d', fontSize: '14px' }}>
                💡 <strong>Dica:</strong> Faça upload de documentos CAPEC-STRIDE para enriquecer a análise de ameaças.
              </p>
            </div>
          )}

          {lastChecked && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', textAlign: 'right' }}>
              Última verificação: {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </>
      )}
    </div>
  );
};
