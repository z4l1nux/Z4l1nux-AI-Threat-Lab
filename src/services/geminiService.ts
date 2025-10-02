import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SystemInfo, IdentifiedThreat, StrideCapecMapType } from '../types';
// import { ragService, RAGContext } from '../src/services/ragService';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY; // Support common env var names

if (!API_KEY) {
  console.warn(
    "A chave da API Gemini não está configurada em process.env.GEMINI_API_KEY ou process.env.API_KEY. As funcionalidades de IA não funcionarão."
  );
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Configuração inteligente de modelos
const MODEL_CONFIG = {
  // Modelos disponíveis ordenados por capacidade/custo
  MODELS: {
    LITE: 'gemini-2.5-flash-lite-preview-06-17',      // Mais barato, tarefas simples
    FLASH: 'gemini-2.5-flash',                         // Equilibrado, uso geral
    FLASH_LEGACY: 'gemini-1.5-flash-latest',          // Fallback confiável
    PRO: 'gemini-2.5-pro'                             // Mais caro, tarefas complexas
  },
  
  // Limites para decisão automática de modelo
  THRESHOLDS: {
    SIMPLE_TASK_TOKENS: 5000,        // < 5k tokens = tarefa simples
    COMPLEX_TASK_TOKENS: 50000,      // > 50k tokens = tarefa complexa
    MAX_RETRIES: 2                   // Máximo de tentativas com modelos alternativos
  }
};

// Função para calcular complexidade aproximada da tarefa
const calculateTaskComplexity = (
  systemInfo: SystemInfo, 
  additionalData?: string
): 'SIMPLE' | 'MEDIUM' | 'COMPLEX' => {
  const systemInfoStr = JSON.stringify(systemInfo);
  const totalLength = systemInfoStr.length + (additionalData?.length || 0);
  
  // Fatores de complexidade
  const componentCount = systemInfo.components?.split(',').length || 0;
  const hasExternalIntegrations = systemInfo.externalIntegrations && 
    systemInfo.externalIntegrations.toLowerCase() !== 'não informado';
  const hasComplexAuth = systemInfo.authentication && 
    systemInfo.authentication.toLowerCase().includes('oauth');
  
  // Cálculo de pontuação de complexidade
  let complexityScore = 0;
  
  // Tamanho do conteúdo
  if (totalLength > MODEL_CONFIG.THRESHOLDS.COMPLEX_TASK_TOKENS) complexityScore += 3;
  else if (totalLength > MODEL_CONFIG.THRESHOLDS.SIMPLE_TASK_TOKENS) complexityScore += 1;
  
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

// Função para selecionar o modelo ideal baseado na tarefa
const selectOptimalModel = (
  taskType: 'ANALYSIS' | 'REFINEMENT' | 'SUMMARY',
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX',
  retryCount: number = 0
): string => {
  // Estratégia de seleção baseada em tipo de tarefa e complexidade
  switch (taskType) {
    case 'SUMMARY':
      // Resumos são geralmente tarefas simples
      return retryCount === 0 ? MODEL_CONFIG.MODELS.LITE : MODEL_CONFIG.MODELS.FLASH;
      
    case 'ANALYSIS': {
      // Para árvore de ataque, forçar PRO
      if (currentGenerationContext.currentTask === 'ATTACK_TREE') {
        return MODEL_CONFIG.MODELS.PRO;
      }
      // Análise de ameaças requer mais capacidade
      if (complexity === 'COMPLEX') {
        return retryCount === 0 ? MODEL_CONFIG.MODELS.PRO : MODEL_CONFIG.MODELS.FLASH;
      } else if (complexity === 'MEDIUM') {
        return retryCount === 0 ? MODEL_CONFIG.MODELS.FLASH : MODEL_CONFIG.MODELS.FLASH_LEGACY;
      } else {
        return retryCount === 0 ? MODEL_CONFIG.MODELS.FLASH : MODEL_CONFIG.MODELS.LITE;
      }
    }
    case 'REFINEMENT':
      // Refinamento requer capacidade de raciocínio
      if (complexity === 'COMPLEX') {
        return retryCount === 0 ? MODEL_CONFIG.MODELS.PRO : MODEL_CONFIG.MODELS.FLASH;
      } else {
        return retryCount === 0 ? MODEL_CONFIG.MODELS.FLASH : MODEL_CONFIG.MODELS.FLASH_LEGACY;
      }
      
    default:
      return MODEL_CONFIG.MODELS.FLASH;
  }
};

// Contexto simples para sinalizar tipo de tarefa atual durante seleção de modelo
const currentGenerationContext: { currentTask: 'DEFAULT' | 'ATTACK_TREE' } = { currentTask: 'DEFAULT' };

// Função para executar geração de conteúdo com retry inteligente
const executeWithIntelligentRetry = async (
  prompt: string,
  taskType: 'ANALYSIS' | 'REFINEMENT' | 'SUMMARY',
  complexity: 'SIMPLE' | 'MEDIUM' | 'COMPLEX',
  maxRetries: number = MODEL_CONFIG.THRESHOLDS.MAX_RETRIES
): Promise<GenerateContentResponse> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const selectedModel = selectOptimalModel(taskType, complexity, attempt);
      
      console.log(`[Gemini Service] Tentativa ${attempt + 1}/${maxRetries + 1} usando modelo: ${selectedModel} (Complexidade: ${complexity})`);
      
      const response = await ai!.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      console.log(`[Gemini Service] Sucesso com modelo: ${selectedModel}`);
      return response;
      
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Gemini Service] Erro com modelo (tentativa ${attempt + 1}):`, error);
      
      // Se é a última tentativa, lança o erro
      if (attempt === maxRetries) {
        break;
      }
      
      // Aguarda um pouco antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error(`Falha em todas as tentativas de geração de conteúdo. Último erro: ${lastError?.message}`);
};

const parseJsonFromText = (text: string | undefined): any => {
  if (!text) throw new Error("Texto da resposta da IA está indefinido.");
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; // Matches ```json ... ``` or ``` ... ```
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Falha ao analisar resposta JSON:", e, "Texto original:", jsonStr);
    throw new Error(`Falha ao analisar resposta da IA como JSON. Conteúdo: ${jsonStr.substring(0,500)}...`);
  }
};

// Função para buscar contexto RAG relevante com múltiplas queries específicas
const searchRAGContext = async (systemInfo: SystemInfo): Promise<any | null> => {
  try {
    const BACKEND_URL = 'http://localhost:3001';
    
    // Construir múltiplas queries específicas baseadas nas características do sistema
    // Cada query foca em um aspecto diferente para capturar documentos relevantes
    const searchQueries: Array<{ query: string; aspect: string }> = [];
    
    // 1. Query sobre o nome e objetivo do sistema
    if (systemInfo.systemName && systemInfo.systemName.trim()) {
      searchQueries.push({
        query: `${systemInfo.systemName} sistema objetivo funcionalidade propósito`,
        aspect: 'Nome e Objetivo do Sistema'
      });
    }
    
    // 2. Query sobre componentes chave e arquitetura
    if (systemInfo.components && systemInfo.components.trim()) {
      searchQueries.push({
        query: `componentes arquitetura ${systemInfo.components} ${systemInfo.systemName}`,
        aspect: 'Componentes Chave'
      });
    }
    
    // 3. Query sobre dados críticos e sensíveis
    if (systemInfo.sensitiveData && systemInfo.sensitiveData.trim()) {
      searchQueries.push({
        query: `dados sensíveis confidenciais ${systemInfo.sensitiveData} proteção segurança`,
        aspect: 'Dados Críticos'
      });
    }
    
    // 4. Query sobre tecnologias e infraestrutura
    if (systemInfo.technologies && systemInfo.technologies.trim()) {
      searchQueries.push({
        query: `tecnologias stack infraestrutura ${systemInfo.technologies} vulnerabilidades`,
        aspect: 'Tecnologias e Infraestrutura'
      });
    }
    
    // 5. Query sobre autenticação e controle de acesso
    if (systemInfo.authentication && systemInfo.authentication.trim()) {
      searchQueries.push({
        query: `autenticação autorização ${systemInfo.authentication} controle acesso segurança`,
        aspect: 'Autenticação'
      });
    }
    
    // 6. Query sobre perfis de usuário e fluxos
    if (systemInfo.userProfiles && systemInfo.userProfiles.trim()) {
      searchQueries.push({
        query: `usuários perfis fluxos processos ${systemInfo.userProfiles} interações`,
        aspect: 'Fluxos de Usuário'
      });
    }
    
    // 7. Query sobre integrações externas
    if (systemInfo.externalIntegrations && systemInfo.externalIntegrations.trim()) {
      searchQueries.push({
        query: `integrações externas APIs ${systemInfo.externalIntegrations} comunicação`,
        aspect: 'Integrações Externas'
      });
    }
    
    // 8. Query geral baseada na descrição completa do sistema
    if (systemInfo.generalDescription && systemInfo.generalDescription.trim()) {
      const descriptionWords = systemInfo.generalDescription
        .split(/\s+/)
        .slice(0, 50) // Primeiras 50 palavras
        .join(' ');
      searchQueries.push({
        query: `threat modeling STRIDE ${descriptionWords}`,
        aspect: 'Descrição Geral'
      });
    }
    
    // Fallback se nenhuma query específica foi criada
    if (searchQueries.length === 0) {
      searchQueries.push({
        query: 'threat modeling security analysis STRIDE vulnerabilities',
        aspect: 'Análise Geral de Ameaças'
      });
    }
    
    console.log(`🔍 Realizando busca RAG com ${searchQueries.length} queries específicas para diferentes aspectos do sistema "${systemInfo.systemName}"`);
    
    // Realizar múltiplas buscas em paralelo
    const searchPromises = searchQueries.map(async ({ query, aspect }, index) => {
      console.log(`  ${index + 1}. Buscando: "${aspect}" - Query: "${query.substring(0, 60)}..."`);
      
      try {
        const response = await fetch(`${BACKEND_URL}/api/search/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query, 
            limit: 3, // Menos resultados por query, mas mais queries
            systemContext: systemInfo.systemName
          })
        });
        
        if (!response.ok) {
          console.warn(`  ⚠️ Busca falhou para aspecto "${aspect}"`);
          return null;
        }
        
        const context = await response.json();
        console.log(`  ✓ ${aspect}: ${context.sources?.length || 0} fontes encontradas`);
        
        return {
          aspect,
          context: context.context || '',
          sources: context.sources || [],
          confidence: context.confidence || 0
        };
      } catch (error) {
        console.warn(`  ⚠️ Erro na busca para "${aspect}":`, error);
        return null;
      }
    });
    
    // Aguardar todas as buscas
    const results = await Promise.all(searchPromises);
    const validResults = results.filter(r => r !== null && r.sources.length > 0);
    
    if (validResults.length === 0) {
      console.warn('⚠️ Nenhum contexto RAG encontrado em nenhuma das buscas');
      return null;
    }
    
    // Combinar resultados de todas as buscas
    const allSources: any[] = [];
    const seenSourceIds = new Set<string>();
    
    validResults.forEach(result => {
      result.sources.forEach((source: any) => {
        const sourceId = `${source.documento.metadata.documentId}-${source.documento.metadata.chunkIndex}`;
        if (!seenSourceIds.has(sourceId)) {
          seenSourceIds.add(sourceId);
          allSources.push({
            ...source,
            searchAspect: result.aspect // Adicionar informação sobre qual aspecto encontrou este chunk
          });
        }
      });
    });
    
    // Ordenar por score (relevância)
    allSources.sort((a, b) => b.score - a.score);
    
    // Limitar a um número razoável de fontes (top 15)
    const topSources = allSources.slice(0, 15);
    
    // Combinar contextos
    const combinedContext = validResults
      .map(result => `\n## ${result.aspect}\n${result.context}`)
      .join('\n\n---\n');
    
    // Calcular confiança média ponderada
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;
    
    console.log(`\n✅ Busca RAG concluída:`);
    console.log(`   - ${validResults.length} aspectos com resultados`);
    console.log(`   - ${topSources.length} fontes únicas encontradas`);
    const confidenceDisplay = (!isNaN(avgConfidence) && avgConfidence != null) ? avgConfidence.toFixed(1) : '0.0';
    console.log(`   - Confiança média: ${confidenceDisplay}%`);
    
    // Agrupar por documento para logging
    const docGroups = new Map<string, number>();
    topSources.forEach(source => {
      const docName = source.documento.metadata.documentName || 'Desconhecido';
      docGroups.set(docName, (docGroups.get(docName) || 0) + 1);
    });
    
    console.log(`\n📚 Documentos utilizados:`);
    docGroups.forEach((count, docName) => {
      console.log(`   - ${docName}: ${count} chunks`);
    });
    
    return {
      context: combinedContext,
      sources: topSources,
      totalDocuments: docGroups.size,
      confidence: avgConfidence,
      aspectsCovered: validResults.map(r => r.aspect)
    };
    
  } catch (error) {
    console.warn('⚠️ Erro ao buscar contexto RAG, continuando sem contexto:', error);
    return null;
  }
};

export const analyzeThreatsAndMitigations = async (
  systemInfo: SystemInfo,
  strideCapecMap: StrideCapecMapType
): Promise<IdentifiedThreat[]> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");
  
  // Buscar contexto RAG relevante
  const ragContext = await searchRAGContext(systemInfo);
  
  // Calcular complexidade da tarefa
  const complexity = calculateTaskComplexity(systemInfo, JSON.stringify(strideCapecMap));
  console.log(`[Gemini Service] Complexidade da análise detectada: ${complexity}`);
  
  // Construir contexto RAG para o prompt
  const ragContextSection = ragContext ? `

═══════════════════════════════════════════════════════════════════
CONTEXTO ADICIONAL DE CONHECIMENTO (RAG) - BUSCA SEMÂNTICA
═══════════════════════════════════════════════════════════════════

📊 ESTATÍSTICAS DA BUSCA:
- Total de fontes encontradas: ${ragContext.sources.length}
- Documentos únicos consultados: ${ragContext.totalDocuments}
- Confiança média da busca: ${(!isNaN(ragContext.confidence) && ragContext.confidence != null) ? ragContext.confidence.toFixed(1) : '0.0'}%

🎯 ASPECTOS DO SISTEMA COBERTOS PELA BUSCA:
${ragContext.aspectsCovered ? ragContext.aspectsCovered.map((aspect: string, i: number) => `${i + 1}. ${aspect}`).join('\n') : 'N/A'}

📚 DOCUMENTOS E CHUNKS UTILIZADOS:
${(ragContext.sources as any[]).map((source: any, index: number) => {
  const docName = source.documento.metadata.documentName || 'Documento';
  const aspect = source.searchAspect || 'Geral';
  const chunkIndex = source.documento.metadata.chunkIndex || 0;
  const score = (source.score != null && !isNaN(source.score)) ? source.score.toFixed(3) : 'N/A';
  return `${index + 1}. ${docName} (Chunk #${chunkIndex}, Score: ${score}) - Aspecto: ${aspect}`;
}).join('\n')}

📖 CONTEÚDO RELEVANTE ENCONTRADO:
${ragContext.context}

═══════════════════════════════════════════════════════════════════

📋 INSTRUÇÕES PARA USO DO CONTEXTO RAG:
✓ Use as informações do contexto acima para enriquecer sua análise de ameaças
✓ Dê atenção especial aos aspectos específicos do sistema que foram encontrados
✓ Referencie práticas, vulnerabilidades e padrões mencionados no contexto quando relevantes
✓ Adapte as mitigações sugeridas com base no conhecimento contextual específico do sistema
✓ Priorize ameaças relacionadas aos componentes, tecnologias e dados mencionados no contexto
✓ Mantenha consistência com as melhores práticas identificadas no contexto
✓ Se o contexto mencionar vulnerabilidades específicas das tecnologias usadas, inclua-as na análise

` : `

═══════════════════════════════════════════════════════════════════
⚠️  NOTA: Nenhum contexto RAG adicional disponível
═══════════════════════════════════════════════════════════════════

O sistema de busca semântica não encontrou documentos específicos sobre este sistema
na base de conhecimento. A análise será baseada apenas no conhecimento interno da IA
e no mapeamento STRIDE-CAPEC fornecido.

Recomendação: Para análises mais precisas, considere fazer upload de documentação
técnica, especificações de segurança ou análises anteriores relacionadas a este sistema.

`;
  
  const prompt = `${ragContextSection}
Informações do Sistema (em Português):
${JSON.stringify(systemInfo, null, 2)}

Mapeamento STRIDE para CAPEC (use estes CAPECs como sugestões para a categoria STRIDE relevante):
${JSON.stringify(strideCapecMap, null, 2)}

Tarefa (Responda em Português do Brasil):
Analise as informações do sistema fornecidas. Para cada componente e fluxo de dados significativo identificado, realize uma análise de ameaças STRIDE.
Para cada ameaça identificada:
1. Especifique o elemento do sistema (nome do componente ou descrição do fluxo).
2. Identifique a categoria STRIDE (use apenas o termo em inglês: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege).
3. Descreva um cenário de ameaça conciso e específico para este elemento e categoria STRIDE (em Português).
4. Selecione o ID e Nome CAPEC mais relevante do Mapeamento STRIDE para CAPEC fornecido para a categoria STRIDE identificada. Se múltiplos forem relevantes, escolha o principal. (Nomes CAPEC podem permanecer em Inglês).
5. Forneça uma breve descrição do padrão de ataque CAPEC selecionado, adaptada ao cenário (em Português).
6. Sugira recomendações de mitigação práticas e acionáveis (2-3 pontos chave, em Português).
7. Avalie o impacto potencial da ameaça, classificando como CRITICAL, HIGH, MEDIUM ou LOW, considerando o possível dano ao negócio, usuários ou dados.
8. Relacione a ameaça ao item mais relevante do OWASP TOP 10 (ex: "A01:2021 - Broken Access Control").

IMPORTANTE - IDIOMA:
- TODOS OS TEXTOS DEVEM ESTAR EM PORTUGUÊS DO BRASIL
- APENAS as categorias STRIDE devem permanecer em inglês (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- Nomes CAPEC podem permanecer em inglês, MAS suas descrições devem ser em português
- Classificações OWASP TOP 10 podem permanecer em inglês, mas qualquer texto explicativo deve ser em português
- Cenários de ameaça, descrições CAPEC e recomendações de mitigação DEVEM SER ESCRITOS EM PORTUGUÊS DO BRASIL

Saída:
Retorne o resultado como um array JSON de objetos. Cada objeto deve seguir esta estrutura exata (mantenha as chaves do JSON em inglês):
{
  "elementName": "string (nome do componente/fluxo como definido)",
  "strideCategory": "string (ex: 'Spoofing')",
  "threatScenario": "string (em Português)",
  "capecId": "string (ex: 'CAPEC-113')",
  "capecName": "string (ex: 'Session Hijacking')",
  "capecDescription": "string (descrição do ataque CAPEC, em Português)",
  "mitigationRecommendations": "string (passos de mitigação acionáveis, em Português)",
  "impact": "string (CRITICAL, HIGH, MEDIUM ou LOW)",
  "owaspTop10": "string (ex: 'A01:2021 - Broken Access Control')"
}

Importante:
- Assegure que a saída seja APENAS o array JSON. Não inclua nenhum outro texto, explicações ou formatação markdown como 'três crases' ou 'formatação markdown de código' fora do próprio array JSON.
- Forneça pelo menos 5-10 ameaças cobrindo diferentes componentes/fluxos e categorias STRIDE.
- TODO O CONTEÚDO DE TEXTO DENTRO DOS VALORES JSON (COMO threatScenario, capecDescription, mitigationRecommendations) DEVE ESTAR EM PORTUGUÊS DO BRASIL.
- REPITO: ESCREVA EM PORTUGUÊS DO BRASIL - apenas categorias STRIDE em inglês!

Exemplo (Ilustrativo - adapte aos elementos reais do sistema e use o mapeamento fornecido):
[
  {
    "elementName": "API de Autenticação de Usuário",
    "strideCategory": "Spoofing",
    "threatScenario": "Um invasor tenta se passar por um usuário legítimo enviando credenciais roubadas para o endpoint de login.",
    "capecId": "CAPEC-15",
    "capecName": "Credentials Dowsing",
    "capecDescription": "O invasor tenta sistematicamente adivinhar ou descobrir credenciais de login válidas através de vários métodos como força bruta ou phishing.",
    "mitigationRecommendations": "Implementar Autenticação Multi-Fator (MFA). Aplicar políticas de senha forte e mecanismos de bloqueio de conta. Monitorar tentativas de login suspeitas.",
    "impact": "HIGH",
    "owaspTop10": "A07:2021 - Identification and Authentication Failures"
  }
]
`;
  
  const response = await executeWithIntelligentRetry(prompt, 'ANALYSIS', complexity);
  const parsedThreatsData = parseJsonFromText(response.text);

  if (!Array.isArray(parsedThreatsData)) {
    console.error("Resposta da IA para ameaças não foi um array:", parsedThreatsData);
    throw new Error("A resposta da IA para ameaças não estava no formato de array esperado.");
  }

  return parsedThreatsData.map((threat: any, index: number) => ({
    ...threat,
    id: `threat-${index}-${Date.now()}`,
    elementName: threat.elementName || "N/D",
    strideCategory: threat.strideCategory || "N/D",
    threatScenario: threat.threatScenario || "N/D",
    capecId: threat.capecId || "N/D",
    capecName: threat.capecName || "N/D",
    capecDescription: threat.capecDescription || "N/D",
    mitigationRecommendations: threat.mitigationRecommendations || "N/D",
    impact: threat.impact || "N/D",
    owaspTop10: threat.owaspTop10 || "N/D",
  }));
};

/**
 * Gera uma árvore de ataque em Mermaid (graph TD ou mindmap) a partir das ameaças identificadas.
 * Retorna apenas o texto Mermaid válido.
 */
export const generateAttackTreeMermaid = async (
  systemInfo: SystemInfo,
  threats: IdentifiedThreat[]
): Promise<string> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");

  const complexity = calculateTaskComplexity(systemInfo, JSON.stringify(threats));

  try {
    // Prompt melhorado baseado na abordagem Python
    const prompt = `
Você é um especialista em modelagem de ameaças. Analise o sistema e as ameaças fornecidas e crie uma Árvore de Ataque estruturada.

Sistema:
${JSON.stringify(systemInfo, null, 2)}

Ameaças Identificadas:
${JSON.stringify(threats, null, 2)}

Tarefa: Crie uma árvore de ataque em formato Mermaid flowchart que organize as ameaças por categoria STRIDE.

Regras IMPORTANTES:
- Use APENAS "flowchart TD" como cabeçalho
- Organize em subgraphs por categoria STRIDE
- Para cada ameaça, crie: Elemento → CAPEC → Cenário
- Use IDs únicos e simples (ex: S1, S2, T1, T2)
- Evite caracteres especiais nos rótulos
- Mantenha rótulos curtos mas descritivos
- NÃO use mindmap ou sintaxes específicas de outros diagramas

Exemplo de estrutura esperada:
flowchart TD
  ROOT["Ataques ao Sistema"]
  subgraph S[Spoofing]
    S1[Elemento A] --> S1C[CAPEC-xxx: Nome]
    S1C --> S1S[Cenário curto]
  end
  subgraph T[Tampering]
    T1[Elemento B] --> T1C[CAPEC-yyy: Nome]
    T1C --> T1S[Cenário curto]
  end
  ROOT --> S
  ROOT --> T

Retorne APENAS o código Mermaid, sem explicações ou markdown.`;

    const response = await executeWithIntelligentRetry(prompt, 'ANALYSIS', complexity, 0);
    let text = (response.text || '').trim();
    
    // Validação e limpeza robusta
    if (!/^(flowchart|graph)\s+(TD|LR|BT|RL)/i.test(text) || /^mindmap/i.test(text)) {
      return buildFlowchartFromThreats(systemInfo, threats);
    }

    // Sanitização avançada baseada na abordagem Python
    text = sanitizeMermaidText(text);
    
    // Validação final
    if (isValidMermaidFlowchart(text)) {
      return text;
    }
    
    return buildFlowchartFromThreats(systemInfo, threats);
  } catch (e) {
    console.debug('IA retornou diagrama não padronizado, usando fallback.');
  }

  return buildFlowchartFromThreats(systemInfo, threats);
}

// Função de sanitização robusta baseada na abordagem Python
function sanitizeMermaidText(text: string): string {
  // Remove markdown code blocks
  text = text.replace(/^```\w*\n?|```$/g, '').trim();
  
  // Normaliza aspas e colchetes
  text = text.replace(/\[\"/g, '[').replace(/\"\]/g, ']').replace(/\"/g, "'");
  
  // Remove caracteres problemáticos para Mermaid
  text = text.replace(/[\/\\|{}()<>]/g, ' ');
  
  // Normaliza espaços múltiplos
  text = text.replace(/\s+/g, ' ');
  
  // Remove linhas vazias extras
  text = text.replace(/\n\s*\n/g, '\n');
  
  return text.trim();
}

// Validação de estrutura Mermaid válida
function isValidMermaidFlowchart(text: string): boolean {
  const lines = text.split('\n');
  const hasValidHeader = /^(flowchart|graph)\s+(TD|LR|BT|RL)/i.test(lines[0] || '');
  const hasNodes = lines.some(line => /\w+\[.*\]/.test(line));
  const hasConnections = lines.some(line => /\w+\s*-->\s*\w+/.test(line));
  
  return hasValidHeader && hasNodes && hasConnections;
}

// Função de fallback melhorada baseada na estrutura JSON Python
function buildFlowchartFromThreats(systemInfo: SystemInfo, threats: IdentifiedThreat[]): string {
  const rootTitle = `Ataques ao ${systemInfo.systemName || 'Sistema'}`;
  
  // Funções de sanitização
  const normalize = (s: string) => (s || 'N/D').replace(/\s+/g, ' ').trim();
  const safeLabel = (s: string) => normalize(s)
    .replace(/[\/\\|{}()<>\[\]"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Função para quebrar linhas longas
  const wrapText = (text: string, maxWidth: number = 25): string => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.join('<br/>');
  };
  
  const truncate = (s: string, n = 60) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  // Ordem das categorias STRIDE
  const categoryOrder = [
    'Spoofing', 'Tampering', 'Repudiation', 
    'Information Disclosure', 'Denial of Service', 'Elevation of Privilege'
  ];

  // Agrupa ameaças por categoria
  const byCategory: Record<string, IdentifiedThreat[]> = {};
  for (const th of threats) {
    const cat = String((th.strideCategory as string) || 'Other');
    (byCategory[cat] ||= []).push(th);
  }

  // Ordena categorias
  const catKeys = Object.keys(byCategory).sort((a, b) => {
    const ia = categoryOrder.indexOf(a);
    const ib = categoryOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  // Constrói o diagrama com layout mais vertical
  const lines: string[] = [];
  lines.push('flowchart TD');
  lines.push(`  ROOT[${safeLabel(truncate(rootTitle, 50))}]`);
  lines.push('  %% Configurações de layout para melhor visualização');
  lines.push('  classDef rootClass fill:#e1f5fe,stroke:#01579b,stroke-width:3px');
  lines.push('  classDef categoryClass fill:#fff3e0,stroke:#e65100,stroke-width:2px');
  lines.push('  classDef elementClass fill:#f3e5f5,stroke:#4a148c,stroke-width:1px');
  lines.push('  classDef capecClass fill:#e8f5e8,stroke:#1b5e20,stroke-width:1px');
  lines.push('  classDef scenarioClass fill:#fff8e1,stroke:#f57f17,stroke-width:1px');
  lines.push('  class ROOT rootClass');

  // Layout em colunas para melhor visualização
  catKeys.forEach((cat, catIdx) => {
    const catId = `CAT${catIdx}`;
    const catLabel = safeLabel(cat);
    
    lines.push(`  subgraph ${catId}[${catLabel}]`);
    lines.push(`    class ${catId} categoryClass`);
    
          byCategory[cat].forEach((th, i) => {
        const elId = `${catId}_E${i}`;
        const cId = `${catId}_C${i}`;
        const sId = `${catId}_S${i}`;
        
        const element = wrapText(safeLabel(th.elementName || 'Elemento'), 20);
        const capec = wrapText(safeLabel(
          th.capecId && th.capecName ? `${th.capecId}: ${th.capecName}` : (th.capecId || th.capecName || 'CAPEC')
        ), 25);
        const scenario = wrapText(safeLabel(th.threatScenario || 'Cenário'), 30);
        
        lines.push(`    ${elId}[${element}]`);
        lines.push(`    ${cId}[${capec}]`);
        lines.push(`    ${sId}[${scenario}]`);
        lines.push(`    class ${elId} elementClass`);
        lines.push(`    class ${cId} capecClass`);
        lines.push(`    class ${sId} scenarioClass`);
        
        // Conexões verticais mais claras
        lines.push(`    ${elId} --> ${cId}`);
        lines.push(`    ${cId} --> ${sId}`);
      });
    
    lines.push('  end');
    lines.push(`  ROOT --> ${catId}`);
  });

  return lines.join('\n');
}

export const refineAnalysis = async (
  systemInfo: SystemInfo,
  currentReportMarkdown: string,
  strideCapecMap: StrideCapecMapType
): Promise<{ threats: IdentifiedThreat[] }> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");

  // Calcular complexidade da tarefa de refinamento
  const complexity = calculateTaskComplexity(systemInfo, currentReportMarkdown);
  console.log(`[Gemini Service] Complexidade do refinamento detectada: ${complexity}`);

  const prompt = `
Contexto: Você é um especialista sênior em segurança cibernética revisando e refinando um relatório de modelagem de ameaças existente. O usuário forneceu uma versão inicial do relatório (em Markdown) que pode ter sido editada.

Informações Originais do Sistema (para referência):
${JSON.stringify(systemInfo, null, 2)}

Mapeamento STRIDE para CAPEC (para referência ao adicionar novas ameaças):
${JSON.stringify(strideCapecMap, null, 2)}

Relatório Atual (Markdown) para Refinar:
---
${currentReportMarkdown}
---

Tarefa (Responda em Português do Brasil):
Sua tarefa é refinar o relatório de modelagem de ameaças fornecido. Analise o conteúdo do Markdown, incluindo a descrição do sistema e as ameaças.

1.  **Refinar a Análise de Ameaças:**
    *   Revise a lista de ameaças existente no contexto do relatório.
    *   Mantenha as ameaças que ainda são válidas.
    *   Corrija quaisquer imprecisões nas ameaças existentes (cenários, mapeamentos CAPEC, etc.).
    *   Adicione **novas ameaças** que você identificar com base em sua experiência e no relatório atualizado. Garanta uma cobertura STRIDE abrangente.
    *   Remova ameaças que não são mais relevantes devido às mudanças.

2.  **Gerar Saída Estruturada:**
    - Com base em sua análise refinada, gere um objeto JSON contendo uma chave chamada 'threats', que deve ser um array JSON de objetos de ameaças, seguindo a mesma estrutura da análise original. Este array deve ser a lista completa e refinada de ameaças.

IMPORTANTE - IDIOMA:
- TODOS OS TEXTOS DEVEM ESTAR EM PORTUGUÊS DO BRASIL
- APENAS as categorias STRIDE devem permanecer em inglês (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- Nomes CAPEC podem permanecer em inglês, MAS suas descrições devem ser em português
- Classificações OWASP TOP 10 podem permanecer em inglês, mas qualquer texto explicativo deve ser em português
- Cenários de ameaça, descrições CAPEC e recomendações de mitigação DEVEM SER ESCRITOS EM PORTUGUÊS DO BRASIL
- REPITO: ESCREVA EM PORTUGUÊS DO BRASIL - apenas categorias STRIDE em inglês!

Estrutura do Objeto de Ameaça (mantenha as chaves em inglês):
{
  "elementName": "string",
  "strideCategory": "string",
  "threatScenario": "string",
  "capecId": "string",
  "capecName": "string",
  "capecDescription": "string",
  "mitigationRecommendations": "string",
  "impact": "string (CRITICAL, HIGH, MEDIUM ou LOW)",
  "owaspTop10": "string (ex: 'A01:2021 - Broken Access Control')"
}

Saída:
Retorne APENAS o objeto JSON principal. Não inclua nenhum outro texto, explicações ou formatação markdown como 'três crases' ou 'formatação markdown de código'.

Exemplo de Saída JSON:
{
  "threats": [
    {
      "elementName": "Frontend(App Web Refinado)",
      "strideCategory": "Information Disclosure",
      "threatScenario": "Um invasor explora uma vulnerabilidade de Cross-Site Scripting (XSS) para roubar tokens de sessão armazenados no navegador do usuário.",
      "capecId": "CAPEC-591",
      "capecName": "Stored XSS",
      "capecDescription": "O invasor tenta injetar script malicioso que é armazenado no servidor e servido a outros usuários, comprometendo suas sessões.",
      "mitigationRecommendations": "Implementar uma Política de Segurança de Conteúdo (CSP) forte. Validar e sanitizar todas as entradas do usuário no lado do servidor e do cliente. Usar codificação de saída apropriada.",
      "impact": "HIGH",
      "owaspTop10": "A03:2021 - Injection"
    }
    // ... outras ameaças refinadas
  ]
}
`;

  const response = await executeWithIntelligentRetry(prompt, 'REFINEMENT', complexity);
  const parsedResponse = parseJsonFromText(response.text);

  if (!parsedResponse || !Array.isArray(parsedResponse.threats)) {
    console.error("A resposta da IA para refinamento não continha 'threats':", parsedResponse);
    throw new Error("A resposta da IA para refinamento estava malformada.");
  }

  const threatsWithIds = parsedResponse.threats.map((threat: any, index: number) => ({
    ...threat,
    id: `threat-${index}-${Date.now()}`,
  }));

  return { threats: threatsWithIds };
};

/**
 * Usa a IA Gemini para resumir e formatar a descrição geral do sistema a partir de um texto livre.
 * @param fullDescription Texto livre informado pelo usuário sobre o sistema.
 * @returns Promise<Partial<SystemInfo>> com a descrição geral resumida e formatada.
 */
export const summarizeSystemDescription = async (fullDescription: string): Promise<Partial<SystemInfo>> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");
  if (!fullDescription) throw new Error("Descrição do sistema não informada.");
  
  // Para resumos, sempre usar complexidade simples
  const complexity = 'SIMPLE' as const;
  console.log(`[Gemini Service] Executando resumo do sistema com complexidade: ${complexity}`);
  
  const prompt = `
Você é um assistente de segurança da informação especializado em análise de sistemas. 

Leia a descrição completa do sistema abaixo e extraia/resuma de forma clara e objetiva os seguintes campos:

1. **generalDescription**: Resuma o objetivo e funcionamento geral do sistema em até 5-6 linhas, destacando os aspectos principais.

2. **components**: Liste os principais componentes/módulos do sistema de forma organizada (ex: frontend, backend, bancos de dados, serviços).

3. **sensitiveData**: Liste os tipos de dados sensíveis tratados pelo sistema (ex: dados pessoais, dados de saúde, financeiros, credenciais).

4. **technologies**: Liste as principais tecnologias, frameworks, linguagens e ferramentas utilizadas.

5. **authentication**: Descreva os mecanismos de autenticação e autorização implementados no sistema.

6. **userProfiles**: Liste os perfis/tipos de usuário que interagem com o sistema.

7. **externalIntegrations**: Liste as integrações externas, APIs de terceiros e sistemas conectados.

INSTRUÇÕES IMPORTANTES:
- TODOS OS TEXTOS DEVEM ESTAR EM PORTUGUÊS DO BRASIL
- Seja conciso mas informativo
- Se a descrição não mencionar explicitamente algum campo, tente inferir a partir do contexto
- Se realmente não houver informação disponível, use "Não informado" ou "Não especificado"
- Mantenha formatação clara com quebras de linha quando apropriado
- ESCREVA TUDO EM PORTUGUÊS DO BRASIL

Responda APENAS com um objeto JSON com as chaves exatamente como especificado, sem explicações ou texto extra fora do JSON.

Descrição completa do sistema:
"""
${fullDescription}
"""

Saída esperada (exemplo de estrutura):
{
  "generalDescription": "Sistema de gestão...",
  "components": "Frontend: React, Angular\nBackend: Node.js, Python\nBanco de Dados: MySQL, MongoDB",
  "sensitiveData": "Dados pessoais (CPF, nome, endereço)\nDados de saúde (prescrições)\nDados financeiros",
  "technologies": "Node.js, Python, MySQL, Redis, Docker",
  "authentication": "JWT, OAuth 2.0, Certificação Digital ICP-Brasil",
  "userProfiles": "Administrador, Farmacêutico, Cliente, Gerente",
  "externalIntegrations": "ANVISA (SNGPC), Operadoras de Saúde, APIs de Delivery"
}
`;

  const response = await executeWithIntelligentRetry(prompt, 'SUMMARY', complexity);
  const result = parseJsonFromText(response.text);
  
  // Garantir que todos os campos existam
  return {
    generalDescription: result.generalDescription || "Não informado",
    components: result.components || "Não informado",
    sensitiveData: result.sensitiveData || "Não informado",
    technologies: result.technologies || "Não informado",
    authentication: result.authentication || "Não informado",
    userProfiles: result.userProfiles || "Não informado",
    externalIntegrations: result.externalIntegrations || "Não informado"
  };
};