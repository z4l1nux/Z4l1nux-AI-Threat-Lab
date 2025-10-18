/**
 * Exporta todas as ferramentas (Tools) do ReAct Agent
 * 
 * Estas ferramentas são usadas pelo agente para:
 * - Buscar informações (CAPECs, OWASP)
 * - Validar dados (unicidade)
 * - Analisar componentes e fluxos
 * - Detectar contexto (componentes IA)
 */

export { SearchCapecTool, createSearchCapecTool } from './SearchCapecTool';
export { SearchOwaspTool, createSearchOwaspTool } from './SearchOwaspTool';
export { ValidateUniqueTool, createValidateUniqueTool } from './ValidateUniqueTool';
export { AnalyzeDataFlowTool, createAnalyzeDataFlowTool } from './AnalyzeDataFlowTool';
export { DetectAIComponentTool, createDetectAIComponentTool } from './DetectAIComponentTool';

import { ThreatModelingState } from '../types/AgentTypes';
import { createSearchCapecTool } from './SearchCapecTool';
import { createSearchOwaspTool } from './SearchOwaspTool';
import { createValidateUniqueTool } from './ValidateUniqueTool';
import { createAnalyzeDataFlowTool } from './AnalyzeDataFlowTool';
import { createDetectAIComponentTool } from './DetectAIComponentTool';

/**
 * Cria todas as ferramentas com o estado compartilhado
 * 
 * @param state Estado do agente
 * @returns Array de todas as ferramentas configuradas
 */
export function createAllTools(state: ThreatModelingState) {
  return [
    createSearchCapecTool(state),
    createSearchOwaspTool(state),
    createValidateUniqueTool(state),
    createAnalyzeDataFlowTool(state),
    createDetectAIComponentTool(state)
  ];
}

/**
 * Nomes de todas as ferramentas disponíveis
 */
export const TOOL_NAMES = {
  SEARCH_CAPEC: 'search_capec',
  SEARCH_OWASP: 'search_owasp',
  VALIDATE_UNIQUE: 'validate_capec_unique',
  ANALYZE_FLOW: 'analyze_data_flow',
  DETECT_AI: 'detect_ai_component'
} as const;

/**
 * Documentação resumida de todas as ferramentas
 */
export const TOOLS_DOCUMENTATION = `
Ferramentas Disponíveis:

1. search_capec
   - Busca CAPECs no Neo4j por categoria STRIDE e keywords
   - Use para encontrar CAPECs apropriados para uma ameaça

2. search_owasp
   - Busca categorias OWASP Top 10 ou OWASP LLM Top 10
   - Use para identificar a categoria OWASP de uma ameaça

3. validate_capec_unique
   - Valida se um CAPEC já foi usado
   - CRÍTICO: Use SEMPRE antes de adicionar uma ameaça

4. analyze_data_flow
   - Analisa fluxos de dados entre componentes
   - Use para identificar ameaças em comunicações cross-boundary

5. detect_ai_component
   - Detecta se um componente é relacionado a IA/ML
   - Use para decidir entre OWASP LLM vs OWASP Web
`;

