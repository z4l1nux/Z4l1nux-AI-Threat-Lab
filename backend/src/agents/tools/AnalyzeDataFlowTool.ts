import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { ThreatModelingState } from "../types/AgentTypes";

/**
 * Schema de entrada para análise de fluxo de dados
 */
const AnalyzeDataFlowSchema = z.object({
  from: z.string().describe("Componente de origem do fluxo"),
  
  to: z.string().describe("Componente de destino do fluxo"),
  
  encrypted: z.boolean().optional().default(false).describe("Se o fluxo usa criptografia (TLS/SSL)"),
  
  trustBoundary: z.enum([
    "internal",
    "external-to-internal",
    "internal-to-external", 
    "internal-to-third-party",
    "cross-boundary"
  ]).optional().default("internal").describe("Tipo de trust boundary atravessado")
});

/**
 * Ferramenta: Analisa Fluxos de Dados
 * 
 * Esta ferramenta analisa fluxos de dados entre componentes e identifica
 * ameaças específicas baseadas em:
 * - Criptografia do canal
 * - Trust boundaries atravessadas
 * - Tipo de dados trafegados
 * 
 * Uso pelo LLM:
 * - Para identificar ameaças em comunicações entre componentes
 * - Especialmente importante para fluxos cross-boundary
 * - Para validar se dados sensíveis estão protegidos
 */
export class AnalyzeDataFlowTool extends StructuredTool {
  name = "analyze_data_flow";
  description = `Analisa fluxos de dados entre componentes e identifica ameaças específicas.

Use esta ferramenta quando:
- Precisar analisar comunicação entre dois componentes
- Identificar ameaças em fluxos cross-boundary (External→Internal, Internal→Third-party)
- Verificar se dados sensíveis estão protegidos em trânsito

Entrada:
- from: Componente de origem
- to: Componente de destino
- encrypted: Se usa TLS/SSL (padrão: false)
- trustBoundary: Tipo de boundary (padrão: 'internal')

Retorna: Ameaças identificadas com CAPECs sugeridos para o fluxo.`;

  schema = AnalyzeDataFlowSchema;

  /**
   * Regras de ameaças para fluxos de dados
   */
  private flowThreatRules = [
    {
      condition: (input: any) => !input.encrypted && input.trustBoundary.includes("external"),
      threats: [
        {
          strideCategory: "Information Disclosure",
          scenario: "Interceptação de dados não criptografados em trânsito",
          suggestedCapecs: ["CAPEC-117", "CAPEC-157", "CAPEC-158"],
          impact: "CRITICAL",
          mitigation: "Implementar TLS 1.3, HSTS, certificate pinning"
        }
      ]
    },
    {
      condition: (input: any) => input.trustBoundary === "cross-boundary" || input.trustBoundary.includes("external"),
      threats: [
        {
          strideCategory: "Tampering",
          scenario: "Man-in-the-Middle para modificação de dados em trânsito",
          suggestedCapecs: ["CAPEC-94", "CAPEC-441", "CAPEC-466"],
          impact: "HIGH",
          mitigation: "Autenticação mútua TLS, assinatura digital de mensagens, validação de integridade"
        }
      ]
    },
    {
      condition: (input: any) => input.trustBoundary === "internal-to-third-party",
      threats: [
        {
          strideCategory: "Elevation of Privilege",
          scenario: "Comprometimento de credenciais de API de terceiros",
          suggestedCapecs: ["CAPEC-560", "CAPEC-561", "CAPEC-70"],
          impact: "CRITICAL",
          mitigation: "Rotação automática de API keys, armazenamento em vault, monitoramento de uso anômalo"
        },
        {
          strideCategory: "Information Disclosure",
          scenario: "Exposição de dados sensíveis para serviço externo não confiável",
          suggestedCapecs: ["CAPEC-116", "CAPEC-167"],
          impact: "HIGH",
          mitigation: "Sanitização de dados, minimização de dados compartilhados, auditoria de acesso"
        }
      ]
    },
    {
      condition: (input: any) => !input.encrypted,
      threats: [
        {
          strideCategory: "Spoofing",
          scenario: "Falsificação de identidade em canal não autenticado",
          suggestedCapecs: ["CAPEC-151", "CAPEC-593"],
          impact: "MEDIUM",
          mitigation: "Implementar autenticação mútua, tokens assinados, validação de certificados"
        }
      ]
    },
    {
      condition: (input: any) => input.trustBoundary.includes("external"),
      threats: [
        {
          strideCategory: "Denial of Service",
          scenario: "Flood de requisições ou timeout forçado no canal de comunicação",
          suggestedCapecs: ["CAPEC-125", "CAPEC-469"],
          impact: "MEDIUM",
          mitigation: "Rate limiting, timeout configurável, circuit breaker, CDN/WAF"
        }
      ]
    }
  ];

  async _call(input: z.infer<typeof AnalyzeDataFlowSchema>): Promise<string> {
    try {
      const flowDescription = `${input.from} → ${input.to}`;
      const applicableThreats = [];
      
      // Avaliar cada regra
      for (const rule of this.flowThreatRules) {
        if (rule.condition(input)) {
          applicableThreats.push(...rule.threats);
        }
      }
      
      if (applicableThreats.length === 0) {
        return JSON.stringify({
          flow: flowDescription,
          threats: [],
          message: "Nenhuma ameaça crítica identificada para este fluxo",
          note: "Fluxo parece seguro, mas considere análise adicional dos componentes individuais"
        });
      }
      
      // Adicionar informações contextuais
      const contextInfo = {
        encrypted: input.encrypted,
        trustBoundary: input.trustBoundary,
        riskLevel: !input.encrypted && input.trustBoundary.includes("external") ? "CRITICAL" : "HIGH"
      };
      
      return JSON.stringify({
        flow: flowDescription,
        context: contextInfo,
        threatsFound: applicableThreats.length,
        threats: applicableThreats.map(t => ({
          ...t,
          flowDescription: `no fluxo ${flowDescription}`
        })),
        message: `Identificadas ${applicableThreats.length} ameaças potenciais no fluxo`,
        recommendation: !input.encrypted 
          ? "CRÍTICO: Implementar criptografia TLS 1.3 imediatamente"
          : "Validar implementação de segurança do fluxo"
      });
      
    } catch (error) {
      console.error('❌ Erro ao analisar fluxo de dados:', error);
      return JSON.stringify({
        flow: `${input.from} → ${input.to}`,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao analisar fluxo de dados'
      });
    }
  }
}

/**
 * Factory para criar a ferramenta com estado
 */
export function createAnalyzeDataFlowTool(state?: ThreatModelingState): AnalyzeDataFlowTool {
  return new AnalyzeDataFlowTool();
}

