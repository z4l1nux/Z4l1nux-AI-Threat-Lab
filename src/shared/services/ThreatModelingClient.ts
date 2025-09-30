/**
 * Cliente TypeScript para Threat Modeling
 * Substitui o threat-modeling.js com type safety completo
 */

import { 
  ThreatModelingRequest, 
  ThreatModelingResponse, 
  Threat, 
  CenarioRisco,
  StrideCategory,
  ProbabilityLevel,
  SeverityLevel
} from '../types/threat-modeling';

export class ThreatModelingClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Gera análise de threat modeling
   */
  async generateThreatModeling(request: ThreatModelingRequest): Promise<ThreatModelingResponse> {
    try {
      console.log('🔍 Enviando requisição de threat modeling:', request);
      
      const response = await fetch(`${this.baseUrl}/api/threat-modeling`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as any;
      console.log('📡 Resposta recebida:', result);
      
      return this.processAIResponse(result.resposta, request.systemType);
    } catch (error) {
      console.error('❌ Erro na requisição de threat modeling:', error);
      throw error;
    }
  }

  /**
   * Processa resposta da IA com type safety
   */
  private processAIResponse(aiResponse: string, systemType: string): ThreatModelingResponse {
    try {
      console.log('🔍 Processando resposta da IA:', aiResponse ? aiResponse.substring(0, 200) + '...' : 'RESPOSTA VAZIA');
      
      if (!aiResponse || aiResponse.trim() === '') {
        console.log('⚠️ Resposta da IA vazia, usando mock');
        return {
          success: false,
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }

      // Verificar se a resposta contém padrões de recusa ou erro
      const refusalPatterns = [
        "I'm sorry, but I can't assist",
        "I cannot help",
        "I'm not able to",
        "I can't provide",
        "I'm unable to",
        "I don't have the ability",
        "I'm not programmed to",
        "I cannot generate",
        "I'm not designed to",
        "does not contain any explicit or implicit questions",
        "no explicit or implicit questions",
        "result\": null",
        "message\": \"The provided text"
      ];
      
      const isRefusal = refusalPatterns.some(pattern => 
        aiResponse.toLowerCase().includes(pattern.toLowerCase())
      );
      
      if (isRefusal) {
        console.log('⚠️ IA recusou a solicitação ou não entendeu, usando mock');
        return {
          success: false,
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }

      // Tentar parsear JSON
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(aiResponse);
      } catch (e) {
        // Procurar JSON em blocos de código - suporte para array e objeto
        const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/i);
        if (jsonBlockMatch) {
          try {
            parsedResponse = JSON.parse(jsonBlockMatch[1]);
          } catch (jsonError) {
            console.log('⚠️ JSON malformado, tentando corrigir...');
            // Tentar corrigir JSON malformado
            let jsonText = jsonBlockMatch[1];
            // Corrigir aspas não escapadas em strings
            jsonText = jsonText.replace(/"([^"]*)"([^"]*)"([^"]*)":/g, '"$1$2$3":');
            // Corrigir vírgulas extras
            jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
            try {
              parsedResponse = JSON.parse(jsonText);
            } catch (finalError) {
              console.log('❌ Não foi possível corrigir JSON:', finalError);
              throw new Error('JSON malformado e não foi possível corrigir');
            }
          }
        } else {
          throw new Error('Não foi possível parsear a resposta da IA');
        }
      }

      // Verificar formato structured outputs (Ollama) - FORMATO CORRETO
      if (parsedResponse.threats && Array.isArray(parsedResponse.threats)) {
        console.log('🎯 Structured Outputs (threats) detectado!');
        const threats = this.validateAndNormalizeThreats(parsedResponse.threats);
        console.log(`✅ Processados ${threats.length} ameaças via structured outputs`);
        return {
          success: threats.length > 0,
          threats,
          source: 'ai',
          confidence: 0.95 // Alta confiança para structured outputs
        };
      }

      // Fallback: Verificar formato cenarios_risco (Ollama antigo)
      if (parsedResponse.cenarios_risco && Array.isArray(parsedResponse.cenarios_risco)) {
        console.log('🎯 Formato Ollama antigo (cenarios_risco) detectado!');
        const threats = this.convertCenariosRiscoToThreats(parsedResponse.cenarios_risco);
        console.log(`✅ Convertidos ${threats.length} cenários para ameaças`);
        return {
          success: threats.length > 0,
          threats,
          source: 'ai',
          confidence: threats.length > 0 ? 0.8 : 0.1
        };
      }

      // Verificar formato cenarios_de_risco (OpenRouter)
      if (parsedResponse.cenarios_de_risco && Array.isArray(parsedResponse.cenarios_de_risco)) {
        console.log('🎯 Formato OpenRouter (cenarios_de_risco) detectado!');
        const threats = this.convertCenariosRiscoToThreats(parsedResponse.cenarios_de_risco);
        return {
          success: true,
          threats,
          source: 'ai',
          confidence: 0.9
        };
      }

      // Verificar formato array direto (OpenRouter novo formato)
      if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
        console.log('🎯 Formato OpenRouter (array direto) detectado!');
        const threats = this.convertCenariosRiscoToThreats(parsedResponse);
        return {
          success: true,
          threats,
          source: 'ai',
          confidence: 0.9
        };
      }

      // Verificar formato com apenas resumo (formato incompleto)
      if (parsedResponse.resumo && !parsedResponse.cenarios_risco && !parsedResponse.cenarios_de_risco) {
        console.log('⚠️ Formato incompleto detectado (apenas resumo), usando fallback');
        return {
          success: false,
          threats: this.getMockThreatsForSystem(systemType),
          source: 'mock',
          confidence: 0
        };
      }

      // Fallback para mock
      return {
        success: false,
        threats: this.getMockThreatsForSystem(systemType),
        source: 'mock',
        confidence: 0
      };

    } catch (error) {
      console.error('❌ Erro ao processar resposta da IA:', error);
      return {
        success: false,
        threats: this.getMockThreatsForSystem(systemType),
        source: 'mock',
        confidence: 0
      };
    }
  }

  /**
   * Valida e normaliza ameaças vindas de structured outputs
   */
  private validateAndNormalizeThreats(threats: any[]): Threat[] {
    const normalizedThreats: Threat[] = [];
    
    threats.forEach((threat, index) => {
      try {
        // Validar campos obrigatórios
        if (!threat.id || !threat.ameaca || !threat.descricao) {
          console.warn(`⚠️ Ameaça ${index + 1} com campos obrigatórios faltando, pulando...`);
          return;
        }

        const normalizedThreat: Threat = {
          id: threat.id || `T${String(index + 1).padStart(3, '0')}`,
          stride: Array.isArray(threat.stride) ? threat.stride : ['T'],
          categoria: threat.categoria || 'Segurança Geral',
          ameaca: threat.ameaca,
          descricao: threat.descricao,
          impacto: threat.impacto || 'Impacto não especificado',
          probabilidade: threat.probabilidade || 'Média',
          severidade: threat.severidade || 'Média',
          mitigacao: threat.mitigacao || 'Implementar controles de segurança apropriados',
          capec: threat.capec || `CAPEC-${Math.floor(Math.random() * 900) + 100}`,
          deteccao: threat.deteccao || 'Monitoramento baseado em logs e métricas de segurança'
        };

        normalizedThreats.push(normalizedThreat);
        console.log(`✅ Ameaça ${index + 1} normalizada: ${normalizedThreat.ameaca}`);
        
      } catch (error) {
        console.warn(`⚠️ Erro ao normalizar ameaça ${index + 1}:`, error);
      }
    });

    return normalizedThreats;
  }

  /**
   * Converte formato cenarios_risco do Ollama para formato de ameaças
   */
  private convertCenariosRiscoToThreats(cenarios: CenarioRisco[]): Threat[] {
    const threats: Threat[] = [];
    
    console.log(`🔄 Convertendo ${cenarios.length} cenários...`);
    
    cenarios.forEach((cenario, index) => {
      try {
        console.log(`📋 Processando cenário ${index + 1}:`, cenario);
        
        // Extrair informações do cenário - Suporte a múltiplos formatos
        const tipoRisco = cenario.tipo_risco || cenario.tipo_de_risco || cenario.cenario || cenario.nome || cenario.tipo || cenario['Cenário de Risco'] || '';
        const descritivo = cenario.descritivo || cenario.descricao || cenario.resumo || cenario.exemplo || cenario['Descrição'] || '';
        const impacto = cenario.impacto || cenario['Impacto'] || '';
        
        // Verificar se temos informações mínimas
        if (!tipoRisco && !descritivo) {
          console.warn(`⚠️ Cenário ${index + 1} sem informações válidas, pulando...`);
          return;
        }
        
        // Determinar categorias STRIDE primeiro
        const strideCategories = this.determineStrideCategories(tipoRisco + ' ' + descritivo);
        
        let mitigacao = '';
        
        // Processar mitigação - pode ser array de objetos ou string
        if (Array.isArray(cenario.mitigacao)) {
          if (cenario.mitigacao.length > 0 && typeof cenario.mitigacao[0] === 'object') {
            // Array de objetos com 'medida' e 'detalhes'
            mitigacao = cenario.mitigacao.map((m: any) => {
              if (typeof m === 'object' && m.medida) {
                return m.detalhes ? `${m.medida}: ${m.detalhes}` : m.medida;
              }
              return String(m);
            }).join('; ');
          } else {
            // Array de strings
            mitigacao = cenario.mitigacao.join('; ');
          }
        } else {
          mitigacao = cenario.mitigacao || cenario.mitigação || cenario['Mitigação'] || '';
        }
        
        // Se mitigação estiver vazia, gerar uma baseada no tipo de ameaça
        if (!mitigacao || mitigacao.trim() === '') {
          mitigacao = this.generateMitigationByStride(strideCategories, descritivo);
        }
        
        // Extrair nome da ameaça
        let ameaca = tipoRisco;
        if (ameaca.includes('(') && ameaca.includes(')')) {
          // Remover categorias STRIDE do nome (ex: "Spoofing (S)" -> "Spoofing")
          ameaca = ameaca.replace(/\s*\([^)]+\)\s*$/, '').trim();
        }
        
        // Se ainda estiver vazio, tentar extrair do resumo
        if (!ameaca || ameaca.length < 3) {
          const firstWords = descritivo.split(' ').slice(0, 3).join(' ');
          ameaca = firstWords.length > 10 ? firstWords.substring(0, 50) + '...' : firstWords;
        }
        
        // Determinar categoria
        const categoria = this.extractCategory(descritivo + ' ' + impacto);
        
        // Determinar severidade - usar descrição se impacto estiver vazio
        const textoParaSeveridade = impacto || descritivo;
        const severidade = this.determineSeverity(textoParaSeveridade);
        
        // Determinar probabilidade
        const probabilidade = this.determineProbability(tipoRisco);
        
        const threat: Threat = {
          id: `T${String(index + 1).padStart(3, '0')}`,
          stride: strideCategories,
          categoria,
          ameaca,
          descricao: descritivo,
          impacto,
          probabilidade,
          severidade,
          mitigacao,
          capec: this.extractCapec(descritivo + ' ' + impacto),
          deteccao: this.determineDetection(strideCategories, descritivo, impacto)
        };
        
        threats.push(threat);
        
        console.log(`🔍 Convertido cenário ${index + 1}:`, {
          ameaca: threat.ameaca,
          categoria: threat.categoria,
          stride: threat.stride,
          severidade: threat.severidade
        });
        
      } catch (error) {
        console.warn(`⚠️ Erro ao converter cenário ${index + 1}:`, error);
        // Criar uma ameaça básica como fallback
        const fallbackThreat: Threat = {
          id: `T${String(index + 1).padStart(3, '0')}`,
          stride: ['T'],
          categoria: 'Segurança Geral',
          ameaca: `Ameaça ${index + 1} - Formato não reconhecido`,
          descricao: `Cenário de risco detectado mas não foi possível processar completamente: ${JSON.stringify(cenario).substring(0, 100)}...`,
          impacto: 'Impacto não especificado',
          probabilidade: 'Média',
          severidade: 'Média',
          mitigacao: 'Implementar controles de segurança apropriados',
          capec: `CAPEC-${Math.floor(Math.random() * 900) + 100}`,
          deteccao: 'Monitoramento baseado em logs e métricas de segurança'
        };
        threats.push(fallbackThreat);
      }
    });
    
    console.log(`✅ Conversão concluída: ${threats.length} ameaças geradas de ${cenarios.length} cenários`);
    return threats;
  }

  /**
   * Determina categorias STRIDE baseadas no conteúdo
   */
  private determineStrideCategories(text: string): StrideCategory[] {
    const detectedCategories: StrideCategory[] = [];
    const lowerText = text.toLowerCase();
    
    const strideKeywords = {
      'S': ['spoofing', 'impersonation', 'falsificação', 'identity', 'autenticação', 'login', 'authentication', 'credential', 'assume a identidade'],
      'T': ['tampering', 'modification', 'alteração', 'manipulation', 'manipulação', 'integridade', 'integrity', 'modify', 'dados financeiros'],
      'R': ['repudiation', 'denial', 'negação', 'repúdio', 'auditoria', 'logs', 'logging', 'accountability', 'não ter realizado'],
      'I': ['information', 'disclosure', 'exposição', 'vazamento', 'dados', 'sensível', 'privacy', 'confidential', 'dados confidenciais'],
      'D': ['denial', 'service', 'negação', 'serviço', 'ddos', 'sobrecarga', 'availability', 'downtime', 'indisponível', 'funcionamento normal'],
      'E': ['elevation', 'privilege', 'escalação', 'privilégio', 'administrativo', 'bypass', 'unauthorized access', 'privilégios de um usuário']
    };
    
    // Priorizar detecção por ordem de especificidade
    for (const [stride, keywords] of Object.entries(strideKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        detectedCategories.push(stride as StrideCategory);
      }
    }
    
    // Se não encontrou nenhuma categoria específica, tentar detectar pelo nome do cenário
    if (detectedCategories.length === 0) {
      if (lowerText.includes('spoofing')) detectedCategories.push('S');
      else if (lowerText.includes('tampering')) detectedCategories.push('T');
      else if (lowerText.includes('repudiation')) detectedCategories.push('R');
      else if (lowerText.includes('information disclosure')) detectedCategories.push('I');
      else if (lowerText.includes('denial of service')) detectedCategories.push('D');
      else if (lowerText.includes('elevation of privilege')) detectedCategories.push('E');
    }
    
    return detectedCategories.length > 0 ? detectedCategories : ['T'];
  }

  /**
   * Gera mitigação baseada no tipo STRIDE quando não fornecida pela IA
   */
  private generateMitigationByStride(strideCategories: StrideCategory[], descritivo: string): string {
    const mitigations: string[] = [];
    
    // Mitigações específicas por STRIDE
    if (strideCategories.includes('S')) {
      mitigations.push('Implementar autenticação multifator (MFA)');
      mitigations.push('Validação rigorosa de identidades');
      mitigations.push('Monitoramento de tentativas de login suspeitas');
    }
    if (strideCategories.includes('T')) {
      mitigations.push('Criptografia em trânsito e repouso');
      mitigations.push('Assinaturas digitais para integridade');
      mitigations.push('Validação de integridade de dados');
    }
    if (strideCategories.includes('R')) {
      mitigations.push('Logs auditáveis com assinatura digital');
      mitigations.push('Sistema de auditoria contínua');
      mitigations.push('Integração com blockchain para imutabilidade');
    }
    if (strideCategories.includes('I')) {
      mitigations.push('Controle de acesso baseado em roles (RBAC)');
      mitigations.push('Criptografia de dados sensíveis');
      mitigations.push('Monitoramento de acessos não autorizados');
    }
    if (strideCategories.includes('D')) {
      mitigations.push('Sistemas de proteção DDoS');
      mitigations.push('Rate limiting e throttling');
      mitigations.push('Monitoramento de disponibilidade');
    }
    if (strideCategories.includes('E')) {
      mitigations.push('Princípio do menor privilégio');
      mitigations.push('Revisão periódica de permissões');
      mitigations.push('Auditoria de escalação de privilégios');
    }
    
    // Mitigações gerais baseadas no contexto
    if (descritivo.toLowerCase().includes('financeiro') || descritivo.toLowerCase().includes('banco')) {
      mitigations.push('Compliance com regulamentações bancárias');
      mitigations.push('Monitoramento de transações suspeitas');
    }
    
    return mitigations.length > 0 ? mitigations.join('; ') : 'Implementar controles de segurança apropriados';
  }

  /**
   * Determina método de detecção baseado no tipo de ameaça
   */
  private determineDetection(strideCategories: StrideCategory[], descritivo: string, impacto: string): string {
    const text = (descritivo + ' ' + impacto).toLowerCase();
    
    // Detecção específica por STRIDE
    if (strideCategories.includes('S')) {
      return 'Monitoramento de tentativas de login falhidas consecutivas e análise comportamental';
    }
    if (strideCategories.includes('T')) {
      return 'Monitoramento de anomalias em parâmetros de requisição e integridade de dados';
    }
    if (strideCategories.includes('R')) {
      return 'Auditoria contínua de transações e logs de atividade com assinatura digital';
    }
    if (strideCategories.includes('I')) {
      return 'Monitoramento de acessos não autorizados e análise de vazamento de dados';
    }
    if (strideCategories.includes('D')) {
      return 'Monitoramento de tráfego anômalo e métricas de disponibilidade do sistema';
    }
    if (strideCategories.includes('E')) {
      return 'Auditoria de privilégios e monitoramento de escalação de permissões';
    }
    
    // Detecção baseada em palavras-chave
    if (text.includes('phishing') || text.includes('credenciais')) {
      return 'Análise de padrões de phishing e monitoramento de tentativas de roubo de credenciais';
    }
    if (text.includes('ddos') || text.includes('negação')) {
      return 'Monitoramento de tráfego DDoS e análise de padrões de ataque';
    }
    if (text.includes('dados') || text.includes('informação')) {
      return 'Monitoramento de acessos a dados sensíveis e detecção de vazamentos';
    }
    if (text.includes('transação') || text.includes('financeiro')) {
      return 'Análise de transações suspeitas e monitoramento de padrões anômalos';
    }
    
    // Fallback genérico
    return 'Monitoramento baseado em logs e métricas de segurança';
  }

  /**
   * Extrai categoria baseada no conteúdo
   */
  private extractCategory(text: string): string {
    const lowerText = text.toLowerCase();
    if (/authentication|autenticação|login|senha|password/i.test(lowerText)) return 'Autenticação';
    if (/data|dados|integrity|integridade|manipulação|manipulation/i.test(lowerText)) return 'Integridade de Dados';
    if (/information|informação|disclosure|exposição|leak|vazamento|privacidade/i.test(lowerText)) return 'Exposição de Dados';
    if (/denial|negação|service|serviço|ddos|dos|sobrecarga/i.test(lowerText)) return 'Negação de Serviço';
    if (/privilege|privilégio|elevation|escalação|acesso/i.test(lowerText)) return 'Escalação de Privilégios';
    if (/injection|injeção|sql|code|código/i.test(lowerText)) return 'Injeção de Código';
    if (/tokenização|tokenization|cartão|card/i.test(lowerText)) return 'Tokenização de Dados';
    return 'Segurança Geral';
  }

  /**
   * Determina severidade baseada no impacto - MELHORADO
   */
  private determineSeverity(impacto: string): SeverityLevel {
    const impactoLower = impacto.toLowerCase();
    
    // Severidade Crítica - Contexto bancário
    if (impactoLower.includes('crítica') || impactoLower.includes('crítico') || impactoLower.includes('critical') ||
        impactoLower.includes('fraude financeira') || impactoLower.includes('financial fraud') ||
        impactoLower.includes('comprometimento total') || impactoLower.includes('total compromise') ||
        impactoLower.includes('perda total') || impactoLower.includes('total loss') ||
        impactoLower.includes('dados financeiros') || impactoLower.includes('financial data') ||
        impactoLower.includes('transações') || impactoLower.includes('transactions') ||
        impactoLower.includes('contas bancárias') || impactoLower.includes('bank accounts') ||
        impactoLower.includes('pix') || impactoLower.includes('credenciais bancárias') ||
        impactoLower.includes('danos à reputação') || impactoLower.includes('reputation damage')) {
      return 'Crítica';
    }
    // Severidade Alta - Contexto bancário
    else if (impactoLower.includes('alta') || impactoLower.includes('alto') || impactoLower.includes('high') ||
             impactoLower.includes('perda de dados') || impactoLower.includes('data loss') ||
             impactoLower.includes('violação de privacidade') || impactoLower.includes('privacy violation') ||
             impactoLower.includes('vazamento de dados') || impactoLower.includes('data breach') ||
             impactoLower.includes('acesso não autorizado') || impactoLower.includes('unauthorized access') ||
             impactoLower.includes('perda de negócios') || impactoLower.includes('business loss') ||
             impactoLower.includes('compliance') || impactoLower.includes('regulatório') ||
             impactoLower.includes('clientes') || impactoLower.includes('customers') ||
             impactoLower.includes('dados sensíveis') || impactoLower.includes('sensitive data') ||
             impactoLower.includes('identidade') || impactoLower.includes('identity') ||
             impactoLower.includes('falsificação') || impactoLower.includes('forgery')) {
      return 'Alta';
    }
    // Severidade Baixa
    else if (impactoLower.includes('baixa') || impactoLower.includes('baixo') || impactoLower.includes('low') ||
             impactoLower.includes('menor') || impactoLower.includes('minor') ||
             impactoLower.includes('inconveniente') || impactoLower.includes('inconvenience') ||
             impactoLower.includes('degradação') || impactoLower.includes('degradation')) {
      return 'Baixa';
    }
    
    // Para contexto bancário, assumir Alta como padrão em vez de Média
    if (impactoLower.includes('banco') || impactoLower.includes('bank') || 
        impactoLower.includes('financeiro') || impactoLower.includes('financial') ||
        impactoLower.includes('core banking') || impactoLower.includes('skybank')) {
      return 'Alta';
    }
    
    return 'Média';
  }

  /**
   * Determina probabilidade baseada no tipo de ameaça
   */
  private determineProbability(tipoRisco: string): ProbabilityLevel {
    const lowerTipo = tipoRisco.toLowerCase();
    if (lowerTipo.includes('injection') || lowerTipo.includes('xss')) return 'Alta';
    if (lowerTipo.includes('spoofing') || lowerTipo.includes('dos')) return 'Alta';
    return 'Média';
  }

  /**
   * Extrai CAPEC do texto
   */
  private extractCapec(text: string): string {
    const capecMatch = text.match(/CAPEC-\d+/gi);
    return capecMatch ? capecMatch[0] : `CAPEC-${Math.floor(Math.random() * 900) + 100}`;
  }

  /**
   * Ameaças mock para fallback
   */
  private getMockThreatsForSystem(systemType: string): Threat[] {
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
      }
    ];

    // Filtrar ameaças baseado no tipo de sistema
    switch (systemType) {
      case 'web':
        return baseThreats.filter(t => ['T001', 'T002'].includes(t.id));
      case 'api':
        return baseThreats.filter(t => ['T002'].includes(t.id));
      case 'mobile':
        return baseThreats.filter(t => ['T001'].includes(t.id));
      default:
        return baseThreats;
    }
  }
}
