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
      const neo4jClient = Neo4jClient.getInstance();
      
      // Buscar CAPECs no Neo4j
      const query = `
        MATCH (capec:CAPEC)
        WHERE capec.strideCategory = $strideCategory
        ${input.keyword ? `AND (
          toLower(capec.name) CONTAINS toLower($keyword) OR 
          toLower(capec.description) CONTAINS toLower($keyword)
        )` : ''}
        RETURN capec.id AS id, capec.name AS name, 
               capec.description AS description, 
               capec.strideCategory AS strideCategory
        LIMIT $limit
      `;
      
      const params = {
        strideCategory: input.strideCategory,
        keyword: input.keyword || '',
        limit: input.limit || 10
      };
      
      const result = await Neo4jClient.executeQuery(query, params);
      
      if (!result || result.length === 0) {
        return JSON.stringify({
          found: false,
          message: `Nenhum CAPEC encontrado para ${input.strideCategory}${input.keyword ? ` com keyword '${input.keyword}'` : ''}`,
          suggestion: "Tente remover a keyword ou use uma categoria STRIDE diferente"
        });
      }
      
      // Formatar resultados
      const capecs = result.map((record: any) => ({
        id: record.id,
        name: record.name,
        description: record.description,
        strideCategory: record.strideCategory
      }));
      
      return JSON.stringify({
        found: true,
        count: capecs.length,
        capecs: capecs,
        message: `Encontrados ${capecs.length} CAPECs para ${input.strideCategory}`
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar CAPECs:', error);
      return JSON.stringify({
        found: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao executar busca no Neo4j'
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

