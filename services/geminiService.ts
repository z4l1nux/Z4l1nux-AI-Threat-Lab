import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SystemInfo, IdentifiedThreat, StrideCapecMapType } from '../types';

const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY; // Support common env var names

if (!API_KEY) {
  console.warn(
    "A chave da API Gemini não está configurada em process.env.GEMINI_API_KEY ou process.env.API_KEY. As funcionalidades de IA não funcionarão."
  );
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const TEXT_MODEL = 'gemini-1.5-flash-latest';

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

export const analyzeThreatsAndMitigations = async (
  systemInfo: SystemInfo,
  strideCapecMap: StrideCapecMapType
): Promise<IdentifiedThreat[]> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");
  const prompt = `
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
  const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
  });
  
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

export const refineAnalysis = async (
  systemInfo: SystemInfo,
  currentReportMarkdown: string,
  strideCapecMap: StrideCapecMapType
): Promise<{ threats: IdentifiedThreat[] }> => {
  if (!ai) throw new Error("Chave da API Gemini não configurada.");

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

  const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" }
  });

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
  const prompt = `
Você é um assistente de segurança da informação. Leia a descrição completa do sistema abaixo e extraia de forma clara e objetiva os seguintes campos, preenchendo cada um deles (mesmo que seja 'Não informado' se não houver dado):

- generalDescription: Resuma o objetivo e funcionamento geral do sistema em até 4 linhas.
- components: Liste os principais componentes do sistema.
- sensitiveData: Liste os dados sensíveis tratados pelo sistema.
- technologies: Liste as principais tecnologias utilizadas.
- authentication: Descreva os mecanismos de autenticação/autorização.
- userProfiles: Liste os perfis de usuário existentes.
- externalIntegrations: Liste as integrações externas relevantes.

Responda APENAS com um objeto JSON com as chaves exatamente como acima, sem explicações ou texto extra.

Descrição completa do sistema:
"""
${fullDescription}
"""

Saída esperada:
{
  "generalDescription": "...",
  "components": "...",
  "sensitiveData": "...",
  "technologies": "...",
  "authentication": "...",
  "userProfiles": "...",
  "externalIntegrations": "..."
}
`;
  const response: GenerateContentResponse = await ai.models.generateContent({
    model: TEXT_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" }
  });
  return parseJsonFromText(response.text);
};