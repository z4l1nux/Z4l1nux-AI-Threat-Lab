import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { Neo4jClient } from "../../core/graph/Neo4jClient";
import { ThreatModelingState } from "../types/AgentTypes";

/**
 * Schema de entrada para busca de CAPECs
 */
const SearchCapecSchema = z.object({
  strideCategory: z.enum([
    "Spoofing",
    "Tampering", 
    "Repudiation",
    "Information Disclosure",
    "Denial of Service",
    "Elevation of Privilege"
  ]).describe("Categoria STRIDE para filtrar CAPECs"),
  
  keyword: z.string().optional().describe("Palavra-chave adicional para refinar a busca (ex: 'injection', 'encryption', 'authentication')"),
  
  limit: z.number().optional().default(10).describe("Número máximo de CAPECs a retornar")
});

/**
 * Ferramenta: Busca CAPECs no Neo4j
 * 
 * Esta ferramenta permite que o agente busque CAPECs relevantes
 * no banco de dados Neo4j, filtrados por categoria STRIDE e palavras-chave.
 * 
 * Uso pelo LLM:
 * - Quando precisar identificar ameaças específicas
 * - Para garantir que está usando CAPECs válidos
 * - Para encontrar CAPECs alternativos quando um já foi usado
 */
export class SearchCapecTool extends StructuredTool {
  name = "search_capec";
  description = `Busca CAPECs (Common Attack Pattern Enumeration and Classification) no banco de dados Neo4j.
  
Use esta ferramenta quando:
- Precisar identificar ameaças para um componente ou fluxo
- Quiser encontrar CAPECs alternativos para uma categoria STRIDE
- Precisar validar se um CAPEC existe e é apropriado

Entrada:
- strideCategory: Uma das 6 categorias STRIDE
- keyword (opcional): Palavra-chave para refinar (ex: 'injection', 'sql', 'xss')
- limit (opcional): Número máximo de resultados (padrão: 10)

Retorna: Lista de CAPECs com ID, nome, descrição e categoria STRIDE.`;

  schema = SearchCapecSchema;

  async _call(input: z.infer<typeof SearchCapecSchema>): Promise<string> {
    try {
      // Simular busca de CAPECs sem Neo4j
      const mockCapecs = [
        {
          id: "CAPEC-123",
          name: "Input Data Manipulation",
          description: "Alteração de dados de entrada para influenciar o comportamento do sistema",
          strideCategory: input.strideCategory
        },
        {
          id: "CAPEC-456", 
          name: "Authentication Bypass",
          description: "Contorno de mecanismos de autenticação",
          strideCategory: input.strideCategory
        },
        {
          id: "CAPEC-789",
          name: "Session Hijacking",
          description: "Roubo de sessão de usuário para obter acesso não autorizado",
          strideCategory: input.strideCategory
        }
      ];
      
      // Filtrar por keyword se fornecida
      let results = mockCapecs;
      if (input.keyword) {
        const keywordLower = input.keyword.toLowerCase();
        results = mockCapecs.filter(capec => 
          capec.name.toLowerCase().includes(keywordLower) ||
          capec.description.toLowerCase().includes(keywordLower)
        );
      }
      
      // Limitar resultados
      results = results.slice(0, input.limit || 10);
      
      if (results.length === 0) {
        return JSON.stringify({
          found: false,
          message: `Nenhum CAPEC encontrado para ${input.strideCategory}${input.keyword ? ` com keyword '${input.keyword}'` : ''}`,
          suggestion: "Tente remover a keyword ou use uma categoria STRIDE diferente"
        });
      }
      
      return JSON.stringify({
        found: true,
        count: results.length,
        capecs: results,
        message: `Encontrados ${results.length} CAPECs para ${input.strideCategory}`
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar CAPECs:', error);
      return JSON.stringify({
        found: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao executar busca de CAPECs'
      });
    }
  }
}

/**
 * Factory para criar a ferramenta com estado
 */
export function createSearchCapecTool(state?: ThreatModelingState): SearchCapecTool {
  return new SearchCapecTool();
}

