import { SystemInfo, IdentifiedThreat, StrideCapecMapType } from '../../types';
import { detectAIComponents, generateAIThreatQuery } from './aiThreatsKnowledgeBase';

// Configuração para análise de complexidade
const COMPLEXITY_THRESHOLDS = {
  SIMPLE_TASK_TOKENS: 5000,        // < 5k tokens = tarefa simples
  COMPLEX_TASK_TOKENS: 50000,      // > 50k tokens = tarefa complexa
  COMPLEX_COMPONENTS: 10,          // > 10 componentes = complexo
  COMPLEX_INTEGRATIONS: 3          // > 3 integrações = complexo
};

// Função para calcular complexidade da tarefa
const calculateTaskComplexity = (systemInfo: SystemInfo, additionalContext: string): 'SIMPLE' | 'MEDIUM' | 'COMPLEX' => {
  const totalLength = systemInfo.generalDescription.length + 
                     systemInfo.components.length + 
                     systemInfo.technologies.length + 
                     additionalContext.length;
  
  const componentCount = (systemInfo.components.match(/,/g) || []).length + 1;
  const hasExternalIntegrations = systemInfo.externalIntegrations && systemInfo.externalIntegrations.trim() !== '';
  const hasComplexAuth = systemInfo.authentication && systemInfo.authentication.length > 50;
  
  // Cálculo de pontuação de complexidade
  let complexityScore = 0;
  
  // Tamanho do conteúdo
  if (totalLength > COMPLEXITY_THRESHOLDS.COMPLEX_TASK_TOKENS) complexityScore += 3;
  else if (totalLength > COMPLEXITY_THRESHOLDS.SIMPLE_TASK_TOKENS) complexityScore += 1;
  
  // Número de componentes
  if (componentCount > 10) complexityScore += 2;
  else if (componentCount > 5) complexityScore += 1;
  
  // Integrações externas
  if (hasExternalIntegrations) complexityScore += 1;
  
  // Autenticação complexa
  if (hasComplexAuth) complexityScore += 1;
  
  // Classificação final
  if (complexityScore >= 5) return 'COMPLEX';
  if (complexityScore >= 2) return 'MEDIUM';
  return 'SIMPLE';
};

// Contexto simples para sinalizar tipo de tarefa atual
// Contexto global para rastrear gerações em andamento (removido - não utilizado)

// JSON Schema para structured output das ameaças STRIDE
// OpenRouter requer type: "object", então envolvemos o array em um objeto
const THREAT_ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    threats: {
      type: "array",
      items: {
        type: "object",
        properties: {
          elementName: {
            type: "string",
            description: "Nome do componente específico do sistema (ex: PDV Checkout, App do Cliente, Banco de Dados, API de Pagamento, Sistema de Autenticação, etc.)"
          },
          strideCategory: {
            type: "string",
            enum: ["Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege"],
            description: "Categoria STRIDE da ameaça"
          },
          threatScenario: {
            type: "string",
            description: "Cenário detalhado da ameaça"
          },
          capecId: {
            type: "string",
            description: "ID do CAPEC associado"
          },
          capecName: {
            type: "string",
            description: "Nome do CAPEC"
          },
          capecDescription: {
            type: "string",
            description: "Descrição do CAPEC"
          },
          mitigationRecommendations: {
            type: "string",
            description: "Recomendações de mitigação"
          },
          impact: {
            type: "string",
            enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
            description: "Nível de impacto da ameaça"
          },
          owaspTop10: {
            type: "string",
            description: "Framework de segurança: OWASP Web (A01:2021, A02:2021, etc.) OU OWASP LLM (LLM01, LLM02, etc.) conforme o tipo de componente"
          }
        },
        required: ["elementName", "strideCategory", "threatScenario", "capecId", "capecName", "capecDescription", "mitigationRecommendations", "impact", "owaspTop10"],
        additionalProperties: false
      }
    }
  },
  required: ["threats"],
  additionalProperties: false
};

const parseJsonFromText = (text: string | undefined | any): any => {
  if (!text) throw new Error("Texto da resposta da IA está indefinido.");
  
  // Se for um objeto, tentar extrair a string
  let jsonStr: string;
  if (typeof text === 'string') {
    jsonStr = text;
  } else if (typeof text === 'object' && text !== null) {
    // Se for um objeto, tentar extrair a propriedade 'response' ou converter para string
    if (text.response && typeof text.response === 'string') {
      jsonStr = text.response;
    } else {
      jsonStr = JSON.stringify(text);
    }
  } else {
    jsonStr = String(text);
  }
  
  jsonStr = jsonStr.trim();
  
  // Remover prefixos comuns do OpenRouter
  const prefixes = [
    'Aqui está o JSON com as informações extraídas:',
    'Aqui está o JSON:',
    'JSON extraído:',
    'Resposta:',
    'Resultado:'
  ];
  
  for (const prefix of prefixes) {
    if (jsonStr.startsWith(prefix)) {
      jsonStr = jsonStr.substring(prefix.length).trim();
    }
  }
  
  // Extrair JSON de markdown
  const fenceRegex = /```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match) {
    jsonStr = match[2];
  }
  
  // Se ainda não encontrou JSON, tentar encontrar o primeiro {
  const jsonStart = jsonStr.indexOf('{');
  if (jsonStart > 0) {
    jsonStr = jsonStr.substring(jsonStart);
  }
  
  // Tentar encontrar o final do JSON válido para evitar texto adicional
  let braceCount = 0;
  let jsonEnd = -1;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }
  }
  
  // Se encontrou o final do JSON, cortar o texto
  if (jsonEnd > 0) {
    jsonStr = jsonStr.substring(0, jsonEnd);
  }
  
  try {
    const result = JSON.parse(jsonStr);
    return result;
  } catch (parseError) {
    console.error("❌ Erro ao fazer parse do JSON da IA:", parseError);
    console.error("❌ Texto que causou erro:", jsonStr.substring(0, 500) + "...");
    
    // Tentar fallback: procurar por JSON entre ```json e ```
    const jsonBlockMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch (e) {
        // Ignorar erro do fallback
      }
    }
    
    // Tentar fallback: procurar por JSON entre ``` e ```
    const codeBlockMatch = text.match(/```\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // Ignorar erro do fallback
      }
    }
    
    // Mensagem de erro mais informativa
    const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
    if (errorMsg.includes("Unexpected end of JSON input") || errorMsg.includes("Unterminated string")) {
      throw new Error(
        `⚠️ RESPOSTA INCOMPLETA DO MODELO DE IA\n\n` +
        `O modelo parou de gerar antes de completar o JSON (resposta truncada).\n\n` +
        `🔧 POSSÍVEIS CAUSAS:\n` +
        `• Limite de tokens de saída do modelo atingido\n` +
        `• Modelo tentou gerar ameaças demais ou muito detalhadas\n\n` +
        `💡 SOLUÇÃO:\n` +
        `1. Tente novamente (pode funcionar na próxima tentativa)\n` +
        `2. Ou troque para um modelo com maior limite de tokens:\n` +
        `   • meta-llama/llama-3.3-70b-instruct:free (OpenRouter)\n` +
        `   • deepseek/deepseek-chat-v3-0324:free (OpenRouter)\n\n` +
        `3. Abra "Configuração de Modelos" no painel lateral\n` +
        `4. Selecione o modelo desejado e tente novamente\n\n` +
        `📊 Tamanho da resposta truncada: ${text.length} caracteres`
      );
    }
    
    throw new Error(`Falha ao fazer parse da resposta JSON da IA: ${parseError}`);
  }
};

// Função RAG com Múltiplas Queries Paralelas e Detecção de IA
const searchRAGContext = async (systemInfo: SystemInfo, modelConfig?: any): Promise<{
  context: string;
  sources: any[];
  totalDocuments: number;
  confidence: number;
  aspectsCovered: string[];
} | null> => {
  try {
    const BACKEND_URL = 'http://localhost:3001';
    
    // ===== 1. DETECTAR COMPONENTES DE IA =====
    const aiDetection = detectAIComponents(systemInfo);
    
    if (aiDetection.hasAI) {
      console.log(`🤖 Sistema com IA detectado!`);
      console.log(`   Confiança: ${aiDetection.confidence}`);
      console.log(`   Componentes: ${aiDetection.aiComponents.slice(0, 5).join(', ')}${aiDetection.aiComponents.length > 5 ? '...' : ''}`);
    }
    
    // ===== 2. MONTAR QUERIES PARALELAS =====
    const searchQueries: Array<{ query: string; aspect: string; limit: number }> = [];
    
    // 🔥 IMPORTANTE: Limites aumentados para garantir diversidade de CAPECs
    // Isso garante que relatórios com 30-50+ ameaças tenham CAPECs únicos disponíveis
    
    // Query 1: STRIDE geral (sempre inclui)
    searchQueries.push({
      query: `threat modeling STRIDE CAPEC security threats vulnerabilities ${systemInfo.systemName}`,
      aspect: 'STRIDE Geral',
      limit: 10  // Aumentado de 3 para 10
    });
    
    // Query 2: Componentes específicos (se tiver)
    if (systemInfo.components && systemInfo.components.trim().length > 0) {
      const components = systemInfo.components.split(',').slice(0, 3).join(' ');
      searchQueries.push({
        query: `STRIDE threats ${components} security vulnerabilities`,
        aspect: 'Componentes',
        limit: 8  // Aumentado de 2 para 8
      });
    }
    
    // Query 3: Tecnologias (se tiver)
    if (systemInfo.technologies && systemInfo.technologies.trim().length > 0 && systemInfo.technologies !== 'Não especificado') {
      const tech = systemInfo.technologies.split(',').slice(0, 3).join(' ');
      searchQueries.push({
        query: `security vulnerabilities ${tech} threats`,
        aspect: 'Tecnologias',
        limit: 8  // Aumentado de 2 para 8
      });
    }
    
    // Query 4: Integrações externas (se tiver)
    if (systemInfo.externalIntegrations && systemInfo.externalIntegrations !== 'Nenhuma identificada' && systemInfo.externalIntegrations !== 'Não informado') {
      searchQueries.push({
        query: `third-party integration security risks ${systemInfo.externalIntegrations}`,
        aspect: 'Integrações Externas',
        limit: 8  // Aumentado de 2 para 8
      });
    }
    
    // Query 5: OWASP LLM + AI TRiSM + NIST AI RMF (SE IA DETECTADA) ⭐⭐⭐
    if (aiDetection.hasAI) {
      const aiQuery = generateAIThreatQuery(aiDetection.confidence);
      searchQueries.push({
        query: aiQuery,
        aspect: `Ameaças de IA (${aiDetection.confidence})`,
        limit: 10  // Aumentado de 3 para 10
      });
    }
    
    console.log(`🔍 Executando ${searchQueries.length} queries RAG em paralelo:`);
    searchQueries.forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.aspect}: "${q.query.substring(0, 50)}..."`);
    });
    
    // ===== 3. EXECUTAR QUERIES EM PARALELO =====
    const searchPromises = searchQueries.map(async ({ query, aspect, limit }) => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/search/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query,
            limit,
            systemContext: systemInfo.systemName,
            modelConfig
          })
        });
        
        if (!response.ok) {
          console.warn(`⚠️ Query "${aspect}" falhou`);
          return { aspect, sources: [], confidence: 0 };
        }
        
        const result = await response.json();
        return {
          aspect,
          sources: result.sources || [],
          confidence: result.confidence || 0
        };
      } catch (error) {
        console.warn(`⚠️ Erro na query "${aspect}":`, error);
        return { aspect, sources: [], confidence: 0 };
      }
    });
    
    const results = await Promise.all(searchPromises);
    
    // ===== 4. DEDUPLICA E COMBINAR RESULTADOS =====
    const allSources: any[] = [];
    const seenChunkIds = new Set<string>();
    const aspectsCovered: string[] = [];
    
    results.forEach(result => {
      if (result.sources.length > 0) {
        aspectsCovered.push(result.aspect);
        
        result.sources.forEach((source: any) => {
          const chunkId = `${source.documento?.metadata?.documentId || source.documento?.metadata?.documentName}-${source.documento?.metadata?.chunkIndex}`;
          
          if (!seenChunkIds.has(chunkId)) {
            seenChunkIds.add(chunkId);
            allSources.push({
              ...source,
              searchAspect: result.aspect
            });
          }
        });
      }
    });
    
    if (allSources.length === 0) {
      console.warn('⚠️ Nenhum resultado RAG encontrado em nenhuma query');
      return null;
    }
    
    // ===== 5. CONSTRUIR CONTEXTO FINAL =====
    let context = `═══════════════════════════════════════\n`;
    context += `📚 CONTEXTO RAG (${allSources.length} fontes, ${aspectsCovered.length} aspectos)\n`;
    context += `═══════════════════════════════════════\n\n`;
    
    allSources.forEach((source, index) => {
      context += `[Fonte ${index + 1}: ${source.searchAspect}]\n`;
      context += `Documento: ${source.documento?.metadata?.documentName || 'Desconhecido'}\n`;
      context += `${source.documento?.pageContent?.substring(0, 400) || ''}...\n\n`;
    });
    
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    
    console.log(`✅ RAG Completo: ${allSources.length} fontes únicas de ${results.length} queries`);
    console.log(`   Aspectos: ${aspectsCovered.join(', ')}`);
    console.log(`   Confiança média: ${avgConfidence.toFixed(1)}%`);
    
    return {
      context,
      sources: allSources,
      totalDocuments: new Set(allSources.map(s => s.documento?.metadata?.documentId)).size,
      confidence: avgConfidence,
      aspectsCovered
    };
    
  } catch (error) {
    console.warn('⚠️ Erro RAG, continuando sem contexto:', error);
    return null;
  }
};

export const analyzeThreatsAndMitigations = async (
  systemInfo: SystemInfo,
  strideCapecMap: StrideCapecMapType,
  modelConfig?: any
): Promise<IdentifiedThreat[]> => {
  // Detectar componentes de IA
  const aiDetection = detectAIComponents(systemInfo);
  
  // Buscar contexto RAG relevante (otimizado) - agora inclui query de IA se detectado
  const ragContext = await searchRAGContext(systemInfo, modelConfig);
  
  // Calcular complexidade da tarefa
  console.log(`[AI Service] Complexidade da análise detectada: ${calculateTaskComplexity(systemInfo, JSON.stringify(strideCapecMap))}`);
  
  // Construir contexto RAG para o prompt (versão ultra-otimizada)
  // Reduzir contexto RAG se sistema tem IA (para economizar tokens)
  // Reduzir ainda mais para modelos locais (Ollama)
  const isLocalModel = modelConfig?.provider === 'ollama';
  
  // Verificar se modelo tem contexto limitado configurado
  const modelName = modelConfig?.model || '';
  const limitedContext = modelName ? 
    (process.env[`OLLAMA_LIMITED_CONTEXT_${modelName.replace(/[^A-Z0-9]/g, '_').toUpperCase()}`] === 'true') : false;
  
  let contextLimit: number;
  if (limitedContext) {
    contextLimit = parseInt(process.env.OLLAMA_LIMITED_CONTEXT_LIMIT || '150'); // Configurável via .env.local
  } else if (isLocalModel) {
    contextLimit = parseInt(process.env.OLLAMA_LOCAL_CONTEXT_LIMIT || '300'); // Configurável via .env.local
  } else if (aiDetection.hasAI) {
    contextLimit = parseInt(process.env.OLLAMA_AI_SYSTEM_CONTEXT_LIMIT || '600'); // Configurável via .env.local
  } else {
    contextLimit = parseInt(process.env.OLLAMA_DEFAULT_CONTEXT_LIMIT || '1000'); // Configurável via .env.local
  }
  
  // =====================
  // CAPECs mencionados no RAG (auditoria)
  // =====================
  const extractCapecIdsFromText = (text: string): Set<string> => {
    const matches = text.match(/CAPEC-\d{1,4}/g) || [];
    return new Set(matches);
  };
  const capecsMentionedInRag = extractCapecIdsFromText(ragContext?.context || '');
  console.log(`[AI Service] CAPECs mencionados no RAG: ${Array.from(capecsMentionedInRag).join(', ') || 'nenhum'}`);
  console.log(`[AI Service] Total de CAPECs disponíveis no mapeamento: ${strideCapecMap.reduce((sum, e) => sum + e.capecs.length, 0)}`);

  const ragContextSection = ragContext ? `
CONTEXTO RAG (${ragContext.sources.length} fontes, confiança: ${ragContext.confidence?.toFixed(1) || '0.0'}%):
${ragContext.context.substring(0, contextLimit)}...

` : `
⚠️ Sem contexto RAG. Use conhecimento geral e mapeamento STRIDE-CAPEC.

`;

  // Seção específica de IA (se detectado)
  const aiContextSection = aiDetection.hasAI ? `
🤖 ===== SISTEMA COM COMPONENTES DE IA DETECTADO =====
Confiança: ${aiDetection.confidence}
Componentes de IA identificados: ${aiDetection.aiComponents.slice(0, 5).join(', ')}${aiDetection.aiComponents.length > 5 ? '...' : ''}

⚠️ ATENÇÃO: Este é um sistema com IA/ML. Use frameworks apropriados:

📋 CAMPO "owaspTop10" - INSTRUÇÕES ESPECIAIS:
   Para componentes de IA/ML (LLM, Vector Database, ML Pipeline, etc.), use:
   ✅ "LLM01 - Prompt Injection" (para ameaças de manipulação de prompts)
   ✅ "LLM02 - Insecure Output Handling" (para saídas não validadas)
   ✅ "LLM03 - Training Data Poisoning" (para envenenamento de dados)
   ✅ "LLM04 - Model Denial of Service" (para DoS específicos de modelo)
   ✅ "LLM05 - Supply Chain Vulnerabilities" (para dependências de IA)
   ✅ "LLM06 - Sensitive Information Disclosure" (para vazamento via LLM)
   ✅ "LLM07 - Insecure Plugin Design" (para plugins do LLM)
   ✅ "LLM08 - Excessive Agency" (para ações não autorizadas do LLM)
   ✅ "LLM09 - Overreliance" (para confiança excessiva em respostas)
   ✅ "LLM10 - Model Theft" (para roubo de modelo)
   
   Para componentes tradicionais (Web App, Database, API), use:
   ✅ "A01:2021 - Broken Access Control"
   ✅ "A02:2021 - Cryptographic Failures"
   ✅ "A03:2021 - Injection"
   ✅ "A05:2021 - Security Misconfiguration"
   ✅ "A07:2021 - Identification and Authentication Failures"
   etc.

🎯 PRIORIDADE: Considere ameaças do OWASP LLM Top 10, AI TRiSM e NIST AI RMF.

` : '';
  
  const prompt = `${ragContextSection}
SISTEMA: ${systemInfo.systemName}
DESCRIÇÃO: ${systemInfo.generalDescription.substring(0, 500)}...

COMPONENTES ESPECÍFICOS DO SISTEMA:
${systemInfo.components || 'Não informado'}

DADOS SENSÍVEIS:
${systemInfo.sensitiveData || 'Não informado'}

TECNOLOGIAS:
${systemInfo.technologies || 'Não informado'}

PERFIS DE USUÁRIO:
${systemInfo.userProfiles || 'Não informado'}

INTEGRAÇÕES EXTERNAS:
${systemInfo.externalIntegrations || 'Não informado'}

${systemInfo.additionalContext ? `
═══════════════════════════════════════════════════════════
📊 ANÁLISE DETALHADA DO DIAGRAMA (Fluxos e Zonas)
═══════════════════════════════════════════════════════════

${systemInfo.additionalContext}

⚠️ ATENÇÃO CRÍTICA: 
- Analise os FLUXOS DE DADOS listados acima (não apenas componentes)
- Identifique ameaças para fluxos cross-boundary (🔴→🟢, 🟢→🟣)
- Use formato "Componente A → Componente B (nome do fluxo)" para elementName
- Para fluxos não criptografados, use CAPECs de interceptação (CAPEC-117, CAPEC-157, CAPEC-158)
- Para fluxos cross-boundary, use CAPEC-94 (MitM) e CAPEC-620 (Drop Encryption)

` : ''}

${aiContextSection}

MAPEAMENTO STRIDE-CAPEC DISPONÍVEL:
${(() => {
  const maxCapecs = isLocalModel ? 15 : 30;
  return strideCapecMap.map(entry => `${entry.stride}:\n${entry.capecs.slice(0, maxCapecs).map(c => `  - ${c.id}: ${c.name}`).join('\n')}`).join('\n\n');
})()}

🔍 DEBUG: Total de ${strideCapecMap.reduce((sum, e) => sum + e.capecs.length, 0)} CAPECs no mapeamento (mostrando top ${isLocalModel ? 15 : 30} por categoria). Use CAPECs mencionados no CONTEXTO RAG quando mais relevantes ao cenário.

⚠️ REGRAS DE SELEÇÃO DE CAPEC (semântica RAG):

1) Use o CAPEC que melhor se encaixar no cenário de ameaça específico. Priorize CAPECs mencionados no CONTEXTO RAG se forem mais relevantes.
2) Selecione da lista acima (MAPEAMENTO STRIDE-CAPEC) conforme a categoria STRIDE correta.
3) Não invente IDs ou nomes. Se não encontrar um CAPEC adequado, use "CAPEC-NOT-FOUND".

🚨 UNICIDADE OBRIGATÓRIA:
✅ Não repita o mesmo CAPEC em mais de uma ameaça no relatório.
✅ Evite aplicar o mesmo CAPEC em múltiplos componentes; distribua CAPECs diferentes quando possível.

INSTRUÇÕES CRÍTICAS - OBRIGATÓRIO SEGUIR TODAS:

ANÁLISE DE COMPONENTES:
1. OBRIGATÓRIO: Identifique ameaças para TODAS as 6 categorias STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
2. OBRIGATÓRIO: Para cada ameaça, identifique um COMPONENTE ESPECÍFICO do sistema listado acima como elementName
3. OBRIGATÓRIO: Inclua TODOS os componentes do sistema, incluindo integrações externas e APIs de terceiros

ANÁLISE DE FLUXOS E ZONAS (CRÍTICO):
4. OBRIGATÓRIO: Identifique ameaças para FLUXOS DE DADOS entre componentes, não apenas componentes isolados
5. OBRIGATÓRIO: Para fluxos cross-boundary (External→Internal, Internal→Third-party), considere:
   - CAPECs de interceptação/man-in-the-middle presentes na shortlist/RAG (ex: Interception, Adversary-in-the-Middle, Downgrade/Drop Encryption Level) — escolha apenas IDs/nome que estejam na shortlist ou citados no CONTEXTO RAG.
6. OBRIGATÓRIO: Para fluxos não criptografados, identifique:
   - CAPECs de sniffing/escuta de rede presentes na shortlist/RAG — escolha apenas IDs/nome que estejam na shortlist ou citados no CONTEXTO RAG.
7. OBRIGATÓRIO: Ao descrever ameaças, mencione o FLUXO específico (ex: "no fluxo de prompts entre Backend e LLM")

USO DE CAPECs:
8. OBRIGATÓRIO: Use APENAS os CAPECs listados no mapeamento acima que correspondem à categoria STRIDE correta
9. OBRIGATÓRIO: NÃO reutilize o mesmo CAPEC para categorias STRIDE diferentes
10. OBRIGATÓRIO: Para cada CAPEC usado, forneça o ID exato e nome correto do mapeamento
11. OBRIGATÓRIO: Para cada categoria STRIDE, escolha CAPECs diferentes e apropriados da lista

QUALIDADE DA ANÁLISE:
12. OBRIGATÓRIO: Crie cenários de ameaça específicos para o sistema "${systemInfo.systemName}"
13. OBRIGATÓRIO: Forneça mitigações específicas e detalhadas, não genéricas
14. OBRIGATÓRIO: Forneça descrição detalhada do CAPEC escolhido
15. OBRIGATÓRIO: Inclua categoria OWASP Top 10 apropriada para cada ameaça
16. OBRIGATÓRIO: TODOS os campos devem ser preenchidos - NÃO deixe campos vazios
17. OBRIGATÓRIO: Gere PELO MENOS 2-3 ameaças por componente quando aplicável
18. OBRIGATÓRIO: A resposta DEVE conter ameaças de TODAS as 6 categorias STRIDE

EXEMPLOS DE RESPOSTA CORRETA - SEGUIR EXATAMENTE ESTE FORMATO:

Exemplo 1 - Sistema de Varejo:
{
  "threats": [
    {
      "elementName": "PDV Checkout",
      "strideCategory": "Tampering", 
      "threatScenario": "Atacante manipula dados de preços no sistema de checkout",
      "capecId": "CAPEC-123",
      "capecName": "Buffer Manipulation",
      "capecDescription": "Manipulação de buffers para alterar comportamento do sistema",
      "mitigationRecommendations": "Implementar validação de entrada e sanitização de dados",
      "impact": "CRITICAL",
      "owaspTop10": "A03:2021-Injection"
    }
  ]
}

Exemplo 2 - Sistema LLM/RAG (USAR ESTE COMO REFERÊNCIA para sistemas com LLM):
{
  "threats": [
    {
      "elementName": "LLM Model",
      "strideCategory": "Tampering",
      "threatScenario": "Atacante injeta prompts maliciosos para manipular respostas do modelo LLM",
      "capecId": "CAPEC-242",
      "capecName": "Code Injection",
      "capecDescription": "Injeção de código ou comandos maliciosos através de entrada não validada",
      "mitigationRecommendations": "Implementar validação rigorosa de prompts, sanitização de entrada, rate limiting e monitoramento de padrões anormais",
      "impact": "HIGH",
      "owaspTop10": "LLM01 - Prompt Injection"
    },
    {
      "elementName": "Vector Database",
      "strideCategory": "Information Disclosure",
      "threatScenario": "Atacante explora vulnerabilidades na busca vetorial para extrair embeddings de dados sensíveis",
      "capecId": "CAPEC-116",
      "capecName": "Excavation",
      "capecDescription": "Extração sistemática de informações através de consultas estruturadas ao sistema",
      "mitigationRecommendations": "Implementar controles de acesso baseados em função (RBAC), criptografia de embeddings em repouso, auditoria de queries e rate limiting",
      "impact": "CRITICAL",
      "owaspTop10": "LLM06 - Sensitive Information Disclosure"
    },
    {
      "elementName": "OpenAI API",
      "strideCategory": "Elevation of Privilege",
      "threatScenario": "Atacante compromete credenciais da API externa para obter acesso privilegiado e gerar conteúdo malicioso",
      "capecId": "CAPEC-560",
      "capecName": "Use of Known Domain Credentials",
      "capecDescription": "Uso de credenciais comprometidas para autenticação em serviços externos",
      "mitigationRecommendations": "Rotação automática de API keys, armazenamento seguro de credenciais (vault), monitoramento de uso anômalo, implementação de least privilege",
      "impact": "CRITICAL",
      "owaspTop10": "LLM05 - Supply Chain Vulnerabilities"
    }
  ]
}

⚠️ ATENÇÃO CRÍTICA: Observe a diferença nos exemplos acima:
- LLM Model usa "LLM01" (componente de IA)
- Vector Database usa "LLM06" (componente de IA)
- OpenAI API usa "LLM05" (componente de IA)
- Componentes tradicionais (Web App, Database) usam "A01:2021", "A03:2021", etc.

Exemplo 3 - Ameaças para FLUXOS DE DADOS (USAR ESTE para analisar fluxos cross-boundary):
{
  "threats": [
    {
      "elementName": "End User → Web Application (queries)",
      "strideCategory": "Information Disclosure",
      "threatScenario": "Atacante intercepta queries não criptografadas entre usuário e aplicação web no fluxo External→Internal para capturar dados sensíveis",
      "capecId": "CAPEC-117",
      "capecName": "Interception",
      "capecDescription": "Interceptação de comunicação entre dois pontos para captura de dados sensíveis em trânsito",
      "mitigationRecommendations": "Implementar TLS 1.3 para todas as comunicações, HSTS, certificate pinning e monitoramento de tentativas de downgrade",
      "impact": "CRITICAL",
      "owaspTop10": "A02:2021-Cryptographic Failures"
    },
    {
      "elementName": "Backend Service → LLM Model (prompts)",
      "strideCategory": "Tampering",
      "threatScenario": "Atacante realiza Man-in-the-Middle no fluxo interno de prompts para manipular queries enviadas ao modelo LLM",
      "capecId": "CAPEC-94",
      "capecName": "Adversary in the Middle (AiTM)",
      "capecDescription": "Interceptação e modificação de comunicação entre dois sistemas para falsificar dados ou identidade",
      "mitigationRecommendations": "Implementar autenticação mútua TLS, assinatura digital de prompts, validação de integridade e segmentação de rede",
      "impact": "HIGH",
      "owaspTop10": "A02:2021-Cryptographic Failures"
    },
    {
      "elementName": "LLM Model → OpenAI API (API calls)",
      "strideCategory": "Information Disclosure",
      "threatScenario": "Atacante realiza sniffing no fluxo Internal→Third-party para capturar API keys e dados sensíveis enviados à API externa",
      "capecId": "CAPEC-157",
      "capecName": "Sniffing Attacks",
      "capecDescription": "Captura passiva de tráfego de rede para obter informações sensíveis como credenciais ou dados",
      "mitigationRecommendations": "Usar HTTPS com TLS 1.3, implementar API key rotation automática, monitorar tráfego anômalo e usar VPN para comunicação externa",
      "impact": "CRITICAL",
      "owaspTop10": "A02:2021-Cryptographic Failures"
    }
  ]
}

⚠️ ATENÇÃO: A resposta DEVE incluir TODOS os campos acima. NÃO omita nenhum campo.

⚠️ INSTRUÇÕES DE FORMATO CRÍTICAS:
- Cada descrição: MÁXIMO 150 caracteres (1 linha curta)
- threatScenario: Descrever ameaça em 1 frase curta
- capecDescription: Definição breve do CAPEC em 1 linha
- mitigationRecommendations: Listar 2-3 controles principais (ex: "Usar TLS, RBAC e logs")
- SEJA EXTREMAMENTE CONCISO: Evite parágrafos longos

Analise e retorne JSON objeto com array de ameaças STRIDE:
{"threats":[{"elementName":"COMPONENTE_ESPECÍFICO_DO_SISTEMA","strideCategory":"Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege","threatScenario":"string","capecId":"string","capecName":"string","capecDescription":"string","mitigationRecommendations":"string","impact":"CRITICAL|HIGH|MEDIUM|LOW","owaspTop10":"string"}]}

🎯 QUANTIDADE DE AMEAÇAS OBRIGATÓRIA:
- EXATAMENTE: 12 ameaças em português (2 por categoria STRIDE)
- OBRIGATÓRIO: 2 ameaças para CADA categoria STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- OBRIGATÓRIO: Distribuir as ameaças entre:
  * Componentes individuais (6-7 ameaças)
  * Fluxos de dados entre componentes (5-6 ameaças)
- CRÍTICO: Descrições MUITO CONCISAS (máximo 1 linha por campo) para não exceder limite de tokens
- FORMATO: Cada campo deve ter no máximo 150 caracteres

🚨 VALIDAÇÃO FINAL OBRIGATÓRIA (Verificar ANTES de retornar):

1. UNICIDADE DE CAPECs:
   ✅ Verificar: Nenhum CAPEC aparece mais de 1 vez na lista
   ✅ Se CAPEC-125 está em Database, NÃO pode estar em Vector Database ou Web Application
   ✅ Se CAPEC-416 está em Web Application, NÃO pode estar em OpenAI API
   ✅ Se CAPEC-268 está em Backend Service, NÃO pode estar em LLM Model
   
2. COMPLETUDE:
   ✅ Cada ameaça DEVE ter: elementName, strideCategory, threatScenario, capecId, capecName, capecDescription, mitigationRecommendations, impact, owaspTop10
   ✅ DEVE haver ameaças de TODAS as 6 categorias STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
   
3. CORREÇÃO:
   ✅ Use APENAS CAPECs do mapeamento fornecido acima
   ✅ Cada CAPEC deve corresponder à categoria STRIDE correta
   ✅ NÃO invente CAPECs
   ✅ NÃO omita campos
   ✅ Siga EXATAMENTE o formato do exemplo

4. CONTAGEM FINAL:
   ✅ Total de ameaças: 12-18
   ✅ Total de CAPECs únicos: ≥ 85% do total de ameaças (ex: se 16 ameaças, mínimo 13 CAPECs diferentes)
   ✅ Todos os 7 componentes devem ter pelo menos 2 ameaças
`;
  
  // Debug: verificar se o mapeamento está sendo enviado
  console.log(`🔍 DEBUG: Mapeamento STRIDE-CAPEC enviado:`, strideCapecMap.length, 'categorias');
  console.log(`🔍 DEBUG: Primeira categoria:`, strideCapecMap[0]?.stride, 'com', strideCapecMap[0]?.capecs?.length, 'CAPECs');
  
  // Usar endpoint do backend para geração de conteúdo
  const backendResponse = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      modelConfig,
      format: THREAT_ANALYSIS_SCHEMA  // Usar structured output
    })
  });

  if (!backendResponse.ok) {
    throw new Error(`Erro na geração de conteúdo: ${backendResponse.statusText}`);
  }

  const result = await backendResponse.json();
  const response = result.content;
  
  // Debug: verificar resposta da IA
  console.log(`🔍 DEBUG: Resposta da IA (primeiros 500 chars):`, response.substring(0, 500));
  console.log(`🔍 DEBUG: Resposta contém capecId?`, response.includes('capecId'));
  console.log(`🔍 DEBUG: Resposta contém capecName?`, response.includes('capecName'));
  
  const parsedThreatsData = parseJsonFromText(response);

  // Extrair array de threats do objeto retornado
  let threatsArray = parsedThreatsData;
  
  // Se parseJsonFromText retornou um objeto com 'response', extrair primeiro
  if (parsedThreatsData && typeof parsedThreatsData === 'object' && parsedThreatsData.response) {
    threatsArray = parsedThreatsData.response;
  }
  
  // Se o objeto tem propriedade 'threats', extrair o array
  if (threatsArray && typeof threatsArray === 'object' && threatsArray.threats) {
    threatsArray = threatsArray.threats;
  }
  
      if (!Array.isArray(threatsArray)) {
        console.error("Resposta da IA para ameaças não foi um array:", threatsArray);
    throw new Error("A resposta da IA para ameaças não estava no formato de array esperado.");
  }

  // Validar e processar ameaças com correção de CAPECs
  const threats: IdentifiedThreat[] = threatsArray.map((threat: any, index: number) => {
    // Validar e corrigir CAPEC
    const validatedCapec = validateAndFixCapec(threat, index);
    
    return {
      id: `threat-${Date.now()}-${index}`,
      elementName: threat.elementName || `Elemento ${index + 1}`,
      strideCategory: threat.strideCategory || 'Information Disclosure',
      threatScenario: threat.threatScenario || 'Cenário de ameaça não especificado',
      capecId: validatedCapec.capecId,
      capecName: validatedCapec.capecName,
      capecDescription: validatedCapec.capecDescription,
      mitigationRecommendations: threat.mitigationRecommendations || 'Implementar controles de segurança apropriados',
      impact: threat.impact || 'MEDIUM',
      owaspTop10: threat.owaspTop10 || 'A1:2021 - Broken Access Control'
    };
  });

  console.log(`✅ Análise de ameaças concluída: ${threats.length} ameaças identificadas`);
  
  // =====================
  // Pós-processamento: garantir unicidade de CAPECs por relatório
  // =====================
  const usedCapecs = new Set<string>();
  const pickAlternativeCapec = (stride: string): { capecId: string; capecName: string; capecDescription: string } => {
    const candidate = (strideCapecMap.find(e => e.stride === stride)?.capecs || []).find(c => !usedCapecs.has(c.id));
    return candidate
      ? { capecId: candidate.id, capecName: candidate.name, capecDescription: 'Selecionado do mapeamento STRIDE→CAPEC' }
      : getFallbackCapec(stride, '');
  };

  for (let i = 0; i < threats.length; i++) {
    const t = threats[i];
    const id = (t.capecId || '').trim();
    if (id && !usedCapecs.has(id)) {
      usedCapecs.add(id);
      continue;
    }
    // Duplicado ou vazio → escolher alternativa
    const alt = pickAlternativeCapec(t.strideCategory);
    console.warn(`♻️ Substituindo CAPEC duplicado/ausente em "${t.elementName}" (${t.strideCategory}) → ${alt.capecId}`);
    t.capecId = alt.capecId;
    t.capecName = alt.capecName;
    t.capecDescription = alt.capecDescription;
    usedCapecs.add(alt.capecId);
  }
  return threats;
};

/**
 * Valida e corrige dados CAPEC para evitar IDs incorretos
 */
function validateAndFixCapec(threat: any, index: number): { capecId: string; capecName: string; capecDescription: string } {
  
  // Verificar se CAPEC é válido
  const hasValidCapec = threat.capecId && 
    threat.capecId.trim() !== '' && 
    threat.capecId !== 'CAPEC-NOT-FOUND' &&
    threat.capecName && 
    threat.capecName.trim() !== '' &&
    threat.capecName !== 'CAPEC não encontrado';

  if (hasValidCapec) {
    const capecId = threat.capecId.trim();
    const capecName = threat.capecName.trim();

    // Aceitar qualquer CAPEC-<número> (shortlist/RAG pode trazer IDs não listados aqui)
    const idLooksLikeCapec = /^CAPEC-\d{1,4}$/.test(capecId);
    if (!idLooksLikeCapec) {
      console.warn(`⚠️ CAPEC ID com formato inválido para ameaça ${index + 1}: ${capecId}`);
      return getFallbackCapec(threat.strideCategory, threat.threatScenario);
    }
    
    // Validar se ID corresponde ao nome
    if (isCapecIdNameMismatch(capecId, capecName)) {
      console.warn(`⚠️ CAPEC ID/Nome inconsistente para ameaça ${index + 1}: ${capecId} vs ${capecName}`);
      return getFallbackCapec(threat.strideCategory, threat.threatScenario);
    }
    
    return {
      capecId,
      capecName,
      capecDescription: threat.capecDescription || 'Descrição CAPEC não disponível'
    };
  }
  
  // Se CAPEC inválido, usar mapeamento STRIDE-CAPEC
  console.warn(`⚠️ CAPEC inválido para ameaça ${index + 1}, usando mapeamento STRIDE-CAPEC`);
  return getFallbackCapec(threat.strideCategory, threat.threatScenario);
}

/**
 * Verifica se ID e nome do CAPEC são inconsistentes
 */
function isCapecIdNameMismatch(_capecId: string, capecName: string): boolean {
  // Aceitar qualquer nome não vazio; nomes oficiais podem ser de 1 palavra (ex.: "Pretexting")
  return !capecName || capecName.trim().length === 0;
}

/**
 * Obtém CAPEC de fallback baseado na categoria STRIDE
 */
function getFallbackCapec(strideCategory: string, _threatScenario: string): { capecId: string; capecName: string; capecDescription: string } {
  const strideCapecMap: { [key: string]: { capecId: string; capecName: string; capecDescription: string } } = {
    'Spoofing': {
      capecId: 'CAPEC-156',
      capecName: 'Engage In Deceptive Interactions',
      capecDescription: 'Ataques que envolvem enganar usuários ou sistemas através de identidades falsas'
    },
    'Tampering': {
      capecId: 'CAPEC-153',
      capecName: 'Input Data Manipulation',
      capecDescription: 'Manipulação de dados de entrada para causar comportamento não intencional'
    },
    'Repudiation': {
      capecId: 'CAPEC-157',
      capecName: 'Log Injection',
      capecDescription: 'Injeção de dados falsos em logs para mascarar atividades maliciosas'
    },
    'Information Disclosure': {
      capecId: 'CAPEC-116',
      capecName: 'Excessive Information Exposure',
      capecDescription: 'Exposição excessiva de informações confidenciais do sistema'
    },
    'Denial of Service': {
      capecId: 'CAPEC-125',
      capecName: 'Flooding',
      capecDescription: 'Ataques de negação de serviço através de sobrecarga de recursos'
    },
    'Elevation of Privilege': {
      capecId: 'CAPEC-233',
      capecName: 'Privilege Escalation',
      capecDescription: 'Escalação de privilégios para obter acesso não autorizado'
    }
  };
  
  return strideCapecMap[strideCategory] || {
    capecId: 'CAPEC-1000',
    capecName: 'General Attack Pattern',
    capecDescription: 'Padrão de ataque geral não especificado'
  };
}


/**
 * Gera um diagrama Mermaid de árvore de ataque baseado nas ameaças identificadas.
 * Retorna apenas o texto Mermaid válido.
 */
export const generateAttackTreeMermaid = async (
  threats: IdentifiedThreat[],
  systemName: string,
  modelConfig?: any
): Promise<string> => {
  try {
    // Garantir que threats é um array válido
    if (!Array.isArray(threats) || threats.length === 0) {
      console.warn('generateAttackTreeMermaid: threats não é um array válido:', threats);
      return `flowchart TD\n    A[${systemName}] --> B[Nenhuma ameaça identificada]`;
    }
    
    // Prompt melhorado baseado na abordagem Python
    const prompt = `
Você é um especialista em modelagem de ameaças. Analise as ameaças fornecidas e crie uma Árvore de Ataque estruturada.

SISTEMA: ${systemName}

Ameaças Identificadas:
${threats.map(t => `- ${t.elementName}: ${t.threatScenario} (${t.strideCategory})`).join('\n')}

Crie um diagrama Mermaid que mostre:
1. Nó raiz com o nome do sistema: "${systemName}"
2. Categorias STRIDE como nós principais
3. Ameaças específicas como folhas
4. Relacionamentos entre ameaças

Use esta estrutura:
- flowchart TD
- Nó raiz: ${systemName}[${systemName}]
- Nós retangulares para categorias STRIDE
- Nós circulares para ameaças específicas
- Labels em português
- Máximo 20 nós para legibilidade

IMPORTANTE: O nó raiz DEVE usar o nome exato do sistema: "${systemName}"

Retorne APENAS o código Mermaid, sem explicações.
`;

  const backendResponse = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelConfig, format: null })
  });

  if (!backendResponse.ok) {
    throw new Error(`Erro na geração de conteúdo: ${backendResponse.statusText}`);
  }

  const result = await backendResponse.json();
  const response = result.content;
  let text = response.trim();
    
    // Validação e limpeza robusta
    if (!/^(flowchart|graph)\s+(TD|LR|BT|RL)/i.test(text) || /^mindmap/i.test(text)) {
      return buildFlowchartFromThreats(threats, systemName);
    }

    // Limpar texto extra
    text = text.replace(/^```mermaid\s*/, '').replace(/```$/, '').trim();
    
      return text;
  } catch (error) {
    console.error('Erro ao gerar árvore de ataque:', error);
    return buildFlowchartFromThreats(threats, systemName);
  }
};

// Função de fallback para criar flowchart básico
const buildFlowchartFromThreats = (threats: IdentifiedThreat[], systemName: string = 'Sistema'): string => {
  // Garantir que threats é um array válido
  if (!Array.isArray(threats) || threats.length === 0) {
    return `flowchart TD\n    A[${systemName}] --> B[Nenhuma ameaça identificada]`;
  }
  
  const categories = [...new Set(threats.map(t => t.strideCategory))];
  
  let mermaid = 'flowchart TD\n';
  mermaid += `    A[${systemName}] --> B[STRIDE]\n`;
  
  categories.forEach((category, index) => {
    const categoryId = `C${index + 1}`;
    mermaid += `    B --> ${categoryId}["${category}"]\n`;
    
    const categoryThreats = threats.filter(t => t.strideCategory === category);
    categoryThreats.forEach((threat, threatIndex) => {
      const threatId = `T${index + 1}_${threatIndex + 1}`;
      mermaid += `    ${categoryId} --> ${threatId}["${threat.elementName}"]\n`;
    });
  });
  
  return mermaid;
};

/**
 * Refina e melhora uma análise de ameaças existente usando IA.
 */
export const refineAnalysis = async (
  currentReportMarkdown: string,
  modelConfig?: any
): Promise<string> => {
  // Calcular complexidade da tarefa de refinamento
  const complexity = calculateTaskComplexity({
    systemName: 'Refinamento',
    systemVersion: '1.0',
    generalDescription: currentReportMarkdown,
    components: '',
    sensitiveData: '',
    technologies: '',
    authentication: '',
    userProfiles: '',
    externalIntegrations: ''
  }, "");
  console.log(`[AI Service] Complexidade do refinamento detectada: ${complexity}`);

  const prompt = `
Você é um especialista sênior em segurança cibernética revisando e refinando um relatório de modelagem de ameaças existente.

RELATÓRIO ATUAL:
${currentReportMarkdown}

TAREFA: Refine e melhore este relatório focando em:
1. Ameaças mais específicas e realistas
2. Mitigações mais práticas e implementáveis
3. Melhor categorização STRIDE
4. Priorização por impacto
5. Linguagem mais clara e profissional

Retorne o relatório refinado em Markdown, mantendo a estrutura original mas com melhorias significativas.
`;

  const backendResponse = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelConfig, format: null })
  });

  if (!backendResponse.ok) {
    throw new Error(`Erro na geração de conteúdo: ${backendResponse.statusText}`);
  }

  const result = await backendResponse.json();
  const response = result.content;
  return response;
};

/**
 * Usa a IA para resumir e formatar a descrição geral do sistema a partir de um texto livre.
 * @param fullDescription Texto livre informado pelo usuário sobre o sistema.
 * @param modelConfig Configuração do modelo de IA a ser usado.
 * @returns Objeto SystemInfo estruturado.
 */
export const summarizeSystemDescription = async (
  fullDescription: string,
  modelConfig?: any
): Promise<SystemInfo> => {
  // Validar se a descrição não está vazia
  if (!fullDescription || fullDescription.trim() === '') {
    throw new Error('Descrição do sistema não informada');
  }

  // Para resumos, sempre usar complexidade simples
  const complexity = 'SIMPLE' as const;
  console.log(`[AI Service] Executando resumo do sistema com complexidade: ${complexity}`);
  
  const prompt = `
Você é um especialista em análise de sistemas. Analise a descrição fornecida e extraia/infira informações estruturadas.

DESCRIÇÃO DO SISTEMA:
${fullDescription}

Extraia e retorne um JSON com:
{
  "generalDescription": "Resumo claro do sistema em 2-3 frases",
  "components": "Lista de componentes principais separados por vírgula",
  "sensitiveData": "Tipos de dados sensíveis identificados OU inferidos baseado nos componentes (ex: LLM → embeddings, prompts; Database → user data, credentials; Vector DB → embeddings; Web App → session tokens, user inputs)",
  "technologies": "Tecnologias e frameworks mencionados",
  "authentication": "Métodos de autenticação identificados OU inferidos baseado no tipo de sistema (ex: Web App → JWT/OAuth; LLM API → API keys; Database → credentials)",
  "userProfiles": "Perfis de usuário mencionados OU inferidos baseado no sistema (ex: Web App → End Users, Admin; LLM system → Data Scientists, Developers; Enterprise → Business Users, IT Admin)",
  "externalIntegrations": "Integrações externas identificadas"
}

⚠️ IMPORTANTE - REGRAS DE INFERÊNCIA:
1. Se "sensitiveData" NÃO estiver explicitamente mencionado:
   - Para sistemas com LLM/Vector Database: presuma "embeddings, prompts, training data, model outputs"
   - Para sistemas com Database: presuma "user credentials, personal data, session tokens"
   - Para sistemas com Web Application: presuma "user inputs, authentication tokens, session data"
   - Para sistemas com API externa: presuma "API keys, authentication tokens"

2. Se "authentication" NÃO estiver explicitamente mencionado:
   - Para Web Application: presuma "JWT tokens, session-based authentication"
   - Para API integrations: presuma "API keys, OAuth 2.0"
   - Para Database: presuma "username/password credentials"

3. Se "userProfiles" NÃO estiver explicitamente mencionado:
   - Para sistemas com interface web: presuma "End Users, Administrators"
   - Para sistemas LLM/ML: presuma "Data Scientists, ML Engineers, End Users"
   - Para sistemas enterprise: presuma "Business Users, IT Administrators, System Operators"

4. NUNCA retorne "Não informado", "Não especificado", "None" ou similar.
5. SEMPRE infira informações razoáveis baseado no contexto dos componentes.
6. Seja específico e realista nas inferências.
`;

  const backendResponse = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, modelConfig, format: null })
  });

  if (!backendResponse.ok) {
    throw new Error(`Erro na geração de conteúdo: ${backendResponse.statusText}`);
  }

  const result = await backendResponse.json();
  const response = result.content;
  const parsedResult = parseJsonFromText(response);
  
  // Garantir que todos os campos existam
  return {
    generalDescription: parsedResult.generalDescription || "Não informado",
    components: parsedResult.components || "Não informado",
    sensitiveData: parsedResult.sensitiveData || "Não informado",
    technologies: parsedResult.technologies || "Não informado",
    authentication: parsedResult.authentication || "Não informado",
    userProfiles: parsedResult.userProfiles || "Não informado",
    externalIntegrations: parsedResult.externalIntegrations || "Não informado",
    systemName: "Sistema Analisado",
    systemVersion: "1.0"
  };
};