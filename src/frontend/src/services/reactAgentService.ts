/**
 * Serviço de integração com ReAct Agent
 * 
 * Este serviço fornece uma interface para usar o ReAct Agent
 * no backend, com fallback automático para o sistema tradicional.
 */

import { SystemInfo, IdentifiedThreat } from '../types';

const BACKEND_URL = 'http://localhost:3001';

/**
 * Configuração do ReAct Agent
 */
export interface ReActAgentConfig {
  /** Se deve usar o ReAct Agent (true) ou sistema tradicional (false) */
  enabled: boolean;
  
  /** Timeout em milissegundos (padrão: 90000 = 90s) */
  timeout?: number;
  
  /** Se deve fazer fallback automático em caso de erro */
  autoFallback?: boolean;
  
  /** Se deve exibir logs detalhados */
  verbose?: boolean;
}

/**
 * Resultado da análise do ReAct Agent
 */
export interface ReActAgentResult {
  /** Se usou ReAct Agent ou fez fallback */
  usedReActAgent: boolean;
  
  /** Ameaças identificadas */
  threats: IdentifiedThreat[];
  
  /** Métricas de performance (se ReAct foi usado) */
  metrics?: {
    totalTime: number;
    iterations: number;
    toolCalls: number;
    threatsGenerated: number;
    uniqueCapecs: number;
    uniquenessRate: number;
    strideCoverage: number;
  };
  
  /** Histórico de ações do agente (para debugging) */
  actionHistory?: Array<{
    iteration: number;
    thought: string;
    action: string;
    result: any;
  }>;
  
  /** Mensagem de status */
  message: string;
  
  /** Erros encontrados */
  errors?: string[];
}

/**
 * Configuração padrão
 */
const DEFAULT_CONFIG: ReActAgentConfig = {
  enabled: true, // Habilitado com OptimizedReActAgent
  timeout: 35000, // 35s para o agente otimizado
  autoFallback: true,
  verbose: false
};

/**
 * Analisa ameaças usando ReAct Agent com fallback automático
 * 
 * @param systemInfo Informações do sistema a analisar
 * @param modelConfig Configuração do modelo de IA
 * @param ragContext Contexto RAG (opcional)
 * @param config Configuração do ReAct Agent
 * @returns Resultado da análise
 */
export async function analyzeWithReActAgent(
  systemInfo: SystemInfo,
  modelConfig: any,
  ragContext?: string,
  config: ReActAgentConfig = DEFAULT_CONFIG
): Promise<ReActAgentResult> {
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Se ReAct Agent está desabilitado, usar sistema tradicional
  if (!finalConfig.enabled) {
    console.log('🔄 ReAct Agent desabilitado, usando sistema tradicional');
    const traditionalThreats = await analyzeWithTraditionalSystem(systemInfo, modelConfig, ragContext);
    return {
      usedReActAgent: false,
      threats: traditionalThreats,
      message: 'Análise completa (sistema tradicional)'
    };
  }
  
  try {
    console.log('🤖 Iniciando análise com ReAct Agent...');
    const startTime = Date.now();
    
    // Chamar endpoint do ReAct Agent
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout atingido, abortando requisição...');
      controller.abort();
    }, finalConfig.timeout);
    
    console.log(`   📡 Enviando requisição para ${BACKEND_URL}/api/analyze-threats-react`);
    console.log(`   ⏱️ Timeout: ${finalConfig.timeout}ms`);
    
    const response = await fetch(`${BACKEND_URL}/api/analyze-threats-react`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInfo,
        modelConfig,
        ragContext
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    const endTime = Date.now();
    
    if (!result.success) {
      throw new Error(result.message || 'Análise falhou');
    }
    
    console.log(`✅ ReAct Agent completou em ${endTime - startTime}ms`);
    console.log(`   Ameaças: ${result.threats.length}`);
    console.log(`   Iterações: ${result.metrics.iterations}`);
    console.log(`   Unicidade: ${result.metrics.uniquenessRate.toFixed(1)}%`);
    
    return {
      usedReActAgent: true,
      threats: result.threats,
      metrics: result.metrics,
      actionHistory: result.actionHistory,
      message: result.message,
      errors: result.errors
    };
    
  } catch (error) {
    console.error('❌ Erro no ReAct Agent:', error);
    
    // Identificar tipo de erro
    let errorType = 'unknown';
    let errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorType = 'timeout';
        errorMessage = `Timeout de ${finalConfig.timeout}ms atingido`;
      } else if (error.message.includes('Failed to fetch')) {
        errorType = 'connection';
        errorMessage = 'Falha na conexão com o backend';
      } else if (error.message.includes('HTTP')) {
        errorType = 'http';
        errorMessage = `Erro HTTP: ${error.message}`;
      }
    }
    
    console.log(`   🔍 Tipo de erro: ${errorType}`);
    console.log(`   📝 Mensagem: ${errorMessage}`);
    
    // Fallback automático se configurado
    if (finalConfig.autoFallback) {
      console.log('🔄 Fallback para sistema tradicional...');
      
      try {
        const traditionalThreats = await analyzeWithTraditionalSystem(systemInfo, modelConfig, ragContext);
        return {
          usedReActAgent: false,
          threats: traditionalThreats,
          message: `Análise completa (fallback para sistema tradicional - ${errorType})`,
          errors: [`ReAct Agent falhou (${errorType}): ${errorMessage}`]
        };
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
        throw new Error(`ReAct Agent e fallback falharam: ${fallbackError instanceof Error ? fallbackError.message : 'Erro desconhecido'}`);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Usa o sistema tradicional (importa do aiService existente)
 * 
 * NOTA: Esta função assume que você tem o serviço tradicional exportado.
 * Ajuste o import conforme necessário.
 */
async function analyzeWithTraditionalSystem(
  systemInfo: SystemInfo,
  modelConfig: any,
  ragContext?: string
): Promise<IdentifiedThreat[]> {
  // Importar dinamicamente para evitar circular dependency
  const { analyzeThreatsAndMitigations } = await import('./aiService');
  
  // Buscar mapeamento STRIDE-CAPEC com modelConfig
  const modelConfigParam = encodeURIComponent(JSON.stringify(modelConfig));
  const mappingResponse = await fetch(`${BACKEND_URL}/api/stride-capec-mapping?modelConfig=${modelConfigParam}`);
  const mappingData = await mappingResponse.json();
  
  if (!mappingData.initialized || !mappingData.mapping || mappingData.mapping.length === 0) {
    throw new Error('Mapeamento STRIDE-CAPEC não disponível');
  }
  
  // Executar análise tradicional
  return await analyzeThreatsAndMitigations(systemInfo, mappingData.mapping, modelConfig);
}

/**
 * Verifica se o ReAct Agent está disponível no backend
 */
export async function checkReActAgentAvailability(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`, {
      method: 'GET'
    });
    
    if (!response.ok) {
      return false;
    }
    
    const health = await response.json();
    return health.status === 'ok' && health.services.rag === 'initialized';
  } catch (error) {
    console.error('❌ Erro ao verificar disponibilidade do ReAct Agent:', error);
    return false;
  }
}

/**
 * Configuração persistente (localStorage)
 */
const STORAGE_KEY = 'reactAgentConfig';

export function saveReActAgentConfig(config: ReActAgentConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.warn('⚠️ Erro ao salvar configuração do ReAct Agent:', error);
  }
}

export function loadReActAgentConfig(): ReActAgentConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar configuração do ReAct Agent:', error);
  }
  return DEFAULT_CONFIG;
}

