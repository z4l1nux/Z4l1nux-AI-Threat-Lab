import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { ThreatModelingState } from "../types/AgentTypes";

/**
 * Schema de entrada para busca de OWASP
 */
const SearchOwaspSchema = z.object({
  componentType: z.enum([
    "ai", 
    "ml", 
    "llm", 
    "rag",
    "web", 
    "api", 
    "database", 
    "mobile",
    "cloud",
    "general"
  ]).describe("Tipo de componente para determinar o framework OWASP apropriado"),
  
  keyword: z.string().optional().describe("Palavra-chave para busca específica (ex: 'injection', 'authentication', 'prompt')"),
  
  limit: z.number().optional().default(5).describe("Número máximo de resultados")
});

/**
 * Ferramenta: Busca OWASP Top 10 / LLM Top 10
 * 
 * Esta ferramenta permite que o agente busque as categorias apropriadas
 * do OWASP Top 10 (para componentes tradicionais) ou OWASP LLM Top 10
 * (para componentes de IA/ML).
 * 
 * Uso pelo LLM:
 * - Para identificar a categoria OWASP correta de uma ameaça
 * - Para entender os riscos específicos de um tipo de componente
 * - Para validar se está usando o framework correto (Web vs LLM)
 */
export class SearchOwaspTool extends StructuredTool {
  name = "search_owasp";
  description = `Busca categorias OWASP Top 10 ou OWASP LLM Top 10 apropriadas para um componente.

Use esta ferramenta quando:
- Precisar identificar a categoria OWASP de uma ameaça
- Quiser saber se deve usar OWASP Web (A01-A10) ou OWASP LLM (LLM01-LLM10)
- Precisar de contexto sobre riscos específicos de um tipo de componente

Entrada:
- componentType: Tipo do componente (ai/ml/llm/rag para OWASP LLM, web/api/database para OWASP Web)
- keyword (opcional): Palavra-chave para busca específica
- limit (opcional): Número máximo de resultados (padrão: 5)

Retorna: Lista de categorias OWASP relevantes com ID, nome e descrição.`;

  schema = SearchOwaspSchema;

  /**
   * Base de conhecimento OWASP integrada
   * (Alternativa: poderia buscar do RAG ou Neo4j)
   */
  private owaspLLMTop10 = [
    { id: "LLM01", name: "Prompt Injection", description: "Manipulação de prompts para alterar comportamento do LLM", keywords: ["prompt", "injection", "manipulation", "jailbreak"] },
    { id: "LLM02", name: "Insecure Output Handling", description: "Tratamento inadequado de saídas do LLM", keywords: ["output", "validation", "sanitization", "xss"] },
    { id: "LLM03", name: "Training Data Poisoning", description: "Manipulação de dados de treinamento", keywords: ["training", "poison", "data", "backdoor"] },
    { id: "LLM04", name: "Model Denial of Service", description: "Sobrecarga ou travamento do modelo", keywords: ["dos", "denial", "resource", "overload"] },
    { id: "LLM05", name: "Supply Chain Vulnerabilities", description: "Vulnerabilidades em dependências e componentes externos", keywords: ["supply", "chain", "dependency", "third-party", "api"] },
    { id: "LLM06", name: "Sensitive Information Disclosure", description: "Exposição de dados sensíveis", keywords: ["disclosure", "leak", "pii", "sensitive", "data"] },
    { id: "LLM07", name: "Insecure Plugin Design", description: "Plugins inseguros ou mal projetados", keywords: ["plugin", "extension", "integration", "tool"] },
    { id: "LLM08", name: "Excessive Agency", description: "Autonomia excessiva do LLM", keywords: ["agency", "autonomy", "permission", "privilege"] },
    { id: "LLM09", name: "Overreliance", description: "Dependência excessiva sem validação", keywords: ["overreliance", "trust", "validation", "hallucination"] },
    { id: "LLM10", name: "Model Theft", description: "Roubo ou extração do modelo", keywords: ["theft", "extraction", "clone", "steal"] }
  ];

  private owaspWebTop10 = [
    { id: "A01:2021", name: "Broken Access Control", description: "Controle de acesso inadequado", keywords: ["access", "authorization", "permission", "privilege"] },
    { id: "A02:2021", name: "Cryptographic Failures", description: "Falhas criptográficas", keywords: ["encryption", "crypto", "tls", "ssl", "hash"] },
    { id: "A03:2021", name: "Injection", description: "Injeção de código ou comandos", keywords: ["injection", "sql", "xss", "command", "code"] },
    { id: "A04:2021", name: "Insecure Design", description: "Design inseguro", keywords: ["design", "architecture", "threat", "modeling"] },
    { id: "A05:2021", name: "Security Misconfiguration", description: "Configuração incorreta de segurança", keywords: ["config", "misconfiguration", "default", "settings"] },
    { id: "A06:2021", name: "Vulnerable and Outdated Components", description: "Componentes vulneráveis ou desatualizados", keywords: ["outdated", "vulnerable", "dependency", "version"] },
    { id: "A07:2021", name: "Identification and Authentication Failures", description: "Falhas de identificação e autenticação", keywords: ["authentication", "auth", "password", "session", "token"] },
    { id: "A08:2021", name: "Software and Data Integrity Failures", description: "Falhas de integridade", keywords: ["integrity", "tampering", "deserialization", "pipeline"] },
    { id: "A09:2021", name: "Security Logging and Monitoring Failures", description: "Falhas de logging e monitoramento", keywords: ["logging", "monitoring", "audit", "detection"] },
    { id: "A10:2021", name: "Server-Side Request Forgery (SSRF)", description: "Falsificação de requisições do lado do servidor", keywords: ["ssrf", "request", "forgery", "server"] }
  ];

  async _call(input: z.infer<typeof SearchOwaspSchema>): Promise<string> {
    try {
      // Determinar qual lista OWASP usar
      const isAIComponent = ["ai", "ml", "llm", "rag"].includes(input.componentType);
      const owaspList = isAIComponent ? this.owaspLLMTop10 : this.owaspWebTop10;
      const framework = isAIComponent ? "OWASP LLM Top 10" : "OWASP Top 10 (2021)";
      
      // Filtrar por keyword se fornecida
      let results = owaspList;
      if (input.keyword) {
        const keywordLower = input.keyword.toLowerCase();
        results = owaspList.filter(item => 
          item.name.toLowerCase().includes(keywordLower) ||
          item.description.toLowerCase().includes(keywordLower) ||
          item.keywords.some(k => k.includes(keywordLower))
        );
      }
      
      // Limitar resultados
      results = results.slice(0, input.limit || 5);
      
      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          framework: framework,
          message: `Nenhuma categoria encontrada${input.keyword ? ` para keyword '${input.keyword}'` : ''}`,
          suggestion: "Tente uma keyword diferente ou use componentType='general'"
        });
      }
      
      return JSON.stringify({
        found: true,
        framework: framework,
        count: results.length,
        categories: results.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description
        })),
        message: `Encontradas ${results.length} categorias ${framework} para componente tipo '${input.componentType}'`
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar OWASP:', error);
      return JSON.stringify({
        found: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao buscar categorias OWASP'
      });
    }
  }
}

/**
 * Factory para criar a ferramenta com estado
 */
export function createSearchOwaspTool(state?: ThreatModelingState): SearchOwaspTool {
  return new SearchOwaspTool();
}

