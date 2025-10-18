import { z } from "zod";
import { StructuredTool } from "@langchain/core/tools";
import { ThreatModelingState } from "../types/AgentTypes";

/**
 * Schema de entrada para detecção de componentes IA
 */
const DetectAIComponentSchema = z.object({
  componentName: z.string().describe("Nome do componente a analisar"),
  
  componentDescription: z.string().optional().describe("Descrição adicional do componente")
});

/**
 * Ferramenta: Detecta Componentes de IA/ML
 * 
 * Esta ferramenta analisa um componente e determina se ele é relacionado
 * a IA/ML, o que afeta qual framework OWASP usar (LLM Top 10 vs Web Top 10).
 * 
 * Uso pelo LLM:
 * - Para determinar se deve usar OWASP LLM Top 10 ou OWASP Top 10 tradicional
 * - Para identificar riscos específicos de IA (prompt injection, model theft, etc.)
 * - Para contextualizar as mitigações apropriadas
 */
export class DetectAIComponentTool extends StructuredTool {
  name = "detect_ai_component";
  description = `Detecta se um componente é relacionado a IA/ML para determinar o framework OWASP apropriado.

Use esta ferramenta quando:
- Encontrar um componente novo durante a análise
- Precisar decidir entre OWASP LLM (LLM01-10) vs OWASP Web (A01-A10)
- Quiser identificar riscos específicos de componentes de IA

Entrada:
- componentName: Nome do componente
- componentDescription (opcional): Descrição adicional

Retorna:
- isAI: true/false
- confidence: Nível de confiança da detecção
- aiType: Tipo específico (LLM, RAG, ML, etc.) se aplicável
- owaspFramework: Qual framework usar (OWASP LLM vs OWASP Web)`;

  schema = DetectAIComponentSchema;

  /**
   * Keywords para detecção de componentes IA/ML
   */
  private aiKeywords = {
    llm: ["llm", "gpt", "claude", "gemini", "chatgpt", "language model", "generative"],
    rag: ["rag", "retrieval", "vector", "embedding", "semantic search"],
    ml: ["machine learning", "ml model", "neural", "training", "inference"],
    ai: ["artificial intelligence", "ai", "intelligent", "cognitive"],
    nlp: ["nlp", "natural language", "text generation", "sentiment"],
    cv: ["computer vision", "image recognition", "object detection"],
    data: ["data science", "data pipeline", "feature engineering"]
  };

  private detectAIType(text: string): { isAI: boolean; aiType: string[]; confidence: number } {
    const textLower = text.toLowerCase();
    const detectedTypes: string[] = [];
    let totalMatches = 0;
    
    for (const [type, keywords] of Object.entries(this.aiKeywords)) {
      const matches = keywords.filter(kw => textLower.includes(kw));
      if (matches.length > 0) {
        detectedTypes.push(type.toUpperCase());
        totalMatches += matches.length;
      }
    }
    
    const isAI = detectedTypes.length > 0;
    const confidence = Math.min(totalMatches * 0.2, 1.0); // Max 1.0
    
    return { isAI, aiType: detectedTypes, confidence };
  }

  async _call(input: z.infer<typeof DetectAIComponentSchema>): Promise<string> {
    try {
      const fullText = `${input.componentName} ${input.componentDescription || ''}`;
      const detection = this.detectAIType(fullText);
      
      // Determinar framework OWASP
      const owaspFramework = detection.isAI ? "OWASP LLM Top 10" : "OWASP Top 10 (2021)";
      
      // Riscos específicos se for IA
      let specificRisks: string[] = [];
      if (detection.isAI) {
        if (detection.aiType.includes("LLM")) {
          specificRisks = [
            "Prompt Injection (LLM01)",
            "Insecure Output Handling (LLM02)", 
            "Training Data Poisoning (LLM03)",
            "Model Denial of Service (LLM04)"
          ];
        }
        if (detection.aiType.includes("RAG")) {
          specificRisks.push(
            "Sensitive Information Disclosure (LLM06)",
            "Supply Chain Vulnerabilities (LLM05)"
          );
        }
      }
      
      return JSON.stringify({
        componentName: input.componentName,
        isAI: detection.isAI,
        confidence: detection.confidence,
        aiType: detection.aiType.length > 0 ? detection.aiType : null,
        owaspFramework: owaspFramework,
        specificRisks: specificRisks.length > 0 ? specificRisks : null,
        message: detection.isAI 
          ? `Componente de IA detectado (${detection.aiType.join(", ")}) - Use ${owaspFramework}`
          : `Componente tradicional - Use ${owaspFramework}`,
        recommendation: detection.isAI
          ? "Considere ameaças específicas de IA como prompt injection, model theft, data poisoning"
          : "Foque em ameaças tradicionais de web/api"
      });
      
    } catch (error) {
      console.error('❌ Erro ao detectar componente IA:', error);
      return JSON.stringify({
        componentName: input.componentName,
        isAI: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        message: 'Erro ao detectar componente IA - assumindo componente tradicional',
        owaspFramework: "OWASP Top 10 (2021)"
      });
    }
  }
}

/**
 * Factory para criar a ferramenta com estado
 */
export function createDetectAIComponentTool(state?: ThreatModelingState): DetectAIComponentTool {
  return new DetectAIComponentTool();
}

