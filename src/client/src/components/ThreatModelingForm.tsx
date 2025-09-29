import React, { useState, useEffect } from 'react';
import { ThreatModelingRequest, SystemType, SensitivityLevel } from '@shared/types/threat-modeling';

interface ThreatModelingFormProps {
  onSubmit: (request: ThreatModelingRequest) => void;
  isLoading: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  value: string;
  enabled: boolean;
  recommended?: boolean;
}

export const ThreatModelingForm: React.FC<ThreatModelingFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ThreatModelingRequest>({
    systemName: '',
    systemType: 'web',
    sensitivity: 'alta',
    description: '',
    assets: 'Não especificados',
    modelo: '1'
  });

  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);

  useEffect(() => {
    loadAvailableModels();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/models');
      const models = await response.json();
      setAvailableModels(models.chat || []);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      // Fallback
      setAvailableModels([
        { id: 'ollama', name: '🦙 Ollama (Local)', value: '1', enabled: true },
        { id: 'openrouter', name: '🧠 DeepSeek (OpenRouter)', value: '2', enabled: false, recommended: true }
      ]);
    }
  };

  const handleInputChange = (field: keyof ThreatModelingRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.systemName && formData.description) {
      onSubmit(formData);
    } else {
      alert('Por favor, preencha pelo menos o nome e descrição do sistema.');
    }
  };

  return (
    <div className="input-section">
      <form onSubmit={handleSubmit}>
        <div className="input-grid">
          <div className="input-group">
            <label htmlFor="systemName">Nome do Sistema</label>
            <input
              type="text"
              id="systemName"
              value={formData.systemName}
              onChange={(e) => handleInputChange('systemName', e.target.value)}
              placeholder="Ex: Sistema de E-commerce"
            />
          </div>
          <div className="input-group">
            <label htmlFor="systemType">Tipo de Sistema</label>
            <select
              id="systemType"
              value={formData.systemType}
              onChange={(e) => handleInputChange('systemType', e.target.value as SystemType)}
            >
              <option value="web">Aplicação Web</option>
              <option value="api">API/Serviço</option>
              <option value="mobile">Aplicativo Mobile</option>
              <option value="desktop">Aplicação Desktop</option>
              <option value="iot">Dispositivo IoT</option>
              <option value="cloud">Sistema Cloud</option>
            </select>
          </div>
        </div>

        <div className="input-grid">
          <div className="input-group">
            <label htmlFor="sensitivity">Nível de Sensibilidade</label>
            <select
              id="sensitivity"
              value={formData.sensitivity}
              onChange={(e) => handleInputChange('sensitivity', e.target.value as SensitivityLevel)}
            >
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="aiModel">Modelo de IA</label>
            <select
              id="aiModel"
              value={formData.modelo}
              onChange={(e) => handleInputChange('modelo', e.target.value)}
            >
              {availableModels.length === 0 ? (
                <option value="">🔄 Carregando modelos...</option>
              ) : (
                availableModels.map(model => (
                  <option
                    key={model.id}
                    value={model.value}
                    disabled={!model.enabled}
                    selected={model.recommended}
                  >
                    {model.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="systemDescription">Descrição do Sistema</label>
          <textarea
            id="systemDescription"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descreva o sistema, suas funcionalidades, tecnologias utilizadas, arquitetura, etc."
          />
        </div>
        
        <div className="input-group">
          <label htmlFor="assets">Ativos Principais</label>
          <textarea
            id="assets"
            value={formData.assets}
            onChange={(e) => handleInputChange('assets', e.target.value)}
            placeholder="Liste os ativos principais do sistema (dados, funcionalidades, recursos, etc.)"
          />
        </div>

        <button 
          type="submit" 
          className="generate-btn" 
          disabled={isLoading}
        >
          {isLoading ? '🔍 Analisando...' : '🔍 Gerar Análise de Ameaças'}
        </button>
      </form>
    </div>
  );
};
