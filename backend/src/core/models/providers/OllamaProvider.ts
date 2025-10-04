import { ModelProvider } from '../ModelProvider';
import { validateAndCorrectJson, createThreatSchema, createSystemSummarySchema, createMermaidSchema } from '../../../utils/jsonValidator';

export class OllamaProvider implements ModelProvider {
  name = 'ollama';
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT || '180000'); // Aumentar para 3 minutos
    this.maxRetries = parseInt(process.env.OLLAMA_MAX_RETRIES || '2'); // Manter 2 tentativas
    console.log(`🔧 OllamaProvider baseUrl: ${this.baseUrl}, timeout: ${this.timeout}ms, maxRetries: ${this.maxRetries}`);
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateContent(prompt: string, model: string, format?: any): Promise<string> {
    console.log(`🔧 OllamaProvider: Gerando conteúdo com modelo ${model}`);
    console.log(`🔧 OllamaProvider: URL: ${this.baseUrl}/api/generate`);
    console.log(`🔧 OllamaProvider: Structured output: ${format ? 'Sim' : 'Não'}`);
    
    // Verificar se o modelo está disponível primeiro
    try {
      const modelsResponse = await fetch(`${this.baseUrl}/api/tags`);
      if (modelsResponse.ok) {
        const models = await modelsResponse.json() as any;
        const modelExists = models.models?.some((m: any) => m.name === model);
        if (!modelExists) {
          console.warn(`⚠️ Modelo ${model} não encontrado no Ollama. Modelos disponíveis:`, models.models?.map((m: any) => m.name));
        }
      }
    } catch (error) {
      console.warn(`⚠️ Não foi possível verificar modelos disponíveis: ${error}`);
    }
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🔧 OllamaProvider: Tentativa ${attempt}/${this.maxRetries}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log(`⏰ OllamaProvider: Timeout após ${this.timeout}ms na tentativa ${attempt}`);
          controller.abort();
        }, this.timeout);
        
        let requestBody: any;
        const endpoint = `${this.baseUrl}/api/generate`;

        if (format) {
          // SOLUÇÃO FINAL: Usar apenas JSON mode simples, ignorar schema complexo
          const simplePrompt = this.createSimpleJsonPrompt(prompt, format);
          
          requestBody = {
            model,
            prompt: simplePrompt,
            stream: false,
            format: "json",
            options: {
              temperature: 0.2,
              top_p: 0.9,
              num_predict: 4000,
              stop: ["\n\n\n"]
            }
          };
          console.log(`🔧 OllamaProvider: Usando JSON mode simples (ignorando schema complexo)`);
        } else {
          requestBody = {
            model,
            prompt,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.9,
              num_predict: 4000
            }
          };
          console.log(`🔧 OllamaProvider: Usando modo texto simples`);
        }
        
        const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

    if (!response.ok) {
          console.error(`❌ OllamaProvider: Erro na resposta (tentativa ${attempt}): ${response.statusText}`);
          if (attempt === this.maxRetries) {
      throw new Error(`Erro ao gerar conteúdo com Ollama: ${response.statusText}`);
          }
          continue;
        }

        const data = await response.json() as any;
        let content: string = (data as any).response || '';
        
        if (format) {
          console.log(`🔧 OllamaProvider: Resposta bruta (tentativa ${attempt}):`);
          console.log(`📝 Raw content (primeiros 200 chars): "${content.substring(0, 200)}"`);
          console.log(`📝 Raw content (últimos 100 chars): "${content.substring(Math.max(0, content.length - 100))}"`);
          
          // SOLUÇÃO DEFINITIVA: Retornar JSON exatamente como o Ollama gera
          console.log(`✅ RETORNANDO JSON DIRETAMENTE DO OLLAMA SEM PROCESSAMENTO`);
          return content;
        } else {
          console.log(`🔧 OllamaProvider: Resposta texto (tentativa ${attempt}): "${content.substring(0, 100)}..."`);
          return content;
        }
        
      } catch (error: any) {
        console.error(`❌ OllamaProvider: Erro na tentativa ${attempt}:`, error.message);
        
        if (error.name === 'AbortError') {
          console.error(`⏰ OllamaProvider: Timeout após ${this.timeout}ms na tentativa ${attempt}`);
        }
        
        if (attempt === this.maxRetries) {
          throw new Error(`Falha após ${this.maxRetries} tentativas: ${error.message}`);
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ OllamaProvider: Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Número máximo de tentativas excedido');
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: text
        }),
        signal: controller.signal
    });

      clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro ao gerar embedding com Ollama: ${response.statusText}`);
    }

    const data = await response.json() as { embedding: number[] };
    return data.embedding;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout ao gerar embedding com Ollama após ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Extrai e limpa JSON de diferentes formatos (markdown, texto, etc) - VERSÃO SIMPLIFICADA
   */
  private extractAndCleanJson(content: string): string {
    console.log(`🔍 extractAndCleanJson - Input length: ${content.length}`);
    
    // Remover espaços em branco extras no início e fim
    let cleaned = content.trim();
    
    // Tentar extrair JSON de blocos markdown
    const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1].trim();
      console.log(`🔍 JSON extraído de bloco markdown`);
    }
    
    // Tentar extrair JSON de blocos de código genéricos
    const codeBlockMatch = cleaned.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch && !jsonBlockMatch) {
      cleaned = codeBlockMatch[1].trim();
      console.log(`🔍 JSON extraído de bloco de código`);
    }
    
    // Se começar com texto antes do JSON, tentar extrair apenas o JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch && !cleaned.startsWith('{')) {
      cleaned = jsonMatch[0];
      console.log(`🔍 JSON extraído do meio do texto`);
    }
    
    // SOLUÇÃO SIMPLES: Apenas remover caracteres de controle problemáticos
    cleaned = cleaned.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '');
    
    // Remover vírgulas antes de } ou ]
    cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
    
    // Remover múltiplas vírgulas
    cleaned = cleaned.replace(/,{2,}/g, ',');
    
    console.log(`🔍 extractAndCleanJson - Output length: ${cleaned.length}`);
    
    return cleaned;
  }

  /**
   * Corrige strings quebradas no JSON - VERSÃO SIMPLIFICADA
   */
  private fixBrokenStrings(json: string): string {
    try {
      // SOLUÇÃO SIMPLES: Apenas corrigir quebras de linha em strings
      let fixed = json;
      
      // Corrigir quebras de linha dentro de strings JSON
      fixed = fixed.replace(/([^\\])\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, '$1\\n');
      fixed = fixed.replace(/([^\\])\r(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, '$1\\r');
      fixed = fixed.replace(/([^\\])\t(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)/g, '$1\\t');
      
      // Remover vírgulas antes de } ou ]
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Remover múltiplas vírgulas
      fixed = fixed.replace(/,{2,}/g, ',');
      
      return fixed;
    } catch (error) {
      console.error(`❌ Erro ao corrigir strings: ${error}`);
      return json;
    }
  }

  /**
   * Tenta corrigir JSON manualmente em casos específicos
   */
  private tryManualJsonFix(content: string, format: any): { success: boolean; data?: any } {
    try {
      console.log(`🔧 Tentando correção manual do JSON...`);
      
      // Tentar parsear primeiro
      try {
        const parsed = JSON.parse(content);
        return { success: true, data: parsed };
      } catch (e) {
        // Continuar com correções
      }
      
      // Correção 1: Adicionar aspas em chaves sem aspas
      let fixed = content.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
      
      // Correção 2: Corrigir strings com aspas simples
      fixed = fixed.replace(/'([^']*)'/g, '"$1"');
      
      // Correção 3: Remover trailing commas
      fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
      
      // Correção 4: Corrigir valores sem aspas que deveriam ser strings
      fixed = fixed.replace(/:\s*([^",\[\]{}0-9][^,\[\]{}]*?)(\s*[,}\]])/g, (match, value, ending) => {
        const trimmed = value.trim();
        if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null' || !isNaN(Number(trimmed))) {
          return match;
        }
        return `: "${trimmed}"${ending}`;
      });
      
      const parsed = JSON.parse(fixed);
      console.log(`✅ JSON corrigido manualmente com sucesso`);
      return { success: true, data: parsed };
    } catch (error) {
      console.error(`❌ Correção manual falhou:`, error);
      return { success: false };
    }
  }

  /**
   * Cria resposta de fallback quando tudo mais falha
   */
  private createFallbackResponse(content: string, format: any): any {
    console.log(`🆘 Criando resposta de fallback...`);
    
    if (format.properties?.threats) {
      return {
        threats: [{
          elementName: "Sistema",
          strideCategory: "Information Disclosure",
          threatScenario: "Análise não concluída - formato de resposta inválido",
          impact: "MEDIUM"
        }]
      };
    }
    
    if (format.properties?.generalDescription) {
      return {
        generalDescription: "Análise não concluída devido a erro no formato de resposta",
        components: "N/A",
        technologies: "N/A"
      };
    }
    
    return { error: "Formato de resposta inválido", rawContent: content.substring(0, 500) };
  }

  /**
   * Cria prompt simples para JSON mode - IGNORA schema complexo
   */
  private createSimpleJsonPrompt(prompt: string, format: any): string {
    if (format.properties?.threats) {
      return `${prompt}

Responda com um JSON contendo um array de ameaças. Cada ameaça deve ter:
- elementName: nome do componente
- strideCategory: categoria STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- threatScenario: descrição da ameaça
- impact: nível de impacto (CRITICAL, HIGH, MEDIUM, LOW)

Exemplo:
{
  "threats": [
    {
      "elementName": "Banco de Dados PostgreSQL",
      "strideCategory": "Information Disclosure",
      "threatScenario": "SQL Injection permite acesso não autorizado aos dados",
      "impact": "CRITICAL"
    }
  ]
}

Responda APENAS com o JSON, sem texto adicional:`;
    }

    if (format.properties?.generalDescription) {
      return `${prompt}

Responda com um JSON contendo:
- generalDescription: descrição geral do sistema
- components: lista de componentes principais separados por vírgula
- technologies: tecnologias utilizadas separadas por vírgula

Exemplo:
{
  "generalDescription": "Sistema de gestão de vendas",
  "components": "Frontend, Backend, Banco de Dados",
  "technologies": "React, Node.js, PostgreSQL"
}

Responda APENAS com o JSON, sem texto adicional:`;
    }

    return `${prompt}

Responda com um JSON válido. Exemplo:
{
  "result": "sua resposta aqui"
}`;
  }

  /**
   * Cria prompt simplificado e mais direto (método antigo - mantido para compatibilidade)
   */
  private createSimplifiedPrompt(prompt: string, format: any): string {
    return this.createSimpleJsonPrompt(prompt, format);
  }

  /**
   * Valida structured output usando Zod
   */
  private validateStructuredOutput(content: string, format: any): { success: boolean; data?: any; error?: string } {
    try {
      let result: any;
      
      if (format.properties?.threats) {
        const schema = createThreatSchema();
        result = validateAndCorrectJson(content, schema);
      } else if (format.properties?.generalDescription) {
        const schema = createSystemSummarySchema();
        result = validateAndCorrectJson(content, schema);
      } else if (format.properties?.mermaid) {
        const schema = createMermaidSchema();
        result = validateAndCorrectJson(content, schema);
      } else {
        // Schema genérico - tentar parsear como JSON simples
        try {
          const parsed = JSON.parse(content);
          return { success: true, data: parsed };
        } catch (parseError) {
          return {
            success: false,
            error: `JSON inválido: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}`
          };
        }
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      };
    }
  }
}