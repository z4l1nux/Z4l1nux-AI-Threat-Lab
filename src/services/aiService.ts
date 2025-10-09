import { SystemInfo, IdentifiedThreat, StrideCapecMapType } from '../../types';

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
            description: "Categoria OWASP Top 10 relacionada"
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
    
    throw new Error(`Falha ao fazer parse da resposta JSON da IA: ${parseError}`);
  }
};

// Função RAG ultra-otimizada - apenas 1 query inteligente
const searchRAGContext = async (systemInfo: SystemInfo, modelConfig?: any): Promise<{
  context: string;
  sources: any[];
  totalDocuments: number;
  confidence: number;
  aspectsCovered: string[];
} | null> => {
  try {
    const BACKEND_URL = 'http://localhost:3001';
    
    // Query única e inteligente baseada no sistema
    const systemKeywords = [
      systemInfo.systemName,
      systemInfo.components?.split(',').slice(0, 2).join(' '),
      systemInfo.technologies?.split(',').slice(0, 2).join(' ')
    ].filter(Boolean).join(' ');
    
    const query = `threat modeling STRIDE ${systemKeywords}`;
    
    console.log(`🔍 RAG otimizado: "${query.substring(0, 60)}..."`);
    
        const response = await fetch(`${BACKEND_URL}/api/search/context`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            query, 
        limit: 3, // Apenas 3 resultados mais relevantes
            systemContext: systemInfo.systemName,
        modelConfig
          })
        });
        
        if (!response.ok) {
      console.warn('⚠️ RAG indisponível, continuando sem contexto');
          return null;
        }
        
    const result = await response.json();
    
    if (!result.sources || result.sources.length === 0) {
      console.warn('⚠️ Nenhum resultado RAG encontrado');
      return null;
    }
    
    console.log(`✅ RAG: ${result.sources.length} fontes (confiança: ${result.confidence?.toFixed(1) || '0.0'}%)`);
    
    return {
      context: result.context || '',
      sources: result.sources,
      totalDocuments: result.totalDocuments || 1,
      confidence: result.confidence || 0,
      aspectsCovered: ['Análise Geral']
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
  // Buscar contexto RAG relevante (otimizado)
  const ragContext = await searchRAGContext(systemInfo, modelConfig);
  
  // Calcular complexidade da tarefa
  console.log(`[AI Service] Complexidade da análise detectada: ${calculateTaskComplexity(systemInfo, JSON.stringify(strideCapecMap))}`);
  
  // Construir contexto RAG para o prompt (versão ultra-otimizada)
  const ragContextSection = ragContext ? `
CONTEXTO RAG (${ragContext.sources.length} fontes, confiança: ${ragContext.confidence?.toFixed(1) || '0.0'}%):
${ragContext.context.substring(0, 1000)}...

` : `
⚠️ Sem contexto RAG. Use conhecimento geral e mapeamento STRIDE-CAPEC.

`;
  
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

MAPEAMENTO STRIDE-CAPEC DISPONÍVEL:
${strideCapecMap.map(entry => 
  `${entry.stride}:\n${entry.capecs.slice(0, 5).map(c => `  - ${c.id}: ${c.name}`).join('\n')}`
).join('\n\n')}

🔍 DEBUG: Mapeamento STRIDE-CAPEC carregado com ${strideCapecMap.length} categorias

INSTRUÇÕES CRÍTICAS - OBRIGATÓRIO SEGUIR TODAS:
1. Para cada ameaça, identifique um COMPONENTE ESPECÍFICO do sistema listado acima como elementName
2. OBRIGATÓRIO: Use APENAS os CAPECs listados no mapeamento acima - NÃO invente CAPECs
3. OBRIGATÓRIO: Para cada CAPEC usado, forneça o ID exato e nome correto do mapeamento
4. OBRIGATÓRIO: Crie cenários de ameaça específicos para o sistema SuperMax Retail Management Platform
5. OBRIGATÓRIO: Forneça mitigações específicas e detalhadas, não genéricas
6. OBRIGATÓRIO: Para cada categoria STRIDE, escolha um CAPEC diferente da lista
7. OBRIGATÓRIO: Forneça descrição detalhada do CAPEC escolhido
8. OBRIGATÓRIO: Inclua categoria OWASP Top 10 apropriada para cada ameaça
9. OBRIGATÓRIO: TODOS os campos devem ser preenchidos - NÃO deixe campos vazios

EXEMPLO DE RESPOSTA CORRETA - SEGUIR EXATAMENTE ESTE FORMATO:
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

⚠️ ATENÇÃO: A resposta DEVE incluir TODOS os campos acima. NÃO omita nenhum campo.

Analise e retorne JSON objeto com array de ameaças STRIDE:
{"threats":[{"elementName":"COMPONENTE_ESPECÍFICO_DO_SISTEMA","strideCategory":"Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege","threatScenario":"string","capecId":"string","capecName":"string","capecDescription":"string","mitigationRecommendations":"string","impact":"CRITICAL|HIGH|MEDIUM|LOW","owaspTop10":"string"}]}

5-6 ameaças em português, cada uma focada em um componente específico diferente do sistema.

🚨 VALIDAÇÃO FINAL OBRIGATÓRIA:
- Cada ameaça DEVE ter: elementName, strideCategory, threatScenario, capecId, capecName, capecDescription, mitigationRecommendations, impact, owaspTop10
- Use APENAS CAPECs do mapeamento fornecido acima
- NÃO invente CAPECs
- NÃO omita campos
- Siga EXATAMENTE o formato do exemplo
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

  // Validar e processar ameaças
  const threats: IdentifiedThreat[] = threatsArray.map((threat: any, index: number) => {
    // Validar se todos os campos obrigatórios estão presentes
    if (!threat.capecId || !threat.capecName || !threat.capecDescription) {
      console.warn(`⚠️ Ameaça ${index + 1} com dados CAPEC incompletos:`, threat);
    }
    
    return {
      id: `threat-${Date.now()}-${index}`,
      elementName: threat.elementName || `Elemento ${index + 1}`,
      strideCategory: threat.strideCategory || 'Information Disclosure',
      threatScenario: threat.threatScenario || 'Cenário de ameaça não especificado',
      capecId: threat.capecId || 'CAPEC-NOT-FOUND',
      capecName: threat.capecName || 'CAPEC não encontrado',
      capecDescription: threat.capecDescription || 'Descrição CAPEC não disponível',
      mitigationRecommendations: threat.mitigationRecommendations || 'Implementar controles de segurança apropriados',
      impact: threat.impact || 'MEDIUM',
      owaspTop10: threat.owaspTop10 || 'A1:2021 - Broken Access Control'
    };
  });

  console.log(`✅ Análise de ameaças concluída: ${threats.length} ameaças identificadas`);
  return threats;
};

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
Você é um especialista em análise de sistemas. Analise a descrição fornecida e extraia informações estruturadas.

DESCRIÇÃO DO SISTEMA:
${fullDescription}

Extraia e retorne um JSON com:
{
  "generalDescription": "Resumo claro do sistema em 2-3 frases",
  "components": "Lista de componentes principais separados por vírgula",
  "sensitiveData": "Tipos de dados sensíveis identificados",
  "technologies": "Tecnologias e frameworks mencionados",
  "authentication": "Métodos de autenticação identificados",
  "userProfiles": "Perfis de usuário mencionados",
  "externalIntegrations": "Integrações externas identificadas"
}

Seja conciso e focado apenas no que está explicitamente mencionado.
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