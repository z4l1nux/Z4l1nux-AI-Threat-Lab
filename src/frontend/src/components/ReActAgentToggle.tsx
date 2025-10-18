/**
 * Componente: Toggle do ReAct Agent
 * 
 * Permite ao usuário alternar entre ReAct Agent e sistema tradicional,
 * com exibição de status e métricas.
 */

import { useState, useEffect } from 'react';
import { 
  loadReActAgentConfig, 
  saveReActAgentConfig,
  checkReActAgentAvailability,
  ReActAgentConfig
} from '../services/reactAgentService';

interface ReActAgentToggleProps {
  /** Callback quando configuração mudar */
  onConfigChange?: (config: ReActAgentConfig) => void;
  
  /** Se deve exibir configurações avançadas */
  showAdvanced?: boolean;
}

export default function ReActAgentToggle({ 
  onConfigChange,
  showAdvanced = false 
}: ReActAgentToggleProps) {
  const [config, setConfig] = useState<ReActAgentConfig>(loadReActAgentConfig());
  const [available, setAvailable] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Verificar disponibilidade ao montar
  useEffect(() => {
    checkReActAgentAvailability().then(setAvailable);
  }, []);
  
  // Salvar e notificar quando configuração mudar
  const updateConfig = (updates: Partial<ReActAgentConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    saveReActAgentConfig(newConfig);
    onConfigChange?.(newConfig);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      {/* Header com Toggle Principal */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                ReAct Agent
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {available === null ? 'Verificando...' : 
                 available ? 'Disponível' : 'Indisponível'}
              </p>
            </div>
          </div>
          
          {/* Status Badge */}
          {available !== null && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              available 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            }`}>
              {available ? '✓ Online' : '✗ Offline'}
            </span>
          )}
        </div>
        
        {/* Toggle Switch */}
        <button
          type="button"
          disabled={!available}
          onClick={() => updateConfig({ enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            config.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
          }`}
          role="switch"
          aria-checked={config.enabled}
          aria-label="Toggle ReAct Agent"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
      
      {/* Descrição */}
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
        {config.enabled ? (
          <>
            <span className="font-medium text-blue-600 dark:text-blue-400">Ativo:</span> Usando análise 
            avançada com raciocínio autônomo e validação em tempo real.
          </>
        ) : (
          <>
            <span className="font-medium text-gray-600 dark:text-gray-400">Inativo:</span> Usando sistema 
            tradicional com prompt estático.
          </>
        )}
      </p>
      
      {/* Benefícios (quando ativo) */}
      {config.enabled && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-1">
            ✨ Benefícios Ativos:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5 ml-4">
            <li>• <strong>100%</strong> unicidade de CAPECs</li>
            <li>• Validações em tempo real</li>
            <li>• Análise adaptativa e inteligente</li>
            <li>• Métricas detalhadas</li>
          </ul>
        </div>
      )}
      
      {/* Configurações Avançadas (se habilitado) */}
      {showAdvanced && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span>{showSettings ? '▼' : '▶'}</span>
            Configurações Avançadas
          </button>
          
          {showSettings && (
            <div className="mt-3 space-y-3">
              {/* Auto Fallback */}
              <label className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Fallback Automático
                </span>
                <input
                  type="checkbox"
                  checked={config.autoFallback}
                  onChange={(e) => updateConfig({ autoFallback: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              
              {/* Verbose */}
              <label className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  Logs Detalhados
                </span>
                <input
                  type="checkbox"
                  checked={config.verbose}
                  onChange={(e) => updateConfig({ verbose: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
              
              {/* Timeout */}
              <div>
                <label className="block text-xs text-gray-700 dark:text-gray-300 mb-1">
                  Timeout (segundos)
                </label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={(config.timeout || 90000) / 1000}
                  onChange={(e) => updateConfig({ timeout: parseInt(e.target.value) * 1000 })}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Link para Documentação */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <a
          href="/REACT_AGENT_IMPLEMENTATION.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          📚 Documentação do ReAct Agent
          <span>→</span>
        </a>
      </div>
    </div>
  );
}

