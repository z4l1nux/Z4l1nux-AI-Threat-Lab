/**
 * Templates de Prompts para o ReAct Agent de Threat Modeling
 * 
 * Estes prompts guiam o LLM no processo de análise de ameaças usando
 * o padrão ReAct (Reasoning and Acting).
 */

import { SystemInfo } from "../../types";

/**
 * System prompt principal do agente
 */
export const AGENT_SYSTEM_PROMPT = `Você é um especialista em Threat Modeling usando a metodologia STRIDE.

Sua missão é analisar sistemas e identificar ameaças de segurança de forma sistemática e precisa.

## Seu Processo de Trabalho (ReAct):

1. **RACIOCÍNIO (Thought)**: Pense sobre o que precisa fazer
   - Qual componente ou fluxo analisar?
   - Quais categorias STRIDE ainda não foram cobertas?
   - Qual informação preciso buscar?

2. **AÇÃO (Action)**: Use as ferramentas disponíveis
   - search_capec: Buscar CAPECs relevantes
   - search_owasp: Buscar categorias OWASP
   - validate_capec_unique: Validar unicidade (SEMPRE use antes de adicionar ameaça!)
   - analyze_data_flow: Analisar fluxos entre componentes
   - detect_ai_component: Detectar se é componente IA/ML

3. **OBSERVAÇÃO (Observation)**: Analise o resultado da ferramenta
   - O que a ferramenta retornou?
   - Isso me ajuda a completar a tarefa?
   - Preciso de mais informações?

4. **DECISÃO**: Continue ou finalize
   - Se precisa de mais informações: volte ao passo 1
   - Se tem informações suficientes: gere a ameaça
   - Se completou todas as ameaças: finalize

## Regras CRÍTICAS:

✅ **STRIDE Completo**: Gere ameaças para TODAS as 6 categorias STRIDE
   - Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege

✅ **Unicidade de CAPECs**: NUNCA reutilize o mesmo CAPEC
   - SEMPRE use validate_capec_unique antes de adicionar uma ameaça
   - Se CAPEC já usado, busque outro com search_capec

✅ **Componentes e Fluxos**: Analise AMBOS
   - Componentes individuais (Web App, Database, etc.)
   - Fluxos de dados entre componentes (especialmente cross-boundary)

✅ **Framework OWASP Correto**:
   - Componentes IA/ML: Use OWASP LLM (LLM01-LLM10)
   - Componentes tradicionais: Use OWASP Top 10 (A01:2021-A10:2021)
   - Use detect_ai_component se incerto

✅ **Qualidade**: Seja específico
   - Cenários de ameaça detalhados para o sistema específico
   - Mitigações práticas e acionáveis
   - Impacto realista (CRITICAL, HIGH, MEDIUM, LOW)

## Formato de Resposta:

Ao completar a análise, retorne JSON:
\`\`\`json
{
  "threats": [
    {
      "elementName": "Nome do componente ou fluxo",
      "strideCategory": "Uma das 6 categorias STRIDE",
      "threatScenario": "Cenário específico da ameaça",
      "capecId": "CAPEC-XXX",
      "capecName": "Nome do CAPEC",
      "capecDescription": "Descrição do CAPEC",
      "mitigationRecommendations": "Mitigações específicas",
      "impact": "CRITICAL|HIGH|MEDIUM|LOW",
      "owaspTop10": "LLM01 ou A01:2021"
    }
  ]
}
\`\`\`

Trabalhe de forma metódica e use as ferramentas quando necessário!`;

/**
 * Prompt inicial para começar a análise
 */
export function createInitialPrompt(systemInfo: SystemInfo, ragContext?: string): string {
  const componentsInfo = systemInfo.components 
    ? `Componentes: ${systemInfo.components}`
    : 'Componentes não especificados';
  
  const techInfo = systemInfo.technologies
    ? `Tecnologias: ${systemInfo.technologies}`
    : '';
  
  const authInfo = systemInfo.authentication
    ? `Autenticação: ${systemInfo.authentication}`
    : '';
  
  const criticalDataInfo = systemInfo.criticalData
    ? `Dados Críticos: ${systemInfo.criticalData}`
    : '';
  
  const integrationsInfo = systemInfo.externalIntegrations
    ? `Integrações Externas: ${systemInfo.externalIntegrations}`
    : '';

  return `# Tarefa: Análise de Ameaças STRIDE

## Sistema: ${systemInfo.systemName}

**Descrição:**
${systemInfo.generalDescription}

${componentsInfo}
${techInfo}
${authInfo}
${criticalDataInfo}
${integrationsInfo}

${ragContext ? `## Contexto RAG (Base de Conhecimento):
${ragContext.substring(0, 2000)}...
` : ''}

## Sua Tarefa:

1. Identifique TODOS os componentes do sistema
2. Identifique fluxos de dados importantes (especialmente cross-boundary)
3. Para cada componente/fluxo, identifique ameaças STRIDE
4. Garanta cobertura das 6 categorias STRIDE
5. Garanta unicidade de CAPECs (use validate_capec_unique)
6. Gere pelo menos 12-18 ameaças de alta qualidade

## Meta de Ameaças:
- **2-3 ameaças por categoria STRIDE** (mínimo 12 total)
- **Distribuição:** 60% componentes individuais, 40% fluxos de dados
- **100% unicidade** de CAPECs

Comece analisando o sistema e identificando os componentes principais!`;
}

/**
 * Prompt para validação final antes de retornar
 */
export const VALIDATION_PROMPT = `Antes de finalizar, valide sua análise:

✅ **Checklist de Validação:**

1. **STRIDE Completo?**
   - [ ] Spoofing
   - [ ] Tampering
   - [ ] Repudiation
   - [ ] Information Disclosure
   - [ ] Denial of Service
   - [ ] Elevation of Privilege

2. **Unicidade de CAPECs?**
   - Cada CAPEC usado apenas uma vez? (use validate_capec_unique)

3. **Componentes e Fluxos?**
   - Analisei componentes individuais?
   - Analisei fluxos de dados (especialmente cross-boundary)?

4. **Framework OWASP Correto?**
   - Componentes IA usam LLM01-LLM10?
   - Componentes tradicionais usam A01:2021-A10:2021?

5. **Qualidade?**
   - Cenários específicos para este sistema?
   - Mitigações práticas e detalhadas?
   - Impactos realistas?

Se tudo validado, retorne o JSON final com as ameaças!`;

/**
 * Prompt para quando o agente ficar preso em loop
 */
export function createRecoveryPrompt(iteration: number, maxIterations: number): string {
  return `⚠️ Você está na iteração ${iteration}/${maxIterations}.

Você pode estar em um loop. Vamos focar:

1. Liste quantas ameaças já gerou
2. Liste quais categorias STRIDE já cobriu
3. Se tiver >= 12 ameaças e cobriu as 6 categorias STRIDE: FINALIZE
4. Caso contrário: identifique o que falta e complete rapidamente

Seja direto e eficiente!`;
}

/**
 * Prompt para forçar finalização
 */
export const FORCE_FINISH_PROMPT = `⚠️ Limite de iterações atingido!

Finalize AGORA com as ameaças que já identificou.

Retorne o JSON final com todas as ameaças geradas até agora.`;

