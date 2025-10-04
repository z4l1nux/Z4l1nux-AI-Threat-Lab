import { z } from 'zod';

/**
 * Utilitário para validação e correção de JSON baseado na comunidade
 * Baseado nas melhores práticas encontradas na pesquisa
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  corrected?: boolean;
}

/**
 * Valida e corrige JSON usando Zod schema
 */
export function validateAndCorrectJson<T>(
  jsonString: string,
  schema: z.ZodSchema<T>,
  maxRetries: number = 3
): ValidationResult<T> {
  // Tentar parsear o JSON primeiro
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    // Tentar corrigir JSON malformado
    const corrected = attemptJsonCorrection(jsonString);
    if (corrected) {
      try {
        parsed = JSON.parse(corrected);
      } catch (correctedError) {
        return {
          success: false,
          error: `JSON inválido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        };
      }
    } else {
      return {
        success: false,
        error: `JSON inválido: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }

  // Validar com schema Zod
  const result = schema.safeParse(parsed);
  
  if (result.success) {
    return {
      success: true,
      data: result.data,
      corrected: jsonString !== JSON.stringify(parsed)
    };
  }

  return {
    success: false,
    error: `Validação falhou: ${result.error.issues.map(i => i.message).join(', ')}`
  };
}

/**
 * Tenta corrigir JSON malformado usando técnicas da comunidade
 */
function attemptJsonCorrection(jsonString: string): string | null {
  try {
    // Remover caracteres de controle e espaços extras
    let corrected = jsonString
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();

    // Tentar corrigir vírgulas ausentes
    corrected = corrected
      .replace(/"\s*}/g, '"}') // "} -> "}
      .replace(/"\s*]/g, '"]') // "] -> "]
      .replace(/,(\s*[}\]])/g, '$1'); // Remove vírgulas desnecessárias

    // Tentar corrigir aspas ausentes em chaves
    corrected = corrected.replace(/(\w+):/g, '"$1":');

    // Verificar se está balanceado
    const openBraces = (corrected.match(/\{/g) || []).length;
    const closeBraces = (corrected.match(/\}/g) || []).length;
    const openBrackets = (corrected.match(/\[/g) || []).length;
    const closeBrackets = (corrected.match(/\]/g) || []).length;

    if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
      return null;
    }

    return corrected;
  } catch {
    return null;
  }
}

/**
 * Cria um schema Zod simplificado para ameaças
 */
export function createThreatSchema() {
  return z.object({
    threats: z.array(
      z.object({
        elementName: z.string(),
        strideCategory: z.string(),
        threatScenario: z.string().optional(),
        capecId: z.string().optional(),
        capecName: z.string().optional(),
        capecDescription: z.string().optional(),
        mitigationRecommendations: z.string().optional(),
        impact: z.string().optional(),
        owaspTop10: z.string().optional()
      })
    )
  });
}

/**
 * Cria um schema Zod simplificado para resumo de sistema
 */
export function createSystemSummarySchema() {
  return z.object({
    generalDescription: z.string(),
    components: z.string(),
    sensitiveData: z.string(),
    technologies: z.string(),
    authentication: z.string(),
    userProfiles: z.string(),
    externalIntegrations: z.string()
  });
}

/**
 * Cria um schema Zod para Mermaid
 */
export function createMermaidSchema() {
  return z.object({
    mermaid: z.string()
  });
}
