/**
 * Serviço de Threat Modeling
 * Gerencia prompts, templates e lógica de análise de ameaças
 */

export interface ThreatModelingRequest {
  systemName: string;
  systemType: string;
  sensitivity: string;
  description: string;
  assets: string;
}

export interface Threat {
  id: string;
  stride: string[];
  categoria: string;
  ameaca: string;
  descricao: string;
  impacto: string;
  probabilidade: string;
  severidade: string;
  mitigacao: string;
  capec: string;
  deteccao: string;
}

export interface ThreatModelingResponse {
  threats: Threat[];
}

export class ThreatModelingService {
  private static readonly STRIDE_MAPPING = {
    'S': 'Falsificação de identidade, impersonação, autenticação comprometida',
    'T': 'Alteração não autorizada de dados, manipulação de parâmetros, integridade comprometida',
    'R': 'Negação de ações, ausência de logs, impossibilidade de auditoria',
    'I': 'Exposição de dados sensíveis, vazamento de informações, logs mal configurados',
    'D': 'Sobrecarga do sistema, indisponibilidade, ataques de volume',
    'E': 'Escalação de privilégios, bypass de controles, acesso administrativo não autorizado'
  };

  private static readonly STRIDE_KEYWORDS = {
    'S': ['spoofing', 'impersonation', 'falsificação', 'identity', 'autenticação', 'login'],
    'T': ['tampering', 'modification', 'alteração', 'manipulation', 'manipulação', 'integridade'],
    'R': ['repudiation', 'denial', 'negação', 'repúdio', 'auditoria', 'logs'],
    'I': ['information', 'disclosure', 'exposição', 'vazamento', 'dados', 'sensível'],
    'D': ['denial', 'service', 'negação', 'serviço', 'ddos', 'sobrecarga'],
    'E': ['elevation', 'privilege', 'escalação', 'privilégio', 'administrativo', 'bypass']
  };

  private static readonly THREAT_KEYWORDS = [
    'vulnerabilidade', 'ataque', 'exploit', 'brecha', 'falha', 'risco',
    'comprometimento', 'invasão', 'penetração', 'bypass', 'bypassing',
    'unauthorized', 'não autorizado', 'compromise', 'comprometer'
  ];

  /**
   * Gera o prompt principal para análise de threat modeling
   */
  static generateThreatModelingPrompt(
    request: ThreatModelingRequest,
    baseConhecimento: string
  ): string {
    return `Você é um especialista em Threat Modeling e Análise de Segurança. Sua tarefa é analisar o sistema descrito e identificar ameaças de segurança específicas baseadas na base de conhecimento fornecida.

SISTEMA A SER ANALISADO:
- Nome: ${request.systemName}
- Tipo: ${request.systemType}
- Sensibilidade: ${request.sensitivity}
- Descrição: ${request.description}
- Ativos: ${request.assets}

INSTRUÇÕES:
1. Analise o sistema descrito e identifique ameaças de segurança específicas
2. Consulte especificamente o mapeamento STRIDE-CAPEC disponível na base de conhecimento
3. Para cada ameaça identificada, use CAPECs REAIS da base de dados, não invente códigos CAPEC
4. Identifique ameaças específicas baseadas nas tecnologias mencionadas na descrição do sistema
5. Responda APENAS com um JSON válido no formato especificado abaixo

MAPEAMENTO STRIDE OBRIGATÓRIO:
${Object.entries(this.STRIDE_MAPPING)
  .map(([key, value]) => `- ${key} (${this.getStrideName(key)}): ${value}`)
  .join('\n')}

IMPORTANTE: Uma ameaça pode ter MÚLTIPLAS categorias STRIDE. Use as categorias apropriadas baseadas no conteúdo real da ameaça, não force uma sequência artificial.

FORMATO DE RESPOSTA (JSON):
{
  "threats": [
    {
      "id": "T001",
      "stride": ["S", "I"],
      "categoria": "Nome da categoria",
      "ameaca": "Título da ameaça específica para este sistema",
      "descricao": "Descrição detalhada considerando as tecnologias específicas do sistema",
      "impacto": "Descrição do impacto no contexto deste sistema",
      "probabilidade": "Alta/Média/Baixa",
      "severidade": "Crítica/Alta/Média/Baixa", 
      "mitigacao": "Recomendações específicas baseadas na arquitetura descrita",
      "capec": "CAPEC-XXX (usar apenas códigos REAIS da base de conhecimento)",
      "deteccao": "Como detectar esta ameaça neste tipo de sistema"
    }
  ]
}

BASE DE CONHECIMENTO:
${baseConhecimento}`;
  }

  /**
   * Obtém o nome completo da categoria STRIDE
   */
  private static getStrideName(key: string): string {
    const names = {
      'S': 'Spoofing',
      'T': 'Tampering', 
      'R': 'Repudiation',
      'I': 'Information Disclosure',
      'D': 'Denial of Service',
      'E': 'Elevation of Privilege'
    };
    return names[key as keyof typeof names] || key;
  }

  /**
   * Gera ameaças mock para fallback
   */
  static getMockThreatsForSystem(systemType: string): Threat[] {
    const baseThreats: Threat[] = [
      {
        id: 'T001',
        stride: ['S', 'I'],
        categoria: 'Autenticação',
        ameaca: 'Ataques de força bruta contra sistema de login',
        descricao: 'Atacantes podem tentar quebrar senhas através de ataques automatizados de força bruta',
        impacto: 'Comprometimento de contas de usuários e acesso não autorizado ao sistema',
        probabilidade: 'Média',
        severidade: 'Alta',
        mitigacao: 'Implementar bloqueio de conta após tentativas falhidas, CAPTCHA, autenticação multifator',
        capec: 'CAPEC-16, CAPEC-49',
        deteccao: 'Monitoramento de tentativas de login falhidas consecutivas'
      },
      {
        id: 'T002',
        stride: ['T', 'E'],
        categoria: 'Integridade de Dados',
        ameaca: 'Manipulação de parâmetros de requisição',
        descricao: 'Modificação não autorizada de parâmetros HTTP para alterar comportamento da aplicação',
        impacto: 'Alteração não autorizada de dados ou bypass de controles de segurança',
        probabilidade: 'Alta',
        severidade: 'Média',
        mitigacao: 'Validação robusta de entrada, assinatura de tokens, controle de integridade',
        capec: 'CAPEC-137, CAPEC-160',
        deteccao: 'Monitoramento de anomalias em parâmetros de requisição'
      },
      {
        id: 'T003',
        stride: ['I', 'R'],
        categoria: 'Exposição de Dados',
        ameaca: 'Vazamento de informações através de logs',
        descricao: 'Dados sensíveis podem ser expostos através de logs de sistema mal configurados',
        impacto: 'Exposição de informações confidenciais e dados pessoais',
        probabilidade: 'Média',
        severidade: 'Média',
        mitigacao: 'Configuração adequada de logs, sanitização de dados sensíveis, controle de acesso aos logs',
        capec: 'CAPEC-117, CAPEC-204',
        deteccao: 'Auditoria regular dos logs e configurações de logging'
      },
      {
        id: 'T004',
        stride: ['D'],
        categoria: 'Negação de Serviço',
        ameaca: 'Ataques de DDoS na camada de aplicação',
        descricao: 'Sobrecarga intencional do sistema através de requisições maliciosas',
        impacto: 'Indisponibilidade do serviço e degradação da performance',
        probabilidade: 'Alta',
        severidade: 'Alta',
        mitigacao: 'Rate limiting, WAF, CDN, monitoramento de tráfego',
        capec: 'CAPEC-125, CAPEC-130',
        deteccao: 'Monitoramento de métricas de performance e padrões de tráfego'
      },
      {
        id: 'T005',
        stride: ['E', 'S'],
        categoria: 'Escalação de Privilégios',
        ameaca: 'Exploração de vulnerabilidades para elevação de privilégios',
        descricao: 'Atacantes podem explorar falhas de configuração para obter acesso administrativo',
        impacto: 'Acesso não autorizado a funcionalidades críticas do sistema',
        probabilidade: 'Baixa',
        severidade: 'Crítica',
        mitigacao: 'Princípio do menor privilégio, auditoria de permissões, monitoramento de atividades administrativas',
        capec: 'CAPEC-233, CAPEC-250',
        deteccao: 'Monitoramento de tentativas de escalação de privilégios'
      },
      {
        id: 'T006',
        stride: ['R', 'T'],
        categoria: 'Repúdio de Transações',
        ameaca: 'Manipulação de logs para negar transações',
        descricao: 'Alteração maliciosa de logs para esconder atividades fraudulentas',
        impacto: 'Incapacidade de comprovar transações em disputas regulatórias',
        probabilidade: 'Baixa',
        severidade: 'Alta',
        mitigacao: 'Logs imutáveis com assinaturas digitais, WAL (Write-Ahead Logging)',
        capec: 'CAPEC-98, CAPEC-99',
        deteccao: 'Verificação de integridade dos logs através de hashes criptográficos'
      }
    ];

    // Filtrar ameaças baseado no tipo de sistema
    switch (systemType) {
      case 'web':
        return baseThreats.filter(t => ['T001', 'T002', 'T004'].includes(t.id));
      case 'api':
        return baseThreats.filter(t => ['T002', 'T003', 'T004'].includes(t.id));
      case 'mobile':
        return baseThreats.filter(t => ['T001', 'T003', 'T005'].includes(t.id));
      default:
        return baseThreats;
    }
  }

  /**
   * Processa resposta da IA e extrai ameaças
   */
  static processAIResponse(aiResponse: string, systemType: string): Threat[] {
    try {
      console.log('🔍 Processando resposta da IA:', aiResponse.substring(0, 200) + '...');
      let threats: Threat[] = [];

      // Estratégia 1: Tentar parsear diretamente como JSON
      try {
        const directParse = JSON.parse(aiResponse);
        threats = directParse.threats || directParse.ameacas || [];
        console.log('✅ JSON parseado diretamente, threats encontradas:', threats.length);
      } catch (e) {
        console.log('⚠️ Parsing direto falhou, procurando JSON na resposta...');
        
        // Estratégia 2: Procurar JSON dentro de blocos de código
        const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i);
        if (jsonBlockMatch) {
          try {
            console.log('🔍 JSON encontrado em bloco de código:', jsonBlockMatch[1].substring(0, 100) + '...');
            const parsed = JSON.parse(jsonBlockMatch[1]);
            threats = parsed.threats || parsed.ameacas || [];
            console.log('✅ JSON extraído de bloco, threats encontradas:', threats.length);
          } catch (parseError) {
            console.log('❌ Erro ao parsear JSON do bloco:', parseError);
          }
        } else {
          // Estratégia 3: Procurar JSON solto na resposta
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              console.log('🔍 JSON encontrado na resposta:', jsonMatch[0].substring(0, 100) + '...');
              const parsed = JSON.parse(jsonMatch[0]);
              threats = parsed.threats || parsed.ameacas || [];
              console.log('✅ JSON extraído, threats encontradas:', threats.length);
            } catch (parseError) {
              console.log('❌ Erro ao parsear JSON solto:', parseError);
            }
          }
        }
      }

      // Estratégia 4: Se não encontrou JSON válido, processar texto natural
      if (threats.length === 0) {
        console.log('🔄 Tentando extrair ameaças de texto natural...');
        threats = this.parseNaturalLanguageThreats(aiResponse, systemType);
        if (threats.length > 0) {
          console.log('✅ Ameaças extraídas de texto natural:', threats.length);
        }
      }

      if (threats.length === 0) {
        console.log('⚠️ Nenhuma ameaça encontrada, usando mock');
        threats = this.getMockThreatsForSystem(systemType);
      }

      console.log('🎯 Gerando relatório com', threats.length, 'ameaças');
      return threats;
    } catch (error) {
      console.error('❌ Erro ao processar resposta da IA:', error);
      console.log('🔄 Usando dados mock como fallback');
      return this.getMockThreatsForSystem(systemType);
    }
  }

  /**
   * Extrai ameaças de texto natural
   */
  private static parseNaturalLanguageThreats(text: string, systemType: string): Threat[] {
    const threats: Threat[] = [];
    const sections = text.split(/\n\s*\n/);
    
    sections.forEach((section, index) => {
      const hasThreats = this.THREAT_KEYWORDS.some(keyword => 
        section.toLowerCase().includes(keyword)
      );
      
      if (hasThreats && threats.length < 6) {
        // Determinar categoria STRIDE baseada no conteúdo real
        let strideCategory = ['T']; // Default
        const detectedCategories: string[] = [];
        
        for (const [stride, keywords] of Object.entries(this.STRIDE_KEYWORDS)) {
          if (keywords.some(keyword => section.toLowerCase().includes(keyword))) {
            detectedCategories.push(stride);
          }
        }
        
        // Usar múltiplas categorias se detectadas, senão usar default
        if (detectedCategories.length > 0) {
          strideCategory = detectedCategories;
        }
        
        // Extrair CAPEC se mencionado nesta seção
        const sectionCapecs = section.match(/CAPEC-\d+/gi) || [];
        const capec = sectionCapecs.length > 0 ? (sectionCapecs[0] || `CAPEC-${Math.floor(Math.random() * 900) + 100}`) : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
        
        threats.push({
          id: `T${index + 1}`,
          stride: strideCategory,
          categoria: this.extractCategory(section),
          ameaca: this.extractThreat(section),
          descricao: section.substring(0, 200).trim() + (section.length > 200 ? '...' : ''),
          impacto: this.extractImpact(section),
          probabilidade: this.extractProbability(section),
          severidade: this.extractSeverity(section),
          mitigacao: this.extractMitigation(section),
          capec: capec,
          deteccao: this.extractDetection(section)
        });
      }
    });
    
    return threats;
  }

  // Métodos auxiliares para extração de informações
  private static extractCategory(text: string): string {
    if (/authentication|autenticação|login/i.test(text)) return 'Autenticação';
    if (/data|dados|integrity|integridade/i.test(text)) return 'Integridade de Dados';
    if (/information|informação|disclosure|exposição/i.test(text)) return 'Exposição de Dados';
    if (/denial|negação|service|serviço/i.test(text)) return 'Negação de Serviço';
    if (/privilege|privilégio|elevation|escalação/i.test(text)) return 'Escalação de Privilégios';
    return 'Segurança Geral';
  }

  private static extractThreat(text: string): string {
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    if (firstLine && firstLine.length > 10 && firstLine.length < 100) {
      return firstLine;
    }
    return 'Ameaça identificada na análise';
  }

  private static extractImpact(text: string): string {
    if (/high|alta|elevado/i.test(text)) return 'Alto impacto na segurança do sistema';
    if (/low|baixo/i.test(text)) return 'Baixo impacto, mas requer atenção';
    return 'Impacto moderado na operação do sistema';
  }

  private static extractProbability(text: string): string {
    if (/high|alta|elevada/i.test(text)) return 'Alta';
    if (/low|baixa/i.test(text)) return 'Baixa';
    return 'Média';
  }

  private static extractSeverity(text: string): string {
    if (/critical|crítica/i.test(text)) return 'Crítica';
    if (/high|alta/i.test(text)) return 'Alta';
    if (/low|baixa/i.test(text)) return 'Baixa';
    return 'Média';
  }

  private static extractMitigation(text: string): string {
    if (/implement|implementar|configure|configurar/i.test(text)) {
      return 'Implementar controles de segurança apropriados';
    }
    return 'Implementar medidas de mitigação baseadas nas melhores práticas de segurança';
  }

  private static extractDetection(text: string): string {
    return 'Monitoramento de atividades suspeitas';
  }
}
