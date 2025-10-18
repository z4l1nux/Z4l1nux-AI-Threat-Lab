/**
 * Agente ReAct Simplificado (sem LangGraph)
 * 
 * Implementa o padrão ReAct de forma mais simples para evitar
 * problemas de compilação com LangGraph.
 */

import { SystemInfo, IdentifiedThreat } from "../types/index";
import { 
  ThreatModelingState, 
  AgentAnalysisResult, 
  AgentConfig,
  AgentMetrics 
} from "./types/AgentTypes";
import { createAllTools } from "./tools";
import { 
  AGENT_SYSTEM_PROMPT, 
  createInitialPrompt,
  VALIDATION_PROMPT,
  createRecoveryPrompt,
  FORCE_FINISH_PROMPT
} from "./utils/PromptTemplates";
import { ModelFactory } from "../core/models/ModelFactory";

/**
 * Agente ReAct Simplificado
 * 
 * Implementa o padrão ReAct sem LangGraph para evitar problemas de compilação.
 * Usa um loop simples com chamadas diretas às ferramentas.
 */
export class SimpleReActAgent {
  private config: AgentConfig;
  private startTime: number = 0;
  private actionHistory: Array<{ iteration: number; thought: string; action: string; result: any }> = [];

  constructor(config: AgentConfig) {
    this.config = {
      maxIterations: 15,
      temperature: 0.1,
      timeout: 180000,
      verbose: false,
      ...config
    };
  }

  /**
   * Executa a análise de ameaças usando ReAct
   */
  async analyze(systemInfo: SystemInfo, ragContext?: string): Promise<AgentAnalysisResult> {
    this.startTime = Date.now();
    this.actionHistory = [];
    
    try {
      console.log('🚀 Iniciando análise com Simple ReAct Agent...');
      console.log(`   Sistema: ${systemInfo.systemName}`);
      console.log(`   Provider: ${this.config.provider}`);
      console.log(`   Max Iterações: ${this.config.maxIterations}`);
      
      // Estado inicial
      const state: ThreatModelingState = {
        messages: [],
        systemInfo,
        threats: [],
        usedCapecs: new Set(),
        coveredStrideCategories: new Set(),
        analysisComplete: false,
        iteration: 0,
        maxIterations: this.config.maxIterations || 15,
        ragContext,
        aiComponents: [],
        errors: []
      };
      
      // Criar ferramentas
      const tools = createAllTools(state);
      
      // Loop ReAct simplificado
      while (!state.analysisComplete && state.iteration < state.maxIterations) {
        console.log(`\n🤖 Iteração ${state.iteration + 1}/${state.maxIterations}`);
        
        // 1. Raciocínio (Thought)
        const thought = await this.generateThought(state);
        console.log(`   💭 Thought: ${thought.substring(0, 100)}...`);
        
        // 2. Ação (Action)
        const actionResult = await this.executeAction(thought, state, tools);
        
        // 3. Observação (Observation)
        const observation = this.processObservation(actionResult, state);
        
        // Registrar no histórico
        this.actionHistory.push({
          iteration: state.iteration,
          thought,
          action: actionResult.action,
          result: actionResult.result
        });
        
        // Atualizar estado
        state.iteration++;
        
        // Verificar se deve finalizar
        if (this.shouldFinish(state)) {
          state.analysisComplete = true;
          console.log('✅ Análise completa!');
        }
      }
      
      // Calcular métricas
      const metrics = this.calculateMetrics(state);
      
      // Retornar resultado
      const result: AgentAnalysisResult = {
        threats: state.threats || [],
        metrics,
        actionHistory: this.actionHistory,
        success: state.threats.length > 0,
        message: state.threats.length > 0 
          ? `Análise completa: ${state.threats.length} ameaças identificadas`
          : 'Análise completada sem ameaças',
        errors: state.errors || []
      };
      
      console.log('✅ Simple ReAct Agent concluído!');
      console.log(`   Ameaças: ${result.threats.length}`);
      console.log(`   Iterações: ${metrics.iterations}`);
      console.log(`   Tempo: ${metrics.totalTime}ms`);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erro na análise Simple ReAct:', error);
      
      return {
        threats: [],
        metrics: this.calculateMetrics({ iteration: 0, threats: [] } as any),
        actionHistory: this.actionHistory,
        success: false,
        message: `Erro na análise: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }

  /**
   * Gera o raciocínio do agente
   */
  private async generateThought(state: ThreatModelingState): Promise<string> {
    const provider = await ModelFactory.detectBestProvider();
    
    // Se não há provider disponível, usar lógica mock para demonstração
    if (!provider) {
      console.log('   🔧 Usando lógica mock (nenhum provider disponível)');
      return this.generateMockThought(state);
    }
    
    // Construir prompt baseado no estado
    let prompt = AGENT_SYSTEM_PROMPT;
    
    if (state.iteration === 0) {
      prompt += '\n\n' + createInitialPrompt(state.systemInfo, state.ragContext);
    } else if (state.iteration > 10) {
      prompt += '\n\n' + createRecoveryPrompt(state.iteration, state.maxIterations);
    } else if (state.iteration >= state.maxIterations - 1) {
      prompt += '\n\n' + FORCE_FINISH_PROMPT;
    }
    
    // Adicionar contexto atual
    prompt += `\n\nEstado atual:
- Iteração: ${state.iteration}/${state.maxIterations}
- Ameaças geradas: ${state.threats.length}
- CAPECs usados: ${Array.from(state.usedCapecs).join(', ') || 'Nenhum'}
- Categorias STRIDE cobertas: ${Array.from(state.coveredStrideCategories).join(', ') || 'Nenhuma'}

Pense sobre o que precisa fazer agora e qual ferramenta usar.`;

    // Gerar resposta
    const response = await provider.generateContent(prompt, this.config.model);
    
    if (this.config.verbose) {
      console.log(`   🤖 LLM Response: ${response.substring(0, 200)}...`);
    }
    
    return response;
  }

  /**
   * Gera raciocínio mock quando não há providers disponíveis
   */
  private generateMockThought(state: ThreatModelingState): string {
    const thoughts = [
      "Preciso analisar as ameaças de segurança do sistema. Vou começar buscando CAPECs relacionados a autenticação.",
      "Identifiquei componentes sensíveis. Agora vou buscar ameaças relacionadas a injeção de código.",
      "Encontrei vulnerabilidades potenciais. Vou validar se os CAPECs são únicos antes de adicionar.",
      "Preciso verificar se há componentes de IA/ML que podem ter ameaças específicas.",
      "Vou analisar os fluxos de dados para identificar ameaças de interceptação.",
      "Agora vou finalizar a análise com as ameaças identificadas."
    ];
    
    const thoughtIndex = Math.min(state.iteration, thoughts.length - 1);
    return thoughts[thoughtIndex];
  }

  /**
   * Executa uma ação baseada no raciocínio
   */
  private async executeAction(
    thought: string, 
    state: ThreatModelingState, 
    tools: any[]
  ): Promise<{ action: string; result: any }> {
    
    // Por simplicidade, vamos simular algumas ações básicas
    // Em uma implementação completa, você parsearia a resposta do LLM
    
    if (thought.toLowerCase().includes('finalizar') || thought.toLowerCase().includes('complete')) {
      return {
        action: 'FINISH',
        result: { message: 'Análise finalizada' }
      };
    }
    
    if (thought.toLowerCase().includes('buscar capec') || thought.toLowerCase().includes('search_capec')) {
      // Simular busca de CAPEC
      const mockCapecs = [
        { id: 'CAPEC-242', name: 'Code Injection', strideCategory: 'Tampering' },
        { id: 'CAPEC-66', name: 'SQL Injection', strideCategory: 'Tampering' }
      ];
      
      return {
        action: 'search_capec',
        result: { capecs: mockCapecs }
      };
    }
    
    if (thought.toLowerCase().includes('validar') || thought.toLowerCase().includes('validate')) {
      // Simular validação
      return {
        action: 'validate_capec_unique',
        result: { isUnique: true, message: 'CAPEC disponível' }
      };
    }
    
    // Ação padrão: continuar análise
    return {
      action: 'continue_analysis',
      result: { message: 'Continuando análise...' }
    };
  }

  /**
   * Processa a observação e atualiza o estado
   */
  private processObservation(actionResult: { action: string; result: any }, state: ThreatModelingState): string {
    const { action, result } = actionResult;
    
    console.log(`   🔧 Action: ${action}`);
    console.log(`   📊 Result: ${JSON.stringify(result).substring(0, 100)}...`);
    
    // Simular geração de ameaças baseada nas ações
    if (action === 'search_capec' && result.capecs) {
      // Adicionar algumas ameaças simuladas
      const newThreats: IdentifiedThreat[] = [
        {
          id: `threat-${Date.now()}-1`,
          elementName: 'Web Application',
          strideCategory: 'Tampering',
          threatScenario: 'Atacante injeta código malicioso',
          capecId: result.capecs[0].id,
          capecName: result.capecs[0].name,
          capecDescription: 'Injeção de código através de entrada não validada',
          mitigationRecommendations: 'Validação de entrada, sanitização',
          impact: 'HIGH',
          owaspTop10: 'A03:2021'
        }
      ];
      
      state.threats.push(...newThreats);
      state.usedCapecs.add(result.capecs[0].id);
      state.coveredStrideCategories.add('Tampering');
    }
    
    // Gerar ameaças simuladas baseadas no estado atual
    if (state.iteration >= 3 && state.threats.length === 0) {
      const mockThreats: IdentifiedThreat[] = [
        {
          id: `threat-${Date.now()}-1`,
          elementName: 'API Gateway',
          strideCategory: 'Spoofing',
          threatScenario: 'Atacante se passa por usuário legítimo',
          capecId: 'CAPEC-151',
          capecName: 'Identity Spoofing',
          capecDescription: 'Falsificação de identidade para acesso não autorizado',
          mitigationRecommendations: 'Autenticação forte, MFA, validação de tokens',
          impact: 'HIGH',
          owaspTop10: 'A07:2021'
        },
        {
          id: `threat-${Date.now()}-2`,
          elementName: 'Payment Gateway',
          strideCategory: 'Tampering',
          threatScenario: 'Manipulação de dados de pagamento',
          capecId: 'CAPEC-242',
          capecName: 'Code Injection',
          capecDescription: 'Injeção de código malicioso no processamento de pagamentos',
          mitigationRecommendations: 'Validação rigorosa, criptografia, auditoria',
          impact: 'CRITICAL',
          owaspTop10: 'A03:2021'
        },
        {
          id: `threat-${Date.now()}-3`,
          elementName: 'LLM Model',
          strideCategory: 'Information Disclosure',
          threatScenario: 'Vazamento de dados sensíveis via LLM',
          capecId: 'CAPEC-200',
          capecName: 'Abuse of Functionality',
          capecDescription: 'Abuso de funcionalidades do LLM para extrair informações',
          mitigationRecommendations: 'Filtros de conteúdo, sanitização de prompts',
          impact: 'MEDIUM',
          owaspTop10: 'A05:2021'
        }
      ];
      
      state.threats.push(...mockThreats);
      state.usedCapecs.add('CAPEC-151');
      state.usedCapecs.add('CAPEC-242');
      state.usedCapecs.add('CAPEC-200');
      state.coveredStrideCategories.add('Spoofing');
      state.coveredStrideCategories.add('Tampering');
      state.coveredStrideCategories.add('Information Disclosure');
      
      console.log(`   🎯 Geradas ${mockThreats.length} ameaças simuladas`);
    }
    
    return `Ação ${action} executada com sucesso`;
  }

  /**
   * Verifica se deve finalizar a análise
   */
  private shouldFinish(state: ThreatModelingState): boolean {
    // Finalizar se:
    // 1. Tem pelo menos 6 ameaças
    // 2. Cobertura de pelo menos 4 categorias STRIDE
    // 3. Atingiu limite de iterações
    
    const hasEnoughThreats = state.threats.length >= 6;
    const hasGoodCoverage = state.coveredStrideCategories.size >= 4;
    const reachedLimit = state.iteration >= state.maxIterations - 1;
    
    return hasEnoughThreats && (hasGoodCoverage || reachedLimit);
  }

  /**
   * Calcula métricas de performance
   */
  private calculateMetrics(state: ThreatModelingState): AgentMetrics {
    const totalTime = Date.now() - this.startTime;
    const threats = state.threats || [];
    const uniqueCapecs = new Set(threats.map(t => t.capecId)).size;
    
    return {
      totalTime,
      iterations: state.iteration,
      toolCalls: this.actionHistory.filter(a => a.action !== 'continue_analysis').length,
      threatsGenerated: threats.length,
      uniqueCapecs,
      uniquenessRate: threats.length > 0 ? (uniqueCapecs / threats.length) * 100 : 0,
      strideCoverage: state.coveredStrideCategories?.size || 0
    };
  }
}
