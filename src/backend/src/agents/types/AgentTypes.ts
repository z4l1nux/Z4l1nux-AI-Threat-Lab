import { BaseMessage } from "@langchain/core/messages";
import { SystemInfo, IdentifiedThreat } from "../../types/index";

/**
 * Estado do Agente ReAct de Threat Modeling
 * 
 * Este estado é passado entre os nós do grafo LangGraph.
 * Cada nó pode ler e atualizar o estado conforme necessário.
 */
export interface ThreatModelingState {
  /** Histórico de mensagens da conversa com o LLM */
  messages: BaseMessage[];
  
  /** Informações do sistema sendo analisado */
  systemInfo: SystemInfo;
  
  /** Lista de ameaças identificadas até agora */
  threats: IdentifiedThreat[];
  
  /** CAPECs já utilizados (para garantir unicidade) */
  usedCapecs: Set<string>;
  
  /** Categorias STRIDE já cobertas */
  coveredStrideCategories: Set<string>;
  
  /** Componente atual sendo analisado */
  currentComponent?: string;
  
  /** Fluxo de dados atual sendo analisado */
  currentDataFlow?: {
    from: string;
    to: string;
    encrypted: boolean;
    trustBoundary: string;
  };
  
  /** Indica se a análise está completa */
  analysisComplete: boolean;
  
  /** Número de iterações do loop ReAct */
  iteration: number;
  
  /** Limite máximo de iterações */
  maxIterations: number;
  
  /** Contexto RAG recuperado */
  ragContext?: string;
  
  /** Componentes de IA detectados */
  aiComponents?: string[];
  
  /** Erros encontrados durante a análise */
  errors: string[];
}

/**
 * Resultado de uma ferramenta (Tool)
 */
export interface ToolResult {
  /** Nome da ferramenta executada */
  toolName: string;
  
  /** Resultado da execução */
  result: any;
  
  /** Se a execução foi bem-sucedida */
  success: boolean;
  
  /** Mensagem de erro (se houver) */
  error?: string;
  
  /** Timestamp da execução */
  timestamp: Date;
}

/**
 * Configuração de uma ferramenta
 */
export interface ToolConfig {
  /** Nome único da ferramenta */
  name: string;
  
  /** Descrição para o LLM entender quando usar */
  description: string;
  
  /** Schema de entrada (Zod schema) */
  schema: any;
  
  /** Função de execução */
  func: (input: any, state: ThreatModelingState) => Promise<any>;
}

/**
 * Métricas de performance do agente
 */
export interface AgentMetrics {
  /** Tempo total de execução (ms) */
  totalTime: number;
  
  /** Número de iterações do loop */
  iterations: number;
  
  /** Número de ferramentas chamadas */
  toolCalls: number;
  
  /** Número de ameaças geradas */
  threatsGenerated: number;
  
  /** Número de CAPECs únicos */
  uniqueCapecs: number;
  
  /** Taxa de unicidade (%) */
  uniquenessRate: number;
  
  /** Categorias STRIDE cobertas */
  strideCoverage: number;
  
  /** Uso de tokens (se disponível) */
  tokensUsed?: number;
}

/**
 * Configuração do Agente
 */
export interface AgentConfig {
  /** Provider de IA a usar */
  provider: string;
  
  /** Modelo específico */
  model: string;
  
  /** Modelo de embedding */
  embeddingModel?: string;
  
  /** Provider de embedding */
  embeddingProvider?: string;
  
  /** Timeout em milissegundos */
  timeout?: number;
  
  /** Número máximo de iterações do loop */
  maxIterations?: number;
  
  /** Temperatura do modelo */
  temperature?: number;
  
  /** Verbose mode (logging detalhado) */
  verbose?: boolean;
}

/**
 * Resultado final da análise do agente
 */
export interface AgentAnalysisResult {
  /** Ameaças identificadas */
  threats: IdentifiedThreat[];
  
  /** Métricas de performance */
  metrics: AgentMetrics;
  
  /** Histórico de ações (para debugging) */
  actionHistory: Array<{
    iteration: number;
    thought: string;
    action: string;
    result: any;
  }>;
  
  /** Se a análise foi bem-sucedida */
  success: boolean;
  
  /** Mensagem de status */
  message: string;
  
  /** Erros encontrados */
  errors: string[];
}

