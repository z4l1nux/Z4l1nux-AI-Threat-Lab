import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { ThreatModelingState } from "../types/AgentTypes";

/**
 * Schema de entrada para validação de unicidade
 */
const ValidateUniqueSchema = z.object({
  capecId: z.string().describe("ID do CAPEC a validar (ex: 'CAPEC-242')"),
  
  componentName: z.string().optional().describe("Nome do componente onde seria usado")
});

/**
 * Ferramenta: Valida Unicidade de CAPECs
 * 
 * Esta ferramenta verifica se um CAPEC já foi usado em outra ameaça,
 * garantindo a unicidade exigida pela análise STRIDE.
 * 
 * Uso pelo LLM:
 * - SEMPRE antes de adicionar uma ameaça ao relatório
 * - Quando encontrar um CAPEC que parece apropriado
 * - Para verificar se precisa buscar um CAPEC alternativo
 */
export class ValidateUniqueTool extends StructuredTool {
  name = "validate_capec_unique";
  description = `Valida se um CAPEC já foi usado em outra ameaça.

CRÍTICO: Use esta ferramenta SEMPRE antes de adicionar uma ameaça!

A análise STRIDE exige que cada CAPEC seja usado apenas uma vez no relatório.
Esta ferramenta verifica no estado atual se o CAPEC já foi utilizado.

Entrada:
- capecId: ID do CAPEC a validar (ex: 'CAPEC-242')
- componentName (opcional): Nome do componente onde seria usado

Retorna:
- isUnique: true/false
- usedIn: Onde o CAPEC já foi usado (se aplicável)
- suggestion: Sugestão de ação (buscar alternativo, etc.)`;

  schema = ValidateUniqueSchema;
  
  // Referência ao estado compartilhado
  private state?: ThreatModelingState;

  constructor(state?: ThreatModelingState) {
    super();
    this.state = state;
  }

  async _call(input: z.infer<typeof ValidateUniqueSchema>): Promise<string> {
    try {
      if (!this.state) {
        return JSON.stringify({
          isUnique: true,
          message: "Estado não disponível, assumindo único",
          warning: "Não foi possível validar completamente"
        });
      }
      
      const capecId = input.capecId.toUpperCase();
      const isUsed = this.state.usedCapecs.has(capecId);
      
      if (!isUsed) {
        return JSON.stringify({
          isUnique: true,
          capecId: capecId,
          message: `${capecId} está disponível e pode ser usado`,
          action: "Pode prosseguir com este CAPEC"
        });
      }
      
      // Encontrar onde foi usado
      const usedThreat = this.state.threats.find(t => t.capecId === capecId);
      
      return JSON.stringify({
        isUnique: false,
        capecId: capecId,
        alreadyUsedIn: {
          component: usedThreat?.elementName,
          strideCategory: usedThreat?.strideCategory
        },
        message: `${capecId} JÁ FOI USADO em '${usedThreat?.elementName}'`,
        suggestion: `Busque um CAPEC alternativo usando search_capec com a mesma categoria STRIDE`,
        action: "REJEITAR este CAPEC e buscar outro"
      });
      
    } catch (error) {
      console.error('❌ Erro ao validar unicidade:', error);
      return JSON.stringify({
        isUnique: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao validar unicidade - por segurança, rejeitar',
        suggestion: "Busque um CAPEC alternativo"
      });
    }
  }
}

/**
 * Factory para criar a ferramenta com estado
 */
export function createValidateUniqueTool(state: ThreatModelingState): ValidateUniqueTool {
  return new ValidateUniqueTool(state);
}

